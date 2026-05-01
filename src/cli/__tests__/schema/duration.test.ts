import { describe, it, expect } from "vitest";
import { parseDuration } from "../../schema/duration.js";

describe("parseDuration", () => {
  it("parses ms suffix", () => expect(parseDuration("100ms")).toBe(100));
  it("parses s suffix", () => expect(parseDuration("2s")).toBe(2000));
  it("parses m suffix", () => expect(parseDuration("1m")).toBe(60_000));
  it("rejects fractional", () => expect(() => parseDuration("1.5s")).toThrow(/integer/i));
  it("rejects bare numbers", () => expect(() => parseDuration("100")).toThrow(/unit/i));
  it("rejects unknown unit", () => expect(() => parseDuration("5h")).toThrow(/unit/i));
});
