# Plan: Serial refactoring opportunities

**Spec:** none. Scope comes from the 2026-05-08 code-map review.
**Created:** 2026-05-08T17:35Z
**Status:** draft
**Shape:** custom serial research-execute-review loop
**Human checkpoints:** 0 planned. If research changes ordering or scope materially, pause and report instead of continuing.
**Refinement passes:** 1
**Worktree:** plan authored from `main`. Execute in one long-lived worktree, suggested:
`git worktree add .worktrees/serial-refactors -b serial-refactors`.

## Context

The code map at `.warden/maps/reacterm/` is current and reports 601 indexed
files. The map plus spot reads surfaced nine refactoring opportunities:

1. Split `src/cli/demo/App.tsx`.
2. Finish the existing `Panes` normalized-tree refactor.
3. Consolidate repeated tree flattening helpers.
4. Consolidate repeated navigability predicates.
5. Extract shared text-editing primitives from headless input hooks.
6. Split the layout engine into focused modules while preserving the public facade.
7. Split renderer paint paths into focused modules.
8. Extract the WebRenderer HTML/page builder.
9. Extract shared chart render helpers.

The user explicitly wants these done one at a time. Before each new part starts,
the executor must do fresh local research against the code as it exists after
the previous part. Later phases may be reordered only after a research gate
shows the current order is wrong.

## Serial Gate Contract

Every implementation phase follows this gate:

1. **Research first.** Read the current code map, target files, nearest tests,
   docs/specs, and previous phase diff. Write a short report under
   `.warden/research/2026-05-08-serial-refactors/<phase>.md`.
2. **Decide approach.** If the research contradicts this plan, update this plan
   and pause. Do not force the old approach.
3. **Implement only that phase.** Do not opportunistically refactor the next
   phase.
4. **Verify.** Run focused tests, `bun x tsc --noEmit`, full `bun test`, and
   `git diff --check`.
5. **Refresh map.** Run `code-map build --repo . --map-tokens 4000`, then
   `code-map status --format json` and confirm `"stale": false`.
6. **Only then move on.** The next phase starts with fresh research against the
   changed code.

No parallel implementation. No batching adjacent phases.

## Assumptions

- `A1`
  - Statement: A single long-lived worktree is better than separate worktrees
    because later research must see earlier changes.
  - Type: workflow
  - Source: user statement that changes may affect each other.
  - Check: before execution, `pwd` contains `.worktrees/serial-refactors`.
  - If false: stop and create/switch to the worktree before editing.
  - Owner: Sub-task 1.

- `A2`
  - Statement: Public API behavior should stay unchanged unless a phase's
    research proves a behavior-preserving split is impossible.
  - Type: architectural
  - Source: all opportunities are refactors, not feature requests.
  - Check: `src/__tests__/api-surface.test.ts` stays green and snapshots do not
    change unless explicitly justified in phase research.
  - If false: pause and re-scope the phase as an API-change task with docs.
  - Owner: every execute phase.

- `A3`
  - Statement: The safest ordering is isolated/demo work first, then component
    refactors, then shared utilities, then core engine/renderer, then lower-risk
    service/chart splits.
  - Type: design
  - Source: code-map fan-out and spot reads on 2026-05-08.
  - Check: each phase research includes `code-map query 'blast-radius <target>'`
    or an equivalent call-site scan.
  - If false: update the phase queue and pause before proceeding.
  - Owner: each research gate.

- `A4`
  - Statement: Full `bun test` after each phase is acceptable because these are
    structural changes that can silently affect shared behavior.
  - Type: policy
  - Source: user requested one-at-a-time implementation due interaction risk.
  - Check: each phase review records full test output.
  - If false: pause and define a narrower verification policy with the user.
  - Owner: every review gate.

- `A5`
  - Statement: Code-map refresh after each phase is required so the next
    research gate does not reason from stale topology.
  - Type: repo-state
  - Source: user asked to use the code map for this work.
  - Check: `code-map status --format json` returns `"stale": false`.
  - If false: rebuild/fix the map before proceeding.
  - Owner: every review gate.

## Sub-tasks

### Sub-task 1 - Execution setup

**Block:** research
**Skill:** warden:git
**Depends on:** none
**Assumption refs:** A1

**Instruction:**

Create or enter `.worktrees/serial-refactors` from `main`. Confirm clean
baseline and current map status. Do not edit source in `main`.

**Acceptance:**
- `pwd | grep -q '/.worktrees/serial-refactors$'` -> exit 0
- `git status --short` -> no output
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 2 - Phase 1 research: split CLI demo app

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 1
**Assumption refs:** A2, A3, A5

**Instruction:**

