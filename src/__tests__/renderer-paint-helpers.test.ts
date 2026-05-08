import { describe, expect, it } from "vitest";

import { intersectClip, isClipEmpty, type ClipRect } from "../reconciler/paint/clip.js";
import { stripAnsi, wrapText } from "../reconciler/paint/text.js";

describe("renderer paint helpers", () => {
  it("intersects clip rectangles", () => {
    const a: ClipRect = { x1: 0, y1: 0, x2: 10, y2: 8 };
    const b: ClipRect = { x1: 4, y1: -2, x2: 12, y2: 5 };

    expect(intersectClip(a, b)).toEqual({ x1: 4, y1: 0, x2: 10, y2: 5 });
    expect(isClipEmpty(intersectClip(a, b))).toBe(false);
  });

  it("detects empty clip rectangles", () => {
    expect(isClipEmpty({ x1: 4, y1: 0, x2: 4, y2: 5 })).toBe(true);
    expect(isClipEmpty({ x1: 0, y1: 7, x2: 4, y2: 7 })).toBe(true);
  });

  it("strips CSI and BEL-terminated OSC sequences from text", () => {
    const text = "safe \x1b[31mred\x1b[0m \x1b]52;c;ZXhwbG9pdA==\x07done";

    expect(stripAnsi(text)).toBe("safe red done");
  });

  it("wraps text by terminal display width", () => {
    expect(wrapText("ab cd", 3)).toEqual(["ab", "cd"]);
    expect(wrapText("a😀b", 3)).toEqual(["a😀", "b"]);
    expect(wrapText("a\n\nb", 10)).toEqual(["a", "", "b"]);
  });
});
