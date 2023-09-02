import { Effect, Option } from "effect";
import { GetModel } from "../../model";
import { Filter, Document, UpdateFilter, UpdateOptions } from "mongodb";
import { getErrorMessage } from "../../../../utils";
import { SessionProvider } from "../../../connection";
import { MongoUpdateError } from "./updateOne.error";

export const updateOne = (
  filter: Filter<Document>,
  update: UpdateFilter<Document> | Partial<Document>,
  options?: UpdateOptions
) =>
  Effect.gen(function* ($) {
    const session = yield* $(Effect.serviceOption(SessionProvider));
    const collection = yield* $(GetModel);
    return yield* $(
      Effect.tryPromise({
        try: () =>
          collection.updateOne(
            filter,
            update,
            Option.isSome(session)
              ? { session: session.value.session, ...options }
              : options
          ),
        catch: (e) => new MongoUpdateError(getErrorMessage(e)),
      })
    );
  });