Research the best split for `src/cli/demo/App.tsx` as it exists in the
worktree. Use `code-map outline`, import/export scans, and nearest tests.
Prefer a layout that keeps demo behavior unchanged and avoids new public API.
Write findings to `.warden/research/2026-05-08-serial-refactors/01-cli-demo.md`.

### Sub-task 3 - Phase 1 execute: split CLI demo app

**Block:** execute
**Skill:** warden:refactoring
**Depends on:** Sub-task 2
**Assumption refs:** A2

**Instruction:**

Split `src/cli/demo/App.tsx` into focused section/helper modules under
`src/cli/demo/`, keeping the public CLI demo behavior identical. Avoid touching
core framework behavior.

**Acceptance:**
- `bun test src/__tests__/robustness.test.ts src/__tests__/demo-calendar.test.ts src/__tests__/overlay-demo-no-warn.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 4 - Phase 2 research: finish Panes refactor

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 3
**Assumption refs:** A2, A3, A5

**Instruction:**

Re-read `docs/specs/2026-04-22-panes-refactor-design.md`,
`src/components/core/Panes.tsx`, `src/__tests__/panes.test.ts`, and related
layout tests after Phase 1. Decide whether the old spec still fits. Write
findings to `.warden/research/2026-05-08-serial-refactors/02-panes.md`.

### Sub-task 5 - Phase 2 execute: normalized Panes tree

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 4
**Assumption refs:** A2

**Instruction:**

Implement the Panes normalized-tree refactor behind the existing `Panes` and
`Pane` API. Remove shape-specific nested row/column branches only after tests
cover current supported shapes.

**Acceptance:**
- `bun test src/__tests__/panes.test.ts src/__tests__/layout.test.ts src/__tests__/robustness.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 6 - Phase 3 research: tree flattening utility

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 5
**Assumption refs:** A2, A3, A5

**Instruction:**

Research the four `flattenVisible` implementations in `Tree`,
`useTreeBehavior`, `TreeTable.flatten`, and `DirectoryTree`. Decide whether a
generic utility can preserve each local type shape without weakening types.
Write findings to `.warden/research/2026-05-08-serial-refactors/03-tree-flatten.md`.

### Sub-task 7 - Phase 3 execute: consolidate tree flattening

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 6
**Assumption refs:** A2

**Instruction:**

Extract a small internal tree-flattening utility and migrate consumers one at a
time. Preserve exported types and visual output.

**Acceptance:**
- `bun test src/__tests__/tree.test.ts src/__tests__/tree-table.test.ts src/__tests__/layout-box-api.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 8 - Phase 4 research: navigability helper

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 7
**Assumption refs:** A2, A3, A5

**Instruction:**

Research repeated `isNavigable` predicates in `Menu`, `OptionList`,
`SearchList`, and `useMenuBehavior`. Check whether `src/utils/navigation.ts`
is the correct home or whether each component needs local semantics. Write
findings to `.warden/research/2026-05-08-serial-refactors/04-navigation.md`.

### Sub-task 9 - Phase 4 execute: consolidate navigability predicates

**Block:** execute
**Skill:** warden:refactoring
**Depends on:** Sub-task 8
**Assumption refs:** A2

**Instruction:**

Introduce the narrowest internal helper that removes duplicated navigability
logic without hiding component-specific disabled/separator rules.

**Acceptance:**
- `bun test src/__tests__/select.test.ts src/__tests__/search-table.test.ts src/__tests__/components.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 10 - Phase 5 research: text editing primitives

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 9
**Assumption refs:** A2, A3, A5

**Instruction:**

Research shared behavior across `useTextInputBehavior`,
`useTextAreaBehavior`, and `useChatInputBehavior`: word movement, wrapping,
row offsets, selection, max-length checks, and cursor math. Identify the first
safe extraction slice. Write findings to
`.warden/research/2026-05-08-serial-refactors/05-text-editing.md`.

### Sub-task 11 - Phase 5 execute: extract text editing primitives

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 10
**Assumption refs:** A2

**Instruction:**

Extract internal pure helpers for the researched slice. Prefer pure utility
tests before hook migration. Do not rewrite all hooks at once if research shows
separate slices are safer.

