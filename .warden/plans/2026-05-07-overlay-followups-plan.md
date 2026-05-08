# Plan: Overlay follow-ups (4 framework improvements)

**Spec:** none — scope distilled from the post-merge review of the movable-overlay work in chat.
**Created:** 2026-05-07T00:05Z
**Status:** approved
**Shape:** decompose-parallel-merge — research + fold inline, four parallel improvement streams (each in its own worktree), final integration review.
**Human checkpoints:** 1 (after parallel work, before merging into main)
**Refinement passes:** 1
**Worktree:** plan authored from `main`. Each improvement runs in its own worktree off `~/projects/reacterm`:
  - `.worktrees/stacked-keys`
  - `.worktrees/eaa-width`
  - `.worktrees/mouse-priority`
  - `.worktrees/layout-fixes`

## Context

The movable-overlay merge (commit `f331a0e`) shipped, and review surfaced four follow-ups that benefit every reacterm component author, not just Overlay:

1. **Stack-aware Esc semantics** — when N overlays mount with `onClose`, currently all of them register Esc at `MODAL=1000` and Esc closes them all simultaneously. Authors expect topmost-only.
2. **East-Asian-Ambiguous-width Unicode chars** — Reacterm's BMP table treats them all as width-1; modern terminals (Kitty, WezTerm, recent xterm) render some as width-2. The Overlay's resize glyph trap (`⇲`/`↘`/`◢` overdrawing the right border) was a symptom; the framework lacks a knob.
3. **`useMouseTarget` hit-zone priority is registration-order-dependent** — fragile. Reordering hooks silently breaks dispatch. Should be explicit via a `priority?: number` opt.
4. **Layout-engine value-name + overflow defaults** — `justifyContent: "flex-end"` silently no-ops because the engine's `Justify` union is `"start" | "center" | "end" | ...` (no `"flex-end"`). And `flex: 1` children default to `overflow: "visible"`, allowing content to overpaint siblings — the resize-handle visibility bug was a direct symptom.

These are independent. They land as four separate commits, each on its own worktree, and merge to main one by one.

## Assumptions

- `A1` — `useStackedKey` can be implemented as a thin wrapper over `useInput` with a module-level handler stack keyed by `key` string. New most-recent handler captures dispatch; passes through (`event.consumed = false`) to fire the next one.
  - Type: design
  - Source: read of `src/input/manager.ts:287-319` (emitKey) — handlers fire in registration order; `event.consumed` short-circuits.
  - Check: prototype passes the stack-of-3 test (mount A, B, C; Esc closes C; Esc closes B; Esc closes A).
  - If false: implement at the InputManager level instead (add `onStackedKey(key, handler)` API). More invasive but cleaner.
  - Owner: Sub-task 2.

- `A2` — Reacterm's BMP width table is the only width source. Adding an `EAA_AMBIGUOUS` range list + a runtime config knob fully addresses the issue.
  - Type: repo-state
  - Source: `src/core/unicode.ts` — single `BMP_WIDTH` Uint8Array table, populated once at module load. No other code paths.
  - Check: `rg -n 'gWidth\|graphemeWidth\|charWidth' src` returns only `unicode.ts` callers.
  - If false: hunt down the other width sites and update them too. Plan grows by 1 sub-task.
  - Owner: Sub-task 3.

- `A3` — `useMouseTarget`'s `priority` parameter can be added without breaking existing callers. Default `priority = 0`. The focus dispatcher's `hitTestInput` (currently iterates registration-order LAST→FIRST) becomes priority-sorted with registration-order as tiebreaker.
  - Type: architectural
  - Source: `src/core/focus.ts` `hitTestInput` impl; existing `useMouseTarget` callers in Tree, TreeTable, Table, Button, Tabs, Overlay.
  - Check: existing 944 tests stay green when undefined-priority callers behave identically (registration-order tiebreaker).
  - If false: revert and ship registration-order only. Skip the improvement.
  - Owner: Sub-task 4.

- `A4` — `Justify` type union really is `"start"|"center"|"end"|...` (no `"flex-end"`). Both fixes are tractable: (a) add `"flex-end"` as accepted alias of `"end"` in the engine; OR (b) reject `"flex-end"` at the type level and require callers to use `"end"`.
  - Type: repo-state
  - Source: `src/layout/engine.ts:1257-1289` (justify switch) and the `Justify` type at the top of the file.
  - Check: grep confirms — already done inline.
  - If false: fix the engine differently.
  - Owner: Sub-task 5.

