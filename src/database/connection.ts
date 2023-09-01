import { Context, Effect } from "effect";
import { MongoClient } from "mongodb";
import { getErrorMessage } from "../utils";

export interface DbProvider {
  readonly client: MongoClient;
}

export class DbConnectionError extends Error {
  readonly _tag = "DbResourceError";
  constructor(err: unknown) {
    super(getErrorMessage(err));
  }
}

export const DbProvider = Context.Tag<DbProvider>();

export const GetConnection = DbProvider.pipe(
  Effect.tap((provider) =>
    Effect.once(
      Effect.tryPromise({
        try: () => provider.client.connect(),
        catch: (e) => new DbConnectionError(e),
      })
    )
  ),
  Effect.map((provider) => provider.client),
  Effect.tap(() => Effect.log("GetConnection"))
);

export const CloseConnection = DbProvider.pipe(
  Effect.tap((provider) =>
    Effect.tryPromise({
      try: () => provider.client.close(),
      catch: (e) => new DbConnectionError(e),
    })
  ),
  Effect.tap(() => Effect.log("CloseConnection"))
);
