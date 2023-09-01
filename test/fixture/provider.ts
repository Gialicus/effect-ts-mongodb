import "dotenv/config";
import { Effect } from "effect";
import { MongoClient } from "mongodb";
import { DbProvider } from "../../src/database/connection";
import { ModelProvider } from "../../src/database/model/model";
import { SyncItem } from "../../src/database/model/watch/sync/sync";

export const DbLiveTest = Effect.provideService(
  DbProvider,
  DbProvider.of({
    client: new MongoClient(process.env.MONGO_URL || ""),
  })
);
export const ModelLiveTest = Effect.provideService(
  ModelProvider,
  ModelProvider.of({ db: "prova", collection: "leads" })
);

export const SyncItemLiveTest = Effect.provideService(
  SyncItem,
  SyncItem.of({
    db: "prova",
    sync: {
      from: "leads",
      to: ["opportunities", "jokes"],
    },
    fields: ["name"],
  })
);
