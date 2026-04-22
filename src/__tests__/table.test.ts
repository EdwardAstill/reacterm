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
});
