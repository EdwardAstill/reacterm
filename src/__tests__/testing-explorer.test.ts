import React from "react";
import { describe, expect, it } from "vitest";
import { Box, Text, TextInput } from "../components/index.js";
import { exploreForTest } from "../testing/index.js";

describe("exploreForTest", () => {
  it("bounds exploration by maxDepth", async () => {
    const report = await exploreForTest(
      React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, null, "Explorer ready"),
        React.createElement(TextInput, { value: "", onChange: () => {}, focus: true }),
      ),
      { maxDepth: 2, actions: ["tab", "enter"], terminal: { width: 40, height: 6 } },
    );

    expect(report.actionsTried).toBe(2);
    expect(report.framesVisited).toBeGreaterThan(0);
    expect(report.failures).toEqual([]);
  });
});
