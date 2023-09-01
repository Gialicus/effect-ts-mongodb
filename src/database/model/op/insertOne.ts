import { Effect, Option } from "effect";
import { GetModel } from "../model";
import { Document, InsertOneOptions, OptionalId } from "mongodb";
import { getErrorMessage } from "../../../utils";
import { SessionProvider } from "../../connection";

export class MongoInsertError extends Error {
  _tag = "MongoInsertError";
}

export const insertOne = (
  doc: OptionalId<Document>,
  options?: InsertOneOptions
) =>
  Effect.gen(function* ($) {
    const session = yield* $(Effect.serviceOption(SessionProvider));
    const collection = yield* $(GetModel);
    return yield* $(
      Effect.tryPromise({
        try: () =>
          collection.insertOne(
            doc,
            Option.isSome(session)
              ? { session: session.value.session, ...options }
              : options
          ),
        catch: (e) => new MongoInsertError(getErrorMessage(e)),
      })
    );
  });
