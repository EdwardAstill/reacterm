import { describe, it, expect } from "vitest";
import React from "react";
import { captureFinal } from "../../engine/capture.js";
import { renderForTest } from "../../../testing/index.js";
import { Box, Text } from "../../../components/index.js";

describe("capture", () => {
  it("text capture contains rendered text", async () => {
    const r = renderForTest(
      React.createElement(Box, null, React.createElement(Text, null, "hi")),
    );
    expect(await captureFinal(r, { as: "text" })).toContain("hi");
  });
  it("svg capture starts with <svg", async () => {
    const r = renderForTest(
      React.createElement(Box, null, React.createElement(Text, null, "hi")),
    );
    expect((await captureFinal(r, { as: "svg" })).startsWith("<svg")).toBe(true);
  });
  it("json capture is parseable", async () => {
    const r = renderForTest(
      React.createElement(Box, null, React.createElement(Text, null, "hi")),
    );
    const parsed = JSON.parse(await captureFinal(r, { as: "json" }));
    expect(parsed.finalText).toContain("hi");
  });
});
