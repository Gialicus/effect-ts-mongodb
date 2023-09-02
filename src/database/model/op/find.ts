import { Document, Filter, FindOptions } from "mongodb";
import { GetModel } from "../model";
import { Effect, Option, Stream } from "effect";
import { getErrorMessage } from "../../../utils";
import { SessionProvider } from "../../connection";

export class MongoFindStreamError extends Error {
  _tag = "MongoFindStreamError" as const;
}

export const find = (
  filter: Filter<Document>,
  options?: FindOptions<Document>
) =>
  Effect.gen(function* ($) {
    const session = yield* $(Effect.serviceOption(SessionProvider));
    const collection = yield* $(GetModel);
    const stream = collection.find(
      filter,
      Option.isSome(session)
        ? { session: session.value.session, ...options }
        : options
    );
    return yield* $(
      Stream.fromAsyncIterable(
        stream,
        (e) => new MongoFindStreamError(getErrorMessage(e))
      ),
      Stream.runCollect
    );
  });
