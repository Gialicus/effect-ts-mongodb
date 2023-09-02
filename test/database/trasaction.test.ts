import { describe, it, expect, afterAll } from "vitest";
import { transaction } from "../../src/database/model/op/transaction/transaction";
import {
  MongoInsertError,
  insertOne,
} from "../../src/database/model/op/insertOne";
import { Effect } from "effect";
import { DbLiveTest, ModelLiveTest } from "../fixture/provider";
import { CloseConnection } from "../../src/database/connection";

describe("trasaction", () => {
  it("should throw error", async () => {
    const program = transaction([
      insertOne({ name: "marioX", age: 30 }),
      insertOne({ name: "luigiX", age: 30 }),
      insertOne({ name: "luigiSecondoX", age: 30 }),
      Effect.fail(new MongoInsertError("Batman")),
    ]);
    const result = await Effect.runPromiseExit(
      program.pipe(DbLiveTest, ModelLiveTest)
    );
    expect(result._tag).toBe("Failure");
  });
  afterAll(async () => {
    await Effect.runPromise(CloseConnection.pipe(DbLiveTest, ModelLiveTest));
  });
});
