import { Effect } from "effect";
import { GetConnection, SessionProvider } from "../../../connection";
import { DbOperation } from "../operations";
import { getErrorMessage } from "../../../../utils";

export class TransactionError extends Error {
  _tag = "TransactionError";
}

export const trasaction = (operations: DbOperation[]) =>
  Effect.gen(function* ($) {
    const client = yield* $(GetConnection);
    const session = client.startSession();
    session.startTransaction();
    yield* $(
      Effect.all(operations, { concurrency: "unbounded" }).pipe(
        Effect.provideService(SessionProvider, SessionProvider.of({ session }))
      ),
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* $(Effect.logError(error));
          yield* $(
            Effect.tryPromise({
              try: () => session.abortTransaction(),
              catch: (e) => new TransactionError(getErrorMessage(e)),
            })
          );
          yield* $(
            Effect.tryPromise({
              try: () => session.endSession(),
              catch: (e) => new TransactionError(getErrorMessage(e)),
            })
          );
        })
      )
    );
    return session;
  }).pipe(
    Effect.tap((session) =>
      Effect.tryPromise(() => session.commitTransaction())
    ),
    Effect.tap((session) => Effect.tryPromise(() => session.endSession()))
  );
