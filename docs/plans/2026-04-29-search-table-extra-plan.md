# Plan: SearchTable extra component

**Spec:** (none — alignment reached in conversation; mirror existing `SearchList` pattern)
**Created:** 2026-04-29T09:45Z
**Status:** done
**Shape:** plan-execute-review
**Human checkpoints:** 0 (autonomous run; non-destructive new-file feature)

## Context

`Table` (`src/components/table/Table.tsx`) stays unopinionated — it renders whatever rows the parent passes. `SearchTable` is a **bundled extra** that wraps `Table`, owns a search query buffer, and filters rows by substring match. Apps that want batteries-included filtering import `SearchTable`; apps that want custom filter logic keep using `Table` directly.

Pattern reference: `src/components/extras/SearchList.tsx` — single focus owner, internal `useInput` handler, ref-backed query state, debounce-capable, clamp on row-set change. Mirror that structure.

## Design notes (settled)

- **API surface (mirrors `SearchListProps` where possible):**
  - `columns: TableColumn[]` — passed through to `Table`.
  - `data: Record<string, string | number>[]` — full unfiltered dataset.
  - `searchableColumns?: string[]` — column keys to search. **Default: every column whose values are strings in the first row.** (Numeric columns excluded by default; user can opt-in by listing them.)
  - `filter?: (row, query) => boolean` — custom predicate; bypasses default substring match.
  - `caseSensitive?: boolean` — default `false`.
  - `placeholder?: string` — default `"Search…"`.
  - `searchIcon?: string` — default `🔍`.
  - `showResultCount?: boolean` — default `true`.
  - `debounceMs?: number` — default `0`.
  - `hideTableUntilQuery?: boolean` — default `false`.
  - `isFocused?: boolean` — default `true`.
  - `onCancel?: () => void` — Escape on empty query.
  - All other `TableProps` (sortable, onRowSelect, stripe, rowHighlight, focus model, …) **passed through unchanged** to the underlying `Table`. Use a `tableProps?: Partial<TableProps>` escape hatch OR spread-rest the unknown keys.
