import { afterAll, describe, expect, it } from "vitest";
import { insertOutbox } from "../../src/database/model/outbox/insertOutbox";
import { DbLiveTest, ModelLiveTest } from "../fixture/provider";
import { Effect } from "effect";
import { ObjectId, Document } from "mongodb";
import { CloseConnection } from "../../src/database/connection";
import {
  MessageProvider,
  sendOutboxMessages,
} from "../../src/database/model/outbox/scheduleOutbox";
import { WithId } from "mongodb";

describe("outbox", () => {
  it("should insert", async () => {
    const program = insertOutbox({
      name: "outboxtest",
      age: 33,
    }).pipe(DbLiveTest, ModelLiveTest);
    const result = await Effect.runPromise(program);
    for (const id of result) {
      expect(ObjectId.isValid(id)).toBe(true);
    }
  });
  it("should throw error", async () => {
    const program = insertOutbox({}).pipe(DbLiveTest, ModelLiveTest);
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
  it("should send message", async () => {
    const program = sendOutboxMessages.pipe(
      DbLiveTest,
      ModelLiveTest,
      Effect.provideService(
        MessageProvider,
        MessageProvider.of({
          async send(payload: WithId<Document>) {
            console.log("send document with id: ", payload._id);
            return true;
          },
        })
      )
    );
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Success");
  });

  afterAll(async () => {
    await Effect.runPromise(CloseConnection.pipe(DbLiveTest, ModelLiveTest));
  });
});
