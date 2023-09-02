import { Context, Effect, Stream } from "effect";
import { Document, Filter } from "mongodb";
import { GetConnection } from "../../../connection";
import { getErrorMessage } from "../../../../utils";

interface Lookup {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  match?: Filter<Document>;
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

export const lookupFactory = (lookups: Lookup[]) =>
  lookups
    .map((value) => {
      return [
        {
          $lookup: {
            from: value.from,
            localField: value.localField,
            foreignField: value.foreignField,
            as: value.as,
          },
        },
        ...(value.match
          ? [
              {
                $match: value.match,
              },
            ]
          : []),
        {
          $unwind: "$" + value.as,
        },
      ];
    })
    .reduce((acc, cur) => [...acc, ...cur]);

export const lookupModel = (filter: Filter<Document>) =>
  Effect.gen(function* ($) {
    const [client, lookup] = yield* $(
      Effect.all([GetConnection, LookupProvider])
    );
    const collection = client.db(lookup.db).collection(lookup.collection);
    const query = [
      {
        $match: filter,
      },
      ...lookupFactory(lookup.lookups),
    ];
    const stream = collection.aggregate(query);
    return yield* $(
      Stream.fromAsyncIterable(stream, catchError),
      Stream.runCollect
    );
  });
