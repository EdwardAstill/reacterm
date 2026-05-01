import { describe, it, expect } from "vitest";
import { prettyReporter } from "../../reporters/pretty.js";

describe("prettyReporter", () => {
  it("summarises pass/fail counts", () => {
    const out = prettyReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
      { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
    ], { color: false });
    expect(out).toMatch(/1 passed.*1 failed/);
    expect(out).toContain("b: x");
  });
});
