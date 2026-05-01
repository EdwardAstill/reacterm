import { describe, expect, it } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Markdown } from "../components/extras/Markdown.js";

describe("Markdown component", () => {
  it("renders an H1 transformed to upper-case with underline bar", () => {
    const result = renderForTest(
      React.createElement(Markdown, { content: "# hello\n" }),
      { width: 30, height: 5 },
    );
    expect(result.output).toContain("HELLO");
    expect(result.output).toMatch(/─{5,}/);
  });

  it("renders a GFM table with box-drawing borders", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |\n";
    const result = renderForTest(
      React.createElement(Markdown, { content: md }),
      { width: 30, height: 6 },
    );
    expect(result.output).toContain("┌");
    expect(result.output).toContain("┤");
    expect(result.output).toContain("│");
    expect(result.output).toMatch(/a\s+│\s+b/);
  });
});
