import { Effect, Stream } from "effect";
import { GetModel } from "../model";
import { getErrorMessage } from "../../../utils";

export class MongoWatchError extends Error {
  _tag = "MongoWatchError";
}

export const watchStream = GetModel.pipe(
  Stream.flatMap((collection) =>
    Stream.fromAsyncIterable(
      collection.watch(),
      (e) => new MongoWatchError(getErrorMessage(e))
    ).pipe(
      Stream.tap((change) => {
        return Effect.log(change);
      })
    )
  )
);
