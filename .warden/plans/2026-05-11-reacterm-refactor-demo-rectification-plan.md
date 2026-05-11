# Plan: Rectify Reacterm Refactor And Demo Coverage Issues

**Spec:** none. Scope comes from `.warden/research/2026-05-11-refactor-demo-scan/REPORT.md`.
**Created:** 2026-05-11
**Status:** completed
**Shape:** research-plan-execute-review
**Human checkpoints:** 0 planned. User approved execution on 2026-05-11 with "implement the plan".
**Refinement passes:** 1 completed before execution.
**Worktree:** plan authored from `main`. Execute in a dedicated worktree, suggested:
`git worktree add .worktrees/demo-coverage-rectification -b demo-coverage-rectification`.

## Goal

Rectify all issues found in the 2026-05-11 scan:

1. Fix public API/docs mismatches.
2. Make demo coverage truthful and auditable.
3. Add missing key public features to `reacterm demo`.
4. Simplify or remove stale/unwired branches where tests prove they are dead.
5. Update docs and verification so the same drift does not return.

## Source Inputs

- `.warden/research/2026-05-11-refactor-demo-scan/REPORT.md`
- `.warden/research/2026-05-11-refactor-demo-scan/units/*.md`
- `src/index.ts`
- `src/hooks/index.ts`
- `src/cli/demo/**`
- `docs/features.md`
- `src/components/effects/Image.tsx`
- `src/hooks/useGhostText.ts`
- `src/components/core/ListView.tsx`
- `src/components/core/Select.tsx`
- `src/components/extras/Form.tsx`

## Assumptions

- `A1`
  - Statement: Implementation must happen in a worktree, not directly on `main`.
  - Type: repo-state
  - Source: Warden planner workflow and existing local plan convention.
  - Check: `pwd | grep -q '/.worktrees/demo-coverage-rectification$'`
  - If false: stop before edits and create/switch to the worktree.
  - Owner: Sub-task 1.

- `A2`
  - Statement: Root public API should be a superset of documented `"reacterm"` imports and the `./hooks` public surface for documented hooks.
  - Type: architectural
  - Source: `docs/hook-guide.md`, `src/hooks/index.ts`, scan report.
  - Check: API-surface snapshot diff after adding missing root exports.
  - If false: update docs to use subpath imports instead, and record the policy.
  - Owner: Sub-task 2.

- `A3`
  - Statement: Demo should cover public user-facing components/widgets/hooks, but low-level internals can be marked docs-only, test-only, or edge-case.
  - Type: design
  - Source: `docs/features.md` and scan report.
  - Check: generated coverage matrix has explicit status for every public runtime export.
  - If false: split the plan into a broader product/design pass before adding more demo cards.
  - Owner: Sub-task 4.

- `A4`
  - Statement: Demo import cleanup should not change demo behavior.
  - Type: repo-state
  - Source: strict unused scan found broad imports, not runtime failures.
  - Check: demo-focused tests and strict no-unused probe for `src/cli/demo/**`.
  - If false: revert the import cleanup slice and keep the coverage matrix based on rendered labels/tests instead.
  - Owner: Sub-task 3.

- `A5`
  - Statement: Stale branches called out in the scan are candidates, not proven dead code.
  - Type: policy
  - Source: scan report.
  - Check: each removal/wiring change starts with a focused failing or characterization test.
  - If false: keep the branch and document why it remains reachable.
  - Owner: Sub-task 8.

- `A6`
  - Statement: Adding a tiny committed image fixture for the `Image` demo is acceptable.
  - Type: design
  - Source: scan report recommendation.
  - Check: fixture is small, repo-local, and used by demo/tests.
  - If false: mark `Image` as docs-only/edge-case in coverage instead of demoing it.
  - Owner: Sub-task 6.

## Sub-tasks

### Sub-task 1 - Create Execution Worktree

**Block:** execute
**Skill:** warden:git
**Depends on:** none
**Assumption refs:** A1

**Instruction:**

Create or enter `.worktrees/demo-coverage-rectification` from `main`. Bring this plan and current Warden research context into that worktree. Confirm clean baseline and fresh code map before source edits.

**Acceptance:**

- `pwd | grep -q '/.worktrees/demo-coverage-rectification$'` -> exit 0
- `git status --short` -> no unrelated source changes
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 2 - Fix Public API Parity

**Block:** execute
**Skill:** warden:typescript
**Depends on:** Sub-task 1
**Assumption refs:** A2

**Instruction:**

Add missing root exports in `src/index.ts` for documented hook APIs that already exist in `src/hooks/index.ts` / `src/hooks/headless/index.ts`: `useDebouncedValue`, `useEventCalendarBehavior` with its related types, and `useImperativeAnimation` if the current API snapshot confirms it is public on `./hooks`. Add or update a focused API test if `src/__tests__/api-surface.test.ts` alone does not catch root import parity.

**Acceptance:**

