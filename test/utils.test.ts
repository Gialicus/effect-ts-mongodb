import { expect, it, describe } from "vitest";
import { getErrorMessage } from "../src/utils";
describe("getErrorMessage", () => {
  it("get string from error", () => {
    expect(getErrorMessage(new Error("hello"))).toBe("hello");
  });
  it("get undefined from non error", () => {
    expect(getErrorMessage({})).toBe(undefined);
  });
});