- **Row-index translation:** when the user filters, the `Table` sees a smaller `data` array. `onRowSelect`/`onRowPress`/`onCellPress` callbacks must receive the **original** row index (index into unfiltered `data`), not the filtered index. Maintain a parallel `originalIndices: number[]` array and translate in callback wrappers.
- **Layout:** input row on top (same shape as `SearchList`'s input row), `Table` below. Single `tui-box` column container.
- **Keyboard routing:** `SearchTable`'s `useInput` handler consumes printable chars + backspace + escape for the query. Arrow keys / return / tab fall through (event not consumed) so `Table`'s own input handler picks them up. Verify ordering by reading `useInput` registration semantics.

## Sub-tasks

### Sub-task 1 — Write failing tests for SearchTable behavior

**Block:** execute
**Skill:** test-driven-development
**Depends on:** (none)

**Instruction:**

Create `src/__tests__/search-table.test.ts` with failing tests that pin down the contract. Use the same test harness pattern as `src/__tests__/table.test.ts` (read it first to match conventions: imports, render helpers, assertions). Cover at minimum:

1. Renders all rows when query is empty.
2. Filters rows by substring across all string columns when no `searchableColumns` prop given.
3. Honors `searchableColumns` prop — only listed columns participate in match.
4. Case-insensitive by default; `caseSensitive={true}` flips behavior.
5. Custom `filter` predicate overrides default match logic.
6. `onRowSelect` callback receives the **original** row index (unfiltered), not the filtered position. Critical regression guard.
7. Result count displays "N results" when `showResultCount` is true and query non-empty.
8. Escape on empty query fires `onCancel`; on non-empty query clears the buffer first.
9. Pass-through: `sortable`, `stripe`, `rowHighlight` props reach the underlying Table (smoke-test by checking rendered output reflects them).

Tests must fail initially (no `SearchTable.tsx` exists yet). Run `bun test src/__tests__/search-table.test.ts` and confirm the failure mode is "module not found" / "export missing", not malformed test code.

**Inputs (pre-staged):**
- file: src/components/extras/SearchList.tsx (pattern reference)
- file: src/components/table/Table.tsx (Table API surface, especially `TableProps`)
- file: src/__tests__/table.test.ts (test conventions)

**Acceptance:**
- `src/__tests__/search-table.test.ts` exists with ≥9 test cases covering items 1–9 above.
- `bun test src/__tests__/search-table.test.ts` runs and fails on missing module / missing export (not on test syntax errors).
- Tests assert against rendered output, not implementation internals.

---

### Sub-task 2 — Implement SearchTable.tsx

**Block:** execute
**Skill:** typescript
**Depends on:** sub-task 1

**Instruction:**

Create `src/components/extras/SearchTable.tsx`. Mirror the structure of `src/components/extras/SearchList.tsx`:

- Same imports (`useColors`, `useInput`, `useTui`, `useForceUpdate`, `useCleanup`, `usePluginProps`, `usePersonality`, `pickLayoutProps`).
- Ref-backed query/filtered/originalIndices state (no `useState` for hot-path values — match SearchList's pattern).
- `applyFilter(data, query, searchableColumns, caseSensitive, customFilter)` pure helper that returns `{ rows, originalIndices }`.
- Input handler: consume printable / backspace / escape; **do NOT consume** up/down/left/right/return/tab — let them fall through to the Table.
- Result count chip in the input row.
- Render `Table` below the input row with `data={filteredRows}` and wrapped callbacks (`onRowSelect`, `onRowPress`, `onCellPress`) that translate the filtered index back to the original index via `originalIndices[i]` before invoking the user's callback.
- Re-filter on `data` reference change (mirror SearchList's `lastItemsRef` guard).
- Debounce support identical to SearchList.
- Cleanup any debounce timer in `useCleanup`.
- Export `SearchTable` and `SearchTableProps`. Type props extend `StormLayoutStyleProps` and accept all `TableProps` keys.

Use `React.createElement` (no JSX) — match every other extra in this directory.

When tests pass, do NOT add scope: no fuzzy match, no regex mode, no highlight-matching-substring rendering. Those can come later; ship the substring core first.

**Inputs (pre-staged):**
- file: src/components/extras/SearchList.tsx (mirror)
- file: src/components/table/Table.tsx (TableProps surface)
- prior: failing tests from sub-task 1

**Acceptance:**
- `src/components/extras/SearchTable.tsx` exists.
- `bun test src/__tests__/search-table.test.ts` passes all cases from sub-task 1.
- No `useState` in hot-path code (refs only, matching SearchList).
- TypeScript compiles clean (`bun run typecheck` or `tsc --noEmit` — whichever the project uses).

---

### Sub-task 3 — Wire export in src/index.ts

**Block:** execute
**Skill:** typescript
**Depends on:** sub-task 2

**Instruction:**

Add to `src/index.ts`, immediately after the existing `SearchList` export at line 188:

```ts
export { SearchTable, type SearchTableProps } from "./components/extras/SearchTable.js";
```

Do not touch the dist/ files — they are build artifacts.

**Inputs (pre-staged):**
- file: src/index.ts (line 188 anchor)

**Acceptance:**
- `src/index.ts` exports `SearchTable` and `SearchTableProps`.
- A consumer importing `import { SearchTable } from "reacterm"` resolves the symbol.
- No duplicate exports introduced.

---

### Sub-task 4 — Verify build, type-check, full test suite

**Block:** review
**Skill:** verification-before-completion
**Depends on:** sub-task 3

**Instruction:**

Confirm the change is shippable end-to-end before marking the plan done:

1. `bun test` — full suite passes, including `search-table.test.ts` and existing `table.test.ts` (no regression in Table behavior).
2. Type-check passes (whatever command the repo uses — likely `bun run typecheck` or `tsc --noEmit`; check `package.json` scripts).
3. Build passes if a build script exists (`bun run build`).
4. Spot-check the new file for the anti-patterns the SearchList comment block warns against — multi-`isFocused` collision, stale closures over query/data.
5. Confirm `originalIndices` translation is covered by sub-task 1's test #6 specifically — this is the easiest regression to ship.

If any check fails, surface the failure verbatim; do not patch silently.

**Inputs (pre-staged):**
- prior: artifacts from sub-tasks 1–3

**Acceptance:**
- `bun test` exits 0.
- Type-check exits 0.
- Build (if present) exits 0.
- No anti-patterns flagged in `SearchTable.tsx`.
- Plan marked `done`.
