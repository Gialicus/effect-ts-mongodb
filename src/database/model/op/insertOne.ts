import { Effect } from "effect";
import { GetModel } from "../model";
import { OptionalId } from "mongodb";
import { getErrorMessage } from "../../../utils";

export class MongoInsertError extends Error {
  _tag = "MongoInsertError";
}

export const insertOne = (doc: OptionalId<Document>) =>
  GetModel.pipe(
    Effect.flatMap((collection) =>
      Effect.tryPromise({
        try: () => collection.insertOne(doc),
        catch(error) {
          return new MongoInsertError(getErrorMessage(error));
        },
      })
    )
  );
