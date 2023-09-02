import { Chunk, Effect } from "effect";
import { it, expect, afterAll } from "vitest";
import { find } from "../../src/database/model/op/find/find";
import { describe } from "node:test";
import { DbLiveTest, ModelLiveTest } from "../fixture/provider";
import { CloseConnection } from "../../src/database/connection";

describe("find", () => {
  const program = Effect.runPromise(find({}).pipe(DbLiveTest, ModelLiveTest));
  it("should return chunk", async () => {
    const result = await program;
    expect(Chunk.isChunk(result)).toBe(true);
  });
  it("chunk should be not empty", async () => {
    const result = await program;
    expect(Chunk.isNonEmpty(result)).toBe(true);
  });
  afterAll(async () => {
    await Effect.runPromise(CloseConnection.pipe(DbLiveTest, ModelLiveTest));
  });
});
