# TreeTable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task when tasks are independent. For same-session manual execution, follow this plan directly. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `TreeTable` component to reacterm/Storm that renders hierarchical rows with shared columns — combining the column model of `Table` with the expand/collapse model of `Tree`.

**Machine plan:** `2026-04-29-tree-table-plan.yaml`

**Architecture:** New standalone component at `src/components/data/TreeTable.tsx`. Reuses `src/utils/table-render.ts` utilities (column widths, fit-to-available, separator, virtual window, sort header text) and a new private `flattenVisible` helper modeled on `Tree`'s. **Does not delegate keyboard to `useTableBehavior`** — TreeTable runs its own `useInput` handler (modeled on `Tree.tsx`'s, not `Table.tsx`'s) so it can intercept `←`/`→` for expand/collapse before column-movement semantics. State is held in refs identical to `Tree.tsx`. No changes to `Table.tsx` or `Tree.tsx`. Sort is reported, not applied — same contract as `Table`.

**Note on `renderCell` signature:** the spec changes the third argument from `Table`'s `rowIndex: number` to `row: TreeTableRow` because `TreeTable` consumers care about the row identity, not its index in a virtualized flat list. This is intentional and divergent from `Table`. Use the spec signature exactly.

**Tech Stack:** TypeScript (strict), React 18/19, Vitest, `bun` for build/test, existing `renderForTest` test harness.

**Recommended Skills:** `test-driven-development`, `typescript`, `tui`, `documentation`, `verification-before-completion`

**Recommended MCPs:** none

**Spec:** `docs/specs/2026-04-29-tree-table-design.md`

---

## File Map

| Action  | Path                                           | Responsibility                                                   |
| ------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Create  | `src/components/data/TreeTable.tsx`            | The component + `TreeTableRow` + `TreeTableProps` types          |
| Create  | `src/components/data/TreeTable.flatten.ts`     | Pure `flattenVisible` helper + types (extracted for unit testing) |
| Create  | `src/__tests__/tree-table.test.ts`             | Vitest specs (all 15 cases from spec)                            |
| Modify  | `src/components/index.ts`                      | Re-export `TreeTable` and types                                  |
| Modify  | `src/index.ts`                                 | Top-level re-export                                              |
| Create  | `playground/examples/tree-table.tsx`           | Playground exercise of 3 levels × 4 columns                      |
| Modify  | `docs/components/data.md`                      | Add `## TreeTable` section + example                             |
| Modify  | `docs/components.md`                           | Add to component index                                           |
| Modify  | `docs/recipes.md`                              | Add "Task list with subtasks" recipe + `sortRecursive` snippet   |
| Modify  | `README.md`                                    | Bump component count badge 97 → 98                               |
| Modify  | `docs/specs/2026-04-29-tree-table-design.md`   | Final task only — fill `Known Limitations` + `Post-Implementation Review` |

The split `TreeTable.tsx` / `TreeTable.flatten.ts` keeps the 350-line component file focused on rendering + React glue and isolates the recursion logic for direct unit tests (no `renderForTest` overhead).

---

## Task 1: Types + `flattenVisible` helper (pure logic)

