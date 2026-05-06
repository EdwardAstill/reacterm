# Plan: Movable / resizable Overlay primitive + demo wiring

**Spec:** none — scope settled in chat (extend `Modal`, multiple coexist, per-instance `movable` / `resizable`, click-to-front z-order, demo wires 2-3 simultaneously)
**Created:** 2026-05-06T14:05Z
**Status:** approved
**Shape:** research-plan-execute-review (research already done inline; folded into Sub-task 1)
**Human checkpoints:** 0
**Refinement passes:** 1
**Worktree:** execute in a worktree off `~/projects/reacterm`. Suggested: `git worktree add .worktrees/movable-overlay -b movable-overlay`. Plan was authored from `main`.

## Context

The current `Modal` at `src/components/core/Modal.tsx` renders into a `tui-overlay` host element. The renderer's `paintOverlay` (`src/reconciler/renderer.ts:457`) supports only three named positions (`center` / `top` / `bottom`). To make an overlay user-movable, the renderer needs a `position: "free"` mode with explicit `top` / `left` props, and the `Overlay` component manages drag / resize state plus a z-order bump on click-to-front.

The existing mouse infrastructure (`useMouseTarget` for hit zones, `useMouse` for global tracking) is sufficient for drag and resize — no new input plumbing required.

This plan is bounded:
- Build the `Overlay` primitive (free position, drag handle on title bar, resize handle on bottom-right corner, z-order via context-managed counter).
- Render N overlays simultaneously without conflict.
- Wire 2-3 into the CLI demo as a new section.
- The overlay is a generic content host — this plan does **not** design feature panels.

`Modal` keeps its current contract; `Overlay` is a new component beside it. Eventually `Modal` could be re-expressed in terms of `Overlay`, but that refactor is **out of scope**.

## Assumptions

- `A1` — Extending `paintOverlay` with `position: "free"` + `top` / `left` props is non-breaking for existing callers. The default remains `"center"` for any code that omits `position`.
  - Type: architectural
  - Source: read of `src/reconciler/renderer.ts:466`
  - Check: `grep -rn 'tui-overlay' ~/projects/reacterm/src --include='*.tsx' --include='*.ts' | wc -l` → list of callers stays small (Modal is the main one); none rely on the absence of `top`/`left`
  - If false: add a separate host element (`tui-floating-overlay`) instead of extending `tui-overlay`; isolate the change
  - Owner: Sub-task 2

- `A2` — `tui-overlay` already declares `zIndex?: number` (verified in `src/storm-jsx.d.ts:257`); the renderer's overlay-painting pass either already sorts by zIndex or can be made to. No host-element schema change needed for z-order.
  - Type: repo-state
  - Source: storm-jsx.d.ts read
  - Check: `rg -n 'zIndex' ~/projects/reacterm/src/reconciler` → confirms whether sort exists; if not, add it
  - If false: add a stable sort by `(zIndex ?? 0)` ascending in `paintOverlay`'s caller before the iteration
  - Owner: Sub-task 2

- `A3` — Mouse hit-testing scoped to a single overlay's title-bar / corner zones works under multiple overlays (top-most overlay's hit zones win). The existing focus / hit-test infrastructure handles overlapping zones via paint order or zIndex.
  - Type: architectural
  - Source: spot-check of `src/input/mouse.ts` and `useMouseTarget` registration via `focus.register`
  - Check: TDD test in Sub-task 5 — render two overlapping overlays, click on the upper one's title bar, expect *its* drag handler to fire (not the lower one's)
  - If false: change z-order to also re-register hit zones in front-to-back order; or add explicit per-overlay zone priority
  - Owner: Sub-task 5

- `A4` — Drag and resize state can live in component state (no global store needed). Z-order needs a shared counter, scoped via a new `OverlayProvider` context (or piggy-back on `TuiContext` if a per-instance counter is appropriate).
  - Type: design
  - Source: user statement "I think you would just be extending modal behaviour"
  - Check: design fits in <300 LOC for `Overlay.tsx`; no global store added
  - If false: extract z-order into a small `OverlayManager` singleton; document in component
  - Owner: Sub-task 4

