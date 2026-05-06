import { it, expect, vi } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Overlay } from "../components/core/Overlay.js";

it("resize handle renders at the bottom-right interior cell", () => {
  const result = renderForTest(
    React.createElement(
      Overlay,
      {
        resizable: true,
        defaultTop: 3,
        defaultLeft: 5,
        defaultWidth: 20,
        defaultHeight: 5,
        borderStyle: "single",
      },
      React.createElement("tui-text", null, "Body"),
    ),
    { width: 80, height: 24 },
  );

  const row = result.lines[6] ?? "";
  const idx = row.indexOf("\\");
  expect(idx).toBe(23);
});

it("close button: clicking [×] in the title bar fires onClose without starting a drag", () => {
  const onClose = vi.fn();
  const result = renderForTest(
    React.createElement(
      Overlay,
      {
        title: "Closable",
        movable: true,
        onClose,
        defaultTop: 3,
        defaultLeft: 5,
        defaultWidth: 30,
        defaultHeight: 6,
        borderStyle: "single",
      },
      React.createElement("tui-text", null, "Body"),
    ),
    { width: 80, height: 24 },
  );

  // Locate the [×] glyph.
  let xRow = -1;
  let xCol = -1;
  for (let y = 0; y < result.height; y++) {
    const idx = (result.lines[y] ?? "").indexOf("×");
    if (idx >= 0) { xRow = y; xCol = idx; break; }
  }
  expect(xRow).toBeGreaterThan(0);
  expect(xCol).toBeGreaterThan(0);

  result.click(xCol, xRow);
  expect(onClose).toHaveBeenCalled();
});

it("close button absent when onClose is not set", () => {
  const result = renderForTest(
    React.createElement(
      Overlay,
      {
        title: "Just movable",
        movable: true,
        defaultTop: 3,
        defaultLeft: 5,
        defaultWidth: 30,
        defaultHeight: 6,
        borderStyle: "single",
      },
      React.createElement("tui-text", null, "Body"),
    ),
    { width: 80, height: 24 },
  );

  expect(result.hasText("[×]")).toBe(false);
});

it("showResizeHandle={false} hides the glyph but resize still works via the bottom row", () => {
  const calls: { width: number; height: number }[] = [];
  const result = renderForTest(
    React.createElement(
      Overlay,
      {
        resizable: true,
        showResizeHandle: false,
        defaultTop: 3,
        defaultLeft: 5,
        defaultWidth: 20,
        defaultHeight: 5,
        borderStyle: "single",
        onResize: (s: { width: number; height: number }) => calls.push(s),
      },
      React.createElement("tui-text", null, "Body"),
    ),
    { width: 80, height: 24 },
  );

  // Glyph absent.
  expect(result.hasText("\\")).toBe(false);

  // Resize still functional — the row spans cols 6..23 at row 6.
  result.mouseDown(23, 6);
  result.mouseMove(28, 8);
  result.mouseUp(28, 8);
  expect(calls.length).toBeGreaterThan(0);
  const last = calls[calls.length - 1]!;
  expect(last.width).toBeGreaterThan(20);
});
