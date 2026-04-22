import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Tree } from "../components/index.js";

describe("Tree", () => {
  const nodes = [
    {
      key: "src",
      label: "src",
      expanded: false,
      children: [
        { key: "index", label: "index.ts" },
      ],
    },
    { key: "pkg", label: "package.json" },
  ];

  it("renders tree nodes", () => {
    const result = renderForTest(
      React.createElement(Tree, { nodes }),
      { width: 40, height: 10 },
    );

    expect(result.hasText("src")).toBe(true);
    expect(result.hasText("package.json")).toBe(true);
  });

  it("toggles the marker when clicked", () => {
    const toggles: string[] = [];
    const result = renderForTest(
      React.createElement(Tree, {
        nodes,
        onToggle: (key) => { toggles.push(key); },
      }),
      { width: 40, height: 10 },
    );

    result.click(0, 0);

    expect(toggles).toEqual(["src"]);
  });

  it("calls onSelect when a row is clicked", () => {
    const selections: string[] = [];
    const result = renderForTest(
      React.createElement(Tree, {
        nodes,
        onSelect: (key) => { selections.push(key); },
      }),
      { width: 40, height: 10 },
    );

    result.click(4, 1);

    expect(selections).toEqual(["pkg"]);
  });

  it("uses selectedKey in renderNode state", () => {
    const result = renderForTest(
      React.createElement(Tree, {
        nodes,
        selectedKey: "pkg",
        renderNode: (node, state) => React.createElement(
          "tui-text",
          null,
          `${node.label}:${state.isSelected ? "S" : "-"}:${state.isHighlighted ? "H" : "-"}`,
        ),
      }),
      { width: 60, height: 10 },
    );

    expect(result.hasText("src:-:-")).toBe(true);
    expect(result.hasText("package.json:S:-")).toBe(true);
  });

  it("calls onSelect on Enter for the highlighted node", () => {
    const selections: string[] = [];
    const result = renderForTest(
      React.createElement(Tree, {
        nodes,
        isFocused: true,
        onSelect: (key) => { selections.push(key); },
      }),
      { width: 40, height: 10 },
    );

    result.pressDown();
    result.pressEnter();

    expect(selections).toEqual(["pkg"]);
  });
});
