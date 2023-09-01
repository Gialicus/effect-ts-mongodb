import { describe, expect, it } from "vitest";
import {
  DbTransactionError,
  insertOutbox,
} from "../../src/database/model/outbox/insertOutbox";
import { DbLiveTest, ModelLiveTest } from "../fixture/provider";
import { Effect } from "effect";
import { ObjectId } from "bson";

describe("outbox", () => {
  it("should insert", async () => {
    const program = insertOutbox({
      name: "outbox",
      age: 33,
    }).pipe(DbLiveTest, ModelLiveTest);
    const result = await Effect.runPromise(program);
    for (const id of result) {
      expect(ObjectId.isValid(id)).toBe(true);
    }
  });
  it("should throw error", async () => {
    const program = insertOutbox({ _id: new ObjectId() }).pipe(
      DbLiveTest,
      ModelLiveTest
    );
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
});
