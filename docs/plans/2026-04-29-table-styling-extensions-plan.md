# Plan: Table styling extensions — predicate row/cell styles + per-column style

**Spec:** (none — alignment in conversation)
**Created:** 2026-04-29T10:05Z
**Status:** done
**Shape:** plan-execute-review
**Human checkpoints:** 0 (autonomous; user delegated full discretion)

## Context

`Table` (`src/components/table/Table.tsx`) currently exposes `stripe`, `headerColor`, `stateStyles` (per-state cell style for focus/selection/edit/lock), and `renderCell`/`renderHeader` escape hatches. Two gaps to close:

1. **Predicate row/cell styling** — apps want to color rows by data (e.g. `status="error" → red row`) without forfeiting the default renderer. Two new optional props:
   - `rowStyle?: (row, rowIndex) => TableCellStyle | undefined`
   - `cellStyle?: (value, column, rowIndex, row) => TableCellStyle | undefined`
2. **Per-column style** — `TableColumn` gains optional style fields (`color`, `backgroundColor`, `bold`, `dim`, `italic`, `underline`) applied to **body cells only**. Header keeps existing `headerColor` / `stateStyles.header` behavior — **do not regress header rendering**.

## Style merge order (lowest → highest, last wins)

```
default text  →  column.style  →  rowStyle(row,i)  →  cellStyle(val,col,i,row)  →  stateStyles (locked → edited → selectedRow → selectedCell → focusedRow → focusedColumn → focusedCell)
```

Stripe is applied at the row-box `backgroundColor` (existing path) and **stays separate** from the cell-style merge.

## Key integration point

`getCellStyle(state)` at line 360 of `Table.tsx`. Today:

```ts
function getCellStyle(state: TableRenderState): TableCellStyle {
  return mergeStyles(
    state.isLocked ? resolvedStateStyles.lockedCell : undefined,
    state.isEdited ? resolvedStateStyles.editedCell : undefined,
    state.isSelectedRow ? resolvedStateStyles.selectedRow : undefined,
    state.isSelectedCell ? resolvedStateStyles.selectedCell : undefined,
    state.isFocusedRow ? resolvedStateStyles.focusedRow : undefined,
    state.isFocusedColumn ? resolvedStateStyles.focusedColumn : undefined,
    state.isFocusedCell ? resolvedStateStyles.focusedCell : undefined,
  );
}
```

Change signature to receive (row, rowIndex, column, value), prepend three new entries to the `mergeStyles` call before the state styles, and call site at line 702 passes the new args. No call sites outside the body-render loop.

## TableColumn extension

Add to interface at line 24:

```ts
color?: string | number;
backgroundColor?: string | number;
bold?: boolean;
dim?: boolean;
italic?: boolean;
underline?: boolean;
```

Resolve into a `TableCellStyle` once per column outside the row loop (`columnStyles[ci]`), then pass into `getCellStyle`.

Note: `TableCellStyle` does NOT currently have `italic`. Add it (`italic?: boolean`) in the same change for symmetry, and pipe it through to the rendered `tui-text` props alongside the existing bold/dim/underline/inverse handling at lines 656–660 and 717–722.

## Sub-tasks

### Sub-task 1 — Write failing tests for new styling props

**Block:** execute
**Skill:** test-driven-development
**Depends on:** (none)

**Instruction:**

Extend `src/__tests__/table.test.ts` with new test cases (don't replace existing ones). Use the same `renderForTest` + `renderCell` introspection trick as the existing "passes controlled focus and state flags to renderCell" test for state-flag assertions, but for style assertions, lean on **rendered styled output** or on `result.styledOutput` ANSI codes. If asserting ANSI is messy, use the existing pattern of confirming key text rendered (some tests just confirm visible content present) and verify style merge precedence by passing predicates that change `color` to a value visible in `result.styledOutput`.

Add at minimum:

1. **`rowStyle` colors a specific row** — predicate returns `{ color: "red" }` only when `row.status === "error"`; assert that row's cells render with the override (e.g. styled output contains a red ANSI code on that row's content but not on others).
2. **`cellStyle` colors a specific cell** — predicate returns `{ bold: true }` only when `column.key === "score" && value > 90`; assert bold on Alice's score cell only.
3. **Column `color` applies to all body cells in that column** — define `columns = [{ key: "name", header: "Name", color: "blue" }, ...]`; assert all body name cells render with that color, header is unaffected.
4. **State styles override predicate styles** — pass a `rowStyle` returning `{ color: "red" }` for row 0, and `stateStyles.focusedRow = { color: "green" }`; with row 0 focused, assert green wins over red (focus highlight stays visible).
5. **`cellStyle` overrides `rowStyle` for the same cell** — `rowStyle` returns red, `cellStyle` returns blue for score column; assert blue wins on the score cell, red wins on the name cell.
6. **Column `bold` does not affect headers** — set `bold: true` on a column; assert headers render with the existing header default (which is also bold via `stateStyles.header.bold`, so to disambiguate, test with a non-bold column field like `dim: true` and assert header is NOT dim).
7. **`italic` propagates** — set `cellStyle` returning `{ italic: true }`; assert italic ANSI code (`\x1b[3m`) appears in `styledOutput` for that cell.