- `bun run test:api` -> exit 0 after intentional snapshot update
- `bun run typecheck` -> exit 0
- `bash -lc 'rg -q "useDebouncedValue" src/index.ts && rg -q "useEventCalendarBehavior" src/index.ts && rg -q "useImperativeAnimation" src/index.ts'` -> exit 0

### Sub-task 3 - Clean Demo Imports And Truth Claims

**Block:** execute
**Skill:** warden:typescript
**Depends on:** Sub-task 2
**Assumption refs:** A4

**Instruction:**

Refactor `src/cli/demo/sections/*.tsx` imports so each section imports only the symbols it uses. Keep or split `demo-kit.ts` only where it still improves readability. Fix stale demo truth claims such as `22 sections` and hard-coded counts that disagree with the catalog. Do not add new feature demos in this sub-task.

**Acceptance:**

- `bun run test -- src/__tests__/robustness.test.ts src/__tests__/demo-calendar.test.ts src/__tests__/demo-visual-effects.test.ts src/__tests__/overlay-demo-no-warn.test.ts src/cli/__tests__/verbs/demo.test.ts` -> exit 0
- `bash -lc 'out=$(bun x tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false 2>&1 || true); printf "%s\n" "$out"; ! grep -q "src/cli/demo/" <<< "$out"'` -> exit 0
- `bash -lc '! rg "22 sections" src/cli/demo'` -> exit 0

### Sub-task 4 - Add Demo Coverage Matrix

**Block:** execute
**Skill:** warden:typescript
**Depends on:** Sub-task 3
**Assumption refs:** A3

**Instruction:**

Add a repo-local coverage matrix for public runtime exports versus demo status. The matrix should distinguish `runtime-demo`, `docs-only`, `test-only`, `edge-case`, and `missing`. Prefer generated or test-checked data over hand-maintained prose. Add a focused test that fails when a public user-facing component/widget lacks an explicit status.

**Acceptance:**

- `bun run test -- src/__tests__/demo-coverage.test.ts src/__tests__/api-surface.test.ts` -> exit 0
- `bash -lc 'rg -q "runtime-demo" docs/features.md src/cli/demo && rg -q "edge-case" docs/features.md src/cli/demo'` -> exit 0
- `bun run typecheck` -> exit 0

### Sub-task 5 - Add Missing Demo Features: Data, Navigation, Feedback

**Block:** execute
**Skill:** warden:reacterm
**Depends on:** Sub-task 4
**Assumption refs:** A3, A4

**Instruction:**

Expand `reacterm demo` with small, interactive cards or sections for:

- Data: `Table`, `SearchTable`, `VirtualList`, `DirectoryTree`, `FilePicker`.
- Navigation: `Tabs`, `TabbedContent`, `Breadcrumb`, `Menu`, `CommandPalette`, `Paginator`, `HelpPanel`.
- Feedback: `Alert`, `ConfirmDialog`, `Tooltip`, `StatusMessage`, `LoadingIndicator`, `Welcome`, `ToastContainer`.

Use existing Reacterm components and headless behavior hooks. Avoid duplicating component internals inside the demo.

**Acceptance:**

- `bun run test -- src/__tests__/demo-coverage.test.ts src/__tests__/table.test.ts src/__tests__/search-table.test.ts src/__tests__/components.test.ts src/__tests__/robustness.test.ts src/__tests__/overlay-demo-no-warn.test.ts` -> exit 0
- `bun run typecheck` -> exit 0
- `bash -lc 'for term in Table SearchTable VirtualList DirectoryTree FilePicker CommandPalette Alert ConfirmDialog Tooltip LoadingIndicator Welcome; do rg -q "$term" src/cli/demo docs/features.md || exit 1; done'` -> exit 0

### Sub-task 6 - Add Missing Demo Features: Charts, Editor, Effects, AI Dev Widgets

**Block:** execute
**Skill:** warden:reacterm
**Depends on:** Sub-task 5
**Assumption refs:** A3, A6

**Instruction:**

Expand `reacterm demo` with focused coverage for:

- `ScatterPlot`
- `MarkdownEditor`
- `Image` with a tiny repo-owned fixture, or mark it edge-case if A6 fails
- `Shadow`, `Link`, `Timer`, `Stopwatch`, `Accordion`, `Collapsible`
- `CommandDropdown`, `PerformanceHUD`

Preserve terminal layout stability and avoid hiding important widgets inside oversized panels.

**Acceptance:**

- `bun run test -- src/__tests__/demo-coverage.test.ts src/__tests__/markdown-editor.test.ts src/__tests__/demo-visual-effects.test.ts src/__tests__/components.test.ts src/__tests__/linechart.test.ts` -> exit 0
- `bun run typecheck` -> exit 0
- `bash -lc 'for term in ScatterPlot MarkdownEditor Shadow Timer Stopwatch Accordion Collapsible CommandDropdown PerformanceHUD; do rg -q "$term" src/cli/demo docs/features.md || exit 1; done'` -> exit 0
- `bash -lc 'rg -q "Image" src/cli/demo docs/features.md || rg -q "Image.*edge-case|edge-case.*Image" docs/features.md'` -> exit 0

