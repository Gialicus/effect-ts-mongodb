import { Effect, Stream } from "effect";
import "dotenv/config";
import { MongoClient } from "mongodb";
import { DbProvider } from "./database/connection";
import { ModelProvider } from "./database/model/model";
import { watchStream } from "./database/model/watch/watch";

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

const program = watchStream.pipe(
  Stream.runCollect,
  DbLive,
  ModelLive,
  Effect.tap((docs) => {
    return Effect.log(docs);
  })
);

Effect.runPromise(program);
