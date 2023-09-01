import { Chunk, Effect } from "effect";
import { ModelProvider } from "../model";
import { GetConnection } from "../../connection";
import { ClientSession, Document, ObjectId, OptionalId } from "mongodb";
import { getErrorMessage } from "../../../utils";

export class OutboxError extends Error {
  _tag = "DbTransactionError";
  constructor(readonly session: ClientSession, message: string | undefined) {
    super(message);
  }
}

export const insertOutbox = (data: OptionalId<Document>, payload = data) =>
  Effect.gen(function* ($) {
    const [client, provider] = yield* $(
      Effect.all([GetConnection, ModelProvider])
    );
    const session = client.startSession();
    yield* $(
      Object.keys(data).length === 0 && data.constructor === Object
        ? Effect.fail(new OutboxError(session, "data cant be empty"))
        : Effect.unit
    );
    session.startTransaction();
    const main = client.db(provider.db).collection(provider.collection);
    const outbox = client
      .db(provider.db)
      .collection(provider.collection + "_outbox");
    const resultMain = yield* $(
      Effect.tryPromise({
        try: () => main.insertOne(data, { session }),
        catch: (e) => new OutboxError(session, getErrorMessage(e)),
      })
    );
    const resultOutbox = yield* $(
      Effect.tryPromise({
        try: () =>
          outbox.insertOne(
            { data: payload, processed: false, createdAt: new Date() },
            { session }
          ),
        catch: (e) => new OutboxError(session, getErrorMessage(e)),
      })
    );
    yield* $(
      Effect.tryPromise({
        try: () => session.commitTransaction(),
        catch: (e) => new OutboxError(session, getErrorMessage(e)),
      })
    );
    yield* $(
      Effect.tryPromise({
        try: () => session.endSession(),
        catch: (e) => new OutboxError(session, getErrorMessage(e)),
      })
    );
    return Chunk.fromIterable([resultMain.insertedId, resultOutbox.insertedId]);
  }).pipe(
    Effect.catchAll((e) =>
      Effect.tryPromise({
        try: () => e.session.abortTransaction(),
        catch(error) {
          return new OutboxError(e.session, getErrorMessage(error));
        },
      }).pipe(
        Effect.tap(() =>
          Effect.tryPromise({
            try: () => e.session.endSession(),
            catch(error) {
              return new OutboxError(e.session, getErrorMessage(error));
            },
          })
        ),
        Effect.map(() => Chunk.empty<ObjectId>())
      )
    )
  );