Run `bunx vitest run src/__tests__/table.test.ts` and confirm new tests fail (props don't exist yet) and existing tests still pass.

**Inputs (pre-staged):**
- file: src/__tests__/table.test.ts (existing patterns)
- file: src/components/table/Table.tsx (current style merge path)

**Acceptance:**
- ≥7 new test cases added covering items 1–7.
- New tests fail with "property does not exist" / undefined behavior; existing tests still pass.
- Failure mode is type/missing-feature, not test-syntax error.

---

### Sub-task 2 — Implement predicate styling, per-column style, and italic support

**Block:** execute
**Skill:** typescript
**Depends on:** sub-task 1

**Instruction:**

Modify `src/components/table/Table.tsx`:

1. **Extend `TableCellStyle`** (line 41) to add `italic?: boolean`.
2. **Extend `TableColumn`** (line 24) to add the six style fields: `color`, `backgroundColor`, `bold`, `dim`, `italic`, `underline` (all optional).
3. **Extend `TableProps`** (line 74) to add:
   ```ts
   rowStyle?: (row: Record<string, string | number>, rowIndex: number) => TableCellStyle | undefined;
   cellStyle?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => TableCellStyle | undefined;
   ```
4. **Destructure new props** in the component body next to the existing destructuring around line 262.
5. **Pre-compute column-derived styles** once per render: build `columnStyles: TableCellStyle[]` keyed by column index, mapping each column's style fields into a `TableCellStyle` object.
6. **Change `getCellStyle` signature** from `(state)` to `(state, row, rowIndex, column, columnIndex, value)`. New body:
   ```ts
   return mergeStyles(
     columnStyles[columnIndex],
     rowStyle?.(row, rowIndex),
     cellStyle?.(value, column, rowIndex, row),
     state.isLocked ? resolvedStateStyles.lockedCell : undefined,
     state.isEdited ? resolvedStateStyles.editedCell : undefined,
     state.isSelectedRow ? resolvedStateStyles.selectedRow : undefined,
     state.isSelectedCell ? resolvedStateStyles.selectedCell : undefined,
     state.isFocusedRow ? resolvedStateStyles.focusedRow : undefined,
     state.isFocusedColumn ? resolvedStateStyles.focusedColumn : undefined,
     state.isFocusedCell ? resolvedStateStyles.focusedCell : undefined,
   );
   ```
7. **Update the call site** at line 702 to pass the new args: `getCellStyle(state, row, ri, col, ci, val !== undefined ? val : "")`.
8. **Pipe `italic` through** to rendered `tui-text` props at the body-cell render (lines 717–722) AND at the header render (lines 656–660): add `...(style.italic ? { italic: true } : {})`.
9. **Header path stays unchanged** for column style — column style fields apply only to body cells. The header render at line 632 must NOT include `columnStyles[ci]` in its merge.

Stripe handling (row-box backgroundColor at line 695) stays as-is.

**Inputs (pre-staged):**
- prior: failing tests from sub-task 1
- file: src/components/table/Table.tsx (lines 24, 41, 74, 262, 360, 632, 656–660, 702, 717–722)

**Acceptance:**
- All new tests from sub-task 1 pass.
- All existing `table.test.ts` tests still pass (no regression).
- `bunx tsc --noEmit` clean.
- Header rendering unchanged for the existing-style cases (visually no diff when no column-style or predicate is set).

---

### Sub-task 3 — Verify build, type-check, full suite

**Block:** review
**Skill:** verification-before-completion
**Depends on:** sub-task 2

**Instruction:**

Confirm shippable:

1. `bunx vitest run` — full suite passes.
2. `bunx tsc --noEmit` — clean.
3. `bun run build` — clean.
4. Spot-check `Table.tsx` for:
   - `getCellStyle` only called from the body-row render, never from the header path.
   - `columnStyles` array indexed by `ci`, length matches `columns.length`.
   - No predicate invoked in the header path (would silently colour headers and surprise users).
5. Confirm `SearchTable` still passes — `SearchTable` wraps `Table` and shouldn't be affected by these additions.

If any check fails, surface verbatim; do not patch silently.

**Inputs (pre-staged):**
- prior: artifacts from sub-tasks 1–2

**Acceptance:**
- `bunx vitest run` exits 0.
- `bunx tsc --noEmit` exits 0.
- `bun run build` exits 0.
- No predicate leakage into header path.
- Plan marked `done`.
