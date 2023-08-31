import { Document, Filter, FindOptions, WithId } from "mongodb";
import { GetModel } from "../model";
import { Chunk, Effect as E, Stream } from "effect";
import { getErrorMessage } from "../../../utils";
import { CloseConnection } from "../../connection";

export class MongoFindStreamError extends Error {
  _tag = "MongoFindStreamError" as const;
}

export const find = (
  filter: Filter<Document>,
  options?: FindOptions<Document>
) =>
  GetModel.pipe(
    E.flatMap((collection) =>
      E.gen(function* ($) {
        const cursor = collection.find(filter, options);
        let chunck = Chunk.empty<WithId<Document>>();
        while (yield* $(E.tryPromise(() => cursor.hasNext()))) {
          const next = yield* $(E.tryPromise(() => cursor.next()));
          chunck = next ? Chunk.append(chunck, next) : chunck;
        }
        yield* $(E.tryPromise(() => cursor.close()));
        return chunck;
      })
    )
  );

export const cursor = (filter: Filter<Document>) =>
  GetModel.pipe(
    E.flatMap((collection) => {
      const stream = collection.find(filter);
      return Stream.fromAsyncIterable(
        stream,
        (e) => new MongoFindStreamError(getErrorMessage(e))
      ).pipe(Stream.runCollect);
    })
  );
