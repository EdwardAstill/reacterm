# Plan: Storm Explorer — all-features showcase

**Spec:** —  *(no separate spec; requirements are inline in this plan)*
**Catalog:** docs/features.md (skeleton scaffolded alongside this plan)
**Created:** 2026-04-29T09:50Z
**Status:** in-progress
**Shape:** custom — `enumerate-design-batch-execute-review`
**Human checkpoints:** 2

---

## Goal

Turn `examples/reacterm-demo.tsx` into the canonical, exhaustive
interactive showcase for the framework. **Every** public export from
`src/index.ts` either has an interactive home in the explorer, or is
explicitly marked as "edge-case — see X" in `docs/features.md`. The
demo stays one running app, navigable in <10 seconds per section, with
real interactability not just visuals.

## Non-goals

- Not redesigning the layout / theming engine.
- Not changing public APIs (additive only — exporters of features the
  demo doesn't currently reach are *exposed*, not redefined).
- Not building a separate web demo (web renderer stays out-of-scope —
  catalog references the existing playground).
- Not exhaustively testing every internal helper. Public exports only.

## Acceptance

1. **Catalog completeness.** `docs/features.md` lists every name
   exported from `src/index.ts`. The catalog totals match the README's
   advertised counts (97 components / 83 hooks / 12 themes etc.) within
   ±2 (allowing for sub-exports / type aliases not counted as
   "features").
2. **Demo coverage ≥ 95%.** ≥ 95% of cataloged names appear in
   `examples/reacterm-demo.tsx`. Names not in the demo carry an
   explicit `Demo: edge-case — see X` row in `features.md` with
   justification (e.g. `WebRenderer` belongs in the browser
   playground).
3. **Interactivity.** Each section has at least one keyboard
   interaction that visibly changes state — no section is purely
   ornamental.
4. **No regressions.** `bun run build` and `bun run test` are clean.
   New tests added per Sub-task 4 are green.
5. **Single binary.** Demo remains one `npx tsx examples/reacterm-demo.tsx`
   command. Sub-modals, sub-tabs, and toggle states are fine; spawning
   subprocesses is not.

---

## Section design (for execute sub-tasks to consume)

Existing 9 sections stay. Five new sections + four expanded sections:

| #   | Section          | Status   | Features pulled in (representative — not exhaustive)            |
|-----|------------------|----------|-----------------------------------------------------------------|
|  1  | Welcome          | expand   | Spinner, Badge, ShimmerText, ContextWindow, CostTracker         |
|  2  | Layout           | expand   | Panes, Pane, VirtualList, Static, Newline, Spacer, Overlay      |
|  3  | Forms            | expand   | Form (schema-driven), MaskedInput, ChatInput, Select, SelectionList |
|  4  | Search           | keep     | SearchList, SearchInput, useSearchFilter, useTypeahead          |
|  5  | Data             | expand   | DirectoryTree, FilePicker, RichLog, Pretty, DefinitionList, Or/UnorderedList |
|  6  | Charts           | expand   | LineChart, AreaChart, ScatterPlot, Heatmap, Histogram           |
|  7  | AI               | expand   | All 15 AI widgets — chat-style screen with side panel of meta widgets |
|  8  | Mouse            | keep     | useMousePosition, useMouse, useDragReorder                      |
|  9  | Themes           | expand   | extendTheme/createTheme demo, validateContrast live-meter       |
| 10  | Editor & docs    | **new**  | Editor, Markdown, MarkdownViewer, DiffView, InlineDiff, SyntaxHighlight |
| 11  | Effects          | **new**  | Transition, AnimatePresence, RevealTransition, Image, Shadow, GlowText, GradientBorder, Gradient, Digits, Diagram, Canvas |
| 12  | Animation lab    | **new**  | useAnimation, useTransition, useTick reactive vs imperative, useGhostText, useTextCycler, useEasedInterval, usePhaseTimer, BrailleCanvas, createAnimation/tickAnimation |
| 13  | Hooks playground | **new**  | useUndoRedo, useHistory, useHotkey/useKeyChord, useConfirmAction, useNotification, useWizard, usePersistentState, useAsyncLoader, useStreamConsumer, useBatchAction |
| 14  | Behaviors        | **new**  | All 15 headless behavior hooks driving custom-rendered widgets  |
| 15  | i18n             | **new**  | LocaleProvider, formatNumber, t, plural across EN/AR/FR/RU/JA   |
| 16  | DevTools live    | **new**  | enableDevTools toggle (1/2/3/4 panels), PerformanceHUD, fpsCounterMiddleware, scanlineMiddleware, debugBorderMiddleware |
| 17  | Plugins          | **new**  | vimMode, compactMode, autoScroll, screenshot, statusBar — toggle each on/off live |
| 18  | Personality      | **new**  | Cycle defaultPreset / minimalPreset / hackerPreset / playfulPreset — affects icons + spinner shapes |
| 19  | Accessibility    | **new**  | useAnnounce live ARIA log, contrastRatio meter, validateContrast against current theme, KeyboardHelp |
| 20  | Capabilities     | **new**  | detectTerminal, terminalInfo, detectImageCaps, color depth picker — read-only "what does THIS terminal support" |
| 21  | About            | **new**  | Renders the catalog: counts per category, links to ROADMAP & improvements |

That's 21 sections. To keep navigation fast: sidebar groups them into
6 super-sections (Tour | Build | Visualize | Hooks & Behaviors |
Internals | Meta) so users can jump quickly.

### Edge cases (justified `Demo: edge-case` entries)

- **WebRenderer** — runs in browser, lives in `playground/`. Catalog row links there.
- **StormSSHServer** — needs ssh2 + open port. Catalog row links to `examples/ssh-demo.tsx`.
- **Testing harness** (`renderForTest`, snapshots) — used BY the explorer's tests, not exposed as a section. Catalog row says "see `src/__tests__/storm-explorer.test.ts`".
- **enableCrashLog** — destructive (writes files). Catalog row says "see code comment".
- **Internal types** (`Cell`, `Style`, `Rect`, `LayoutNode`, etc.) — type-level. Catalog row says "type-only — see `src/core/types.ts`".

---

## Sub-tasks

### Sub-task 1 — Enumerate every export, fill `docs/features.md`

**Block:** research
**Skill:** codebase-explainer
**Depends on:** none

**Instruction:**

Read `src/index.ts` end-to-end and produce the complete catalog inside
`docs/features.md`, replacing the skeleton placeholders with real
rows. For each named export:

- Determine its kind (Component / Hook / Type / Function / Class /
  Constant / Plugin / Middleware) by reading its source file.
- Write a one-line purpose, ≤ 80 chars, in plain prose. Avoid restating
  the type signature.
- Record the source path relative to `src/`.
- Leave `Demo:` set to `—` for now (Sub-task 3 fills that column).

For features that ship as type-only or as constants without a runnable
demo (e.g. `MAX_LAYOUT_DEPTH`), say so in the one-liner.

Update the rollup totals at the bottom of the file once the table is
filled. Confirm the totals roughly match the README's 97/83/12 claims
and call out any mismatch with one line of commentary in the rollup.

**Inputs (pre-staged):**
- file: `src/index.ts`
- file: `docs/features.md` (skeleton)

**Acceptance:**
- Every named export in `src/index.ts` appears in exactly one row.
- All rows have non-empty Name, Kind, Source, One-liner.
- Rollup totals filled in.

---

### Sub-task 2 — Gap analysis: features.md ↔ current explorer

**Block:** research
**Skill:** codebase-explainer
**Depends on:** Sub-task 1

**Instruction:**

Diff the catalog against the current `examples/reacterm-demo.tsx`. Walk
the file and for each named export from `reacterm` (or `../src/index.js`)
that the demo imports, mark its row `Demo: <existing section>`. Then
build a coverage rollup at the foot of `features.md`:

```
covered:                  N (X%)
not yet covered:          M
edge-case (justified):    K
total:                    N + M + K
```

List the **first 10 highest-impact uncovered features** in a
"top gaps" subsection, ordered by likely user value. This becomes the
priority queue for Sub-tasks 5a-5e.

**Inputs (pre-staged):**
- output of Sub-task 1: `docs/features.md`
- file: `examples/reacterm-demo.tsx`

**Acceptance:**
- Every export has a `Demo:` value (covered, edge-case, or `—`).
- Coverage rollup totals add up.
- "Top 10 gaps" listed with one-line justification each.

---

### Sub-task 3 — Section design doc

**Block:** plan
**Skill:** lightweight-spec
**Depends on:** Sub-task 2

**Instruction:**

Produce `docs/specs/2026-04-29-explorer-sections-design.md` capturing
the 21-section layout (above) at file level: for each section, list
the features it owns, the keyboard interactions, and the rough
ASCII-shape of the rendered view. Any ambiguity from Sub-task 2's gap
analysis (e.g. "where does `useReducedMotion` go — Animation lab or
Accessibility?") gets resolved here.

This spec is the contract Sub-tasks 5a-5g compile against. Once
written, every uncovered feature has a target section name.

**Inputs (pre-staged):**
- output of Sub-task 2 (the gap analysis)
- file: `examples/reacterm-demo.tsx`
- file: `ROADMAP.md` (for prioritization context)

**Acceptance:**
- All 21 sections specified.
- Each uncovered feature from Sub-task 2 mapped to exactly one section
  (or moved to the edge-case list with justification).
- Keyboard contract per section documented.

---

### Sub-task 4 — Human checkpoint: review the design

**Block:** human
**Skill:** ask
**Depends on:** Sub-task 3

**Instruction:**

Surface the design doc and the gap-analysis to the user. Ask:

1. Is the 21-section breakdown right, or do they want fewer/more?
2. Are the edge-case justifications acceptable?
3. Any features they specifically want highlighted that the gap
   analysis didn't flag?
4. Approval to proceed with Sub-tasks 5a-5g (estimated 4-8 hours of
   execute work).

If `WDN_HUMAN_AVAILABLE=false` the runtime pauses here. Surface the
plan's status as `paused` until the user resumes.

**Acceptance:**
- User responds with approve / change-X / reject.
- On change-X, planner re-invoked to amend Sub-task 3.

---

### Sub-task 5a — Tests-first scaffolding

**Block:** execute
**Skill:** test-driven-development
**Depends on:** Sub-task 4 (approved)

**Instruction:**

Create `src/__tests__/storm-explorer.test.ts`. Use `renderForTest` to
mount the explorer and assert per-section invariants. Tests should be
written BEFORE the corresponding section is implemented in 5b–5g,
following TDD. Initial test set covers:

- App boots and renders the Welcome section by default.
- Tab cycles through all sections in `SECTIONS` (parametrized over the
  full 21-entry list).
- `?` opens the help modal; any key closes it.
- `t` cycles theme; the rendered theme name in the header advances.
- For each section, hitting its number / shortcut renders a unique
  identifying string (e.g. "STREAM" for AI, "ANNOUNCE" for
  Accessibility) so that a regression dropping a section fails loudly.

Use parametrized `describe.each` to keep the file lean. Tests start
RED — failing assertions for sections that don't yet exist drive 5b-5g.

**Acceptance:**
- Test file committed with at least one failing assertion per
  not-yet-built section.
- Existing passing tests stay green.

---

### Sub-task 5b — Build & Visualize sections

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 5a

**Instruction:**

Implement / expand sections in `examples/reacterm-demo.tsx`:

- §2 Layout (expand): Panes nested 2-row × 2-col, `Static`,
  `VirtualList` over 10k items.
- §3 Forms (expand): swap manual mini-form for a `Form fields=[…]`
  driven instance + a sibling `MaskedInput` (phone number) and
  `ChatInput`.
- §5 Data (expand): add `DirectoryTree`, `FilePicker` (modal trigger),
  `RichLog` with live appends, `Pretty` showing JSON, `DefinitionList`,
  `OrderedList` and `UnorderedList`.
- §6 Charts (expand): add `LineChart`, `AreaChart`, `ScatterPlot`,
  `Heatmap`, `Histogram`.
- §10 Editor & docs (new): `Editor` left, `Markdown` preview right,
  bottom row toggles to `DiffView` / `InlineDiff` / `SyntaxHighlight`.
- §11 Effects (new): grid of demos — `Image` (kitty/sixel sample),
  `Shadow`, `GlowText`, `GradientBorder`, `Gradient`, `Digits` clock,
  `Diagram`, `Canvas` editable nodes, `Transition` toggle.

Constraint: every section that adds an interactive widget MUST handle
focus correctly per the SearchList lesson — single focus owner, route
keys through one `useInput` or use the framework's built-in
`isFocused` toggling.

Update the explorer's section list, sidebar, and global tab nav to
include the new entries. Group sections in the sidebar under super-
sections (Tour / Build / Visualize / etc.) for navigation speed.

**Acceptance:**
- The 5a test for each section above transitions RED → GREEN.
- Build is clean; no new tsc errors; no new vitest failures elsewhere.
- Manual smoke: the demo boots and Tab walks through every new
  section without crashing.

---

### Sub-task 5c — Hooks & Behaviors sections

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 5b

**Instruction:**

- §12 Animation lab (new): demonstrate every animation/timing hook
  with a side-by-side card per hook (single mounted view, each card
  contains a tiny live demo).
- §13 Hooks playground (new): an undo/redo text editor (`useUndoRedo`),
  a hotkey cheatsheet (`useHotkey`/`useKeyChord`), an "are you sure"
  delete row (`useConfirmAction`), a wizard (`useWizard`),
  notifications spamming the toast queue (`useNotification`),
  persisted-counter that survives reload (`usePersistentState`).
- §14 Behaviors (new): three custom-rendered widgets driven by
  headless hooks — e.g. a "horizontal accordion" using
  `useAccordionBehavior` with non-default visuals; a chord-style
  command list using `useMenuBehavior` rendered as a tag cloud; a
  vertical date picker using `useCalendarBehavior` rendered as a
  scrolling river.

Each card has a one-line caption naming the hook so the user knows
what they're seeing.

**Acceptance:**
- All §12-§14 5a tests transition RED → GREEN.
- Each hook from §15-§17 of `features.md` either appears in §12-§14
  or has its row updated to `Demo: edge-case — backs <component>` if
  it's only consumed via a high-level component.

---

### Sub-task 5d — Internals & Meta sections

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 5c

**Instruction:**

- §15 i18n (new): `LocaleProvider` swap row of EN/FR/AR/RU/JA buttons;
  the section body re-formats a number, a relative date, and a
  pluralized item-count under the selected locale.
- §16 DevTools live (new): toggle each panel via 1/2/3/4 (matching the
  enableDevTools convention). Render `PerformanceHUD` always-on at
  the corner; sliders to flip `fpsCounterMiddleware`,
  `scanlineMiddleware`, `debugBorderMiddleware`.
- §17 Plugins (new): live toggle each of `vimModePlugin`,
  `compactModePlugin`, `autoScrollPlugin`, `screenshotPlugin`,
  `statusBarPlugin`. Side panel narrates what each one is doing.
- §18 Personality (new): radio-group cycles
  `defaultPreset` / `minimalPreset` / `hackerPreset` / `playfulPreset`.
  The whole demo's icons and spinner shapes restyle live (so the user
  sees personality affect EVERY section, not just this one).
- §19 Accessibility (new): `useAnnounce` ARIA log on the right;
  `contrastRatio` live-meter sampling current theme fg/bg;
  `validateContrast` red-light/green-light per WCAG-AA.
- §20 Capabilities (new): a read-only panel showing the output of
  `detectTerminal()`, `terminalInfo`, `detectImageCaps()`,
  `bestColorDepth()`, `bestKeyboardProtocol()`. Useful as a debugging
  aid for users running the demo on weird terminals.
- §21 About (new): renders the catalog inline — totals per category +
  links to ROADMAP, improvements.md, and the `features.md` source.

**Acceptance:**
- All §15-§21 5a tests transition RED → GREEN.
- DevTools panels actually toggle; visible feedback when on/off.
- Personality preset change visible across at least 3 other sections.

---

### Sub-task 5e — Globals + navigation polish

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 5d

**Instruction:**

- Sidebar: group 21 sections under 6 super-headings. Up/Down moves
  through entries; Left collapses a super-heading; Right expands.
- Help modal (`?`): regenerate from new bindings; columns laid out so
  ALL of them fit on a 24-row terminal without scroll.
- Status bar (bottom): three slots — current section, current theme +
  personality, `tokIn / FPS` driven by `PerformanceHUD`.
- New keybindings: `g` jumps back to Welcome; `G` jumps to About;
  `[` / `]` jump to prev/next super-section; `:` opens
  `CommandPalette` to fuzzy-jump to any section by name.

**Acceptance:**
- Help modal's binding count matches the implemented binding count.
- CommandPalette `:` opens, filters by section name, and Enter jumps.
- No regressions: existing 5a tests still pass.

---

### Sub-task 5f — Wire up Toast + ARIA + announce paths

**Block:** execute
**Skill:** typescript
**Depends on:** Sub-task 5e

**Instruction:**

Replace the inline toast list in the shell with `ToastContainer` /
`Toast.Provider` so the explorer demonstrates the recommended pattern
not the ad-hoc one. Wire `useNotification` to push toasts. Pipe every
action ("submitted form", "selected command", "cycled theme",
"approved tool") through `useAnnounce` so screen readers see the same
stream.

**Acceptance:**
- ToastContainer in use; existing toast UX unchanged from the user's
  perspective.
- `useAnnounce` log in the §19 Accessibility section receives every
  action regardless of which section the user is in.

---

### Sub-task 6 — Update `features.md` Demo column

**Block:** execute
**Skill:** documentation
**Depends on:** Sub-task 5f

**Instruction:**

Re-walk `examples/reacterm-demo.tsx` and update the `Demo:` column
of every row in `features.md` to its new home. Anything still `—`
must transition to `edge-case — see X` with a one-line justification
or escalate as a re-plan event (an untouched feature is the planner's
problem, not the catalog's).

Update the rollup at the bottom of `features.md`: covered count,
edge-case count, percentage. The acceptance threshold is 95%.

**Acceptance:**
- No row in `features.md` has `Demo: —`.
- Rollup percentage ≥ 95%.

---

### Sub-task 7 — Verification before completion

**Block:** review
**Skill:** verification-before-completion
**Depends on:** Sub-task 6

**Instruction:**

Run the full verification gate:

1. `bun run build` — clean.
2. `bun run test` — all 716 + new tests pass.
3. `bunx tsx examples/reacterm-demo.tsx < /dev/null` — boots, no
   stderr "Multiple components" warning, exits clean on `q`.
4. Coverage assert: parse `features.md`, count covered ≥ 95%.
5. Manual smoke: walk through every section via Tab; no section
   throws or renders blank.

Output a one-page report at `docs/plans/2026-04-29-explorer-all-features-verify.md`
summarizing pass/fail per gate.

**Acceptance:**
- All five gates pass.
- Report committed.

---

### Sub-task 8 — Final code review

**Block:** review
**Skill:** code-review
**Depends on:** Sub-task 7

**Instruction:**

Review the reacterm-demo.tsx diff for: dead code, duplicated
section scaffolds, `isFocused` conflicts (per `improvements.md` §4),
and the framework's "no useEffect cleanup" rule (use `useCleanup`).
Reject anything that adds churn without a feature payoff.

**Acceptance:**
- Reviewer signs off OR returns specific change requests.
- All change requests addressed in a follow-up commit.

---

### Sub-task 9 — Human sign-off

**Block:** human
**Skill:** ask
**Depends on:** Sub-task 8

**Instruction:**

Surface to user: PR-ready summary of what changed (file count, line
delta, sections added, coverage %), screenshot/transcript of the
demo Tab-walk if available, and ask whether to commit / squash /
amend onto a feature branch.

**Acceptance:**
- User responds with approve / change-X / reject.

---

## Re-plan triggers

This plan amends in place if:

- Sub-task 1 reveals a category we missed (add §28+ rows; expand
  Sub-task 3 design accordingly).
- Sub-task 2 finds a feature with no plausible interactive home
  (escalate to user via Sub-task 4 — "kill it from the demo? add
  edge-case row?").
- Sub-task 5b-5d typescript skill returns "section X needs N more
  components than expected" — split that 5x sub-task in two.
- Sub-task 7 verification fails on coverage % — re-plan inserts a
  Sub-task 5g "fill remaining gaps" before re-running 7.

Hard cap: 5 re-plan events. After that, escalate via `ask` — the
design probably needs a spec revision, not more iteration.

## Effort & scope

- Sub-tasks 1-3 (research + design): ~2-3 hours.
- Sub-task 5a (tests-first): ~1 hour.
- Sub-tasks 5b-5f (implementation): ~4-8 hours, parallelizable across
  separate worktrees if a subagent fan-out makes sense.
- Sub-tasks 6-9 (close-out): ~1-2 hours.

Total: 8-14 hours of focused work. Plan deliberately splits execute
into 5b/5c/5d so each is a checkpointable unit ≤ 2 hours.

## Inputs already staged

- `docs/features.md` — skeleton catalog, ready for Sub-task 1 to fill.
- `ROADMAP.md` — already references this plan in its "Interactive
  demo" section.
- `improvements.md` — defines the focus-conflict rules Sub-task 8
  reviews against.
- `examples/reacterm-demo.tsx` — the substrate.
