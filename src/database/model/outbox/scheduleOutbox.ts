import { Chunk, Context, Duration, Effect, Schedule } from "effect";
import { GetConnection } from "../../connection";
import { ModelProvider } from "../model";
import { getErrorMessage } from "../../../utils";
import { WithId, Document } from "mongodb";

export class ScheduleOutboxError extends Error {
  _tag = "ScheduleOutboxError";
}

const catchError = (e: unknown) => new ScheduleOutboxError(getErrorMessage(e));

export interface MessageProvider {
  send: (payload: WithId<Document>) => Promise<boolean>;
}
export const MessageProvider = Context.Tag<MessageProvider>();

export const sendOutboxMessages = Effect.gen(function* ($) {
  const [client, model, messageProvider] = yield* $(
    Effect.all([GetConnection, ModelProvider, MessageProvider])
  );
  const outbox = client.db(model.db).collection(model.collection + "_outbox");
  const unprocessed = yield* $(
    Effect.tryPromise({
      try: () => outbox.find({ processed: false }).toArray(),
      catch: catchError,
    })
  );
  return yield* $(
    Effect.forEach(unprocessed, (doc) =>
      Effect.gen(function* () {
        const response = yield* $(
          Effect.tryPromise({
            try: () => messageProvider.send(doc.data),
            catch: catchError,
          })
        );
        yield* $(
          Effect.tryPromise({
            try: () =>
              outbox.updateOne(
                { _id: doc._id },
                { $set: { processed: response, processedAt: new Date() } }
              ),
            catch: catchError,
          })
        );
        return Chunk.make(response);
      })
    )
  );
});

export const scheduleOutbox = (millis: number) =>
  Effect.repeat(sendOutboxMessages, Schedule.fixed(Duration.millis(millis)));
