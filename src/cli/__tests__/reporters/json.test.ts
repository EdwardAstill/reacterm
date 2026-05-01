import { describe, it, expect } from "vitest";
import { jsonReporter } from "../../reporters/json.js";

describe("jsonReporter", () => {
  it("emits valid JSON with summary", () => {
    const out = jsonReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
      { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
    ]);
    const parsed = JSON.parse(out);
    expect(parsed.summary.passed).toBe(1);
    expect(parsed.summary.failed).toBe(1);
    expect(parsed.scenarios).toHaveLength(2);
  });
});
