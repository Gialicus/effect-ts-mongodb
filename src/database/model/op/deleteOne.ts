import { Effect } from "effect";
import { GetModel } from "../model";
import { Filter, Document, DeleteOptions } from "mongodb";
import { getErrorMessage } from "../../../utils";

export class MongoDeleteError extends Error {
  _tag = "MongoDeleteError";
}

export const deleteOne = (filter: Filter<Document>, options?: DeleteOptions) =>
  GetModel.pipe(
    Effect.flatMap((collection) =>
      Effect.tryPromise({
        try: () => collection.deleteOne(filter, options),
        catch: (e) => new MongoDeleteError(getErrorMessage(e)),
      })
    )
  );
