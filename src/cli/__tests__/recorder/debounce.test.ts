import { describe, it, expect } from "vitest";
import { coalesceKeystrokes } from "../../recorder/debounce.js";

describe("coalesceKeystrokes", () => {
  it("merges contiguous text-keys within window into a single type step", () => {
    const events = [
      { t: 0,  kind: "key" as const, key: "h" },
      { t: 20, kind: "key" as const, key: "i" },
      { t: 50, kind: "key" as const, key: "tab" },
    ];
    expect(coalesceKeystrokes(events, 50)).toEqual([
      { kind: "type", text: "hi" },
      { kind: "press", keys: ["tab"] },
    ]);
  });
});
