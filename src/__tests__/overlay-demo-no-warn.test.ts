import { it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { App as DemoApp } from "../cli/demo/App.js";

it("Overlays demo section does not produce 'multiple components' warnings", () => {
  const writes: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown) => {
    writes.push(typeof chunk === "string" ? chunk : (chunk as Buffer).toString("utf8"));
    return true;
  }) as typeof process.stderr.write;

  try {
    const result = renderForTest(React.createElement(DemoApp), { width: 120, height: 34 });
    for (let i = 0; i < 6; i++) result.pressTab();

    expect(result.hasText("Show overlay")).toBe(true);
    expect(result.hasText("Demo overlay - movable + resizable")).toBe(false);
    expect(result.hasText("B - movable only")).toBe(false);
    expect(result.hasText("C - resize only")).toBe(false);
    expect(result.hasText("ConfirmDialog preview")).toBe(false);

    result.fireKey("escape");
    result.fireKey("a");
    result.fireKey("tab");
  } finally {
    process.stderr.write = orig;
  }

  const warnings = writes.filter(w =>
    w.includes("Multiple components are receiving keyboard input")
  );
  expect(warnings).toEqual([]);
});
