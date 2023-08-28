import { Context, Effect } from "effect";
import { GetConnection } from "../connection";

export interface ModelProvider {
  db: string;
  collection: string;
}

export const ModelProvider = Context.Tag<ModelProvider>();

export const GetModel = ModelProvider.pipe(
  Effect.flatMap((provider) =>
    GetConnection.pipe(
      Effect.map((client) =>
        client.db(provider.db).collection(provider.collection)
      )
    )
  )
);
