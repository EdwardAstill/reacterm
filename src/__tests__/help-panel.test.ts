import { describe, expect, it } from "vitest";
import React from "react";
import { HelpPanel } from "../components/index.js";
import { renderForTest } from "../testing/index.js";

const bindings = [
  { keys: "/", description: "CommandPalette", category: "Navigation" },
  { keys: "Esc", description: "Dismiss overlay", category: "Feedback" },
];

describe("HelpPanel", () => {
  it("treats raw terminal backspace as deletion, not filter text", () => {
    const result = renderForTest(
      React.createElement(HelpPanel, {
        bindings,
        mode: "inline",
        visible: true,
        title: "HelpPanel",
        columns: 1,
      }),
      { width: 80, height: 16 },
    );

    result.type("sdf");
    expect(result.hasText("Filter: sdf")).toBe(true);

    result.fireKey("backspace", { char: "", raw: "\x7f" });
    expect(result.hasText("Filter: sd")).toBe(true);
    expect(result.hasText("Filter: sdf")).toBe(false);
  });
});
