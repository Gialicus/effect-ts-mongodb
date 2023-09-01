import { Document, Filter, FindOptions } from "mongodb";
import { GetModel } from "../model";
import { Effect, Option } from "effect";
import { DbConnectionError, SessionProvider } from "../../connection";

export const findOne = (filter: Filter<Document>, options?: FindOptions) =>
  Effect.gen(function* ($) {
    const session = yield* $(Effect.serviceOption(SessionProvider));
    const collection = yield* $(GetModel);
    return yield* $(
      Effect.tryPromise({
        try: () =>
          collection.findOne(
            filter,
            Option.isSome(session)
              ? { session: session.value.session, ...options }
              : options
          ),
        catch: (e) => new DbConnectionError(e),
      }),
      Effect.flatMap((value) =>
        value ? Effect.succeedSome(value) : Effect.succeedNone
      )
    );
  });
