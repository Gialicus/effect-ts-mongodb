import { Effect, Stream } from "effect";
import { Document, Filter } from "mongodb";
import { GetConnection } from "../../../connection";
import { getErrorMessage } from "../../../../utils";
import { LookupError } from "./lookup.error";
import { LookupProvider } from "./lookup.context";
import { Lookup } from "./lookup.interface";

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
