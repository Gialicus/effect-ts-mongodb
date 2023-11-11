import { Effect } from "effect";
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

const program = getMany([]).pipe(DbLive, ModelLive);

Effect.runPromise(program);