**Files:**
- Create: `src/components/data/TreeTable.flatten.ts`
- Test: `src/__tests__/tree-table.test.ts` (new file, just this task's tests for now)

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/tree-table.test.ts
import { describe, it, expect } from "vitest";
import {
  flattenVisible,
  type TreeTableRow,
  type FlatTreeTableRow,
} from "../components/data/TreeTable.flatten.js";

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

describe("flattenVisible", () => {
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
    cyclic.children = [cyclic]; // self-reference
    expect(() => flattenVisible([cyclic])).not.toThrow();
    const flat = flattenVisible([cyclic]);
    expect(flat.length).toBeLessThanOrEqual(101);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test src/__tests__/tree-table.test.ts
```

Expected: FAIL — module `TreeTable.flatten.js` does not exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/components/data/TreeTable.flatten.ts
const MAX_TREE_DEPTH = 100;

export interface TreeTableRow {
  key: string;
  values: Record<string, string | number>;
  children?: TreeTableRow[];
  expanded?: boolean;
  icon?: string;
}

export interface FlatTreeTableRow {
  row: TreeTableRow;
  depth: number;
  isLast: boolean;
  parentIsLast: boolean[];
  hasChildren: boolean;
}

export function flattenVisible(
  rows: TreeTableRow[],
  depth: number = 0,
  parentIsLast: boolean[] = [],
): FlatTreeTableRow[] {
  if (depth >= MAX_TREE_DEPTH) return [];
  const out: FlatTreeTableRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const isLast = i === rows.length - 1;
    const hasChildren = row.children !== undefined && row.children.length > 0;
    out.push({ row, depth, isLast, parentIsLast: [...parentIsLast], hasChildren });
    if (hasChildren && row.expanded) {
      out.push(...flattenVisible(row.children!, depth + 1, [...parentIsLast, isLast]));
    }
  }
  return out;
}

export { MAX_TREE_DEPTH };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test src/__tests__/tree-table.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.flatten.ts src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): add flattenVisible helper + types"
```

---

## Task 2: TreeTable component skeleton — empty state + basic header/body render

**Files:**
- Create: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`, `@typescript`

- [ ] **Step 1: Write failing tests** (append to existing test file)

```ts
import React from "react";
import { renderForTest } from "../testing/index.js";
import { TreeTable } from "../components/data/TreeTable.js";

const cols = [
  { key: "name", header: "Name" },
  { key: "owner", header: "Owner" },
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
```

- [ ] **Step 2: Run — expect FAIL** (`TreeTable` undefined)

```bash
bun test src/__tests__/tree-table.test.ts
```

- [ ] **Step 3: Implement minimal `TreeTable.tsx`**

Create the component with the props interface from the spec, render `"No data"` for empty data, render header row and flat rows as plain cells (no tree column logic yet). Reuse `computeColumnWidths`, `fitColumnWidthsToAvailableWidth`, `buildSeparatorText`, `padCell`, `useColors`, `useMeasure`, `mergeBoxStyles`, `pickStyleProps`. Pattern: study `Table.tsx` lines 244–835 for the body of the implementation. Translate `data: Record<...>[]` → `data: TreeTableRow[]` by passing `flat.map(f => f.row.values)` through to the column-render path. No keyboard/mouse yet.

Critical: every cell must use `flat[i].row.values` for the value lookup, not `data[i]`.

- [ ] **Step 4: Run tests — expect 3 new passes (7 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): empty state + header + flat row render"
```

---

## Task 3: Tree column rendering — connectors, marker, icon, depth

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`, `@tui`

- [ ] **Step 1: Write failing tests**

```ts
describe("TreeTable — tree column", () => {
  const hierarchy: TreeTableRow[] = [
    {
      key: "p", values: { name: "Parent", owner: "Eve" }, expanded: true,
      children: [
        { key: "c1", values: { name: "Child 1", owner: "Eve" } },
        { key: "c2", values: { name: "Child 2", owner: "Eve" } },
      ],
    },
  ];

  it("renders ▾ marker on expanded parent and ├── / └── connectors on children", () => {
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data: hierarchy }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("▾")).toBe(true);
    expect(result.hasText("├──")).toBe(true);
    expect(result.hasText("└──")).toBe(true);
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
      React.createElement(TreeTable, {
        columns: cols,
        data: hierarchy,
        treeColumnKey: "owner",
      }),
      { width: 60, height: 10 },
    );
    // marker must appear in the same line as Eve; rough proxy: hasText('▾')
    // and 'Parent' rendered without leading marker glyph
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
});
```

- [ ] **Step 2: Run — expect FAIL on the new tests**

- [ ] **Step 3: Implement tree-column rendering**

Add a private `buildTreePrefix(flat: FlatTreeTableRow): string` (port `Tree`'s `buildPrefix` with `MAX_TREE_DEPTH` clamp). In the render loop, detect when the current column's `key === treeColumnKey ?? columns[0].key`. For tree-column cells, prepend connector prefix + marker (▾/▸/"  ") + optional icon (use `padEndCells` from `core/unicode.js` for cell-aware width) before the padded value. Subtract the prefix width from `colWidths[i]` when computing the value-only padding to avoid overflow.

- [ ] **Step 4: Run — expect 4 new passes (11 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): tree column with connectors, marker, icon"
```

---

## Task 4: Keyboard navigation — arrow keys, expand/collapse, Enter, sort cycle

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write failing tests**

```ts
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
      React.createElement(TreeTable, { columns: cols, data, isFocused: true, onRowSelect, rowHighlight: true }),
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
    // Move cursor up onto header (useTableBehavior puts header above row 0 when sortable)
    result.pressUp();
    result.pressEnter();
    expect(onSort).toHaveBeenLastCalledWith("name", "asc");
    result.pressEnter();
    expect(onSort).toHaveBeenLastCalledWith("name", "desc");
  });
});
```

(Add `import { vi } from "vitest";` at top of test file.)

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement keyboard with TreeTable's own `useInput` handler**

**Do not use `useTableBehavior` for keyboard.** It owns `←`/`→` for column movement and we need them for expand/collapse. Instead, model the handler on `Tree.tsx:382–441`:

- Hold cursor row index in a `useRef<number>`, bumped by `↑`/`↓` against the **flat-visible** row count.
- Hold cursor column index in a separate `useRef<number>`. Hold a "header row" flag in a third ref (the header is logically above flat row 0).
- Hold sort state `{ column, direction } | null` in a ref.
- `→`: if cursor row has children and is **not** expanded → fire `onToggle(key, row)` and consume; else if `cursorCol < columns.length - 1` → bump `cursorCol`.
- `←`: if cursor row has children and **is** expanded → fire `onToggle(key, row)` and consume; else if `cursorCol > 0` → decrement `cursorCol`.
- `↑` from row 0 with `sortable=true` → move to header row.
- `↓` from header row → return to row 0.
- `Enter` on header row → cycle sort: `null → asc → desc → null`, fire `onSort(columns[cursorCol].key, dir)`.
- `Enter` on body row → `onRowSelect(flat[cursorRow].row.key, flat[cursorRow].row)`.
- `s` / `S` (only if `sortable && !onHeaderRow`) → cycle sort on `cursorCol`.
- `PageUp` / `PageDown` → bump cursor by `maxVisibleRows`, clamped.

Use `requestRender()` from `useTui()` after any state change. Wire `useInput(handleInput, { isActive: isFocused })`.

- [ ] **Step 4: Run — expect 4 new passes (15 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): keyboard navigation, expand/collapse, sort cycle"
```

---

## Task 5: Mouse interaction — marker toggle, row press, header sort

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write failing tests**

```ts
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
    // Find marker line and column. Marker for depth 0, no children-of-children:
    // prefix is empty, so marker sits at column 0 of the tree cell, after the
    // border + cell padding. Inspect the rendered line then click on its position.
    const lineIdx = result.lines.findIndex((l) => l.includes("▸"));
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
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Wire mouse via `useMouseTarget`**

Mirror `Table`'s mouse handler from `Table.tsx:588–633`. Differences: hit-testing the tree column needs to compute the marker's local column (within the cell box) using the same prefix-width math as the renderer; if the click lands within the marker's two-cell zone and the row has children → `onToggle`; otherwise → `onRowPress`. Header clicks → `onHeaderPress` + sort cycle (if sortable). Use the flat-visible index space, identical to the keyboard cursor.

- [ ] **Step 4: Run — expect 3 new passes (18 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): mouse — marker toggle, row press, header sort"
```

---

## Task 6: Virtualization on flat-visible rows

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write failing tests**

```ts
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
    expect(result.hasText("Row 0")).toBe(true);
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
    // 1 parent + 60 children + 40 siblings = 101 flat rows when expanded
    expect(result.hasText("Showing 1-30 of 101")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement virtualization**

Use `computeVirtualWindow(flat.length, maxVisibleRows, scrollOffset)` from `src/utils/table-render.ts`. Hold a `scrollOffsetRef`. When the cursor row leaves the visible window, bump `scrollOffsetRef` by the same logic as `useTableBehavior` (see `useTableBehavior.ts:120–130`). Render only `flat.slice(visibleStart, visibleEnd)`. When `needsVirtualization`, append the row indicator using the **actual `formatRowIndicator` signature** — verify by `grep -n "export function formatRowIndicator" src/utils/table-render.ts` before coding the call site.

- [ ] **Step 4: Run — expect 2 new passes (20 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): virtualization on flat-visible rows"
```

---

## Task 7: Custom renderers + style precedence

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write failing tests**

```ts
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
      { width: 60, height: 10 },
    );
    expect(result.hasText("[d0] Parent")).toBe(true);
    expect(result.hasText("[d1] Child")).toBe(true);
    expect(seen).toContainEqual({ depth: 0, hasChildren: true, isExpanded: true });
    expect(seen).toContainEqual({ depth: 1, hasChildren: false, isExpanded: false });
  });

  it("renderHeader replaces the default header cell", () => {
    const data: TreeTableRow[] = [{ key: "a", values: { name: "X", owner: "Y" } }];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols, data,
        renderHeader: (col) => `<<${col.header}>>`,
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("<<Name>>")).toBe(true);
  });

  it("renderCell replaces non-tree-column cells but does not affect the tree column", () => {
    const data: TreeTableRow[] = [{ key: "a", values: { name: "Task", owner: "Alice" } }];
    const result = renderForTest(
      React.createElement(TreeTable, {
        columns: cols, data,
        renderCell: (value, col) => col.key === "owner" ? `@${value}` : String(value),
      }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("@Alice")).toBe(true);
    expect(result.hasText("Task")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement custom-renderer hooks + style merging**

In the cell render path, when the column is the tree column and `renderTreeCell` is supplied: call `renderTreeCell(value, row, depth, { ...state, isExpanded, hasChildren })` and use its return as the cell content (still wrapped in the cell box for width). For non-tree columns with `renderCell`: same as `Table`'s flow. Style merging precedence (column → state) follows `Table.tsx:395–415`.

- [ ] **Step 4: Run — expect 3 new passes (23 total)**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): custom renderers + style precedence"
```

---

## Task 8: Edge cases — cycles, empty children, bad treeColumnKey

**Files:**
- Modify: `src/components/data/TreeTable.tsx`
- Modify: `src/__tests__/tree-table.test.ts`

**Invoke skill:** `@test-driven-development`

- [ ] **Step 1: Write failing tests**

```ts
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
    const result = renderForTest(
      React.createElement(TreeTable, { columns: cols, data, treeColumnKey: "does-not-exist" }),
      { width: 60, height: 10 },
    );
    expect(result.hasText("├──")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement guards**

The depth-clamp already exists in Task 1's `flattenVisible` (`MAX_TREE_DEPTH = 100`). Empty-children logic: `hasChildren = children !== undefined && children.length > 0` (already correct in Task 1). Bad `treeColumnKey`: in `TreeTable.tsx`, resolve the effective tree-column key as `columns.find((c) => c.key === treeColumnKey)?.key ?? columns[0]?.key`. Emit `console.warn` once per render only when `treeColumnKey` was supplied and missing — guard with a `useRef<boolean>` to avoid log spam.

- [ ] **Step 4: Run — expect 3 new passes (26 total). Final test count matches the spec's 15 + the additional unit + render coverage above.**

- [ ] **Step 5: Commit**

```bash
git add src/components/data/TreeTable.tsx src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): edge cases — cycles, empty children, bad treeColumnKey"
```

---

## Task 9: Public API wiring

**Files:**
- Modify: `src/components/index.ts`
- Modify: `src/index.ts`
- Test: extend `src/__tests__/tree-table.test.ts` with an import smoke test

**Invoke skill:** `@typescript`

- [ ] **Step 1: Write the import smoke test**

```ts
describe("TreeTable — public API", () => {
  it("is importable from the package barrel", async () => {
    const mod = await import("../index.js");
    expect(typeof mod.TreeTable).toBe("function");
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`mod.TreeTable` undefined)

- [ ] **Step 3: Add re-exports**

In `src/components/index.ts` (alongside the existing `Tree` export):
```ts
export { TreeTable, type TreeTableProps } from "./data/TreeTable.js";
export type { TreeTableRow } from "./data/TreeTable.flatten.js";
```

In `src/index.ts` (alongside the existing `Tree` export at line 147):
```ts
export { TreeTable, type TreeTableProps } from "./components/data/TreeTable.js";
export type { TreeTableRow } from "./components/data/TreeTable.flatten.js";
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Run full suite + build**

```bash
bun test
bun run build
```

Expected: all green, no `tsc` errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/index.ts src/index.ts src/__tests__/tree-table.test.ts
git commit -m "feat(tree-table): export from package barrels"
```

---

## Task 10: Playground example

**Files:**
- Create: `playground/examples/tree-table.tsx`

**Invoke skill:** `@tui`

- [ ] **Step 1: Write a 3-level × 4-column example**

Columns: `name`, `owner`, `priority`, `status`. Three top-level projects, each with 2-3 stories, each with 1-2 subtasks. Make `name` the tree column. Wire `expanded` state via `useState`, toggle with `onToggle`. Show `rowHighlight` + `sortable`. Mirror the style of `playground/examples/dashboard.tsx`.

- [ ] **Step 2: Smoke-load the file**

```bash
bun run build
node -e 'import("./dist/components/data/TreeTable.js").then((m) => console.log(typeof m.TreeTable))'
```

Expected: `function`.

- [ ] **Step 3: Resolve playground wiring**

Run `ls playground/` and `grep -n "examples" playground/server.mjs playground/public/index.html` to determine whether examples are auto-discovered or hand-registered. If hand-registered, add an entry mirroring `playground/examples/dashboard.tsx`'s registration. If auto-discovered, the new file appears automatically.

- [ ] **Step 4: Commit**

```bash
git add playground/examples/tree-table.tsx
git commit -m "feat(tree-table): playground example with 3 levels × 4 columns"
```

---

## Task 11: Documentation

**Files:**
- Modify: `docs/components/data.md`
- Modify: `docs/components.md`
- Modify: `docs/recipes.md`
- Modify: `README.md`

**Invoke skill:** `@documentation`

- [ ] **Step 1: Add `## TreeTable` section to `docs/components/data.md`**

Place under `## Tree` and above the next data component. Include:
- One-paragraph description (what it is, when to reach for it).
- Props table (mirror the format used by `## Tree`).
- Code example: 2-level project/story hierarchy with three columns.
- Cross-link to `Tree` and `Table`.

- [ ] **Step 2: Add an entry to `docs/components.md`** in the data-components list.

- [ ] **Step 3: Add a recipe in `docs/recipes.md`** titled "Task list with subtasks". Include the `sortRecursive` helper from the spec's Sort Semantics section.

- [ ] **Step 4: Bump the badge in `README.md`** — change `components-97` → `components-98` (line 14 of README.md). Update the prose count in the "What's inside" section (line 168) from `**98 components**` to `**99 components**` only if it currently reads 98 — verify before editing.

- [ ] **Step 5: Verify links and table formatting**

```bash
grep -n "TreeTable" docs/components/data.md docs/components.md docs/recipes.md README.md
```

Expected: at least one match in each of the four files.

- [ ] **Step 6: Commit**

```bash
git add docs/components/data.md docs/components.md docs/recipes.md README.md
git commit -m "docs(tree-table): component reference, recipe, README badge"
```

---

## Task 12 (final): Spec Acceptance + Post-Implementation Review

**Files:**
- Modify: `docs/specs/2026-04-29-tree-table-design.md` (fill `Known Limitations` and `Post-Implementation Review` blocks)

- [ ] **Step 1: Re-read the spec's Acceptance Criteria block**

Open `docs/specs/2026-04-29-tree-table-design.md`. Hold the criteria in context.

- [ ] **Step 2: Run every acceptance item, fresh, in one batch**

For each item from the spec's Acceptance Criteria, run the command and capture output. Mark ✅ pass / ⚠ known-limit / ❌ fail.

```bash
# Items requiring shell:
test -f src/components/data/TreeTable.tsx && grep -q "export.*TreeTable" src/components/data/TreeTable.tsx && echo "✅ exports present"
grep -q "TreeTable" src/index.ts && echo "✅ top-level re-export"
bun run build
bun test src/__tests__/tree-table.test.ts
bun test
grep -n "TreeTable" src/components/table/Table.tsx | wc -l   # expect 0
grep -n "TreeTable" src/components/data/Tree.tsx | wc -l     # expect 0
wc -l src/components/data/TreeTable.tsx                       # expect ≤ 500
grep -q "## TreeTable" docs/components/data.md && echo "✅ docs"
grep -q "components-98" README.md && echo "✅ badge"
test -f playground/examples/tree-table.tsx && echo "✅ playground"
```

For the manual-smoke item (`npx tsx examples/reacterm-demo.tsx` flow): if a TreeTable section was not added to the demo, mark this item ⚠ and log it under Known Limitations with the reason (the playground example covers the same surface and the demo addition was descoped to avoid touching the demo file — the spec author's recommendation #1).

- [ ] **Step 3: Resolve every ❌ fail**

For each failing item, choose one path:
1. **Fix it** — implement the missing piece, re-run, mark ✅.
2. **Log it** — after **2-3 different approaches** (see `verification-before-completion`), write a `Known Limitations` entry: root cause, what was tried, why each failed, decision. Then mark ⚠.

Never leave ❌ items.

- [ ] **Step 4: Fill the Post-Implementation Review block in the spec**

Three subsections:
- **Acceptance results** — paste verification output for each item.
- **Scope drift** — list every change beyond the spec. For each: justify or revert.
- **Refactor proposals** — list noticed-but-not-executed improvements with trigger conditions.

- [ ] **Step 5: Surface limitations to user**

If `Known Limitations` is non-empty, summarise to the user: which acceptance items did not pass, what blocks them, suggested next step.

- [ ] **Step 6: Commit**

```bash
git add docs/specs/2026-04-29-tree-table-design.md
git commit -m "docs(spec): post-implementation review for tree-table"
```

Only after this task's six steps complete may the executing agent claim the plan is done.
