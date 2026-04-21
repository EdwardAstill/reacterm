import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Panes, Pane } from "../components/core/Panes.js";

const T = (p: { children: string }) => React.createElement("tui-text", null, p.children);

describe("Panes", () => {
  it("row: renders all pane text", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 60, height: 8 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Left")),
        React.createElement(Pane, { flex: 2 }, React.createElement(T, null, "Middle")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Right")),
      ),
      { width: 60, height: 8 },
    );
    expect(result.hasText("Left")).toBe(true);
    expect(result.hasText("Middle")).toBe(true);
    expect(result.hasText("Right")).toBe(true);
  });

  it("row: single border between panes (no double vertical lines)", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 30, height: 5 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "A")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "B")),
      ),
      { width: 30, height: 5 },
    );
    // ││ (double bar) should not appear — only a single │ between panes
    expect(result.output.includes("││")).toBe(false);
    expect(result.hasText("A")).toBe(true);
    expect(result.hasText("B")).toBe(true);
  });

  it("column: renders all pane text", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "column", borderStyle: "single", width: 30, height: 16 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Top")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Middle")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Bottom")),
      ),
      { width: 30, height: 16 },
    );
    expect(result.hasText("Top")).toBe(true);
    expect(result.hasText("Middle")).toBe(true);
    expect(result.hasText("Bottom")).toBe(true);
  });

  it("column: single border between panes (no double horizontal lines)", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "column", borderStyle: "single", width: 20, height: 10 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "A")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "B")),
      ),
      { width: 20, height: 10 },
    );
    // ── on consecutive lines (double horizontal) should not appear
    const lines = result.lines;
    for (let i = 0; i < lines.length - 1; i++) {
      const bothHorizontal = /^[─└┘]+$/.test(lines[i]!.trim()) && /^[─┌┐]+$/.test(lines[i + 1]!.trim());
      expect(bothHorizontal).toBe(false);
    }
  });

  it("single pane renders correctly", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 20, height: 5 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Solo")),
      ),
      { width: 20, height: 5 },
    );
    expect(result.hasText("Solo")).toBe(true);
  });

  it("prints output for visual inspection", () => {
    const row = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 50, height: 6 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Left")),
        React.createElement(Pane, { flex: 2 }, React.createElement(T, null, "Middle")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Right")),
      ),
      { width: 50, height: 6 },
    );
    const col = renderForTest(
      React.createElement(
        Panes,
        { direction: "column", borderStyle: "single", width: 24, height: 16 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Top")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Mid")),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "Bot")),
      ),
      { width: 24, height: 16 },
    );
    console.log("\n── Panes row ──────────────────────────────────────");
    console.log(row.output);
    console.log("── Panes column ───────────────────────────────────");
    console.log(col.output);
    expect(true).toBe(true);
  });
});

describe("Panes border styles", () => {
  const styles = ["single", "double", "heavy", "round", "ascii"] as const;

  styles.forEach((style) => {
    it(`row: ${style}`, () => {
      const result = renderForTest(
        React.createElement(
          Panes,
          { direction: "row", borderStyle: style, width: 40, height: 5 },
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, style)),
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "B")),
        ),
        { width: 40, height: 5 },
      );
      console.log(`\n── ${style} row ──`);
      console.log(result.output);
      expect(result.hasText(style)).toBe(true);
    });

    it(`column: ${style}`, () => {
      const result = renderForTest(
        React.createElement(
          Panes,
          { direction: "column", borderStyle: style, width: 22, height: 10 },
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, style)),
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "B")),
        ),
        { width: 22, height: 10 },
      );
      console.log(`── ${style} col ──`);
      console.log(result.output);
      expect(result.hasText(style)).toBe(true);
    });
  });
});
