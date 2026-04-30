import { describe, expect, it } from "vitest";
import React from "react";
import { App as DemoApp } from "../../examples/reacterm-demo.js";
import { Box, GradientBorder, Text } from "../components/index.js";
import { renderForTest } from "../testing/index.js";

function openEditorSection() {
  const result = renderForTest(React.createElement(DemoApp), { width: 80, height: 24 });
  const editorRow = result.lines.findIndex((line) => line.includes("Editor"));
  expect(editorRow).toBeGreaterThanOrEqual(0);
  result.click(Math.max(1, result.lines[editorRow]!.indexOf("Editor")), editorRow);
  expect(result.hasText("Editor & docs")).toBe(true);
  return result;
}

describe("Demo editor and visual effects", () => {
  it("shows every visual effect family in the Effects section", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 100, height: 60 });
    const effectsRow = result.lines.findIndex((line) => line.includes("Effects"));
    expect(effectsRow).toBeGreaterThanOrEqual(0);
    result.click(Math.max(1, result.lines[effectsRow]!.indexOf("Effects")), effectsRow);

    for (const label of [
      "Gradient",
      "GradientBorder",
      "GradientProgress",
      "GlowText",
      "Transition",
      "RevealTransition",
      "AnimatePresence",
      "Digits",
      "Diagram",
      "Canvas",
    ]) {
      expect(result.hasText(label), label).toBe(true);
    }
  });

  it("groups the Effects section into compact visual lanes", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 100, height: 60 });
    const effectsRow = result.lines.findIndex((line) => line.includes("Effects"));
    expect(effectsRow).toBeGreaterThanOrEqual(0);
    result.click(Math.max(1, result.lines[effectsRow]!.indexOf("Effects")), effectsRow);

    expect(result.hasText("Paint")).toBe(true);
    expect(result.hasText("Motion")).toBe(true);
    expect(result.hasText("Readouts")).toBe(true);
    expect(result.hasText("Gradient · GradientBorder · GradientProgress · GlowText")).toBe(false);
  });

  it("keeps GradientBorder side borders aligned to the requested width", () => {
    const result = renderForTest(
      React.createElement(
        Box,
        { width: 80, flexDirection: "column" },
        React.createElement(
          GradientBorder,
          { width: 28 },
          React.createElement(Text, null, "multi-color border"),
        ),
      ),
      { width: 80, height: 8 },
    );

    const top = result.lines.find((line) => line.includes("╭"));
    const middle = result.lines.find((line) => line.includes("│") && line.includes("multi-color border"));
    const bottom = result.lines.find((line) => line.includes("╰"));

    expect(top).toBeDefined();
    expect(middle).toBeDefined();
    expect(bottom).toBeDefined();
    expect(middle!.length).toBe(top!.length);
    expect(bottom!.length).toBe(top!.length);
  });

  it("makes the demo Editor section editable", () => {
    const result = openEditorSection();

    result.type("Z");

    expect(result.hasText("Zfunction fizzbuzz")).toBe(true);
  });

  it("lets Tab indent inside the focused demo editor instead of leaving the section", () => {
    const result = openEditorSection();

    result.pressTab();

    expect(result.hasText("Editor & docs")).toBe(true);
    expect(result.hasText("  function fizzbuzz")).toBe(true);
  });
});
