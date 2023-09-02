import { Context, Effect, Stream } from "effect";
import { Document, Filter } from "mongodb";
import { GetConnection } from "../../../connection";
import { getErrorMessage } from "../../../../utils";

interface Lookup {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
}

export interface LookupProvider {
  db: string;
  collection: string;
  lookups: Lookup[];
}

export const LookupProvider = Context.Tag<LookupProvider>();

export class LookupError extends Error {
  _tag = "LookupError";
}

const catchError = (e: unknown) => new LookupError(getErrorMessage(e));

export const lookupModel = (filter: Filter<Document>) =>
  Effect.gen(function* ($) {
    const [client, lookup] = yield* $(
      Effect.all([GetConnection, LookupProvider])
    );
    const collection = client.db(lookup.db).collection(lookup.collection);
    const stream = collection.aggregate([
      {
        $match: filter,
      },
      ...lookup.lookups.map((value) => ({ $lookup: value })),
    ]);
    return yield* $(
      Stream.fromAsyncIterable(stream, catchError),
      Stream.runCollect
    );
  });
