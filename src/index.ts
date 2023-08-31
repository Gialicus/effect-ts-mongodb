import { Effect, Schedule } from "effect";
import "dotenv/config";
import { MongoClient } from "mongodb";
import { DbProvider } from "./database/connection";
import { ModelProvider } from "./database/model/model";
import { getMany } from "./database/model/op/request/getMany";

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
// const SyncItemLive = Effect.provideService(
//   SyncItem,
//   SyncItem.of({
//     db: "prova",
//     sync: {
//       from: "leads",
//       to: ["opportunities", "jokes"],
//     },
//     fields: ["name"],
//   })
// );

// const program = SyncCollection.pipe(DbLive, SyncItemLive);

Effect.runPromise(
  Effect.all(
    [
      getMany(["64e7244662d0978218af156f", "64e790bbc761e132b013ad42"]).pipe(
        DbLive,
        ModelLive,
        Effect.repeat(Schedule.fixed("2 seconds"))
      ),
    ],
    { concurrency: "unbounded" }
  )
);
