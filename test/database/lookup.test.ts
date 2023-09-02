import { beforeAll, describe, expect, it } from "vitest";
import { transaction } from "../../src/database/model/op/transaction/transaction";
import { insertOne } from "../../src/database/model/op/insertOne";
import { ObjectId } from "bson";
import { DbLiveTest, ModelLiveTest } from "../fixture/provider";
import { Chunk, Effect } from "effect";
import { ModelProvider } from "../../src/database/model/model";
import {
  LookupProvider,
  lookupModel,
} from "../../src/database/model/op/lookup/lookup";

describe("lookup", () => {
  const _id = new ObjectId();
  beforeAll(async () => {
    const insert = transaction([
      insertOne({ _id: _id, name: "gialicus" }).pipe(ModelLiveTest, DbLiveTest),
      insertOne({ user: _id, name: "spada laser", price: 500 }).pipe(
        Effect.provideService(
          ModelProvider,
          ModelProvider.of({ db: "prova", collection: "items" })
        ),
        DbLiveTest
      ),
      insertOne({ contact: _id, address: "Rome" }).pipe(
        Effect.provideService(
          ModelProvider,
          ModelProvider.of({ db: "prova", collection: "adresses" })
        ),
        DbLiveTest
      ),
    ]);
    await Effect.runPromise(insert.pipe(ModelLiveTest, DbLiveTest));
  });
  it("should join result of query", async () => {
    const program = lookupModel({ _id });
    const result = await Effect.runPromise(
      program.pipe(
        DbLiveTest,
        Effect.provideService(
          LookupProvider,
          LookupProvider.of({
            db: "prova",
            collection: "leads",
            lookups: [
              {
                from: "items",
                localField: "_id",
                foreignField: "user",
                as: "items",
              },
              {
                from: "adresses",
                localField: "_id",
                foreignField: "contact",
                as: "adresses",
              },
            ],
          })
        )
      )
    );
    expect(Chunk.isNonEmpty(result)).toBe(true);
  });
});
