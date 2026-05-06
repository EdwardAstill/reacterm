import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import {
  flattenVisible,
  type TreeTableRow,
} from "../components/data/TreeTable.flatten.js";
import { TreeTable } from "../components/data/TreeTable.js";

const cols = [
  { key: "name", header: "Name" },
  { key: "owner", header: "Owner" },
];

describe("flattenVisible", () => {
  const sample: TreeTableRow[] = [
    {
      key: "a",
      values: { name: "A" },
      expanded: true,
      children: [
        { key: "a1", values: { name: "A1" } },
        { key: "a2", values: { name: "A2" } },
      ],
    },
    { key: "b", values: { name: "B" } },
  ];

  it("flattens an expanded parent's children inline", () => {
    const flat = flattenVisible(sample);
    expect(flat.map((r) => r.row.key)).toEqual(["a", "a1", "a2", "b"]);
  });

  it("hides children when expanded is false or undefined", () => {
    const collapsed: TreeTableRow[] = [{ ...sample[0]!, expanded: false }, sample[1]!];
    const flat = flattenVisible(collapsed);
    expect(flat.map((r) => r.row.key)).toEqual(["a", "b"]);
  });

  it("populates depth, isLast, parentIsLast, hasChildren", () => {
    const flat = flattenVisible(sample);
    expect(flat[0]).toMatchObject({ depth: 0, isLast: false, hasChildren: true });
    expect(flat[1]).toMatchObject({ depth: 1, isLast: false, hasChildren: false, parentIsLast: [false] });
    expect(flat[2]).toMatchObject({ depth: 1, isLast: true, hasChildren: false, parentIsLast: [false] });
    expect(flat[3]).toMatchObject({ depth: 0, isLast: true, hasChildren: false });
  });

  it("clamps recursion at MAX_TREE_DEPTH (cycle protection)", () => {
    const cyclic: TreeTableRow = { key: "x", values: {}, expanded: true };
    cyclic.children = [cyclic];
    expect(() => flattenVisible([cyclic])).not.toThrow();
    const flat = flattenVisible([cyclic]);
    expect(flat.length).toBeLessThanOrEqual(101);
  });
});

const hierarchy: TreeTableRow[] = [
  {
    key: "p", values: { name: "Parent", owner: "Eve" }, expanded: true,
    children: [
      { key: "c1", values: { name: "Child 1", owner: "Eve" } },
      { key: "c2", values: { name: "Child 2", owner: "Eve" } },
    ],
  },
];

describe("TreeTable — skeleton", () => {
  it("renders 'No data' for empty data", () => {
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: [] }),
      { width: 40, height: 10 },
    );
    expect(result.hasText("No data")).toBe(true);
  });

  it("renders the header row", () => {
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: [{ key: "a", values: { name: "Task A", owner: "Alice" } }],
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("Name")).toBe(true);
    expect(result.hasText("Owner")).toBe(true);
  });

  it("renders a single flat row", () => {
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: [{ key: "a", values: { name: "Task A", owner: "Alice" } }],
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("Task A")).toBe(true);
    expect(result.hasText("Alice")).toBe(true);
  });
});

describe("TreeTable — tree column", () => {
  it("renders ▾ marker on expanded parent and ├── / └── connectors on children", () => {
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: hierarchy }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("▾")).toBe(true);
    expect(result.hasText("├──")).toBe(true);
    expect(result.hasText("└──")).toBe(true);
    expect(result.hasText("Child 1")).toBe(true);
    expect(result.hasText("Child 2")).toBe(true);
  });

  it("renders ▸ marker on collapsed parent and hides children", () => {
    const collapsed: TreeTableRow[] = [{ ...hierarchy[0]!, expanded: false }];
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: collapsed }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("▸")).toBe(true);
    expect(result.hasText("Child 1")).toBe(false);
  });

  it("places tree prefix in the configured treeColumnKey, not column 0", () => {
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: hierarchy, treeColumnKey: "owner" }),
      { width: 80, height: 10 },
    );
    const parentLine = result.lines.find((l) => l.includes("Parent")) ?? "";
    expect(parentLine.includes("▾")).toBe(true);
    expect(parentLine.indexOf("▾")).toBeGreaterThan(parentLine.indexOf("Parent"));
  });

  it("renders icon when provided", () => {
    const withIcon: TreeTableRow[] = [{ key: "a", values: { name: "Doc", owner: "" }, icon: "📄" }];
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: withIcon }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("📄")).toBe(true);
  });

  it("allocates leftover explicit width to a flex tree column", () => {
    const result = renderForTest(
      React.createElement(TreeTable, {
        width: 70,
        borderStyle: "none",
        columns: [
          { key: "name", header: "Name", flex: 1, minWidth: 10 },
          { key: "owner", header: "Owner", width: 8 },
        ],
        data: [{ key: "a", values: { name: "Long flexible tree row", owner: "Eve" } }],
      }),
      { width: 80, height: 10 },
    );

    const header = result.lines.find((line) => line.includes("Name") && line.includes("Owner")) ?? "";
    expect(header.indexOf("Owner")).toBeGreaterThan(55);
    expect(result.hasText("Long flexible tree row")).toBe(true);
  });
});

