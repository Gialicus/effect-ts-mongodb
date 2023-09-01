import { Effect } from "effect";
import { MongoClient } from "mongodb";
import { DbProvider } from "../../src/database/connection";
import { ModelProvider } from "../../src/database/model/model";

export const DbLiveTest = Effect.provideService(
  DbProvider,
  DbProvider.of({
    client: new MongoClient(
      process.env.MONGO_URL || "mongodb://localhost:27017"
    ),
  })
);
export const ModelLiveTest = Effect.provideService(
  ModelProvider,
  ModelProvider.of({ db: "prova", collection: "leads" })
);