**Acceptance:**
- `bun test src/__tests__/textinput.test.ts src/__tests__/testing-driver.test.ts src/__tests__/robustness.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 12 - Phase 6 research: layout engine module split

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 11
**Assumption refs:** A2, A3, A5

**Instruction:**

Research `src/layout/engine.ts`, all imports of `../layout/engine.js`, and
layout tests. Choose a split that keeps `src/layout/engine.ts` as the stable
public facade for exports used by API snapshots. Write findings to
`.warden/research/2026-05-08-serial-refactors/06-layout-engine.md`.

### Sub-task 13 - Phase 6 execute: split layout engine internals

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 12
**Assumption refs:** A2

**Instruction:**

Move spacing, grid, flex, and measurement internals into focused modules while
preserving imports from `src/layout/engine.ts`. Do not change layout semantics.

**Acceptance:**
- `bun test src/__tests__/layout.test.ts src/__tests__/layout-properties.test.ts src/__tests__/layout-engine-scroll.test.ts src/__tests__/component-boundary-layout.test.ts` -> exit 0
- `bun test src/__tests__/api-surface.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 14 - Phase 7 research: renderer paint split

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 13
**Assumption refs:** A2, A3, A5

**Instruction:**

Research `src/reconciler/renderer.ts`, renderer tests, overlay tests, and
callers of exported renderer symbols. Decide a module boundary for background,
text, scroll-view, border, overlay, and orchestration without changing exports.
Write findings to `.warden/research/2026-05-08-serial-refactors/07-renderer.md`.

### Sub-task 15 - Phase 7 execute: split renderer paint modules

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 14
**Assumption refs:** A2

**Instruction:**

Extract renderer paint helpers behind the current public renderer surface.
Keep orchestration in `renderer.ts`. Avoid behavior changes to clipping,
overlays, scrollbars, ANSI stripping, and image sequencing.

**Acceptance:**
- `bun test src/__tests__/integration.test.ts src/__tests__/overlay-free-position.test.ts src/__tests__/overlay-component.test.ts src/__tests__/scrollview.test.ts src/__tests__/text-injection-safety.test.ts` -> exit 0
- `bun test src/__tests__/api-surface.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 16 - Phase 8 research: WebRenderer template split

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 15
**Assumption refs:** A2, A3, A5

**Instruction:**

Research `src/core/web-renderer.ts`, especially `buildHtmlPage`, and existing
tests or smoke coverage. Decide whether to extract only static HTML/script
building or frame encode/decode helpers too. Write findings to
`.warden/research/2026-05-08-serial-refactors/08-web-renderer.md`.

### Sub-task 17 - Phase 8 execute: extract WebRenderer page builder

**Block:** execute
**Skill:** warden:refactoring
**Depends on:** Sub-task 16
**Assumption refs:** A2

**Instruction:**

Extract the static browser page/script builder from `WebRenderer` into an
internal module. Keep `WebRenderer` construction and public options unchanged.

**Acceptance:**
- `bun test src/__tests__/integration.test.ts src/__tests__/render-context.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 18 - Phase 9 research: chart render core

**Block:** research
**Skill:** warden:codebase-explainer
**Depends on:** Sub-task 17
**Assumption refs:** A2, A3, A5

**Instruction:**

Research `BarChart`, `LineChart`, `Histogram`, `AreaChart`, `Heatmap`,
`ScatterPlot`, and chart tests. Find the smallest shared helper extraction
that reduces duplication without coupling unrelated chart types. Write
findings to `.warden/research/2026-05-08-serial-refactors/09-charts.md`.

### Sub-task 19 - Phase 9 execute: extract chart helpers

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** Sub-task 18
**Assumption refs:** A2

**Instruction:**

Extract shared chart helpers for the slice selected by research. Start with
pure helpers and tests; migrate chart components one by one. Do not rewrite the
chart rendering architecture in a single pass.

**Acceptance:**
- `bun test src/__tests__/linechart.test.ts src/__tests__/components.test.ts` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `git diff --check` -> exit 0
- `code-map build --repo . --map-tokens 4000` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

### Sub-task 20 - Final review gate

**Block:** review
**Skill:** warden:verification-before-completion
**Depends on:** Sub-task 19
**Assumption refs:** A2, A4, A5

**Instruction:**

Run the final verification gate across the whole serial branch. Confirm every
phase research report exists, all maps are current, and no public API surface
changed unexpectedly.

**Acceptance:**
- `test -f .warden/research/2026-05-08-serial-refactors/01-cli-demo.md` -> exit 0
- `test -f .warden/research/2026-05-08-serial-refactors/09-charts.md` -> exit 0
- `bun x tsc --noEmit` -> exit 0
- `bun test` -> exit 0
- `bun run build` -> exit 0
- `bun test src/__tests__/api-surface.test.ts` -> exit 0
- `git diff --check` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

## Notes For Execution

- Keep each phase behavior-preserving.
- Do not combine phases even if the same file is open.
- If a phase exposes a real bug, decide whether it is required to complete the
  refactor. If not required, log it as a follow-up instead of expanding scope.
- If a public export, docs example, or CLI surface changes, add a docs/update
  sub-task before moving to the next phase.
