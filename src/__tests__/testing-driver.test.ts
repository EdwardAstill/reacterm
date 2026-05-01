import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { Box, Button, Text, TextInput } from "../components/index.js";
import {
  renderDriver,
  renderForTest,
  writeFailureBundle,
  type ScenarioDefinition,
  runScenario,
  exploreForTest,
} from "../testing/index.js";

describe("testing metadata", () => {
  it("captures frame, semantic, focus, and bounds metadata without breaking renderForTest", () => {
    const result = renderForTest(
      React.createElement(Box, { role: "region", "aria-label": "Demo Region", testId: "root-box" },
        React.createElement(Button, { label: "Run", "aria-label": "Run task" }),
      ),
      { width: 40, height: 8 },
    );

    expect(result.hasText("Run")).toBe(true);
    expect(result.metadata.frames.length).toBeGreaterThan(0);
    expect(result.metadata.frames.at(-1)?.screenHash).toMatch(/^h[0-9a-f]+$/);
    expect(result.metadata.semanticNodes.some((node) => node.role === "region" && node.label === "Demo Region")).toBe(true);
    expect(result.metadata.semanticNodes.some((node) => node.role === "button" && node.label === "Run task")).toBe(true);
    expect(result.metadata.semanticNodes.some((node) => node.testId === "root-box")).toBe(true);
    expect(result.metadata.focusedId).not.toBeNull();
  });
});

describe("renderDriver", () => {
  function DriverHarness(): React.ReactElement {
    const [value, setValue] = useState("");
    const [submitted, setSubmitted] = useState("");
    return React.createElement(Box, { flexDirection: "column" },
      React.createElement(TextInput, {
        value,
        onChange: setValue,
        onSubmit: setSubmitted,
        placeholder: "name",
        focus: true,
        "aria-label": "Name",
      }),
      React.createElement(Text, null, `value=${value}`),
      React.createElement(Text, null, `submitted=${submitted}`),
    );
  }

  it("drives keyboard input with fluent assertions and trace records", async () => {
    const driver = renderDriver(React.createElement(DriverHarness), { width: 50, height: 8 });

    await driver.type("Ada").press("enter").expectText("value=Ada").expectText("submitted=Ada");

    expect(driver.trace().map((entry) => entry.type)).toEqual(["type", "press", "expectText", "expectText"]);
    expect(driver.frames().length).toBeGreaterThanOrEqual(3);

    driver.unmount();
  });

  it("queries semantic nodes and clicks by role", async () => {
    let clicked = 0;
    const driver = renderDriver(
      React.createElement(Button, { label: "Save", onPress: () => { clicked++; }, "aria-label": "Save file" }),
      { width: 30, height: 5 },
    );

    expect(driver.getByRole("button", { name: "Save file" }).label).toBe("Save file");
    await driver.click({ role: "button", name: "Save file" });

    expect(clicked).toBe(1);
    driver.unmount();
  });

  it("writes failure bundles with text, styled output, svg, frames, and trace", async () => {
    const driver = renderDriver(React.createElement(Text, null, "Bundle"), { width: 20, height: 4 });
    await driver.expectText("Bundle");

    const files = writeFailureBundle(driver, "tmp/testing-driver-bundle");

    expect(files.some((file) => file.endsWith("screen.txt"))).toBe(true);
    expect(files.some((file) => file.endsWith("screen.svg"))).toBe(true);
    expect(files.some((file) => file.endsWith("trace.json"))).toBe(true);
    driver.unmount();
  });
});

describe("scenario runner", () => {
  it("replays declarative steps against a provided app", async () => {
    const scenario: ScenarioDefinition = {
      name: "text scenario",
      terminal: { width: 30, height: 4 },
      steps: [
        { expectText: "Ready" },
        { snapshotText: "initial" },
        { assertNoWarnings: true },
      ],
    };

    const result = await runScenario(scenario, {
      app: React.createElement(Text, null, "Ready"),
    });

    expect(result.passed).toBe(true);
    expect(result.trace.length).toBeGreaterThan(0);
  });
});

describe("explorer", () => {
  it("runs bounded actions and reports visited frames", async () => {
    const report = await exploreForTest(
      React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, null, "Explore"),
        React.createElement(TextInput, { focus: true, value: "", onChange: () => {} }),
      ),
      { maxDepth: 3, actions: ["tab", "enter"], terminal: { width: 40, height: 6 } },
    );

    expect(report.framesVisited).toBeGreaterThan(0);
    expect(report.failures).toEqual([]);
  });
});
