# Plan: Data section refactor — make it work smooth

**Spec:** —  *(small enough that the issues + acceptance below ARE the spec)*
**Created:** 2026-04-29T11:25Z
**Status:** in-progress
**Shape:** custom — `enumerate-fix-test-verify`
**Human checkpoints:** 0  *(autonomous run, per session contract)*

---

## What we're fixing

The Data section of `examples/reacterm-demo.tsx` (the demo's section §5)
is functional but rough. From the user's screenshot review, here are the
concrete issues, grouped by widget.

### A. Tree (top-left)

| #   | Issue                                                     | Severity |
|-----|-----------------------------------------------------------|----------|
| A1  | No mouse-click to expand/collapse — only `Enter` works    | medium   |
| A2  | Section title "File tree" is a separate `Text`, not a chrome of the widget | low |

### B. DataGrid (top-right)

| #   | Issue                                                     | Severity |
|-----|-----------------------------------------------------------|----------|
| B1  | Column headers are not clickable to sort                  | high     |
| B2  | Rows are not clickable to select                          | medium   |
| B3  | Zebra-striping conflicts visually with the cyan selection bar — at a glance you can't tell selected vs alt-row | medium |
| B4  | Sort indicator (▼) only visible on the active sort column; no hover affordance to discover other sortable columns | low |

### C. Scroll-to-edit table (bottom)

| #   | Issue                                                     | Severity |
|-----|-----------------------------------------------------------|----------|
| C1  | **Phantom keyboard cursor** — `kbCellRef` defaults to `{row:0, col:0}` and renders the warning-color highlight on Revenue·Q1 *before any keyboard input has occurred*. Looks like a permanent selection. | **high** |
| C2  | Hover and keyboard cells render with overlapping styling when they coincide — two cells appear "selected" simultaneously with similar colors | high |
| C3  | Click on a numeric cell currently **resets it to baseline** — undiscoverable, most users expect click to pick / focus | high |
| C4  | The bottom status row uses two `Tag` chips (`hover: …` / `kb: …`) that wrap awkwardly on narrow widths | medium |
| C5  | `inverse` styling makes hovered cell a giant cyan block — overwhelming on a dark theme | medium |
| C6  | The whole table has a `borderColor: brand.primary` border, mimicking a focused widget even when nothing is focused | medium |
| C7  | No visible "delta" arrow next to a changed value — only color signals delta | low |

### D. Section layout / header

| #   | Issue                                                     | Severity |
|-----|-----------------------------------------------------------|----------|
| D1  | Header help text dumps every interaction in one dense run-on sentence; should be one line per interaction | low |
| D2  | RichLog and Pretty rendered side-by-side with `flex: 1` each, but their natural heights differ — leaves dead vertical space on the shorter one | low |
| D3  | No hint that the sidebar is clickable; this is a global gap but Data is where users land | low |

### E. Architecture / code health

| #   | Issue                                                     | Severity |
|-----|-----------------------------------------------------------|----------|
| E1  | `ScrollEditTable` mixes `useRef` (mutable) + `useState` (React) for adjacent concerns — partial imperative, partial reactive. Hard to reason about. | medium |
| E2  | `React.createElement("tui-box", { _focusId, ... }, ...)` mixed with JSX in the same component — should be uniformly JSX through the new `Clickable` (or a similar helper) | medium |
| E3  | `DataSection` is 80 lines of inline JSX assembling 5 widgets — should split into one component per widget for readability and testability | medium |
| E4  | Tree state (`tree`, `setTree`, `toggleKey`) is colocated with grid state (`sortCol`, `selectedRow`) inside `DataSection` — unrelated state, should sit with the widget that owns it | low |

---

## Goal

After this refactor, the Data section:

1. **Mouse-driven**: every visible widget responds to mouse — Tree
   click toggles folders; DataGrid headers click-sort; rows click-select;
   ScrollEditTable cells hover-highlight on real hover only and bump on
   wheel-scroll. No phantom selections.
2. **Visually clean**: at most ONE cell highlighted at a time per
   widget. Selected vs alt-row vs hover are visually distinct.
3. **Modular**: `DataSection` becomes a thin assembler. Each widget is
   its own function component owning its state.
4. **Tested**: each widget has a `renderForTest` test pinning the new
   behavior. Phantom-cursor regression test for ScrollEditTable.
5. **No regressions**: full `bun run test` stays green; demo boots; no
   new diagnostics.

---

## Sub-tasks

### Sub-task 1 — Split `DataSection` into 4 sub-components

**Block:** execute
**Skill:** typescript
**Depends on:** none

**Instruction:**

In `examples/reacterm-demo.tsx`, refactor `DataSection` from one
80-line function into:

- `DataSection` — thin layout assembler, no state of its own.
- `FileTreePane({ focused })` — owns `tree` state, renders the Tree.
- `FileGridPane({ focused })` — owns `sortCol` / `sortDir` /
  `selectedRow`, renders the DataGrid.
- `ServiceLogPane()` — renders RichLog (no state, fixed entries).
- `ConfigPretty()` — renders Pretty (no state, fixed object).

`ScrollEditTable` already lives separately — keep as-is for this
sub-task; it's refactored in Sub-task 3.

**Acceptance:**
- Visual output unchanged.
- Build clean; existing tests pass.

---

### Sub-task 2 — Wire mouse on Tree + DataGrid

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 1

**Instruction:**

`Tree` already supports click via its built-in `useMouseTarget` (see
`src/components/data/Tree.tsx:451`). Confirm that clicking a folder
in the demo *currently* toggles it. If not, the Tree's
`onToggle` is fine but the click target's bounds may not be tracked
because the parent `Box` doesn't have a `_focusId`. Quick repro: open
the demo's Data section, click a folder. Outcome: should toggle.

For `DataGrid`, the component accepts `onSort` and `onSelect`
callbacks. The PROBLEM is its built-in click-to-sort and
click-to-select wiring. Read `src/components/data/DataGrid.tsx` to
confirm which clicks it captures internally — if it doesn't capture
header clicks, wrap each header cell in a `<Clickable>` wrapper at
the call site OR file a follow-up to add native click-to-sort to
DataGrid.

Result must be:
- Click a column header in DataGrid → sort cycles asc → desc → asc.
- Click a body row in DataGrid → that row becomes the selected row.

**Acceptance:**
- Manually verify both clicks via repro from the demo.
- Add a `renderForTest` test that simulates a click on the "Lines"
  header cell and asserts `onSort("lines")` fires.

---

### Sub-task 3 — Fix `ScrollEditTable` C1–C7

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 1

**Instruction:**

Rewrite `ScrollEditTable` to address every C-row issue:

- **C1 (phantom keyboard cursor):** change `kbCellRef` to
  `useRef<{row, col} | null>(null)`. Render the warning-color
  highlight ONLY when `kbCellRef.current !== null`. The first arrow
  keypress sets it to `{row:0, col:0}`; until then no kb cell shows.
  Keep mouse hover the same (it's already null-by-default via
  `hoverRef.current === null`).

- **C2 (overlap):** define an explicit precedence: if mouse-hover is
  on a cell, it takes the *visible* highlight (primary, inverse).
  The keyboard cursor underneath is suppressed visually but still
  tracked. When the mouse leaves, the kb cursor becomes visible
  again.

- **C3 (click-resets is undiscoverable):** change the click semantic.
  Left-click now **promotes a cell to keyboard-cursor** (so the user
  can drive with `+`/`-` from there). **Shift-click** resets to
  baseline. **Middle-click** also resets (alt path). Document in the
  header line.

- **C4 (status row layout):** replace the two `Tag` chips with a
  single one-line summary like `cell: Revenue · Q4 (was 145, now
  192, +47)` rendered as plain text in dim/secondary colors. No
  Tags. Drops below the table cleanly even on narrow widths.

- **C5 (inverse too aggressive):** drop `inverse` on the hovered
  cell. Use `bold + brand.primary color` for hover, plain `warning`
  color for the kb cell. Easier to read on dark themes.

- **C6 (border looks focused):** change the table's outer border
  from `borderColor: brand.primary` to `borderColor: divider`.
  Reserve the bright border for actual focus.

- **C7 (delta arrow):** when a cell's value differs from baseline,
  prefix the value with `↑` (positive) or `↓` (negative) in the
  same delta color. Strip the arrow once value matches baseline.

**Acceptance:**
- New `renderForTest` test verifying the phantom cursor is GONE on
  initial render (`isCellHighlighted(row=0, col=0)` returns false
  before any keypress).
- Test: pressing arrow key once renders the kb highlight.
- Test: shift-click reset reverts to baseline (current value !==
  baseline initially after a mock scroll).
- Build clean, manual smoke confirms cleaner visual.

---

### Sub-task 4 — Polish section header + layout

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 1

**Instruction:**

Replace the dense single-line help in `DataSection` with a 3-line
breakdown plus a `Kbd` chip per shortcut. Layout the subsections:

```
Tree (col 1)        | DataGrid (col 2-3)
RichLog (col 1-2)   | Pretty (col 3)
ScrollEditTable     [full width]
```

so the wider widgets get more horizontal room. Both rows should
share the same column-stop axis to avoid the current "different
heights, mismatched borders" problem.

**Acceptance:**
- Demo's Data section renders without column-mismatch artifacts.
- Help text fits in ≤ 3 lines, no horizontal overflow at 80 cols.

---

### Sub-task 5 — Verification

**Block:** review
**Skill:** verification-before-completion
**Depends on:** Sub-tasks 1–4

**Instruction:**

Run the gate:

1. `bun run build` clean.
2. `bun run test` all green (existing 733 + ≥ 3 new tests from
   Sub-tasks 2, 3).
3. `bunx tsx examples/reacterm-demo.tsx < /dev/null` boots without
   stderr warnings (other than the existing TTY warning when piped).
4. Capture a fresh terminal screenshot of the Data section and
   verify each issue from the table above is fixed.
5. Update `improvements.md` if any of these issues turn out to be
   framework-level (e.g. DataGrid lacking native click-sort would
   be a §7 entry).

**Acceptance:**
- All four gates pass.
- No new diagnostics.

---

## Implementation order

The sub-tasks above are written so they CAN be done in order. But
realistically I'll batch:

1. **One execute pass** that does Sub-tasks 1, 3, 4 together (they
   all touch the same file and the splits make the diffs reviewable
   piece-by-piece).
2. **Mouse wiring (Sub-task 2)** as a second pass since it requires
   reading DataGrid internals first.
3. **Verification (Sub-task 5)** at the end.

Estimated effort: 1–2 hours focused. The biggest unknown is whether
DataGrid already supports click-sort — if not, the cleanest fix
might be a small PR to DataGrid itself, not to the demo.

## Acceptance summary

A user opening the Data section should:

- See **no phantom selection** anywhere on first render.
- Click a tree folder → it expands. Click again → collapses.
- Click a DataGrid header → that column becomes the sort column.
  Click again → reverses direction.
- Click a DataGrid body row → it becomes selected (cyan bar moves).
- Hover a numeric cell in the scroll table → exactly that one cell
  highlights. Wheel-scroll → value bumps. Shift-click → resets.
  Arrow keys → keyboard cursor appears (warning color), distinct
  from mouse hover.
- Read the header in three short lines, with each shortcut shown as
  a `Kbd` chip.

When all five points behave that way, the section "works smooth".
