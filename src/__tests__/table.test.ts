/**
 * Table component tests.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Table } from "../components/index.js";

const columns = [
  { key: "name", header: "Name" },
  { key: "score", header: "Score" },
];

describe("Table", () => {
  it("renders columns and rows", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }, { name: "Bob", score: 87 }],
      }),
      { width: 40, height: 10 },
    );
    expect(result.hasText("Alice")).toBe(true);
    expect(result.hasText("Bob")).toBe(true);
    expect(result.hasText("95")).toBe(true);
    expect(result.hasText("87")).toBe(true);
  });

  it("renders header row", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Carol", score: 100 }],
      }),
      { width: 40, height: 10 },
    );
    expect(result.hasText("Name")).toBe(true);
    expect(result.hasText("Score")).toBe(true);
  });

  it("renders right-aligned column", () => {
    const cols = [
      { key: "item", header: "Item" },
      { key: "price", header: "Price", align: "right" as const },
    ];
    const result = renderForTest(
      React.createElement(Table, {
        columns: cols,
        data: [{ item: "Widget", price: 42 }],
      }),
      { width: 40, height: 10 },
    );
    expect(result.hasText("Widget")).toBe(true);
    expect(result.hasText("42")).toBe(true);
  });

  it("renders empty state", () => {
    const result = renderForTest(
      React.createElement(Table, { columns, data: [] }),
      { width: 40, height: 5 },
    );
    expect(result.hasText("No data")).toBe(true);
  });

  it("renders separator between header and body", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Dan", score: 77 }],
      }),
      { width: 40, height: 10 },
    );
    // Separator uses ─ characters
    expect(result.output.includes("\u2500")).toBe(true);
  });

  it("passes controlled focus and state flags to renderCell", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        isFocused: true,
        focusMode: "cell",
        focusedCell: { row: 0, column: "score" },
        selectedRows: [0],
        editedCells: [{ row: 0, column: "name" }],
        lockedCells: [{ row: 0, column: "score" }],
        renderCell: (value, column, _row, state) =>
          React.createElement(
            "tui-text",
            null,
            `${column.key[0]}${state.isFocusedCell ? "F" : "-"}${state.isSelectedRow ? "S" : "-"}${state.isEdited ? "E" : "-"}${state.isLocked ? "L" : "-"}`,
          ),
      }),
      { width: 80, height: 10 },
    );
    expect(result.hasText("n-SE-")).toBe(true);
    expect(result.hasText("sFS-L")).toBe(true);
  });

  it("supports row and column focus modes", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        isFocused: true,
        focusMode: "column",
        focusedColumn: "score",
        renderCell: (value, column, _row, state) =>
          React.createElement(
            "tui-text",
            null,
            `${column.key[0]}${state.isFocusedColumn ? "C" : "-"}${state.isFocusedRow ? "R" : "-"}`,
          ),
      }),
      { width: 80, height: 10 },
    );
    expect(result.hasText("n--")).toBe(true);
    expect(result.hasText("sC-")).toBe(true);
  });

  it("respects cell editability and lock predicates", () => {
    const edits: Array<{ row: number; column: string; value: string }> = [];
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        isFocused: true,
        rowHighlight: true,
        editable: true,
        isCellEditable: (_value, column) => column.key === "score",
        onCellEdit: (row, column, value) => { edits.push({ row, column, value }); },
      }),
      { width: 40, height: 10 },
    );

    result.pressRight();
    result.pressEnter();
    result.fireKey("backspace");
    result.fireKey("6", { });
    result.pressEnter();

    expect(edits).toEqual([{ row: 0, column: "score", value: "96" }]);
  });

  it("does not enter edit mode for locked cells", () => {
    const edits: Array<{ row: number; column: string; value: string }> = [];
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        isFocused: true,
        rowHighlight: true,
        editable: true,
        isCellEditable: () => true,
        isCellLocked: (_value, column) => column.key === "score",
        onCellEdit: (row, column, value) => { edits.push({ row, column, value }); },
      }),
      { width: 40, height: 10 },
    );

    result.pressRight();
    result.pressEnter();
    result.fireKey("1", {});
    result.pressEnter();

    expect(edits).toEqual([]);
  });

  it("handles mouse cell presses", () => {
    const presses: Array<{ row: number; column: string }> = [];
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        onCellPress: (row, column) => { presses.push({ row, column }); },
      }),
      { width: 40, height: 10 },
    );

    result.click(2, 3);

    expect(presses).toEqual([{ row: 0, column: "name" }]);
  });

  it("sorts from header clicks", () => {
    const sorts: Array<{ column: string; direction: "asc" | "desc" }> = [];
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        sortable: true,
        onSort: (column, direction) => { sorts.push({ column, direction }); },
      }),
      { width: 40, height: 10 },
    );

    result.click(2, 1);
    result.click(2, 1);

    expect(sorts).toEqual([
      { column: "name", direction: "asc" },
      { column: "name", direction: "desc" },
    ]);
  });

  it("fits auto-sized columns to an explicit table width", () => {
    const result = renderForTest(
      React.createElement(Table, {
        width: 40,
        borderStyle: "none",
        columns: [
          { key: "field", header: "Field" },
          { key: "value", header: "Value", align: "right" as const },
          { key: "unit", header: "Unit" },
          { key: "format", header: "Format" },
        ],
        data: [{ field: "Live load element factor", value: 4, unit: "-", format: "0.00" }],
      }),
      { width: 60, height: 10 },
    );

    expect(result.hasText("Format")).toBe(true);
    expect(result.hasText("Live load ele…")).toBe(true);
  });

  // ── Styling: predicate row/cell + per-column ────────────────────────

  /** True if any of the preceding 80 bytes before `text` in `styled` contain the SGR sequence `sgr`. */
  function hasStyleBefore(styled: string, text: string, sgr: string): boolean {
    const idx = styled.indexOf(text);
    if (idx === -1) return false;
    const window = styled.slice(Math.max(0, idx - 25), idx);
    return window.includes(sgr);
  }

  /** True if no occurrence of `text` in `styled` is preceded (within 80 bytes) by `sgr`. */
  function neverHasStyleBefore(styled: string, text: string, sgr: string): boolean {
    let pos = 0;
    while (true) {
      const idx = styled.indexOf(text, pos);
      if (idx === -1) return true;
      const window = styled.slice(Math.max(0, idx - 25), idx);
      if (window.includes(sgr)) return false;
      pos = idx + text.length;
    }
  }

  it("rowStyle predicate styles a specific row", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns: [
          { key: "name", header: "Name" },
          { key: "status", header: "Status" },
        ],
        data: [
          { name: "Alice", status: "ok" },
          { name: "Bob", status: "error" },
        ],
        rowStyle: (row: Record<string, string | number>) =>
          row.status === "error" ? { bold: true } : undefined,
      }),
      { width: 40, height: 10 },
    );
    // Bob's row is bolded; Alice's is not.
    expect(hasStyleBefore(result.styledOutput, "Bob", "\x1b[1m")).toBe(true);
    expect(neverHasStyleBefore(result.styledOutput, "Alice", "\x1b[1m")).toBe(true);
  });

  it("cellStyle predicate styles a specific cell", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [
          { name: "Alice", score: 95 },
          { name: "Bob", score: 70 },
        ],
        cellStyle: (value: string | number, column: { key: string }) =>
          column.key === "score" && Number(value) > 90 ? { italic: true } : undefined,
      }),
      { width: 40, height: 10 },
    );
    // Alice's score is italic; Bob's score and Alice's name are not.
    expect(hasStyleBefore(result.styledOutput, "95", "\x1b[3m")).toBe(true);
    expect(neverHasStyleBefore(result.styledOutput, "70", "\x1b[3m")).toBe(true);
    expect(neverHasStyleBefore(result.styledOutput, "Alice", "\x1b[3m")).toBe(true);
  });

  it("column style applies to all body cells in that column", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns: [
          { key: "name", header: "Name", dim: true },
          { key: "score", header: "Score" },
        ],
        data: [
          { name: "Alice", score: 95 },
          { name: "Bob", score: 70 },
        ],
      }),
      { width: 40, height: 10 },
    );
    // All body name cells render dim (\x1b[2m).
    expect(hasStyleBefore(result.styledOutput, "Alice", "\x1b[2m")).toBe(true);
    expect(hasStyleBefore(result.styledOutput, "Bob", "\x1b[2m")).toBe(true);
    // Score cells are not dim.
    expect(neverHasStyleBefore(result.styledOutput, "95", "\x1b[2m")).toBe(true);
  });

  it("column style does NOT affect headers", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns: [
          { key: "name", header: "Name", dim: true },
          { key: "score", header: "Score" },
        ],
        data: [{ name: "Alice", score: 95 }],
      }),
      { width: 40, height: 10 },
    );
    // Header "Name" is NOT dim despite the column setting dim=true.
    expect(neverHasStyleBefore(result.styledOutput, "Name", "\x1b[2m")).toBe(true);
  });

  it("state style overrides rowStyle predicate (focus stays visible)", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        isFocused: true,
        rowHighlight: true,
        rowStyle: () => ({ bold: false, inverse: false }),
        stateStyles: { focusedRow: { inverse: true } },
      }),
      { width: 40, height: 10 },
    );
    // Focused row gets inverse (\x1b[7m) from stateStyles, overriding the predicate.
    expect(hasStyleBefore(result.styledOutput, "Alice", "\x1b[7m")).toBe(true);
  });

  it("cellStyle overrides rowStyle for the same cell", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        rowStyle: () => ({ bold: true, italic: false }),
        cellStyle: (_value: string | number, column: { key: string }) =>
          column.key === "score" ? { bold: false, italic: true } : undefined,
      }),
      { width: 40, height: 10 },
    );
    // Score cell: italic wins, bold disabled by cellStyle.
    expect(hasStyleBefore(result.styledOutput, "95", "\x1b[3m")).toBe(true);
    // Name cell: bold from rowStyle still applied.
    expect(hasStyleBefore(result.styledOutput, "Alice", "\x1b[1m")).toBe(true);
  });

  it("italic propagates from cellStyle to rendered tui-text", () => {
    const result = renderForTest(
      React.createElement(Table, {
        columns,
        data: [{ name: "Alice", score: 95 }],
        cellStyle: () => ({ italic: true }),
      }),
      { width: 40, height: 10 },
    );
    expect(result.styledOutput.includes("\x1b[3m")).toBe(true);
  });
});