- `A5` — Vitest can drive component-level interactions for drag/resize via `renderForTest` + simulated mouse events from `reacterm/testing`. No real terminal / PTY needed for the test suite.
  - Type: external
  - Source: skill description for `test-driven-development` mentions Reacterm's TDD against `renderForTest`; `docs/testing.md` documents the harness
  - Check: locate an existing `useMouse`-driven component test in `src/__tests__/` to confirm idiom
  - If false: drop to PTY smoke (`runPtySmoke`) or fall back to driver-only assertions for the demo wiring (keep primitive's drag/resize tests as unit-level pure-state tests)
  - Owner: Sub-task 3, Sub-task 5

- `A6` — A new section in `src/cli/demo/App.tsx` follows the existing pattern (the file is large; sections are individual blocks with `<Heading>` + content). Adding a section does not require restructuring the demo's navigation.
  - Type: repo-state
  - Source: `App.tsx:45-47` shows components import including `Heading`; existing 22-section structure
  - Check: read 50 lines around the "Modal" section to confirm sectioning idiom
  - If false: discuss with user — do we restructure or graft on?
  - Owner: Sub-task 7

## Sub-tasks

### Sub-task 1 — Research (already done inline)

**Block:** research
**Skill:** codebase-explainer
**Depends on:** (none)
**Assumption refs:** A1, A2, A6 (validated inline in chat before plan write)

**Findings (recorded for downstream sub-tasks):**

- `Modal` at `src/components/core/Modal.tsx:179-276` — uses `React.createElement("tui-overlay", overlayProps, ...)` via a `renderModalShell` helper. Wraps body in `FocusGroup` with focus trap.
- Renderer painter: `paintOverlay` at `src/reconciler/renderer.ts:457-522`. Reads `position` prop, computes `overlayX` / `overlayY`, calls `computeLayout(element.layoutNode, overlayX, overlayY, overlayWidth, overlayHeight)` then paints border + children.
- Type declarations: `StormOverlayProps` at `src/storm-jsx.d.ts:241-259` and a *legacy* declaration at `src/jsx.d.ts:88-102`. Both must be updated for free positioning. (Legacy file may be redundant — confirm before adding the new fields.)
- Mouse hooks: `src/hooks/useMouse.ts` (35 LOC, global handler), `src/hooks/useMouseTarget.ts` (55 LOC, hit-zone via `focus.register` with bounds), `src/hooks/useLayoutBox.ts` (143 LOC, measured rect via `measureId`).
- Demo: `src/cli/demo/App.tsx` is large; line 47 imports `Heading, Calendar, DatePicker, EventCalendar, ...`. The demo follows a sectioned layout — new section grafts in.
- `tui-overlay` callers (existing): only `Modal` per `rg "tui-overlay" src/components` — extending props is safe.

### Sub-task 2 — Extend renderer + types for free positioning

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 1
**Assumption refs:** A1, A2

**Instruction:**

In `~/projects/reacterm`:

1. Update `src/storm-jsx.d.ts` `StormOverlayProps` (line 241-259):
   - Extend `position?:` union to include `"free"`.
   - Add `top?: number;` and `left?: number;` (cell coordinates from screen origin).
2. Update `src/jsx.d.ts` `tui-overlay` declaration (line 88-102) to match. (If the legacy file is unused, remove its `tui-overlay` block; verify by checking what imports `jsx.d.ts` vs `storm-jsx.d.ts`.)
3. In `src/reconciler/renderer.ts:457` (`paintOverlay`), add a `case "free":` arm:
   ```ts
   case "free": {
     const top = (props["top"] as number | undefined) ?? 0;
     const left = (props["left"] as number | undefined) ?? 0;
     overlayX = Math.max(0, Math.min(left, screenWidth - overlayWidth));
     overlayY = Math.max(0, Math.min(top, screenHeight - overlayHeight));
     break;
   }
   ```
   Clamping to the screen prevents overlays from being dragged out of bounds.
4. Verify zIndex sort. Find the call site that iterates overlays before `paintOverlay` (likely in `paintFrame` or `drawScreen`). If overlays are not sorted by `(props["zIndex"] as number | undefined) ?? 0` ascending, add a stable sort there. If already sorted, no change.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/src/storm-jsx.d.ts (lines 241-259)
- file: ~/projects/reacterm/src/jsx.d.ts (lines 88-102)
- file: ~/projects/reacterm/src/reconciler/renderer.ts (lines 440-522)

**Acceptance:**
- `cd ~/projects/reacterm && bun run typecheck` → exit 0
- `grep -q '"free"' ~/projects/reacterm/src/storm-jsx.d.ts` → exit 0
- `grep -q 'case "free"' ~/projects/reacterm/src/reconciler/renderer.ts` → exit 0
- `cd ~/projects/reacterm && bun test src/__tests__ 2>&1 | tail -3 | grep -q '0 fail'` → exit 0 (no regressions in existing tests)

### Sub-task 3 — TDD: free-position rendering + zIndex ordering

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 2
**Assumption refs:** A1, A2, A5

**Instruction:**

Create `src/__tests__/overlay-free-position.test.ts`. Use `renderForTest` from `reacterm/testing`. Assertions, all done with cell-buffer reads:

1. **Free position renders at given coordinates.** Render `<><tui-overlay visible position="free" top={5} left={10} width={20} height={5}><tui-text>X</tui-text></tui-overlay></>` against an 80×24 buffer. Assert that the cell at (10, 5) has the top-left border glyph and that "X" appears within the overlay region.
2. **zIndex orders multiple overlays.** Render two overlays at the same coords, one with `zIndex={1}` containing "BACK", one with `zIndex={2}` containing "FRONT". Assert that the visible content at the overlap is "FRONT".
3. **Free position clamps to screen.** Render `<tui-overlay visible position="free" top={1000} left={1000} width={20} height={5}>...`. Assert the painter clamps the overlay to within screen bounds (not painted off-buffer; no crash).

Run the test, see it fail (red), implement any missing pieces in Sub-task 2 if revealed, then green.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/src/__tests__/overlay-free-position.test.ts (Create)
- prior: Sub-task 2 changes

**Acceptance:**
- `cd ~/projects/reacterm && bun test src/__tests__/overlay-free-position.test.ts 2>&1 | tail -3 | grep -q '3 pass'` → exit 0
- `cd ~/projects/reacterm && bun test 2>&1 | tail -3 | grep -q '0 fail'` → exit 0

### Sub-task 4 — Build the `Overlay` component

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 2
**Assumption refs:** A3, A4

**Instruction:**

Create `src/components/core/Overlay.tsx`. Public API:

```ts
export interface OverlayProps extends StormContainerStyleProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;

  /** Initial / controlled position (cell coords from screen origin). */
  defaultPosition?: { top: number; left: number };
  position?: { top: number; left: number };  // controlled
  onPositionChange?: (pos: { top: number; left: number }) => void;

  /** Initial / controlled size (cells). */
  defaultSize?: { width: number; height: number };
  size?: { width: number; height: number };  // controlled
  onSizeChange?: (size: { width: number; height: number }) => void;

  /** When true, dragging the title bar moves the overlay. Default: false. */
  movable?: boolean;
  /** When true, dragging the bottom-right corner resizes. Default: false. */
  resizable?: boolean;
  /** Min/max size for resize. Defaults: min 10×3, max screen size. */
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };

  /** Stable z-order ID. If omitted, generated. Click-to-front bumps shared counter. */
  id?: string;
}
```

Implementation outline:

1. Internal state: `position` (uncontrolled fallback to `defaultPosition`), `size` (uncontrolled fallback to `defaultSize`), `zIndex` (managed by `OverlayManager` context).
2. **Drag handle** (title bar, only when `movable`):
   - Use `useMouseTarget` to register the title bar's hit zone. On `mousedown`, set local `dragging` state and capture the current pointer offset relative to the overlay's top-left.
   - Use `useMouse` (global) to track move while `dragging`. On move, compute new `{top, left}` = `pointer - offset`, call `onPositionChange` (controlled) or update local state (uncontrolled).
   - On `mouseup` (also via `useMouse`), clear `dragging`.
3. **Resize handle** (bottom-right corner, only when `resizable`):
   - Same pattern: `useMouseTarget` on the corner zone, `useMouse` for global drag.
   - Compute new size = `pointer - overlay.topLeft`. Clamp to `minSize` / `maxSize`. Call `onSizeChange` or update local state.
4. **Click-to-front**: any mouse-down anywhere on the overlay (delegate via a top-level `useMouseTarget` covering the full overlay) calls `OverlayManager.bringToFront(id)`. The manager increments its counter and assigns the new zIndex to that overlay.
5. **`OverlayProvider` context** (also in this file):
   ```ts
   export interface OverlayManagerValue {
     register(id: string): number;       // returns initial zIndex
     bringToFront(id: string): number;   // returns new zIndex
   }
   export const OverlayContext = createContext<OverlayManagerValue | null>(null);
   export function OverlayProvider({ children }: { children: React.ReactNode }): JSX.Element;
   ```
   `Overlay` consumes the context if present; otherwise it falls back to a module-local counter so a single overlay works without a provider.
6. **Render**: emit `tui-overlay` with `position="free"`, computed `top`/`left`/`width`/`height`/`zIndex`. Body structure mirrors `Modal`: title bar (with optional drag-cursor hint), divider, body, optional close hint. Bottom-right corner gets a single-cell resize handle (e.g. `↘` glyph) when `resizable`.
7. **Escape-to-close** + **Tab focus cycling** — reuse `useModalFocusTrap` from Modal.tsx (export it from `Modal.tsx` if not already), or copy the small helper into Overlay.

Keep the file under 350 LOC. Comments only where the WHY is non-obvious (e.g. why drag offset is captured at mousedown).

**Inputs (pre-staged):**
- file: ~/projects/reacterm/src/components/core/Overlay.tsx (Create)
- file: ~/projects/reacterm/src/components/core/Modal.tsx (reference patterns, possibly export `useModalFocusTrap`)

**Acceptance:**
- `test -f ~/projects/reacterm/src/components/core/Overlay.tsx` → exit 0
- `cd ~/projects/reacterm && bun run typecheck` → exit 0
- `wc -l ~/projects/reacterm/src/components/core/Overlay.tsx | awk '{print $1}'` → less than 400
- `grep -q 'OverlayProvider' ~/projects/reacterm/src/components/core/Overlay.tsx` → exit 0

### Sub-task 5 — TDD: Overlay component behaviors

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 4
**Assumption refs:** A3, A4, A5

**Instruction:**

Create `src/__tests__/overlay-component.test.ts`. Use `renderDriver` (full app flow with synthetic mouse events) for behavior tests. Cases:

1. **Movable: drag title bar updates position.** Render an `<Overlay movable defaultPosition={{top: 5, left: 10}} ...>`. Simulate mouse-down at the title-bar coords, mouse-move by (+3, +4), mouse-up. Read overlay coords from buffer; expect new top/left = (8, 14).
2. **Resizable: drag corner updates size.** Render `<Overlay resizable defaultSize={{width: 20, height: 5}} ...>`. Mouse-down at the bottom-right cell, drag by (+5, +2), mouse-up. Expect new width=25, height=7.
3. **Min/max size clamps.** Same setup with `minSize={{width: 10, height: 3}}`. Drag corner inward past the minimum; expect size stays at 10×3.
4. **Click-to-front: clicking lower overlay bumps its zIndex above the upper one.** Render two overlays inside an `<OverlayProvider>` with overlapping coords. Initially upper one has the higher zIndex. Click the lower one's title bar; assert that subsequent reads show the lower-now-upper one's content at the overlap.
5. **Multiple coexist: independent state.** Render two movable overlays. Drag one; assert the other's position is unchanged.
6. **Controlled position**: render with `position` (controlled) prop and an `onPositionChange` spy. Drag; assert spy called with new coords AND that the overlay does NOT move on screen until the parent re-renders with the new prop (i.e., the controlled invariant holds).

Use the existing testing harness from `reacterm/testing`. If a needed helper (e.g. coordinate-based mouse simulation) is missing, add a small wrapper in the test file rather than expanding the public testing API in this plan.

**Acceptance:**
- `cd ~/projects/reacterm && bun test src/__tests__/overlay-component.test.ts 2>&1 | tail -3 | grep -qE '6 pass'` → exit 0
- `cd ~/projects/reacterm && bun test 2>&1 | tail -3 | grep -q '0 fail'` → exit 0

### Sub-task 6 — Wire `Overlay` into public exports

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 4
**Assumption refs:** (none)

**Instruction:**

1. Add to `src/components/index.ts` (matching the export style around the existing `Modal` export):
   ```ts
   export { Overlay, OverlayProvider, type OverlayProps, type OverlayManagerValue } from "./core/Overlay.js";
   ```
2. Re-export from `src/index.ts` if `Modal` is re-exported there. (Confirm Modal's export path; mirror it.)
3. Confirm `bun -e 'import("reacterm").then(m => console.log(["Overlay", "OverlayProvider"].every(k => k in m)))'` prints `true`.

**Acceptance:**
- `grep -q 'export.*Overlay.*from.*core/Overlay' ~/projects/reacterm/src/components/index.ts` → exit 0
- `cd ~/projects/reacterm && bun -e 'import("reacterm").then(m => console.log(["Overlay","OverlayProvider"].every(k => k in m) ? "OK" : "MISSING"))' 2>&1 | tail -1` → prints `OK`
- `cd ~/projects/reacterm && bun run typecheck` → exit 0

### Sub-task 7 — Demo wiring

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 6
**Assumption refs:** A6

**Instruction:**

In `src/cli/demo/App.tsx`:

1. Import `Overlay`, `OverlayProvider` from `"../../index.js"` (matching the existing import block at line 45-48).
2. Add a new demo section "Movable Overlays". Pattern follows the existing sections (Heading + content). Wrap the section in `<OverlayProvider>` so multiple overlays share the z-counter.
3. Inside the section, render three overlays simultaneously:
   - **A**: `movable resizable defaultPosition={{top: 8, left: 10}} defaultSize={{width: 30, height: 8}}` containing `<Text>Drag my title bar; drag bottom-right to resize.</Text>`.
   - **B**: `movable defaultPosition={{top: 12, left: 45}} defaultSize={{width: 25, height: 6}}` containing some non-trivial reacterm content (a small `<List>` or `<Calendar>`).
   - **C**: `resizable defaultPosition={{top: 18, left: 20}} defaultSize={{width: 40, height: 5}}` containing a long `<Text>` to demonstrate resize-driven reflow.
4. Above the overlays, add a one-line `<Text dim>` with brief instructions: "Drag titles to move (A, B). Drag corners to resize (A, C). Click any overlay to bring it forward."

Do not add specific feature panels — overlays host arbitrary reacterm content per the user's scope.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/src/cli/demo/App.tsx (existing demo section structure)

**Acceptance:**
- `grep -q 'Overlay' ~/projects/reacterm/src/cli/demo/App.tsx` → exit 0 (3+ matches)
- `grep -q 'OverlayProvider' ~/projects/reacterm/src/cli/demo/App.tsx` → exit 0
- `cd ~/projects/reacterm && bun run typecheck` → exit 0
- `timeout 3 reacterm demo; test $? -eq 124 -o $? -eq 143` → demo starts cleanly (no SyntaxError, no runtime error)

### Sub-task 8 — Documentation

**Block:** execute
**Skill:** writing
**Depends on:** Sub-task 6, Sub-task 7
**Assumption refs:** (none)

**Instruction:**

Add a short docs entry. If `docs/components/core.md` exists and Modal is documented there, follow that file's pattern. Otherwise add a new section to whatever doc enumerates components (likely `docs/components.md` per README link at line 188). Include:

1. A 1-paragraph description of `Overlay` and its difference from `Modal` (movable / resizable / multiple-instance / z-order).
2. Minimal usage example (movable + resizable, single instance).
3. Multiple-overlay example wrapped in `<OverlayProvider>`.
4. Props table covering: `movable`, `resizable`, controlled `position` / `onPositionChange`, controlled `size` / `onSizeChange`, `minSize` / `maxSize`, `id`.
5. One-line note: "For modal dialogs (focus-trapped, single-instance, fixed-position), prefer `Modal`."

No emojis. Edit minimally — don't restructure surrounding sections.

**Acceptance:**
- `grep -lr "Overlay" ~/projects/reacterm/docs | head -1` → returns at least one path
- `grep -q 'movable' $(grep -l "Overlay" ~/projects/reacterm/docs/*.md ~/projects/reacterm/docs/components/*.md 2>/dev/null | head -1)` → exit 0

### Sub-task 9 — End-to-end verification

**Block:** review
**Skill:** verification-before-completion
**Depends on:** Sub-task 2, Sub-task 3, Sub-task 4, Sub-task 5, Sub-task 6, Sub-task 7, Sub-task 8
**Assumption refs:** A1, A2, A3, A4, A5, A6

**Instruction:**

Run the full proving sequence. Report each command's exit code; do not declare success until every check passes.

1. `cd ~/projects/reacterm && bun run typecheck` → exit 0
2. `cd ~/projects/reacterm && bun test 2>&1 | tail -3` → "0 fail"
3. `cd ~/projects/reacterm && bun -e 'import("reacterm").then(m => console.log(["Overlay","OverlayProvider"].every(k => k in m) ? "OK" : "MISSING"))'` → prints `OK`
4. `timeout 3 reacterm demo` → exit 124 or 143 (no SyntaxError, no runtime crash). Capture the first 100 lines of stderr; assert no `Error:` lines.
5. New tests covered: `bun test src/__tests__/overlay-free-position.test.ts src/__tests__/overlay-component.test.ts 2>&1 | tail -3` → "9 pass" (3 from Sub-task 3 + 6 from Sub-task 5).
6. Manual smoke (record outcome but do not fail the plan if interactive): drive the demo for ~10s under the user's terminal, drag overlay A's title, resize overlay A's corner, click between A/B/C and verify front-to-back behaviour. Report only.

If any of checks 1-5 fail, do NOT mark plan done. Re-plan with the failure as input.

**Acceptance:**
- All checks 1-5 pass with explicit exit codes captured in chat output.

### Sub-task 10 — Independent review

**Block:** review
**Skill:** reviewer
**Depends on:** Sub-task 9
**Assumption refs:** (none)

**Instruction:**

Independent review of the Overlay implementation. Focus areas:

1. `src/components/core/Overlay.tsx` — drag offset captured correctly, no off-by-one in resize math, cleanup of global mouse subscription on unmount, controlled/uncontrolled invariant respected, no emoji.
2. `src/reconciler/renderer.ts` (the `paintOverlay` change) — `case "free"` clamps don't break existing `center`/`top`/`bottom`. zIndex sort is stable.
3. `src/storm-jsx.d.ts` and `src/jsx.d.ts` — both kept in sync; any redundancy flagged for future consolidation but not fixed in this plan.
4. `src/cli/demo/App.tsx` — section grafts in cleanly, doesn't break existing sections.
5. Tests — assertions check observable behaviour (position cells in the buffer, not internal state), no test-only escape hatches.

Output: pass / fail per area with concrete line refs. Confidence-filtered (only real issues, no nits). Under 500 words.

**Acceptance:**
- Review report produced in chat with explicit pass / fail per area.
- All HIGH-confidence issues resolved before declaring plan done.

## Out of scope

- Refactoring `Modal` to be expressed in terms of `Overlay`. Possible future work; not now.
- Animated drag / resize (pure-state position updates only — no spring physics, no frame interpolation).
- Snap-to-edge / snap-to-grid.
- Keyboard-driven move / resize (arrow-keys to nudge). Reasonable follow-up; not in scope.
- Persisting overlay positions across runs.
- Designing specific feature panels for the demo (per the user's scope: overlay is a generic content host).
- Touch / gesture support (terminal doesn't expose those signals).
- Z-order management across overlays from *different* `OverlayProvider` trees. One provider per logical app surface.

## Refinement record

Pass 1 — Phase 6.5 checks:
- All file paths exist or are explicitly Create: `Modal.tsx`, `renderer.ts`, `storm-jsx.d.ts`, `jsx.d.ts`, `App.tsx`, hooks all verified by inline read in chat. New files: `Overlay.tsx`, two test files, doc entry — all marked Create.
- Skill names valid: `codebase-explainer`, `reacterm`, `test-driven-development`, `writing`, `verification-before-completion`, `reviewer` all in catalog.
- Acceptance criteria are runnable (shell commands with explicit expected exit codes / outputs).
- Assumptions A1, A2, A6 partially validated inline in chat (read of renderer.ts:457, storm-jsx.d.ts:241-259, App.tsx:45-47).
- Assumptions A3, A4, A5 deferred to their owning execute / TDD sub-tasks (cheap to validate when those run).
- No `<TBD>` / `<NEEDS_CLARIFICATION>` placeholders.
- Sub-task 4's instruction is concrete (props shape, file path, LOC budget).

Status bumped: `draft` → `approved`.
