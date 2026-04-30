# Storm/Reacterm Roadmap

A living, prioritized list of improvements grouped by theme. Sibling to
`improvements.md` (which captures consumer-side bugs), this file is for
**proactive** work: better DX, more features, cleaner internals, sharper
implementations of features that already exist.

Each item lists rough effort, motivation, and concrete file/line anchors
so the next person can pick it up cold.

---

## Theme A — Easier use (DX)

### A1. `SearchList` compound component  *(landed)*

Lives at `src/components/extras/SearchList.tsx`. Single-focus-owner
compound: typing filters, arrows navigate, Enter selects, Esc clears.
Backed by 3 robustness tests including stderr-capture for the
multi-handler warning regression.

`SearchInput` + `OptionList` as siblings is the canonical search-filter
pattern. Today it forces consumers to:

- wire `useSearchFilter` themselves
- pass `isFocused` to both children
- worry about `[storm] Multiple components are receiving keyboard input`

A single `<SearchList items predicate onSelect />` collapses all three.
One focus owner, one keyboard-domain split (printable → input,
arrows/enter → list), zero consumer wiring. Resolves
`improvements.md` §4 root cause for the showcase pattern.

Files: `src/components/extras/SearchList.tsx` (new),
`src/index.ts` (export).

### A2. Default mouse position tracking  *(landed)*

`useMousePosition({ trackMoves? })` lives at
`src/hooks/useMousePosition.ts`. Returns `{ position, positionRef,
isInside(rect) }`. Subscribes once to the InputManager and updates a
ref on every event; renders only fire on press/release/scroll unless
`trackMoves` is on. Used by the Mouse section of `reacterm-demo.tsx`.

### A3. Bin-installed scaffolds (`reacterm new`)

`bin/reacterm.mjs` exists but only runs the playground. Add:

```
reacterm new my-app                # full app starter
reacterm new --template ai-agent
reacterm new --template dashboard
```

Templates already live in `src/templates/`. Wire the bin script to copy
the right one + drop a `package.json` with `react`/`reacterm` pinned.

### A4. First-class `<KeyDomain>` boundary

Wrap a subtree to declare which keys it claims, so the input manager
warns only on real conflicts. Today `pitfalls.md#7` is the only escape
hatch for the multi-`isFocused` warning, and the warning fires for
benign disjoint-domain pairs (per `improvements.md` §4 historical note).

```tsx
<KeyDomain claims="printable"><SearchInput .../></KeyDomain>
<KeyDomain claims={["up","down","return"]}><OptionList .../></KeyDomain>
```

Files: `src/input/manager.ts:286` (emitKey), new
`src/components/core/KeyDomain.tsx`, `src/input/types.ts`.

### A5. Focus-owner contract on `Panes`

Per `improvements.md` §5 (pane isolation leaks), `Panes` should mask
input for non-active panes at the tree boundary instead of relying on
each child gating with `if (activePane === ...)`. Add:

```tsx
<Panes activePane="left" maskInactive>
  <Pane id="left">…</Pane>   {/* receives input */}
  <Pane id="right">…</Pane>  {/* useInput is no-op */}
</Panes>
```

Implemented by registering a `KeyDomain` (A4) at the pane boundary that
swallows everything when inactive.

---

## Theme B — More features

### B1. Virtual scroll for `Tree`

`Tree` currently renders every node. Trees over ~5k nodes drop frames on
expand/collapse. `VirtualList` already exists; share its windowing code
into a `useVirtualWindow` headless behavior and consume from both.

Files: `src/components/data/Tree.tsx`,
`src/hooks/headless/useVirtualListBehavior.ts` (extract).

### B2. Drag-to-resize between panes

Spec already drafted: `docs/specs/2026-04-26-draggable-scrollbars-design.md`
covers scrollbars; add a sibling spec for pane separators. Cursor on
separator → grab → drag changes the underlying flex ratios. Mouse infra
exists (`src/hooks/useMouseTarget.ts`); the missing piece is recording
hit zones for separator chars in `Panes`.

### B3. Markdown live preview

`Markdown.tsx` (742 lines) renders, but consumers wanting an "editor +
preview" split component still wire it themselves. Ship `MarkdownEditor`
that pairs `<Editor>` with `<Markdown>` and a debounced re-parse.

### B4. WCAG audit dev panel

`src/devtools/accessibility-audit.ts` already computes violations.
Surface them in the DevTools overlay (`src/devtools/devtools-overlay.ts`)
as a 5th panel beside heatmap/inspector/time-travel/perf. Click to jump
to the offending node.

### B5. Theme hot-reload from `.storm.css` watcher

`src/core/stylesheet-loader.ts` parses CSS-style theme files;
`useStyleSheet` hook applies them; nothing watches the file system. Add
opt-in `watch: true` that re-parses on `fs.watch` events. Already
mentioned in README ("live `.storm.css` hot-reload") but only partially
delivered.

---

## Theme C — Better organization

### C1. Split `src/reconciler/renderer.ts` (1466 lines)

It hosts: layout-result-to-cells painting, background fill, border draw,
shadow + glow effects, mouse hit-testing all in one file. Suggested
split:

- `renderer/paint-text.ts`
- `renderer/paint-background.ts`
- `renderer/paint-border.ts`
- `renderer/paint-effects.ts`  (Shadow, GlowText, GradientBorder)
- `renderer/hit-test.ts`
- `renderer/index.ts` keeps the public exports

Each module ≤ 400 lines, easier to reason about and test in isolation.

### C2. Split `src/layout/engine.ts` (1584 lines)

Same pattern. Engine has: tree walk, flex axis math, grid solver,
position absolute resolver, shrink-fit measurement. Extract:

