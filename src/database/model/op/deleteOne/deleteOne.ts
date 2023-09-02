import { Effect, Option } from "effect";
import { GetModel } from "../../model";
import { Filter, Document, DeleteOptions } from "mongodb";
import { getErrorMessage } from "../../../../utils";
import { SessionProvider } from "../../../connection";
import { MongoDeleteError } from "./deleteOne.error";

export const deleteOne = (filter: Filter<Document>, options?: DeleteOptions) =>
  Effect.gen(function* ($) {
    const session = yield* $(Effect.serviceOption(SessionProvider));
    const collection = yield* $(GetModel);
    return yield* $(
      Effect.tryPromise({
        try: () =>
          collection.deleteOne(
            filter,
            Option.isSome(session)
              ? { session: session.value.session, ...options }
              : options
          ),
        catch: (e) => new MongoDeleteError(getErrorMessage(e)),
      })
    );
  });
