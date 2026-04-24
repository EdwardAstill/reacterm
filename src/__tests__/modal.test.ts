/**
 * Modal component tests.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Modal } from "../components/index.js";

describe("Modal", () => {
  it("renders children when visible", () => {
    const result = renderForTest(
      React.createElement(Modal, { visible: true },
        React.createElement("tui-text", null, "Modal body"),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Modal body")).toBe(true);
  });

  it("renders nothing when not visible", () => {
    const result = renderForTest(
      React.createElement(Modal, { visible: false },
        React.createElement("tui-text", null, "Hidden content"),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Hidden content")).toBe(false);
  });

  it("renders title when provided", () => {
    const result = renderForTest(
      React.createElement(Modal, { visible: true, title: "Confirm Action" },
        React.createElement("tui-text", null, "Are you sure?"),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Confirm Action")).toBe(true);
    expect(result.hasText("Are you sure?")).toBe(true);
  });

  it("shows esc hint when onClose is provided", () => {
    const result = renderForTest(
      React.createElement(Modal, { visible: true, onClose: () => {} },
        React.createElement("tui-text", null, "Content"),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("[Esc to close]")).toBe(true);
  });

  it("does not displace siblings in normal flow when toggled visible", () => {
    // Regression: tui-overlay must be out-of-flow. Previously the layout
    // engine treated it as a regular flex child, so opening a modal inside
    // a column-flow root shrank the body region (the modal stole rows from
    // the flex spacer above it). Use a screen wider than the default modal
    // so TOP/BOTTOM remain visible at the screen edges either side.
    const layout = (modalVisible: boolean) =>
      React.createElement(
        "tui-box",
        { flexDirection: "column", width: 80, height: 12 },
        React.createElement("tui-text", { key: "top" }, "TOP_MARKER"),
        React.createElement("tui-box", { key: "spacer", flex: 1 }),
        React.createElement("tui-text", { key: "bottom" }, "BOTTOM_MARKER"),
        React.createElement(Modal, { visible: modalVisible, key: "modal", size: "sm" },
          React.createElement("tui-text", null, "ModalContent"),
        ),
      );

    const without = renderForTest(layout(false), { width: 80, height: 12 });
    const with_ = renderForTest(layout(true), { width: 80, height: 12 });

    const lineOf = (r: { lines: string[] }, needle: string) =>
      r.lines.findIndex((l) => l.includes(needle));

    expect(lineOf(without, "TOP_MARKER")).toBe(0);
    expect(lineOf(without, "BOTTOM_MARKER")).toBe(11);
    expect(lineOf(with_, "TOP_MARKER")).toBe(0);
    expect(lineOf(with_, "BOTTOM_MARKER")).toBe(11);
    expect(with_.hasText("ModalContent")).toBe(true);
  });

  it("renders compound API with Root/Title/Body/Footer", () => {
    const result = renderForTest(
      React.createElement(Modal.Root, { visible: true },
        React.createElement(Modal.Title, null, "Settings"),
        React.createElement(Modal.Body, null,
          React.createElement("tui-text", null, "Body content"),
        ),
        React.createElement(Modal.Footer, null,
          React.createElement("tui-text", null, "Save"),
        ),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Settings")).toBe(true);
    expect(result.hasText("Body content")).toBe(true);
    expect(result.hasText("Save")).toBe(true);
  });
});