describe("TreeTable — keyboard", () => {
  const data: TreeTableRow[] = [
    {
      key: "p", values: { name: "Parent", owner: "" }, expanded: false,
      children: [{ key: "c", values: { name: "Child", owner: "" } }],
    },
    { key: "q", values: { name: "Sibling", owner: "" } },
  ];

  it("→ on collapsed parent fires onToggle once", () => {
    const onToggle = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, isFocused: true, onToggle }),
      { width: 60, height: 10 },
    );
    result.pressRight();
    expect(onToggle).toHaveBeenCalledWith("p", expect.objectContaining({ key: "p" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("← on expanded parent fires onToggle once", () => {
    const onToggle = vi.fn();
    const expanded = [{ ...data[0]!, expanded: true }, data[1]!];
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: expanded, isFocused: true, onToggle }),
      { width: 60, height: 10 },
    );
    result.pressLeft();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("↓ then Enter fires onRowSelect with sibling key", () => {
    const onRowSelect = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, isFocused: true, onRowSelect }),
      { width: 60, height: 10 },
    );
    result.pressDown();
    result.pressEnter();
    expect(onRowSelect).toHaveBeenCalledWith("q", expect.objectContaining({ key: "q" }));
  });

  it("header sort cycles direction via Enter on header row", () => {
    const onSort = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, isFocused: true, sortable: true, onSort }),
      { width: 60, height: 10 },
    );
    result.pressUp();
    result.pressEnter();
    expect(onSort).toHaveBeenLastCalledWith("name", "asc");
    result.pressEnter();
    expect(onSort).toHaveBeenLastCalledWith("name", "desc");
  });

  it("edits the focused cell and reports row key, column key, value, and row", () => {
    const onCellEdit = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data,
        isFocused: true,
        editable: true,
        onCellEdit,
      }),
      { width: 60, height: 10 },
    );

    result.pressEnter();
    result.type(" updated");
    result.pressEnter();

    expect(onCellEdit).toHaveBeenCalledWith(
      "p",
      "name",
      "Parent updated",
      expect.objectContaining({ key: "p" }),
    );
  });

  it("uses Ctrl+Arrow reorder shortcuts and emits replaceable nextData", () => {
    const onReorder = vi.fn();
    const rows: TreeTableRow[] = [
      { key: "a", values: { name: "A", owner: "" } },
      { key: "b", values: { name: "B", owner: "" } },
      { key: "c", values: { name: "C", owner: "" } },
    ];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: rows,
        isFocused: true,
        reorderable: true,
        onReorder,
      }),
      { width: 60, height: 10 },
    );

    result.pressDown();
    result.fireKey("up", { ctrl: true });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder.mock.calls[0]![0].movedKeys).toEqual(["b"]);
    expect(onReorder.mock.calls[0]![0].nextData.map((row: TreeTableRow) => row.key)).toEqual(["b", "a", "c"]);
  });

  it("supports Ctrl+Right indent and Ctrl+Left outdent reorders", () => {
    const onIndent = vi.fn();
    const rows: TreeTableRow[] = [
      { key: "a", values: { name: "A", owner: "" } },
      { key: "b", values: { name: "B", owner: "" } },
    ];
    const indentResult = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: rows,
        isFocused: true,
        reorderable: true,
        onReorder: onIndent,
      }),
      { width: 60, height: 10 },
    );

    indentResult.pressDown();
    indentResult.fireKey("right", { ctrl: true });

    expect(onIndent).toHaveBeenCalledTimes(1);
    const indented = onIndent.mock.calls[0]![0].nextData as TreeTableRow[];
    expect(indented.map((row) => row.key)).toEqual(["a"]);
    expect(indented[0]!.children?.map((row) => row.key)).toEqual(["b"]);

    const onOutdent = vi.fn();
    const outdentRows: TreeTableRow[] = [
      {
        key: "a",
        values: { name: "A", owner: "" },
        expanded: true,
        children: [{ key: "b", values: { name: "B", owner: "" } }],
      },
      { key: "c", values: { name: "C", owner: "" } },
    ];
    const outdentResult = renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: outdentRows,
        isFocused: true,
        reorderable: true,
        onReorder: onOutdent,
      }),
      { width: 60, height: 10 },
    );

    outdentResult.pressDown();
    outdentResult.fireKey("left", { ctrl: true });

    expect(onOutdent).toHaveBeenCalledTimes(1);
    expect(onOutdent.mock.calls[0]![0].nextData.map((row: TreeTableRow) => row.key)).toEqual(["a", "b", "c"]);
  });
});

