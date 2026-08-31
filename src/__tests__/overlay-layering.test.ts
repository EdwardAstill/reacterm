import { describe, expect, it } from "vitest";
import React from "react";
import { OVERLAY_LAYER } from "../components/overlay-layers.js";
import { INPUT_PRIORITY } from "../input/priorities.js";
import { renderForTest } from "../testing/index.js";

describe("semantic overlay layers", () => {
  it("keeps paint and input bands in ascending semantic order", () => {
    expect(OVERLAY_LAYER).toEqual({
      INLINE: 10_000,
      WINDOW_BASE: 20_000,
      FLOATING_PANEL: 30_000,
      MODAL: 40_000,
      CONFIRM_DIALOG: 50_000,
    });
    expect(INPUT_PRIORITY.WINDOW).toBe(700);
    expect(OVERLAY_LAYER.CONFIRM_DIALOG).toBeGreaterThan(OVERLAY_LAYER.MODAL);
    expect(OVERLAY_LAYER.MODAL).toBeGreaterThan(OVERLAY_LAYER.FLOATING_PANEL);
    expect(OVERLAY_LAYER.FLOATING_PANEL).toBeGreaterThan(OVERLAY_LAYER.WINDOW_BASE);
    expect(OVERLAY_LAYER.WINDOW_BASE).toBeGreaterThan(OVERLAY_LAYER.INLINE);
    expect(INPUT_PRIORITY.FLOATING_PANEL).toBeGreaterThan(INPUT_PRIORITY.WINDOW);
  });

  it("paints the confirmation dialog above every lower semantic band", () => {
    const layers = [
      ["inline", OVERLAY_LAYER.INLINE],
      ["window", OVERLAY_LAYER.WINDOW_BASE],
      ["panel", OVERLAY_LAYER.FLOATING_PANEL],
      ["modal", OVERLAY_LAYER.MODAL],
      ["confirm", OVERLAY_LAYER.CONFIRM_DIALOG],
    ] as const;
    const result = renderForTest(
      React.createElement(
        React.Fragment,
        null,
        ...layers.map(([name, zIndex]) => React.createElement(
          "tui-overlay",
          {
            key: name,
            visible: true,
            position: "free",
            top: 5,
            left: 10,
            width: 24,
            height: 5,
            borderStyle: "single",
            zIndex,
          },
          React.createElement("tui-text", null, `${name} layer`),
        )),
      ),
      { width: 80, height: 24 },
    );

    expect(result.hasText("confirm layer")).toBe(true);
    expect(result.hasText("inline layer")).toBe(false);
    expect(result.hasText("window layer")).toBe(false);
    expect(result.hasText("panel layer")).toBe(false);
    expect(result.hasText("modal layer")).toBe(false);
  });
});
