import { describe, expect, it } from "vitest";
import type { StormColors } from "../theme/colors.js";
import { formatValue } from "../utils/pretty-format.js";

const colors = {
  text: { primary: "#fff", secondary: "#aaa", dim: "#555" },
  brand: { primary: "#80f", light: "#a8f" },
  success: "#0c0",
  info: "#08c",
} as unknown as StormColors;

describe("formatValue", () => {
  it("formats primitives with color tags", () => {
    expect(formatValue("x", 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: '"x"', color: "#0c0", path: "$" },
    ]);
    expect(formatValue(42, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "42", color: "#a8f", path: "$" },
    ]);
    expect(formatValue(true, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "true", color: "#80f", path: "$" },
    ]);
    expect(formatValue(null, 2, true, 5, 0, "", "$", new Set(), colors)).toEqual([
      { text: "null", color: "#555", path: "$" },
    ]);
  });

  it("emits multi-line array with trailing commas", () => {
    const lines = formatValue([1, 2], 2, false, 5, 0, "", "$", new Set(), colors);
    expect(lines.map((l) => l.text)).toEqual(["[", "  1,", "  2", "]"]);
  });

  it("collapses object when path is in collapsedPaths", () => {
    const collapsed = new Set(["$"]);
    const lines = formatValue({ a: 1, b: 2 }, 2, false, 5, 0, "", "$", collapsed, colors);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text).toBe("{...2}");
    expect(lines[0]!.collapsible).toBe(true);
    expect(lines[0]!.isCollapsed).toBe(true);
  });

  it("guards depth and circular refs", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const lines = formatValue(obj, 2, false, 3, 0, "", "$", new Set(), colors);
    const joined = lines.map((l) => l.text).join("\n");
    expect(joined).toContain("[Circular]");
  });
});