describe("TreeTable — mouse", () => {
  const data: TreeTableRow[] = [
    {
      key: "p", values: { name: "Parent", owner: "" }, expanded: false,
      children: [{ key: "c", values: { name: "Child", owner: "" } }],
    },
  ];

  it("clicking the ▸ marker fires onToggle", () => {
    const onToggle = vi.fn();
    const onRowPress = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, onToggle, onRowPress }),
      { width: 60, height: 10 },
    );
    const lineIdx = result.lines.findIndex((l) => l.includes("▸"));
    expect(lineIdx).toBeGreaterThanOrEqual(0);
    const colIdx = result.lines[lineIdx]!.indexOf("▸");
    result.click(colIdx, lineIdx);
    expect(onToggle).toHaveBeenCalledWith("p", expect.objectContaining({ key: "p" }));
    expect(onRowPress).not.toHaveBeenCalled();
  });

  it("clicking the value cell (not the marker) fires onRowPress, not onToggle", () => {
    const onToggle = vi.fn();
    const onRowPress = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, onToggle, onRowPress }),
      { width: 60, height: 10 },
    );
    const lineIdx = result.lines.findIndex((l) => l.includes("Parent"));
    const colIdx = result.lines[lineIdx]!.indexOf("Parent");
    result.click(colIdx, lineIdx);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onRowPress).toHaveBeenCalledWith("p", expect.objectContaining({ key: "p" }));
  });

  it("clicking the header fires onHeaderPress and cycles sort if sortable", () => {
    const onSort = vi.fn();
    const onHeaderPress = vi.fn();
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, sortable: true, onSort, onHeaderPress }),
      { width: 60, height: 10 },
    );
    const lineIdx = result.lines.findIndex((l) => l.includes("Name"));
    const colIdx = result.lines[lineIdx]!.indexOf("Name");
    result.click(colIdx, lineIdx);
    expect(onHeaderPress).toHaveBeenCalledWith("name");
    expect(onSort).toHaveBeenCalledWith("name", "asc");
  });
});

describe("TreeTable — virtualization", () => {
  it("renders only maxVisibleRows when flat list exceeds the cap, with indicator", () => {
    const data: TreeTableRow[] = Array.from({ length: 200 }, (_, i) => ({
      key: `r${i}`,
      values: { name: `Row ${i}`, owner: "" },
    }));
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, maxVisibleRows: 50 }),
      { width: 60, height: 80 },
    );
    expect(result.hasText("Row 0 ")).toBe(true);
    expect(result.hasText("Row 49")).toBe(true);
    expect(result.hasText("Row 50")).toBe(false);
    expect(result.hasText("Showing 1-50 of 200")).toBe(true);
  });

  it("collapsing a parent shrinks the flat list and updates the indicator", () => {
    const data: TreeTableRow[] = [
      {
        key: "p", values: { name: "Parent", owner: "" }, expanded: true,
        children: Array.from({ length: 60 }, (_, i) => ({
          key: `c${i}`, values: { name: `Child ${i}`, owner: "" },
        })),
      },
      ...Array.from({ length: 40 }, (_, i) => ({
        key: `s${i}`, values: { name: `Sib ${i}`, owner: "" },
      })),
    ];
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, maxVisibleRows: 30 }),
      { width: 60, height: 80 },
    );
    expect(result.hasText("Showing 1-30 of 101")).toBe(true);
  });
});

