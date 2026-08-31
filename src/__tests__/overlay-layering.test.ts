import { describe, expect, it, vi } from "vitest";
import React, { useContext, useRef } from "react";
import { OVERLAY_LAYER } from "../components/overlay-layers.js";
import {
  createWindowLayerManager,
  Overlay,
  OverlayContext,
  type OverlayManagerValue,
  OverlayProvider,
} from "../components/core/Overlay.js";
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

  it("keeps a brought-forward window topmost when the window band is full", () => {
    const BoundaryWindows = (): React.ReactElement => {
      const manager = useContext(OverlayContext);
      const primed = useRef(false);
      if (!manager) throw new Error("OverlayProvider is required");
      if (!primed.current) {
        primed.current = true;
        for (let i = 0; i < 9_997; i++) manager.register(`filler-${i}`);
      }

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Overlay,
          {
            id: "back",
            position: "free",
            defaultTop: 5,
            defaultLeft: 10,
            defaultWidth: 30,
            defaultHeight: 5,
            borderStyle: "single",
          },
          React.createElement("tui-text", null, "          BACK"),
        ),
        React.createElement(
          Overlay,
          {
            id: "front",
            position: "free",
            defaultTop: 5,
            defaultLeft: 20,
            defaultWidth: 20,
            defaultHeight: 5,
            borderStyle: "single",
          },
          React.createElement("tui-text", null, "FRONT"),
        ),
        React.createElement(
          Overlay,
          {
            id: "overflow",
            position: "free",
            defaultTop: 12,
            defaultLeft: 45,
            defaultWidth: 20,
            defaultHeight: 5,
            borderStyle: "single",
          },
          React.createElement("tui-text", null, "OVERFLOW"),
        ),
      );
    };

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let result: ReturnType<typeof renderForTest>;
    try {
      result = renderForTest(
        React.createElement(OverlayProvider, null, React.createElement(BoundaryWindows)),
        { width: 80, height: 24 },
      );
    } finally {
      error.mockRestore();
    }

    expect(error.mock.calls.flat().join(" ")).not.toContain("Cannot update a component while rendering");
    expect(result!.hasText("FRONT")).toBe(true);
    result!.click(12, 7);
    expect(result!.hasText("BACK")).toBe(true);
    expect(result!.hasText("FRONT")).toBe(false);
  });

  it("keeps standalone window-manager bring-to-front values within the window band", () => {
    const manager = createWindowLayerManager();
    for (let i = 0; i < 9_997; i++) manager.register(`filler-${i}`);
    manager.register("back");
    manager.register("front");

    const broughtToFront = manager.bringToFront("back");
    const front = manager.register("front");

    expect(broughtToFront).toBeGreaterThan(front);
    expect(broughtToFront).toBeLessThan(OVERLAY_LAYER.FLOATING_PANEL);
    expect(front).toBeGreaterThan(OVERLAY_LAYER.WINDOW_BASE);
  });

  it("accepts a custom OverlayContext manager with the exported two-method interface", () => {
    const manager: OverlayManagerValue = {
      register: () => OVERLAY_LAYER.WINDOW_BASE + 1,
      bringToFront: () => OVERLAY_LAYER.WINDOW_BASE + 2,
    };
    const result = renderForTest(
      React.createElement(
        OverlayContext.Provider,
        { value: manager },
        React.createElement(
          Overlay,
          {
            id: "custom-manager-window",
            position: "free",
            defaultTop: 5,
            defaultLeft: 10,
            defaultWidth: 20,
            defaultHeight: 5,
            borderStyle: "single",
          },
          React.createElement("tui-text", null, "CUSTOM MANAGER"),
        ),
      ),
      { width: 80, height: 24 },
    );

    expect(result.hasText("CUSTOM MANAGER")).toBe(true);
  });
});
