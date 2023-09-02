import { Effect, Schedule } from "effect";
import "dotenv/config";
import { MongoClient } from "mongodb";
import { DbProvider } from "./database/connection";
import { ModelProvider } from "./database/model/model";
import { getMany } from "./database/model/op/request/getMany";
import { SyncCollection, SyncItem } from "./database/model/watch/sync/sync";

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is required");
}

const DbLive = Effect.provideService(
  DbProvider,
  DbProvider.of({ client: new MongoClient(process.env.MONGO_URL) })
);
const ModelLive = Effect.provideService(
  ModelProvider,
  ModelProvider.of({ db: "prova", collection: "leads" })
);
const SyncItemLive = Effect.provideService(
  SyncItem,
  SyncItem.of({
    db: "prova",
    sync: {
      current: "opportunities",
      path: "lead",
      external: "leads",
    },
    fields: ["name"],
  })
);

const program = SyncCollection.pipe(DbLive, SyncItemLive);

Effect.runPromise(program);
