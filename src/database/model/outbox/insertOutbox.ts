import { Chunk, Effect } from "effect";
import { ModelProvider } from "../model";
import { GetConnection } from "../../connection";
import { Document, ObjectId, OptionalId } from "mongodb";
import { getErrorMessage } from "../../../utils";

export class DbTransactionError extends Error {
  _tag = "DbTransactionError";
}

export const insertOutbox = (data: OptionalId<Document>, payload = data) =>
  Effect.all([GetConnection, ModelProvider]).pipe(
    Effect.map(([client, provider]) => ({
      client,
      provider,
      session: client.startSession(),
    })),
    Effect.tap(() => Effect.log(data)),
    Effect.tap(() =>
      Object.keys(data).length === 0 && data.constructor === Object
        ? Effect.fail(new DbTransactionError("data cant be empty"))
        : Effect.unit
    ),
    Effect.flatMap(({ client, provider, session }) =>
      Effect.gen(function* ($) {
        session.startTransaction();
        const main = client.db(provider.db).collection(provider.collection);
        const outbox = client
          .db(provider.db)
          .collection(provider.collection + "_outbox");
        const resultMain = yield* $(
          Effect.tryPromise({
            try: () => main.insertOne(data, { session }),
            catch: (e) => new DbTransactionError(getErrorMessage(e)),
          })
        );
        const resultOutbox = yield* $(
          Effect.tryPromise({
            try: () =>
              outbox.insertOne(
                { data: payload, processed: false, createdAt: new Date() },
                { session }
              ),
            catch: (e) => new DbTransactionError(getErrorMessage(e)),
          })
        );
        yield* $(
          Effect.tryPromise({
            try: () => session.commitTransaction(),
            catch: (e) => new DbTransactionError(getErrorMessage(e)),
          })
        );
        yield* $(
          Effect.tryPromise({
            try: () => session.endSession(),
            catch: (e) => new DbTransactionError(getErrorMessage(e)),
          })
        );
        return Chunk.fromIterable([
          resultMain.insertedId,
          resultOutbox.insertedId,
        ]);
      }).pipe(
        Effect.catchAll(() =>
          Effect.tryPromise({
            try: () => session.abortTransaction(),
            catch(error) {
              return new DbTransactionError(getErrorMessage(error));
            },
          }).pipe(
            Effect.tap(() =>
              Effect.tryPromise({
                try: () => session.endSession(),
                catch(error) {
                  return new DbTransactionError(getErrorMessage(error));
                },
              })
            ),
            Effect.map(() => Chunk.empty<ObjectId>())
          )
        )
      )
    )
  );