- `A5` — `flex: 1` children default to `overflow: "visible"` (allowing content to overpaint). Changing the default to `"hidden"` for flex-sized children is a behavior change; doing it as a config or as an opt-in would be safer.
  - Type: design
  - Source: `src/layout/engine.ts:54-56` (Overflow type) and `src/reconciler/renderer.ts:864-870` (clip handling).
  - Check: do existing components rely on `flex: 1` overflow:visible behavior? Sample 5+ flex-using components.
  - If false: don't change the default; only document.
  - Owner: Sub-task 5 (research-then-decide).

## Sub-tasks

### Sub-task 1 — Pre-execution research (already partially done inline; finalize)

**Block:** research
**Skill:** codebase-explainer
**Depends on:** (none)
**Assumption refs:** A1, A2, A3, A4, A5

**Instruction:**

Already partially done in chat. Surface the remaining unknowns in a short report:

1. Confirm A2: `rg -n 'gWidth\|graphemeWidth\|charWidth\|cellWidth' ~/projects/reacterm/src` — list every consumer of the width API.
2. Confirm A5: sample 5 `flex: 1` callers in src/components and check whether any depend on overflow:visible behavior. Examples to check: ScrollView, ListView, Table, TreeTable, Panes.
3. Read `src/core/focus.ts` `hitTestInput` impl and confirm the iteration order assumption for A3.
4. Read `src/input/manager.ts:285-330` (emitKey) and confirm the stack-aware semantics in A1 are achievable as a wrapper, not requiring InputManager changes.

Output: short markdown summary in chat (no file). Each assumption marked validated / grounded / branched.

### Sub-task 2 — Improvement 1: useStackedKey hook + Overlay migration

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 1
**Assumption refs:** A1
**Worktree:** `.worktrees/stacked-keys`

**Instruction:**

1. Create the worktree: `git worktree add .worktrees/stacked-keys -b stacked-keys`. `cd` into it. `bun install`.

2. **Red phase.** Create `src/__tests__/stacked-key.test.ts`. Test cases:
   - 3 components mount in order A, B, C, all calling `useStackedKey("escape", handlerN)`. Fire Escape. Only C's handler fires. Fire Escape again, only B fires. Fire Escape again, only A fires.
   - When a handler sets `event.consumed = false` (opt-out), the next-most-recent handler in the stack fires.
   - Unmounting a stacked handler removes it from the stack (next Esc goes to whatever is now topmost).
   - `isActive: false` excludes the handler from the stack (same semantics as `useInput`).

3. **Green phase.** Implement `src/hooks/useStackedKey.ts`:
   ```ts
   export function useStackedKey(
     key: string,
     handler: (event: KeyEvent) => void,
     options?: { isActive?: boolean }
   ): void
   ```
   Strategy: a module-level `Map<string, StackEntry[]>` per key. Each `useEffect` push/pop on mount/unmount. A single shared `useInput` listener at module-load time dispatches by popping the topmost active entry. Or simpler: each `useStackedKey` call registers via `useInput({ priority: BASE + monotonicCounter })` so newer handlers shadow older — leveraging Tier-1's already-correct `isActive` semantics and InputManager's existing priority sort.

4. Migrate `src/components/core/Overlay.tsx`'s Esc-to-close `useInput(...)` to `useStackedKey("escape", onClose)`.

5. Update `src/components/index.ts` and `src/index.ts` to re-export `useStackedKey`.

6. Add a smoke test in the demo: spawn 3 overlays, simulate Esc 3 times, verify they close in reverse-mount order.

**Acceptance:**
- `cd .worktrees/stacked-keys && bun run typecheck` → exit 0
- `bun run test src/__tests__/stacked-key.test.ts` → 4/4 pass
- `bun run test` (full vitest) → all pass (including pre-existing 944, plus new tests)
- `grep -q 'useStackedKey' ~/projects/reacterm/.worktrees/stacked-keys/src/components/core/Overlay.tsx` → exit 0
- `grep -q 'export.*useStackedKey' ~/projects/reacterm/.worktrees/stacked-keys/src/index.ts` → exit 0

### Sub-task 3 — Improvement 2: EAA Unicode width config

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 1
**Assumption refs:** A2
**Worktree:** `.worktrees/eaa-width`

**Instruction:**

1. Create worktree, install.

