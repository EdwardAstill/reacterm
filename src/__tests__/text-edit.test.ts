import { describe, expect, it } from "vitest";
import {
  deleteLinearSelection,
  orderedLinearSelection,
  wordLeftBySpace,
  wordRightBySpace,
} from "../hooks/headless/text-edit/linear.js";
import {
  clampPos,
  joinLines,
  orderedSelection,
  splitLines,
  wordLeftInLine,
  wordRightInLine,
} from "../hooks/headless/text-edit/multiline.js";

describe("linear text edit helpers", () => {
  it("orders and deletes linear selections", () => {
    expect(orderedLinearSelection(5, 2)).toEqual({ start: 2, end: 5 });
    expect(deleteLinearSelection("abcdef", 5, 2)).toEqual({ value: "abf", cursor: 2 });
  });

  it("preserves space-based word movement used by text and chat inputs", () => {
    const value = "alpha  beta";
    expect(wordLeftBySpace(value.length, value)).toBe(7);
    expect(wordRightBySpace(0, value)).toBe(7);
  });
});

describe("multiline text edit helpers", () => {
  it("splits, joins, and clamps line positions", () => {
    const lines = splitLines("a\nbc");
    expect(lines).toEqual(["a", "bc"]);
    expect(joinLines(lines)).toBe("a\nbc");
    expect(clampPos({ row: 5, col: 10 }, lines)).toEqual({ row: 1, col: 2 });
  });

  it("orders selections and uses whitespace word movement", () => {
    expect(orderedSelection({ row: 2, col: 0 }, { row: 1, col: 4 })).toEqual({
      start: { row: 1, col: 4 },
      end: { row: 2, col: 0 },
    });
    expect(wordLeftInLine("alpha\tbeta", 10)).toBe(6);
    expect(wordRightInLine("alpha\tbeta", 0)).toBe(6);
  });
});