describe("TreeTable — renderers + style", () => {
  it("renderTreeCell receives depth, hasChildren, isExpanded and replaces the cell content", () => {
    const data: TreeTableRow[] = [
      { key: "p", values: { name: "Parent", owner: "" }, expanded: true,
        children: [{ key: "c", values: { name: "Child", owner: "" } }] },
    ];
    const seen: Array<{ depth: number; hasChildren: boolean; isExpanded: boolean }> = [];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols, data,
        renderTreeCell: (value, _row, depth, state) => {
          seen.push({ depth, hasChildren: state.hasChildren, isExpanded: state.isExpanded });
          return `[d${depth}] ${value}`;
        },
      }),
      { width: 80, height: 10 },
    );
    expect(result.hasText("[d0] Parent")).toBe(true);
    expect(result.hasText("[d1] Child")).toBe(true);
    expect(seen).toContainEqual({ depth: 0, hasChildren: true, isExpanded: true });
    expect(seen).toContainEqual({ depth: 1, hasChildren: false, isExpanded: false });
  });

  it("renderHeader replaces the default header cell", () => {
    const wide = [{ key: "name", header: "Name", width: 12 }, { key: "owner", header: "Owner", width: 12 }];
    const data: TreeTableRow[] = [{ key: "a", values: { name: "X", owner: "Y" } }];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: wide, data,
        renderHeader: (col) => `<<${col.header}>>`,
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("<<Name>>")).toBe(true);
  });

  it("renderCell replaces non-tree-column cells but does not affect the tree column", () => {
    const wide = [{ key: "name", header: "Name", width: 10 }, { key: "owner", header: "Owner", width: 10 }];
    const data: TreeTableRow[] = [{ key: "a", values: { name: "Task", owner: "Alice" } }];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: wide, data,
        renderCell: (value, col) => col.key === "owner" ? `@${value}` : String(value),
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("@Alice")).toBe(true);
    expect(result.hasText("Task")).toBe(true);
  });

  it("renderCell receives stable tree row metadata", () => {
    const seen: Array<{
      rowKey?: string;
      depth?: number;
      siblingIndex?: number;
      path?: number[];
      parentKey?: string | null;
    }> = [];
    renderForTest(
      React.createElement(TreeTable, {
        columns: cols,
        data: hierarchy,
        renderCell: (value, _col, _row, state) => {
          seen.push({
            rowKey: state.rowKey,
            depth: state.depth,
            siblingIndex: state.siblingIndex,
            path: state.path,
            parentKey: state.parentKey,
          });
          return String(value);
        },
      }),
      { width: 80, height: 10 },
    );

    expect(seen).toContainEqual({
      rowKey: "c2",
      depth: 1,
      siblingIndex: 1,
      path: [0, 1],
      parentKey: "p",
    });
  });
});

describe("TreeTable — edge cases", () => {
  it("does not crash on a row whose children include itself (depth-clamp)", () => {
    const cyclic: TreeTableRow = { key: "x", values: { name: "X", owner: "" }, expanded: true };
    cyclic.children = [cyclic];
    expect(() =>
      renderForTest(
        React.createElement(TreeTable, { columns: cols, data: [cyclic] }),
        { width: 60, height: 10 },
      ),
    ).not.toThrow();
  });

  it("treats expanded:true with empty children array as a leaf", () => {
    const data: TreeTableRow[] = [{ key: "a", values: { name: "Empty", owner: "" }, expanded: true, children: [] }];
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("▾")).toBe(false);
    expect(result.hasText("▸")).toBe(false);
  });

  it("falls back to columns[0] when treeColumnKey does not match any column", () => {
    const data: TreeTableRow[] = [
      { key: "p", values: { name: "Parent", owner: "" }, expanded: true,
        children: [{ key: "c", values: { name: "Child", owner: "" } }] },
    ];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, treeColumnKey: "does-not-exist" }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("├──") || result.hasText("└──")).toBe(true);
    warn.mockRestore();
  });
});

describe("TreeTable — public API", () => {
  it("is importable from the package barrel", async () => {
    const mod = await import("../index.js");
    const exported = (mod as { TreeTable?: unknown }).TreeTable;
    expect(exported).toBeDefined();
    expect(["function", "object"]).toContain(typeof exported);
  });
});