2. **Red phase.** Create `src/__tests__/unicode-eaa.test.ts`:
   - With default config: `gWidth("⇲")` returns 1 (current behavior preserved).
   - After `setUnicodeOptions({ eastAsianAmbiguous: "wide" })`: `gWidth("⇲")` returns 2.
   - Sample EAA chars covered: `⇲` (U+21F2), `↘` (U+2198), `◢` (U+25E2), `▲` (U+25B2), `△` (U+25B3) — assert width-1 narrow / width-2 wide for each.
   - `setUnicodeOptions({ eastAsianAmbiguous: "narrow" })` resets back.

3. **Green phase.** Edit `src/core/unicode.ts`:
   - Define an EAA range list (precomputed from UAX-#11 — focus on the common BMP ranges: U+2000–U+27FF mathematical / arrows / geometric, U+E000–U+F8FF private use, U+F900–U+FAFF CJK compat, etc.).
   - Add `let eaaWidth: 1 | 2 = 1` module variable.
   - Add `export function setUnicodeOptions(opts: { eastAsianAmbiguous?: "narrow" | "wide" }): void`.
   - In the `gWidth` function (or wherever the table is consulted), check the EAA range list AFTER the BMP table, and return `eaaWidth` for matched chars.
   - Performance: keep the EAA range as a sorted array of `[start, end]` tuples, binary search. Or pre-compute a second `EAA_BITMAP` and OR in at runtime.

4. Document the new option in `docs/i18n.md` (or wherever Unicode behavior is discussed) — the README's "Correct grapheme rendering" line at line 162 may also want a sentence.

5. Re-export `setUnicodeOptions` from `src/index.ts`.

**Acceptance:**
- `cd .worktrees/eaa-width && bun run typecheck` → exit 0
- `bun run test src/__tests__/unicode-eaa.test.ts` → 5+ tests pass
- `bun run test` → all pass (full suite)
- `bun -e 'import("reacterm").then(m => console.log("setUnicodeOptions" in m ? "OK" : "MISSING"))'` → prints OK
- Default behavior: `bun -e 'const u = await import("reacterm/internal/unicode" /* or wherever */); console.log(u.gWidth("⇲"))'` → prints 1

### Sub-task 4 — Improvement 3: useMouseTarget priority

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 1
**Assumption refs:** A3
**Worktree:** `.worktrees/mouse-priority`

**Instruction:**

1. Create worktree, install.

2. **Red phase.** Create `src/__tests__/mouse-target-priority.test.ts`:
   - Two overlapping zones at the same coords; Zone A registered first with `priority: 10`, Zone B registered second with `priority: 0`. Click — A's handler fires (higher priority wins despite later registration of B).
   - Three nested zones with explicit priorities `bodyMouse=0`, `titleMouse=10`, `closeMouse=20`. Click on close — only closeMouse fires.
   - Backwards-compat: two zones with `priority: undefined` (omitted) — registration-order tiebreaker still applies (last-registered wins).

3. **Green phase.** Edit `src/hooks/useMouseTarget.ts`:
   - Add `priority?: number` to `UseMouseTargetOptions`.
   - Pass through to `focus.register({ ..., priority })`.

4. Edit `src/core/focus.ts`:
   - Add `priority?: number` to `FocusableEntry`.
   - Update `hitTestInput`: among entries with bounds containing the click, pick the one with the highest `priority` (default 0). Tiebreaker: registration order (most-recent first, preserving existing behavior).

5. Migrate `src/components/core/Overlay.tsx`:
   - Drop the registration-order comment.
   - Pass explicit priorities: `bodyMouse: 0`, `titleMouse: 10`, `closeMouse: 20`, `resizeMouse: 10`.

**Acceptance:**
- `cd .worktrees/mouse-priority && bun run typecheck` → exit 0
- `bun run test src/__tests__/mouse-target-priority.test.ts` → 3/3 pass
- `bun run test` → all pass (existing component tests must continue to pass — Overlay's drag/resize/close all work)
- `grep -q 'priority: 20' ~/projects/reacterm/.worktrees/mouse-priority/src/components/core/Overlay.tsx` → exit 0

### Sub-task 5 — Improvement 4: Layout-engine fixes

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 1
**Assumption refs:** A4, A5
**Worktree:** `.worktrees/layout-fixes`

**Instruction:**

Two distinct issues, fix together but treat each on its own merits.

**Issue (a) — `justifyContent: "flex-end"` silent no-op.**

1. **Red phase.** Add to `src/__tests__/layout-justify.test.ts`:
   - Render a `tui-box` with `flexDirection: "row"` `width: 20` `justifyContent: "flex-end"` containing a single `tui-text` of width 4. Assert the text's left coord is `16` (right-aligned).
   - Same with `justifyContent: "end"` — same expected result.
   - Both values produce identical output.

2. **Green phase.** Edit `src/layout/engine.ts`:
   - Either: extend the `Justify` type to `"start" | "center" | "end" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly"` AND map `"flex-end"` → `"end"` and `"flex-start"` → `"start"` in the switch; OR reject the alias at compile time and require callers to use the short form.
   - Recommend: accept `"flex-end"` / `"flex-start"` as aliases. Easier on muscle memory for CSS-trained authors.

3. Update Overlay.tsx's resize-row layout to drop the flex-grow-spacer workaround and use `justifyContent: "end"` (or `"flex-end"`) directly. Confirm the glyph still lands at the rightmost interior cell.

**Issue (b) — `flex: 1` children default to `overflow: "visible"`.**

This is a design decision. Two options:

- **Option B1 (conservative, recommended).** Don't change the default. Document in `docs/pitfalls.md` and add a one-line warning when a `flex: 1` child contains content larger than its allotted space — emit a dev-mode `[storm] Warning: ...` similar to the multi-handler warning.
- **Option B2 (breaking).** Default `flex: number > 0` children to `overflow: "hidden"`. Investigate breakage: scan for `flex: 1` callers whose content depends on rendering OUTSIDE its box. Likely no real callers depend on this (cell-grid TUIs don't have "render-beyond-the-box" semantics) but it's a behavior change.

Pick during execution after surveying `flex: 1` usage. Default to B1.

4. **Red phase (B1).** Add a test: render `<tui-box overflow="visible" flex=1 width=20 height=2>` containing 5 lines of text (overflow). Assert the warning fires.

5. **Green phase (B1).** Add the dev-mode warning emission in the renderer when an element's content vertical extent exceeds its layout-allocated height with `overflow !== "hidden"`. Document the gotcha in `docs/pitfalls.md`.

**Acceptance:**
- `cd .worktrees/layout-fixes && bun run typecheck` → exit 0
- `bun run test src/__tests__/layout-justify.test.ts` → all pass (3 tests for issue a)
- `bun run test src/__tests__/layout-overflow-warning.test.ts` (if option B1 chosen) → passes
- `bun run test` → all pass (full suite)
- Overlay.tsx no longer uses the flex-grow-spacer workaround; resize glyph at the rightmost interior cell verified by the existing handle-position test

### Sub-task 6 — Per-improvement verification

**Block:** review
**Skill:** verification-before-completion
**Depends on:** Sub-task 2, Sub-task 3, Sub-task 4, Sub-task 5
**Assumption refs:** A1, A2, A3, A4, A5

**Instruction:**

Run the full proving sequence in EACH worktree. Report each command's exit code per worktree.

For each of `.worktrees/{stacked-keys, eaa-width, mouse-priority, layout-fixes}`:

1. `cd <worktree> && bun run typecheck` → exit 0
2. `bun run test 2>&1 | tail -5` → "Tests N passed (N)" (no failures)
3. `bun -e 'import("reacterm").then(m => console.log("OK"))'` → prints "OK"
4. `timeout 3 bun bin/reacterm.ts demo; test $? -eq 124 -o $? -eq 143` → exit 0 or matches one of those (clean smoke)

Report passes per worktree. If any fail, route back to the relevant Sub-task 2-5 for fix.

**Acceptance:**
- All 4 worktrees pass all 4 checks.

### Sub-task 7 — Independent code review (per improvement)

**Block:** review
**Skill:** reviewer
**Depends on:** Sub-task 6
**Assumption refs:** (none)

**Instruction:**

Independent reviewer pass on each worktree's diff against `main`. Focus areas, per worktree:

- **stacked-keys**: useStackedKey API shape, stack management correctness (no leaks, unmount removes), Overlay migration is complete, no double-handlers from old useInput path remaining.
- **eaa-width**: EAA range table covers known troublemakers, default narrow preserved, no regression in the existing unicode tests, setUnicodeOptions API is clean (no global mutation traps).
- **mouse-priority**: priority sort is stable (registration-order tiebreaker preserved), default 0 keeps existing components working unchanged, focus dispatcher integration clean.
- **layout-fixes**: `"flex-end"` alias works AND `"end"` still works; if B2 chosen for overflow, list the breaking changes.

Report pass/fail per area per worktree. Confidence-filtered.

**Acceptance:**
- Review report produced in chat with explicit pass/fail per worktree per area.
- All HIGH-confidence issues resolved before merge.

### Sub-task 8 — Human checkpoint: confirm before merging into main

**Block:** human
**Skill:** ask
**Depends on:** Sub-task 7
**Assumption refs:** (none)

**Instruction:**

Surface the four improvements' summaries to the user:

- Brief diff stat per worktree (files changed, +/-).
- One-line behavior change summary per improvement.
- Any unresolved review concerns from Sub-task 7.

Ask: "Merge all four into main now? Or hold any specific worktree?"

Wait for user response. Default action on no response: hold (per planner safety contract).

### Sub-task 9 — Merge all to main + final verification

**Block:** execute
**Skill:** git
**Depends on:** Sub-task 8
**Assumption refs:** (none)

**Instruction:**

For each approved worktree (per user response in Sub-task 8):

1. `cd ~/projects/reacterm` (main).
2. `git merge <branch> --no-ff -m "Merge branch '<branch>' (overlay follow-up: <one-liner>)"`.
3. After all merges: `git push origin main`.
4. Remove each worktree: `git worktree remove .worktrees/<branch>`.
5. Delete the merged local branch: `git branch -d <branch>`.

Finally:

6. `bun run typecheck` and `bun run test` on `main` — confirm green.
7. Refresh API-surface snapshots if needed: `bun run test -- -u` then commit.

**Acceptance:**
- `git log --oneline -10` shows the merge commits.
- `git worktree list` shows only `~/projects/reacterm` (no leftover worktrees).
- `git branch` shows only `main`.
- `bun run test` on main → all pass.
- `git status` clean, `git status -b` shows main = origin/main.

### Sub-task 10 — Documentation pass

**Block:** execute
**Skill:** writing
**Depends on:** Sub-task 9
**Assumption refs:** (none)

**Instruction:**

Update affected user-facing docs:

1. `docs/components/core.md` Overlay section — note that the resize handle now uses `"end"` justify and lives in `<tui-box>` directly without the spacer workaround. Mention the new `useStackedKey` for Esc behavior briefly.
2. `docs/pitfalls.md` — add a section on "Layout overflow doesn't clip by default" with the dev-mode warning info.
3. `docs/i18n.md` (or wherever Unicode behavior is documented) — add a section on `setUnicodeOptions` and EAA terminals.
4. Hooks reference (if there is one) — add `useStackedKey` and the `priority` option for `useMouseTarget`.

Keep edits minimal — only touch the sections the four improvements affect.

**Acceptance:**
- `grep -q 'useStackedKey' ~/projects/reacterm/docs/**/*.md` → exit 0
- `grep -q 'setUnicodeOptions' ~/projects/reacterm/docs/**/*.md` → exit 0
- `grep -q 'mouseTarget.*priority\|useMouseTarget.*priority' ~/projects/reacterm/docs/**/*.md` → exit 0

## Out of scope

- Ergonomic improvements to `useInput` itself beyond the Tier-1 fix already shipped.
- Migrating Modal / ConfirmDialog / HelpPanel / CommandPalette to `useStackedKey` (Modal is single-instance; ConfirmDialog already uses a higher priority; only affecting Overlay is enough for now).
- Refactoring `Modal` to be expressed in terms of `Overlay` (still future work).
- Changing the `flex: 1` overflow default (B2) — recommended deferred unless survey reveals B1's warning is annoying.
- Adding a CLI flag to `reacterm demo` to test EAA mode quickly.
- Wiki notes about the Tier-1 useInput rewrite (worth a separate writeup).

## Refinement record

Pass 1 — Phase 6.5 checks:
- All paths exist or are explicitly Create: verified inline.
- Skill names valid: codebase-explainer, test-driven-development, verification-before-completion, reviewer, git, writing, ask — all in catalog.
- Acceptance criteria are runnable shell commands with explicit exit-code/grep checks.
- A4 (justify type union) was validated inline before plan write.
- A1, A2, A3 deferred to their owning sub-tasks (cheap to validate when those run).
- A5 (overflow default) deliberately marked branch-or-defer in Sub-task 5 because the right answer depends on a survey done at execution time.
- 10 sub-tasks; >5; refinement was warranted; passed.

Status bumped: `draft` → `approved`.
