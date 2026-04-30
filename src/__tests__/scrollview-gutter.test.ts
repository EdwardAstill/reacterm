import React from "react";
import { describe, expect, it } from "vitest";
import { Box, ScrollView, Text } from "../components/index.js";
import { renderForTest } from "../testing/index.js";

function renderScrollView(height: number, extraProps: Record<string, unknown> = {}) {
  return renderForTest(
    React.createElement(
      ScrollView,
      {
        width: 12,
        height,
        ...extraProps,
      },
      React.createElement(
        Box,
        { borderStyle: "single", width: 12 },
        React.createElement(Text, null, "1234567890"),
        React.createElement(Text, null, "abcdefghij"),
        React.createElement(Text, null, "klmnopqrst"),
        React.createElement(Text, null, "uvwxyz1234"),
      ),
    ),
    { width: 12, height },
  );
}

describe("ScrollView scrollbar gutter", () => {
  it("keeps bordered content off the default scrollbar gutter", () => {
    const result = renderScrollView(4);
    const firstLine = result.lines.at(0) ?? "";

    expect(firstLine.endsWith(" ┃")).toBe(true);
  });

  it("allows compact legacy behavior with scrollbarGutter=0", () => {
    const result = renderScrollView(4, { scrollbarGutter: 0 });
    const firstLine = result.lines.at(0) ?? "";

    expect(firstLine.endsWith("┃")).toBe(true);
    expect(firstLine.endsWith(" ┃")).toBe(false);
  });

  it("does not render a scrollbar when content fits", () => {
    const result = renderScrollView(8);

    expect(result.output).not.toContain("┃");
    expect((result.lines.at(-1) ?? "").endsWith("┘")).toBe(true);
  });
});
