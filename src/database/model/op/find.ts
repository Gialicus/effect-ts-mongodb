import { Document, Filter } from "mongodb";
import { GetModel } from "../model";
import { Effect as E, Stream } from "effect";
import { getErrorMessage } from "../../../utils";

export class MongoFindStreamError extends Error {
  _tag = "MongoFindStreamError" as const;
}

export const find = (filter: Filter<Document>) =>
  GetModel.pipe(
    E.flatMap((collection) => {
      const stream = collection.find(filter);
      return Stream.fromAsyncIterable(
        stream,
        (e) => new MongoFindStreamError(getErrorMessage(e))
      ).pipe(Stream.runCollect);
    })
  );