### Sub-task 7 - Add Missing Public Hook Demo Cards

**Block:** execute
**Skill:** warden:reacterm
**Depends on:** Sub-task 6
**Assumption refs:** A3, A4

**Instruction:**

Add compact hook demo cards for the missing public hooks called out in the scan: `useFocus`, `useFocusManager`, `useVirtualList`, `useCommandPalette`, `useTimer`, `usePhaseTimer`, `useGhostText`, `useImperativeAnimation`, `useClipboard`, `usePaste`, `useKeyChord`, `useTypeahead`, `useMultiSelect`, `useSortable`, `useAsyncLoader`, `useBatchAction`, `useStreamConsumer`, `useHistory`, `useModeCycler`, `useNotification`, `useContextMenu`, `useDragReorder`, `useInfiniteScroll`, `useCopyPasteBuffer`, and `useStyleSheet`.

Where a hook is unsafe or impractical in the demo, mark it explicitly as docs-only or edge-case in the coverage matrix.

**Acceptance:**

- `bun run test -- src/__tests__/demo-coverage.test.ts src/__tests__/use-clipboard.test.ts src/__tests__/testing-driver.test.ts src/__tests__/robustness.test.ts` -> exit 0
- `bun run typecheck` -> exit 0
- `bash -lc 'for term in useFocus useVirtualList useCommandPalette useTimer useGhostText useImperativeAnimation useStyleSheet; do rg -q "$term" src/cli/demo docs/features.md || exit 1; done'` -> exit 0

### Sub-task 8 - Remove Or Wire Stale Simplification Candidates

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 7
**Assumption refs:** A5

**Instruction:**

For each simplification candidate, first add or identify a focused characterization test, then either remove dead code or wire the option correctly:

- `Image.tsx`: `renderBlockImage`, `renderSextantWithUnderline`, and stale fallback comment.
- `useGhostText`: unused `cursor` and `acceptKey`.
- `ListView`: computed `initialIndex`.
- `Select`: inert compound trigger and ignored `maxVisible`.
- `Form`: compound `validate`, `setValue`, `setError`, and `submit` paths.
- `useStyleSheet`: unused `flushSync` and `existingSheet`.
- `InputWiring`: constructor parameter properties that are not read outside construction.

Do not remove misuse guards such as compound-context errors.

**Acceptance:**

- `bun run test -- src/__tests__/components.test.ts src/__tests__/select.test.ts src/__tests__/form.test.ts src/__tests__/scrollview.test.ts src/__tests__/robustness.test.ts` -> exit 0
- `bun run test -- src/__tests__/demo-visual-effects.test.ts src/__tests__/textinput.test.ts src/__tests__/text-edit.test.ts` -> exit 0
- `bash -lc 'out=$(bun x tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false 2>&1 || true); printf "%s\n" "$out"; ! grep -E "src/(components/effects/Image|hooks/useGhostText|components/core/ListView|components/core/Select|components/extras/Form|hooks/useStyleSheet|reconciler/input-wiring)" <<< "$out"'` -> exit 0
- `bun run typecheck` -> exit 0

### Sub-task 9 - Update Feature Docs And Demo Docs

**Block:** execute
**Skill:** warden:writing
**Depends on:** Sub-task 8
**Assumption refs:** A2, A3

**Instruction:**

Update `docs/features.md`, component docs, hook guide, and any CLI/demo docs touched by the changes. Remove stale references to `examples/reacterm-demo.tsx` unless intentionally kept as compatibility shim. Make the feature catalog point to the real demo and coverage matrix.

**Acceptance:**

- `bash -lc '! rg "examples/reacterm-demo|catalog is currently a skeleton|22 sections" docs src/cli/demo'` -> exit 0
- `bun run test -- src/cli/__tests__/docs.test.ts src/__tests__/api-surface.test.ts src/__tests__/demo-coverage.test.ts` -> exit 0
- `bun run typecheck` -> exit 0

### Sub-task 10 - Final Verification And Code Map Refresh

**Block:** review
**Skill:** warden:verification-before-completion
**Depends on:** Sub-task 9
**Assumption refs:** A1, A2, A3, A4, A5, A6

**Instruction:**

Run the final verification gate fresh. Refresh the Warden code map after all source edits. Report exact command results and any residual documented edge-cases.

**Acceptance:**

- `bun run typecheck` -> exit 0
- `bun run test` -> exit 0
- `bun run test:api` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

## Execution Notes

- Keep implementation serial. Demo additions can be grouped by sub-task, but do not batch simplification removals without tests.
- Update API snapshots only when the diff is intentional and additive.
- Treat `docs/features.md` as an auditable source of truth only after Sub-task 4.
- Low-level runtime utilities may remain docs-only or test-only. The goal is truthful coverage, not forcing every internal into the interactive demo.
