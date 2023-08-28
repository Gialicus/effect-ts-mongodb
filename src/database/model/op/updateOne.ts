import { Effect } from "effect";
import { GetModel } from "../model";
import { Filter, Document, UpdateFilter } from "mongodb";
import { getErrorMessage } from "../../../utils";

export class MongoUpdateError extends Error {
  _tag = "MongoUpdateError";
}

export const updateOne = (
  filter: Filter<Document>,
  update: UpdateFilter<Document> | Partial<Document>
) =>
  GetModel.pipe(
    Effect.flatMap((collection) =>
      Effect.tryPromise({
        try: () => collection.updateOne(filter, update),
        catch: (e) => new MongoUpdateError(getErrorMessage(e)),
      })
    )
  );