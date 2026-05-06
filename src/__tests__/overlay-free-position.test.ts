/**
 * Renderer-level tests for `tui-overlay` free-position mode and zIndex ordering.
 * These tests verify the renderer change in src/reconciler/renderer.ts paintOverlay.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";

describe("tui-overlay position=free", () => {
  it("renders at given top/left coordinates", () => {
    const result = renderForTest(
      React.createElement(
        "tui-overlay",
        { visible: true, position: "free", top: 5, left: 10, width: 20, height: 5, borderStyle: "single" },
        React.createElement("tui-text", null, "FREE"),
      ),
      { width: 80, height: 24 },
    );

    // Border top-left glyph should appear at (left, top) = (10, 5).
    // Lines are 0-indexed; column 10 of line 5 is the top-left corner of the overlay box.
    const borderRow = result.lines[5] ?? "";
    expect(borderRow.length).toBeGreaterThanOrEqual(11);
    // Top-left corner glyph for "single" border style is "┌".
    expect(borderRow[10]).toBe("┌");
    // Body text "FREE" should appear inside the overlay area (inside the top-left).
    expect(result.hasText("FREE")).toBe(true);
  });

  it("zIndex orders multiple overlays — higher zIndex paints on top", () => {
    const result = renderForTest(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "tui-overlay",
          { key: "back", visible: true, position: "free", top: 5, left: 10, width: 20, height: 5, zIndex: 1, borderStyle: "single" },
          React.createElement("tui-text", null, "BACK"),
        ),
        React.createElement(
          "tui-overlay",
          { key: "front", visible: true, position: "free", top: 5, left: 10, width: 20, height: 5, zIndex: 2, borderStyle: "single" },
          React.createElement("tui-text", null, "FRONT"),
        ),
      ),
      { width: 80, height: 24 },
    );

    // FRONT overlay should win at the overlap.
    expect(result.hasText("FRONT")).toBe(true);
    expect(result.hasText("BACK")).toBe(false);
  });

  it("clamps to screen bounds when top/left would push it off-screen", () => {
    const result = renderForTest(
      React.createElement(
        "tui-overlay",
        { visible: true, position: "free", top: 1000, left: 1000, width: 20, height: 5, borderStyle: "single" },
        React.createElement("tui-text", null, "CLAMPED"),
      ),
      { width: 80, height: 24 },
    );

    // Should not crash; content should still render somewhere on the buffer.
    expect(result.hasText("CLAMPED")).toBe(true);
    // Overlay's right edge clamped: left should be screenWidth - width = 80 - 20 = 60.
    // Top-left border at column 60.
    const lastValidRow = result.lines[24 - 5] ?? ""; // top = screenHeight - height = 19
    expect(lastValidRow[60]).toBe("┌");
  });
});