- `layout/flex.ts`
- `layout/grid.ts`
- `layout/absolute.ts`
- `layout/measure.ts`
- `layout/engine.ts` — orchestrator only

### C3. Group big extras components

`src/components/extras/` has 49 files including 700+ line monsters
(`Form.tsx`, `Markdown.tsx`, `CommandPalette.tsx`, `DiffView.tsx`).
Rename `extras` → `composites` and create per-component sub-folders for
the big ones (`composites/form/index.tsx` + `field.tsx` + `validate.ts`).

### C4. Split `src/index.ts` re-exports (542 lines)

Already mostly grouped, but a single file imports everything. Split
into `index/public.ts` + `index/devtools.ts` + `index/testing.ts` and
re-export from the root. Tree-shaking is already exports-driven, this
is purely for editor navigation.

### C5. Glyph-width library extraction

Per `improvements.md` §1. `src/core/unicode.ts` (311 lines) has both
Unicode-theoretical width and ad-hoc terminal-practical overrides. Pull
into a separate package (`@reacterm/glyph-width` or similar) with:

- grapheme segmentation
- emoji/text presentation selectors
- ambiguous-glyph registry
- terminal/font profiles
- safe-icon helpers

Reacterm depends on it. Standalone consumers (other TUI frameworks,
log formatters, table libraries) get a clean surface.

---

## Theme D — Better implementations of existing features

### D1. Disjoint-domain coexistence in `InputManager`

`improvements.md` §4 documents the warning. The current
`emitKey` (`src/input/manager.ts:286`) breaks on `event.consumed`, so
the SearchInput + OptionList pair is fine in practice. But two MODAL
trap handlers still trip it with `countAtMax > 1`. Fix:

- declare a `domain` on prioritized handlers
- `countAtMax` only sums handlers whose domains overlap with the event
- modal traps that only capture tab/escape don't conflict with each
  other on `j` keypresses

Foundational for A4.

### D2. Tighten `DiffRenderer` cursor sequencing

`src/core/diff.ts` (691 lines) emits cursor moves between every changed
run. For dense scrolls, the cursor-positioning overhead can dominate.
Profile with `tests/optimization` fixtures, batch contiguous runs on
the same row, skip CSI when next run begins where prev ended.

### D3. Shrink WASM fallback path

`src/core/wasm-tokenizer.ts` + `wasm/` ship the optional 33KB Rust diff.
Today the JS fallback is a separate code path. Extract the run-encoding
output stage so JS and WASM share emit, halving the maintenance
burden.

### D4. `FrameScheduler` adaptive maxFps

`reconciler/frame-scheduler.ts` (133 lines) caps FPS at a static
default. When the render budget is consistently under 4ms, raise the
cap. When over 16ms, drop it and warn. EWMA over the last N frames.

### D5. Replace ad-hoc `useRef` mutation with `signals`

Multiple components (e.g. `OptionList`, `SearchInput`,
`OperationTree`) keep ref-backed state and call `requestRender()` by
hand. A small `createSignal()` primitive that auto-batches
`requestRender` per microtask would remove ~200 LOC of bookkeeping
across the codebase and prevent missing-render bugs.

---

## Theme E — Hygiene / quick wins

- **E1.** Delete stale branch `fix/bare-escape-lost-in-mouse-buffer`
  (fully merged, 8 days old per repo-map).
- **E2.** `playground/examples/dashboard.tsx` and
  `playground/public/index.html` have uncommitted churn — review and
  either commit or revert.
- **E3.** `improvements.md` and this `ROADMAP.md` should cross-link in
  `README.md` under a "Roadmap" subsection so contributors find them.
- **E4.** `docs/handover-bun-global-install.md` looks like an
  incident-handoff doc; either move under `docs/internal/` or fold into
  CONTRIBUTING.

---

## Picking the next item

Order by ratio of *user impact* to *effort*. Right now that ranks:

1. A1 (SearchList) — done
2. A2 (useMousePosition) — done
3. E3 (cross-link in README) — done
4. E1 (delete stale branch) — pending
5. A4 (KeyDomain) — unlocks A5 + D1
6. C1 (renderer split) — unlocks faster iteration on D2/D4
7. B4 (WCAG audit dev panel) — leverages existing
   `accessibility-audit.ts`

Anything bigger (B-theme features, library extraction in C5) needs a
spec under `docs/specs/` first.

## Interactive demo

`examples/reacterm-demo.tsx` is the running showcase that exercises
nearly every shipped capability — layout, forms, search, data, charts,
AI widgets, mouse tracking, theme switching — in one app. Update it
when you add a new flagship feature so the demo stays the canonical
proof-of-life for the framework.

Run: `npx tsx examples/reacterm-demo.tsx`

**Source of truth:** [`docs/features.md`](docs/features.md) — the
exhaustive feature catalog, every public export grouped into 27
categories with name / kind / source / one-liner / demo location.

**Active expansion plan:** [`docs/plans/2026-04-29-explorer-all-features-plan.md`](docs/plans/2026-04-29-explorer-all-features-plan.md)
— a 9-sub-task plan to lift demo coverage to ≥95% of cataloged features
across 21 interactive sections grouped under 6 super-headings.

**Data-section refactor plan:** [`docs/plans/2026-04-29-data-section-refactor-plan.md`](docs/plans/2026-04-29-data-section-refactor-plan.md)
— addresses screenshot-reported issues in §5 Data: phantom keyboard
cursor in scroll-edit table, missing click-to-sort on DataGrid headers,
overlapping hover/keyboard styles, undiscoverable click-resets-baseline
semantics. Five small sub-tasks; ~1–2 hours.
