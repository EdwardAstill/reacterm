import React from "react";
import { describe, expect, it } from "vitest";
import { Text } from "../components/index.js";
import { runScenario, type ScenarioDefinition } from "../testing/index.js";

describe("scenario runner", () => {
  it("returns a failing result and trace when an expectation fails", async () => {
    const scenario: ScenarioDefinition = {
      name: "failing scenario",
      terminal: { width: 30, height: 4 },
      steps: [
        { expectText: "Ready" },
        { expectText: "Missing" },
      ],
    };

    const result = await runScenario(scenario, {
      app: React.createElement(Text, null, "Ready"),
    });

    expect(result.passed).toBe(false);
    expect(result.error?.message).toContain("Missing");
    expect(result.trace.some((entry) => entry.type === "expectText")).toBe(true);
  });
});
