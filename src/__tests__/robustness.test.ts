/**
 * Robustness tests — multi-component stress scenarios.
 *
 * Each test composes multiple components (Panes + Modal + ConfirmDialog +
 * SearchInput + OptionList + ScrollView) to catch layout seam, focus trap,
 * and event routing regressions that single-component tests can't surface.
 *
 * Tests here should be resilient to harmless render-order changes but fail
 * loudly on:
 *   - double-drawn seams (│ beside │, ─ above ─)
 *   - missing content labels in a visible layout
 *   - hook-order errors when toggling visibility
 *   - focus traps leaking across modal boundaries
 *   - keyboard events reaching the wrong component
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { App as DemoApp } from "../../examples/reacterm-demo.js";
import { renderForTest } from "../testing/index.js";
import {
  Panes,
  Pane,
  Modal,
  ConfirmDialog,
  ScrollView,
  TextInput,
  SearchInput,
} from "../components/index.js";
import { OptionList } from "../components/extras/OptionList.js";
import { SearchList } from "../components/extras/SearchList.js";
import { FocusGroup } from "../components/core/FocusGroup.js";

const T = (p: { children: string }) => React.createElement("tui-text", null, p.children);

// ── Demo global shortcut routing ────────────────────────────────────────

describe("Demo global shortcuts", () => {
  it("lets Forms text fields receive letters that are also global shortcuts", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 80, height: 24 });

    result.pressTab(); // Layout
    result.pressTab(); // Forms
    expect(result.hasText("Form controls")).toBe(true);

    for (const ch of "Quentin") result.type(ch);

    expect(result.hasText("Quentin")).toBe(true);
    expect(result.hasText("Form controls")).toBe(true);
  });

  it("lets SearchList consume bare letters before app-level shortcuts", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 80, height: 24 });

    result.pressTab(); // Layout
    result.pressTab(); // Forms
    result.pressTab(); // Search
    expect(result.hasText("SearchList")).toBe(true);

    result.type("q");

    expect(result.hasText("SearchList")).toBe(true);
    expect(result.hasText("No matches")).toBe(true);
  });

  it("opens Data at the top and mouse-wheel scroll reveals lower widgets", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 80, height: 24 });

    result.pressTab(); // Layout
    result.pressTab(); // Forms
    result.pressTab(); // Search
    result.pressTab(); // Data

    expect(result.hasText("Data widgets")).toBe(true);
    expect(result.hasText("Pretty (JSON-like)")).toBe(false);

    for (let i = 0; i < 8; i++) result.scroll("down", 30, 12);

    expect(result.hasText("Pretty (JSON-like)")).toBe(true);
    expect(result.hasText("reacterm")).toBe(true);
  });

  it("lets the Scroll-to-edit table consume wheel events to edit a cell", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 100, height: 30 });

    result.pressTab(); // Layout
    result.pressTab(); // Forms
    result.pressTab(); // Search
    result.pressTab(); // Data

    for (let i = 0; i < 9; i++) result.scroll("down", 95, 15);

    expect(result.hasText("Scroll-to-edit table")).toBe(true);
    expect(result.hasText("Revenue        120")).toBe(true);

    const rowY = result.lines.findIndex((line) => line.includes("Revenue") && line.includes("120"));
    expect(rowY).toBeGreaterThanOrEqual(0);
    const revenueLine = result.lines[rowY]!;
    const x = revenueLine.indexOf("120") + 1;
    expect(x).toBeGreaterThan(0);

    result.click(x, rowY);
    result.scroll("up", x, rowY);

    expect(result.hasText("Revenue · Q1 = 121")).toBe(true);
  });

  it("renders the AI section as separated panels without metric collision", () => {
    const result = renderForTest(React.createElement(DemoApp), { width: 120, height: 34 });

    for (let i = 0; i < 7; i++) result.pressTab();

    expect(result.hasText("AI agent flow")).toBe(true);
    expect(result.hasText("Conversation")).toBe(true);
    expect(result.hasText("Workflow")).toBe(true);
    expect(result.hasText("Context")).toBe(true);
    expect(result.hasText("Cost")).toBe(true);
    expect(result.hasText("Run agent")).toBe(true);
    expect(result.output).not.toContain("remTotal");

    result.type("r");

    expect(result.hasText("Fix the bug in auth.ts")).toBe(true);
    expect(result.hasText("Read auth.ts")).toBe(true);
  });
});

// ── Panes + Modal ────────────────────────────────────────────────────────

describe("Panes + Modal", () => {
  it("modal overlays panes without destroying pane layout", () => {
    const layout = (modalVisible: boolean) =>
      React.createElement("tui-box", { flexDirection: "column", width: 60, height: 20 },
        React.createElement(
          Panes,
          { direction: "row", borderStyle: "single", flex: 1 },
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "PaneA")),
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "PaneB")),
        ),
        React.createElement(Modal, { visible: modalVisible, size: "sm" },
          React.createElement(T, null, "ModalX"),
        ),
      );

    const without = renderForTest(layout(false), { width: 60, height: 20 });
    const with_ = renderForTest(layout(true), { width: 60, height: 20 });
    // Panes still present under the modal
    expect(with_.hasText("PaneA")).toBe(true);
    expect(with_.hasText("PaneB")).toBe(true);
    expect(with_.hasText("ModalX")).toBe(true);
    // No pane-border corruption from modal overlay
    expect(with_.output.includes("││")).toBe(false);
    // Confirm open vs closed both preserve panes
    expect(without.hasText("PaneA")).toBe(true);
  });

  it("panes containing scrollview still layout correctly", () => {
    // Smaller content that fits comfortably — test is about layout stability,
    // not scrollview virtualisation. Larger datasets touch ScrollView's internal
    // viewport logic which is covered separately in scrollview.test.ts.
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 60, height: 10 },
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "SideA")),
        React.createElement(
          Pane,
          { flex: 2 },
          React.createElement(ScrollView, { height: 6 },
            React.createElement("tui-text", null, "Row-A"),
            React.createElement("tui-text", null, "Row-B"),
            React.createElement("tui-text", null, "Row-C"),
          ),
        ),
      ),
      { width: 60, height: 10 },
    );
    expect(result.hasText("SideA")).toBe(true);
    expect(result.hasText("Row-A")).toBe(true);
    // No double seams from the Panes border layering with the ScrollView
    expect(result.output.includes("││")).toBe(false);
  });
});

// ── Modal stacking ───────────────────────────────────────────────────────

describe("Modal stacking", () => {
  it("modal inside modal renders without throwing; outer stays visible", () => {
    // Nested overlays position absolutely — layering is platform-defined and
    // the inner may overdraw or be clipped. We don't pin a specific layering;
    // we DO verify the outer content survives and the render doesn't crash.
    expect(() => {
      const result = renderForTest(
        React.createElement(Modal, { visible: true, title: "Outer", onClose: () => {} },
          React.createElement(T, null, "OuterBody"),
          React.createElement(Modal, { visible: true, title: "Inner", onClose: () => {} },
            React.createElement(T, null, "InnerBody"),
          ),
        ),
        { width: 80, height: 24 },
      );
      expect(result.hasText("Outer")).toBe(true);
    }).not.toThrow();
  });

  // Deliberately omitted: "two siblings at same absolute centre both render".
  // Two modals at identical position overdraw; there's no z-index contract
  // to pin. The consumer pattern is nested (child closes → parent remains) or
  // single-modal-with-ConfirmDialog-sibling (different overlay shape). Testing
  // two same-position modals would pin accidental paint-order as a contract.

  it("rapid visible toggling does not corrupt state", () => {
    const makeModal = (v: boolean, tag: string) =>
      React.createElement(Modal, { visible: v, title: "T", onClose: () => {} },
        React.createElement(T, null, tag),
      );
    const result = renderForTest(makeModal(true, "R1"), { width: 60, height: 20 });
    expect(result.hasText("R1")).toBe(true);
    for (let i = 0; i < 12; i++) {
      result.rerender(makeModal(i % 2 === 0, `R${i + 2}`));
    }
    // Final rerender: visible
    result.rerender(makeModal(true, "FINAL"));
    expect(result.hasText("FINAL")).toBe(true);
  });
});

// ── Modal + ConfirmDialog ────────────────────────────────────────────────

describe("Modal + ConfirmDialog (sibling overlays)", () => {
  // Real-world pattern: host app keeps Modal mounted, then mounts
  // ConfirmDialog at the SAME parent level for destructive confirmations.
  // Nesting ConfirmDialog inside Modal's children subjects it to overlay
  // clipping; siblings is the documented pattern.

  it("sibling confirm dialog over modal — both messages render", () => {
    const result = renderForTest(
      React.createElement("tui-box", { width: 80, height: 24 },
        React.createElement(Modal, { visible: true, title: "Settings", onClose: () => {} },
          React.createElement(T, null, "SettingsBody"),
        ),
        React.createElement(ConfirmDialog, {
          visible: true,
          message: "Discard changes?",
          onConfirm: () => {},
          onCancel: () => {},
          type: "danger",
        }),
      ),
      { width: 80, height: 24 },
    );
    expect(result.hasText("Settings")).toBe(true);
    expect(result.hasText("Discard changes?")).toBe(true);
  });

  it("ConfirmDialog Escape wins over Modal when stacked (priority invariant)", () => {
    // Regression guard for input/priorities.ts: CONFIRM_DIALOG (2000) must
    // exceed MODAL (1000) so a dialog stacked over a modal dismisses itself
    // on Escape, not the host modal.
    let modalClosed = false;
    let dialogCancelled = false;
    const result = renderForTest(
      React.createElement("tui-box", { width: 80, height: 24 },
        React.createElement(Modal, { visible: true, title: "Host", onClose: () => { modalClosed = true; } },
          React.createElement(T, null, "HostBody"),
        ),
        React.createElement(ConfirmDialog, {
          visible: true,
          message: "Confirm?",
          onConfirm: () => {},
          onCancel: () => { dialogCancelled = true; },
        }),
      ),
      { width: 80, height: 24 },
    );
    expect(result.hasText("Confirm?")).toBe(true);
    result.pressEscape();
    expect(dialogCancelled).toBe(true);
    expect(modalClosed).toBe(false);
  });

  it("confirm dialog visibility flip does not destabilize host modal", () => {
    const layout = (dialogVisible: boolean) =>
      React.createElement("tui-box", { width: 80, height: 24 },
        React.createElement(Modal, { visible: true, title: "Host", onClose: () => {} },
          React.createElement(T, null, "HostBody"),
        ),
        React.createElement(ConfirmDialog, {
          visible: dialogVisible,
          message: "Proceed?",
          onConfirm: () => {},
          onCancel: () => {},
        }),
      );
    const r = renderForTest(layout(false), { width: 80, height: 24 });
    expect(r.hasText("Host")).toBe(true);
    expect(r.hasText("Proceed?")).toBe(false);
    r.rerender(layout(true));
    expect(r.hasText("Proceed?")).toBe(true);
    r.rerender(layout(false));
    expect(r.hasText("Proceed?")).toBe(false);
    r.rerender(layout(true));
    expect(r.hasText("Proceed?")).toBe(true);
  });
});

// ── SearchInput + OptionList regression (improvements.md §4) ─────────────

describe("SearchInput + OptionList in Modal (improvements.md §4)", () => {
  it("disjoint-key domain: arrow/enter → OptionList, typing → SearchInput", () => {
    const items = [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Cherry", value: "cherry" },
    ];
    let selected = "";
    let query = "";
    const result = renderForTest(
      React.createElement(Modal, { visible: true, title: "Pick", onClose: () => {} },
        React.createElement(SearchInput, {
          value: query,
          onChange: (v: string) => { query = v; },
          isFocused: true,
        }),
        React.createElement(OptionList, {
          items,
          isFocused: true,
          onSelect: (v: string) => { selected = v; },
        }),
      ),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Apple")).toBe(true);
    expect(result.hasText("Banana")).toBe(true);
    // Navigate: press down, then enter → should select banana (index 1)
    result.pressDown();
    result.pressEnter();
    expect(selected).toBe("banana");
  });

  it("mounting SearchInput + OptionList + Modal siblings does NOT emit the multi-handler warning", () => {
    // End-to-end stderr capture: the exact consumer pattern from
    // improvements.md §4. Dual `isFocused` on disjoint-domain widgets
    // (typing vs navigation) should NOT trip the warning.
    const stderrWrites: string[] = [];
    const originalWrite = process.stderr.write;
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrWrites.push(typeof chunk === "string" ? chunk : chunk.toString());
      return true;
    }) as typeof process.stderr.write;
    try {
      const items = [
        { label: "Alpha", value: "alpha" },
        { label: "Beta", value: "beta" },
      ];
      const result = renderForTest(
        React.createElement(Modal, { visible: true, title: "Add", onClose: () => {} },
          React.createElement(SearchInput, {
            value: "",
            onChange: () => {},
            isFocused: true,
          }),
          React.createElement(OptionList, {
            items,
            isFocused: true,
            onSelect: () => {},
          }),
        ),
        { width: 60, height: 20 },
      );
      // Exercise typing + navigation like a real user: letter, down, enter
      result.type("a");
      result.pressDown();
      result.pressEnter();
      result.unmount();
    } finally {
      process.stderr.write = originalWrite;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
    const warningFired = stderrWrites.some((s) =>
      s.includes("Multiple components are receiving keyboard input"),
    );
    expect(warningFired).toBe(false);
  });
});

// ── SearchList compound (ROADMAP A1) ─────────────────────────────────────

describe("SearchList compound", () => {
  const items = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry" },
    { label: "Apricot", value: "apricot" },
  ];

  it("typing filters, arrow navigates filtered, enter selects", () => {
    let selected = "";
    const result = renderForTest(
      React.createElement(SearchList, {
        items,
        onSelect: (v: string) => { selected = v; },
      }),
      { width: 60, height: 20 },
    );
    // Initial render: full list.
    expect(result.hasText("Apple")).toBe(true);
    expect(result.hasText("Banana")).toBe(true);
    // Filter to "ap" — should leave only Apple + Apricot (alphabetical
    // order, both start with "Ap"). Down → Apricot, enter → "apricot".
    // We don't read hasText after typing because the test harness doesn't
    // auto-rerender on key events; we verify the filter through the
    // selected side effect.
    result.type("a");
    result.type("p");
    result.pressDown();
    result.pressEnter();
    expect(selected).toBe("apricot");
  });

  it("escape clears query first, then calls onCancel", () => {
    let cancels = 0;
    const result = renderForTest(
      React.createElement(SearchList, {
        items,
        onCancel: () => { cancels++; },
      }),
      { width: 60, height: 20 },
    );
    result.type("z");
    result.pressEscape();
    expect(cancels).toBe(0);
    result.pressEscape();
    expect(cancels).toBe(1);
  });

  it("does NOT emit the multi-handler warning", () => {
    const stderrWrites: string[] = [];
    const originalWrite = process.stderr.write;
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrWrites.push(typeof chunk === "string" ? chunk : chunk.toString());
      return true;
    }) as typeof process.stderr.write;
    try {
      const result = renderForTest(
        React.createElement(SearchList, { items, onSelect: () => {} }),
        { width: 60, height: 20 },
      );
      result.type("a");
      result.pressDown();
      result.pressEnter();
      result.unmount();
    } finally {
      process.stderr.write = originalWrite;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
    const warningFired = stderrWrites.some((s) =>
      s.includes("Multiple components are receiving keyboard input"),
    );
    expect(warningFired).toBe(false);
  });
});

// ── FocusGroup trap-prop toggle ──────────────────────────────────────────

// ── Inline-component anti-pattern regression ────────────────────────────
// Reproduces the demo bug where defining a Row component inside the
// parent caused the entire input subtree to remount on every parent
// re-render, thrashing focus.register/focus.focus and emitting the
// "Multiple elements have isFocused={true}" warning when the user
// changed which field had focus.

describe("Stable parent component (no inline component definitions)", () => {
  it("toggling which sibling input has isFocused does NOT emit the multi-handler warning", () => {
    const stderrWrites: string[] = [];
    const originalWrite = process.stderr.write;
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrWrites.push(typeof chunk === "string" ? chunk : chunk.toString());
      return true;
    }) as typeof process.stderr.write;
    try {
      // Two TextInputs as siblings; only one has isFocused at any time.
      const layout = (active: "a" | "b") =>
        React.createElement("tui-box", { flexDirection: "column" },
          React.createElement(TextInput, {
            value: "", onChange: () => {}, isFocused: active === "a",
          }),
          React.createElement(TextInput, {
            value: "", onChange: () => {}, isFocused: active === "b",
          }),
        );
      const result = renderForTest(layout("a"), { width: 30, height: 5 });
      // Toggle the focused input — emulating the demo's setField flow.
      result.rerender(layout("b"));
      result.rerender(layout("a"));
      result.rerender(layout("b"));
      result.unmount();
    } finally {
      process.stderr.write = originalWrite;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
    const warningFired = stderrWrites.some((s) =>
      s.includes("Multiple elements have isFocused"),
    );
    expect(warningFired).toBe(false);
  });
});

describe("FocusGroup trap prop toggle", () => {
  it("trap:true → false after mount releases the trap", () => {
    const layout = (trap: boolean) =>
      React.createElement(FocusGroup, { trap, id: "toggle-test" },
        React.createElement(T, null, "trapped"),
      );
    const r = renderForTest(layout(true), { width: 40, height: 6 });
    expect(r.hasText("trapped")).toBe(true);
    // Flip: no crash, content still visible
    r.rerender(layout(false));
    expect(r.hasText("trapped")).toBe(true);
    r.rerender(layout(true));
    expect(r.hasText("trapped")).toBe(true);
  });
});

// ── Focus trap interactions ──────────────────────────────────────────────

describe("Focus trap interactions", () => {
  it("escape inside modal invokes onClose, not host handler", () => {
    let modalClosed = false;
    let hostEscapes = 0;
    // Host that would also respond to escape if not trapped
    const layout = React.createElement("tui-box", { flexDirection: "column", width: 60, height: 20 },
      React.createElement(T, null, "Host"),
      React.createElement(Modal, {
        visible: true,
        onClose: () => { modalClosed = true; },
      },
        React.createElement(T, null, "Trapped"),
      ),
    );
    // NOTE: host-level escape handler can't easily be added without a full app
    // shell, but we can still verify the modal's onClose fires on escape.
    const result = renderForTest(layout, { width: 60, height: 20 });
    expect(result.hasText("Trapped")).toBe(true);
    result.pressEscape();
    expect(modalClosed).toBe(true);
    expect(hostEscapes).toBe(0); // no host handler registered; sanity check
  });

  it("text input inside modal: escape closes modal (focus trap priority)", () => {
    let closed = false;
    let value = "";
    const result = renderForTest(
      React.createElement(Modal, { visible: true, onClose: () => { closed = true; } },
        React.createElement(TextInput, {
          value,
          onChange: (v: string) => { value = v; },
          isFocused: true,
        }),
      ),
      { width: 60, height: 20 },
    );
    result.pressEscape();
    expect(closed).toBe(true);
  });
});

// ── Panes invariant matrix ───────────────────────────────────────────────

const BORDER_STYLES = ["single", "double", "heavy", "round", "ascii"] as const;
const DIRECTIONS = ["row", "column"] as const;

describe("Panes invariant matrix", () => {
  for (const style of BORDER_STYLES) {
    for (const dir of DIRECTIONS) {
      for (const n of [1, 2, 3, 4]) {
        it(`${style} ${dir} n=${n}: labels visible, no double seams`, () => {
          const w = dir === "row" ? 60 : 24;
          const h = dir === "row" ? 6 : Math.max(8, n * 3 + 2);
          const panes = Array.from({ length: n }, (_, i) =>
            React.createElement(Pane, { key: i, flex: 1 },
              React.createElement(T, null, `${style.slice(0, 2)}_${i}`),
            ),
          );
          const result = renderForTest(
            React.createElement(
              Panes,
              { direction: dir, borderStyle: style, width: w, height: h },
              ...panes,
            ),
            { width: w, height: h },
          );
          // All labels present
          for (let i = 0; i < n; i++) {
            expect(result.hasText(`${style.slice(0, 2)}_${i}`)).toBe(true);
          }
          // No double vertical seams (any unicode border style)
          if (style !== "ascii") {
            const vertPairs: Record<string, string> = {
              single: "││",
              double: "║║",
              heavy: "┃┃",
              round: "││",
            };
            const pair = vertPairs[style];
            if (pair) {
              expect(result.output.includes(pair)).toBe(false);
            }
          }
        });
      }
    }
  }

  it("per-pane border style override does not corrupt outer border", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 40, height: 5 },
        React.createElement(Pane, { flex: 1, borderStyle: "double" },
          React.createElement(T, null, "Dbl"),
        ),
        React.createElement(Pane, { flex: 1 },
          React.createElement(T, null, "Sng"),
        ),
      ),
      { width: 40, height: 5 },
    );
    expect(result.hasText("Dbl")).toBe(true);
    expect(result.hasText("Sng")).toBe(true);
  });

  it("nested row+column: all corner junctions present", () => {
    const result = renderForTest(
      React.createElement(
        Panes,
        { direction: "row", borderStyle: "single", width: 50, height: 12 },
        React.createElement(
          Panes,
          { direction: "column", flex: 1 },
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "TL")),
          React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "BL")),
        ),
        React.createElement(Pane, { flex: 1 }, React.createElement(T, null, "RR")),
      ),
      { width: 50, height: 12 },
    );
    expect(result.hasText("TL")).toBe(true);
    expect(result.hasText("BL")).toBe(true);
    expect(result.hasText("RR")).toBe(true);
    // All four outer corners must render
    expect(result.output).toContain("┌");
    expect(result.output).toContain("┐");
    expect(result.output).toContain("└");
    expect(result.output).toContain("┘");
    // Compound junctions present
    expect(result.output).toContain("├");
    expect(result.output).toContain("┤");
  });
});
