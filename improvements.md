# Reacterm Improvements

This file records follow-up improvements discovered while integrating and
debugging `reacterm` inside `dash` and, more recently, inside
`Pyseas-Dock/tui2`.

## Consumer source — where the reproducing code lives

Sections 4 and 5 below reference a consumer TUI that is NOT in this repo.
Its source is local on the same machine, one repo over:

- Consumer repo root: `/home/eastill/projects/Pyseas-Dock/`
- Consumer TUI app: `/home/eastill/projects/Pyseas-Dock/tui2/app.tsx`
- Consumer backend glue: `/home/eastill/projects/Pyseas-Dock/tui2/api/`
  (`client.ts`, `hooks.ts`, `adapters.ts`, `mutations.ts`)
- Launch script: `/home/eastill/projects/Pyseas-Dock/tui2/bin/dock-tui2`

The TUI depends on `reacterm` via `"reacterm": "github:EdwardAstill/reacterm"`
in its `package.json`, so its behavior reflects published GitHub HEAD, not
uncommitted work in this repo. When reproducing, install with
`bun install --force` inside `tui2/` after pushing reacterm changes.

Running the consumer to reproduce issues below:
```
cd /home/eastill/projects/Pyseas-Dock/backend && uv run python -m uvicorn app.main:app --port 8000 &
mkdir -p /tmp/dock-repro && cd /tmp/dock-repro && dock-tui2 init
```

When an improvement below cites a file path starting with `Pyseas-Dock/`,
the absolute path is `/home/eastill/projects/Pyseas-Dock/<rest>` and is
directly readable from a shell inside this repo.

## 1. Extract terminal glyph width logic into a dedicated library

### Problem

Terminal Unicode width is not reliably determined by Unicode data alone.

Examples seen in real usage:

- Some symbols render consistently as narrow text glyphs.
- Some symbols render consistently as wide emoji glyphs.
- Some symbols are font/terminal dependent and behave differently on the same
  machine depending on the glyph:
  - `☔` / `☔︎` / `☔️`
  - `☀` / `☀︎` / `☀️`
  - `☁` / `☁︎` / `☁️`
  - `⛅` / `⛅︎` / `⛅️`

This creates layout bugs in tight terminal UIs:

- borders appear to shift
- header alignment breaks
- cards look like they have incorrect width calculations
- the bug can be mistaken for a scrollbar or clipping issue

### Why `reacterm` should not keep this as ad hoc logic forever

`reacterm` currently needs to answer several related but distinct questions:

- What is the semantic Unicode width of a grapheme cluster?
- What width do common terminals actually render?
- How should ambiguous-width symbols be treated in layout-critical components?
- When should the framework prefer a safe fallback icon over a decorative glyph?

That is a real domain, not just a utility function.

### Suggested improvement

Create a separate library focused on terminal glyph measurement and ambiguity
handling. `reacterm` can depend on it rather than growing one-off rules in
`core/unicode`.

Possible scope for the library:

- grapheme segmentation
- Unicode width tables
- emoji-presentation selector handling
- text-presentation selector handling
- ambiguous-width symbol registry
- terminal/font profile overrides
- safe-icon normalization helpers
- "layout-safe" mode for TUI components
- fixtures and regression tests for known problematic glyphs

Potential API ideas:

- `stringWidth(text, options)`
- `graphemeWidth(segment, options)`
- `isAmbiguousTerminalGlyph(text)`
- `normalizeForTerminalIcon(text, { safe: true })`
- `pickSafeIcon({ preferred, fallback, tightLayout })`

The important design point is to separate:

1. Unicode-theoretical width
2. terminal-practical width
3. application-safe fallback choice

## 2. Keep scrollbar/layout math under one contract

The scrollbar issue uncovered during this debugging session came from layout
and renderer using slightly different rules for reserved width.

Improvement direction:

- keep viewport reserve logic in one shared place
- ensure layout, clipping, hit-testing, and host viewport metadata all use the
  same effective width
- test overflow and non-overflow cases separately

This is less fundamental than the glyph-width problem, but it should stay under
the same "layout correctness" bucket.

## 3. Add a documented safe-icon policy for tight layouts

For narrow headers, tables, and bordered cards, `reacterm` should document a
recommended policy:

- use ASCII or text-presentation-safe symbols in tight layouts
- reserve decorative emoji for roomy layouts
- provide helpers so component authors do not rediscover terminal glyph bugs by
  accident

That policy can live in docs even before the glyph library exists.

## 4. Search-filter modal pattern trips the "multiple isFocused" warning

### What happened

While integrating `reacterm` into `Pyseas-Dock/tui2` (app.tsx, an unmodified
adaptation of `examples/ui-terminal/showcase/dock.tsx`), opening the
Add-Calculation modal emits this dev warning on stderr:

```
[storm] Warning: Multiple components are receiving keyboard input simultaneously.
This usually means multiple isFocused={true} props on sibling components. Use a
focus state to control which component is active. See docs/pitfalls.md#7
```

Emitter: `src/input/manager.ts:305` (the `countAtMax > 1` check against
`prioritizedKeyListeners`).

### Why it fires here

The add-calc modal mounts a `SearchInput` and an `OptionList` as siblings
inside `<Modal opaque>`. Both receive `isFocused` so the user can:

- Type letters into `SearchInput` (they filter the list).
- Press Up/Down/Enter on `OptionList` (they navigate/select from the filter).

Minimal repro (condensed from the showcase):

```tsx
<Modal visible title="Add Calculation" onClose={close}>
  <SearchInput value={q} onChange={setQ} isFocused />
  <OptionList items={filtered} onSelect={pick} isFocused />
</Modal>
```

**Status (2026-04-24 refactor):** The specific pattern above — `SearchInput` +
`OptionList` as siblings inside a `Modal` — no longer trips the warning on
current reacterm HEAD. Verified by a direct stderr-capture test in
`src/__tests__/robustness.test.ts` ("mounting SearchInput + OptionList + Modal
siblings does NOT emit the multi-handler warning").

**Historical note:** An earlier draft of this section claimed both components
"register as prioritized handlers at the same priority". That was inaccurate
for current code — both `SearchInput` (`useInput(handleInput, { isActive })`)
and `OptionList` (same) register via the non-priority `onKey` path, not
`onKeyPrioritized`. The warning in `input/manager.ts` fires only from the
prioritized branch when `countAtMax > 1`, so non-prioritized siblings cannot
trip it directly.

What actually handled the co-existence:

1. `OptionList` sets `event.consumed = true` on Up/Down/Enter so those keys
   don't leak to SearchInput's typing handler.
2. `input/manager.ts:emitKey` breaks the prioritized-handler loop on
   `event.consumed`, short-circuiting `countAtMax` before it can exceed 1.
3. `SearchInput` claims printable characters; arrow/enter are left for other
   handlers to consume.

The remaining cases where the warning can still legitimately fire:

- Two nested `<Modal>`s open at once: both register trap handlers at
  `INPUT_PRIORITY.MODAL` (1000). Typing keys are not consumed by either trap
  (only tab/escape are), so `countAtMax == 2` and the warning fires.
- Any future pair of same-priority handlers that don't use the
  `event.consumed` disjoint-key pattern.

### Why the `docs/pitfalls.md#7` advice is hard to apply

Section 7 suggests a single focus-owner pattern (`useFocus` + tab order, or
`Modal`'s built-in focus trap). That works well for mutually exclusive
widgets — a form moving focus between fields — but not for a search-filter
modal, where typing and list navigation are intentionally concurrent.

Workarounds the consumer has today all degrade UX:

- Give `SearchInput` focus only while typing, then shift to the list —
  breaks "type more to refine while keeping the cursor on the list".
- Handle arrows/enter inside a custom `useInput` outside the list —
  duplicates `OptionList`'s logic.
- Suppress the warning — defeats its purpose.

### Suggested direction for reacterm

Any of:

1. A first-class `SearchList` / `FilterList` compound component that owns
   both the input and the list and internally registers a single
   prioritized handler that routes keys (letters → input, arrows/enter →
   list). Consumer passes items + a filter predicate + `onSelect`; no
   double-`isFocused`.

2. An opt-in `isPassthrough` / `acceptsTyping` prop on `SearchInput` (or a
   new `keyDomain` axis: `typing` vs `navigation`) so the input manager
   can co-exist two handlers that claim disjoint keys without treating it
   as a conflict.

3. Loosen the warning: if the sibling handlers register with
   non-overlapping key sets (e.g. one only consumes printable chars, the
   other only arrows/enter), skip the warning. Requires handlers to
   declare their key domain.

Option 1 is the lowest-friction for consumers; option 3 would let
existing showcase code stay valid without a new component. Either
would remove the warning from the frozen showcase, which is currently
both the canonical example and the noisiest user of this pattern.

### Cross-reference

- Emitting site: `src/input/manager.ts:305`
- Showcase source that triggers it verbatim:
  `examples/ui-terminal/showcase/dock.tsx` — Add-Calculation modal body
- Consumer hitting it: `Pyseas-Dock/tui2/app.tsx` (`modalMode === "add-calc"`)
- Doc section the warning links to: `docs/pitfalls.md` section 7

### Local-workaround attempts

Evaluated but not applied:

- Drop `isFocused` from `OptionList`, keep it on `SearchInput`, handle
  arrow/enter in the consumer's outer `useInput` — blocked: `OptionList`
  has no external `activeIndex` prop, so arrow/enter can't be fed in
  from outside without reimplementing the component.
- Drop `isFocused` from `SearchInput`, keep it on `OptionList`, handle
  typing in the outer `useInput` — functional but strips the in-modal
  block-cursor affordance from the search input.

Conclusion: this one needs reacterm-side work. The warning is
dev-only and non-blocking, so left as-is in the consumer for now.

## 5. Pane isolation leaks: Enter can trigger two interaction states at once

### What happened

While authoring inputs in the detail pane of `Pyseas-Dock/tui2/app.tsx`, the
user pressed `Enter` on a table cell (the unit column — `GPa` was
highlighted in the Elastic Modulus row) to begin editing that cell. The cell
did enter edit mode, but at the same instant the add-calc flow advanced to
its second step, rendering the `Name Calculation` modal on top of the table
with the library item name prefilled (`Cargo + Underdeck Girder Check`).

Two mutually exclusive interaction states were live simultaneously:

1. Cell-edit mode: `editingCellKey === "inputs:elastic_modulus:unit"`,
   block cursor visible on `GPa`.
2. Naming modal: `modalMode === "name-calc"`, input buffer populated from
   the previously picked library entry.

Reproduction path (from the screenshot):
- User had at some earlier point opened the add-calc modal and selected a
  library item, but did not commit — probably left the flow mid-way.
- User then navigated to the detail pane and pressed Enter on a cell.
- The single Enter keypress advanced the lingering add-calc step AND
  entered cell-edit mode.

### Why this points at `Panes` / input manager

`Pane` / `Panes` are supposed to scope focus and input, but here Enter is
being consumed by a handler that "belongs" to an ex-focused pane (the
calcs pane that owned the library modal) as well as the handler that owns
the currently focused pane (the detail pane's cell editor). That means
either:

- The modal's prioritized handler was not fully unregistered when
  `modalMode` transitioned from `"add-calc"` → `"name-calc"` (or the
  transition is async and a stray key races into both listeners), or
- `Panes` does not fully mask input for non-active panes; its children
  still see keys even when another pane is the logical focus owner.

Either way, this is the symptom of the same root cause as the warning in
section 4: input routing in Storm leans on individual `isFocused` booleans
propagated down the tree, rather than a single authoritative focus owner
maintained by `Panes` / `Modal` at the tree boundary.

### Things to dig into

- `Panes` focus semantics: does setting `activePane` actually mask input
  for the other panes, or does each `Pane` child still register its own
  `useInput` listener and rely on consumer code gating by `if (activePane
  === "…")`? If the latter, that gating can drift every time new state
  (a modal, a cell editor) is added in parallel.
- Modal teardown ordering: when `modalMode` changes from `"add-calc"` to
  `"name-calc"`, is the previous modal's input listener torn down before
  the new one registers? If React batching or a microtask boundary lets
  both listeners coexist for one tick, a single Enter can be seen twice.
- `useInput` event consumption: the current model emits to every
  registered handler unless one calls `event.consume()`. None of the
  showcase's handlers do, so it's possible two handlers each react to the
  same Enter without either knowing.
- Worth a test matrix: "modal open + focus in different pane + Enter",
  "modal transitioning + Enter", "two Panes with overlapping keybindings".
  The showcase in `examples/ui-terminal/showcase/dock.tsx` is a decent
  fixture — reproduce in a Vitest + terminal-harness pair.

### Related

- Section 4 above (multi-`isFocused` warning) is the warning-level signal
  of the same underlying issue.
- Emitter locations of interest: `src/input/manager.ts` (listener
  dispatch), `src/components/layout/Panes.tsx`, `src/components/overlay/Modal.tsx`.

### Cross-reference

- Consumer: `Pyseas-Dock/tui2/app.tsx`
- Observed during: add-calc flow + detail-pane cell edit, single Enter
  keypress collapsed both into one frame.

### Local-workaround applied

A defensive mutual-exclusion effect now lives in `Pyseas-Dock/tui2/app.tsx`:

```tsx
useEffect(() => {
  if (modalMode !== "none" && editingCellKey) {
    setEditingCellKey(null);
    setEditValue("");
    setCursorIdx(0);
  }
}, [modalMode]);
useEffect(() => {
  if (editingCellKey && modalMode !== "none") {
    setModalMode("none");
    setModalInput("");
    setModalCursor(0);
    setPendingCalcId(null);
  }
}, [editingCellKey]);
```

Effect: if both states ever become live simultaneously (regardless of
which reacterm path let the key through), the consumer collapses back
to a single state on the next render.

What the workaround does NOT fix:

- Does not stop the duplicate delivery — two listeners still fire on one
  Enter when the race occurs.
- Does not consume the key, so downstream handlers below the two
  observed states can still react to the same event if any exist.
- Does not address the root cause (`Panes` not masking input for
  non-active panes, modal teardown ordering). Those still belong on
  the reacterm side.

Treat this as a belt-and-braces patch until reacterm exposes a proper
focus-owner contract at the tree boundary.

## 6. `Modal` shadows lower-priority handlers even when invisible

### What happened

Building `examples/reacterm-demo.tsx` I registered a global app handler
with `useInput(fn, { priority: 900 })` to handle Tab / `?` / `t` / `q`.
The demo shell rendered a help `<Modal visible={showHelp}>` that's
invisible at startup. **Tab did nothing** — the global handler never
fired.

### Why it fires

`Modal` registers a focus-trap handler unconditionally on mount via
`useInput(handleInput, { isActive: visible, priority: INPUT_PRIORITY.MODAL })`
where `MODAL = 1000`. The handler is gated by `isActive` (returns
early when `visible=false`), but it's still **registered** in the
prioritized listener set at priority 1000.

`InputManager.emitKey` only iterates handlers at the **max** priority
found:

```ts
for (const entry of this.prioritizedKeyListeners) {
  if (entry.priority === maxPriority) {
    entry.handler(event);
    if (event.consumed) break;
  }
}
```

So the priority-900 handler is shadowed forever. When Modal's
invisible handler returns without consuming, the loop just ends — it
doesn't fall through to the next-highest priority. Execution
continues only to the **non-prioritized** listener set; anything
registered with `priority` strictly less than 1000 evaporates.

### Why it surprises

The semantics most users expect from "priority": higher runs first,
and if it doesn't consume, the next priority gets a turn. The
implementation is "highest priority wins, all-or-nothing".

### Workaround

Drop the priority on the global handler — register as a normal
listener. Modal at 1000 still runs first, returns when invisible
without consuming, falls through to the normal listener queue. Done.

### Suggested direction for reacterm

One of:

1. **Cascade priorities** — when no max-priority handler consumes,
   run the next-highest tier, and so on, until a handler consumes or
   we fall through to normal listeners. Matches the principle of
   least surprise and lets layered apps stack global > section >
   widget handlers via priority numbers.
2. **Skip inactive prioritized handlers when computing max** — i.e.
   `maxPriority = max(entry.priority for entry where entry.active)`.
   This keeps the all-or-nothing model but stops invisible Modals
   from poisoning the max bucket. Requires propagating `isActive`
   into `PrioritizedKeyHandler` (it currently lives only inside the
   wrapper closure in `useInput`).
3. **Document the gotcha** — at a minimum, the warning in
   `pitfalls.md` should call this out: "if you mount a Modal anywhere
   in your tree, a `priority` below 1000 on any other handler is
   effectively dead code."

Option 2 is the smallest change and probably the right semantics —
an inactive handler shouldn't influence anything.

### Cross-reference

- Emitting site: `src/input/manager.ts:286` (`emitKey`)
- Modal site: `src/components/core/Modal.tsx:55`
- Demo bitten by it: `examples/reacterm-demo.tsx` (App's `useInput`)
- Reproduction: a small App with priority-900 Tab handler + an
  invisible Modal — Tab evaporates. Removing the priority fixes it.

## 7. `DataGrid` headers are not clickable

### What happened

Building the demo's Data section, I wired `DataGrid`'s `onSort` callback
expecting that clicking a column header would fire it. It didn't —
`DataGrid` invokes `onSort` only from its keyboard `s` shortcut. The
column headers render as plain `<tui-text>`, no `useMouseTarget`, no
`_focusId`. Same story for `onSelect` and body rows.

### Why it's a gap

Every consumer of `DataGrid` who wants click-sort or click-select has
to wrap headers/rows themselves, which means re-implementing the
header layout (sort indicators, alignment, column widths) outside
the component.

### Workaround in the demo

`examples/reacterm-demo.tsx` ships a small custom grid (~80 lines) in
the `FileGridPane` component instead of using `DataGrid`. The grid
wraps each header cell and each body row in the demo's `Clickable`
helper. It's not a great precedent — the framework should ship this
out of the box.

### Suggested direction

Inside `DataGrid`:

1. Wrap each header cell in a `useMouseTarget` so a click invokes
   `onSort(col.key)` — same dispatcher as the `s` shortcut.
2. Wrap each body row in a `useMouseTarget` so a click invokes
   `onSelect(rowIndex)`.
3. Track hover state (the row under the cursor) and offer a hover
   color in props (`hoverColor`, default `text.primary` over the
   regular row color).

### Cross-reference

- Site: `src/components/data/DataGrid.tsx` — header rendering at
  `headerCells = columns.map(...)` (around line 241), no mouse
  wiring.
- Demo workaround: `FileGridPane` in `examples/reacterm-demo.tsx`.

## 8. Inline-component definitions thrash focus registrations

### What happened

The demo's `FormsSection` defined a small `Row` helper component INSIDE
the function body:

```tsx
function FormsSection() {
  const Row = ({ label, children, focused }) => ( ... <Clickable>... </Clickable> );
  return (<>
    <Row label="Name" focused={field === "name"}><TextInput .../></Row>
    <Row label="Phone" focused={field === "phone"}><MaskedInput .../></Row>
    ...
  </>);
}
```

Clicking any field row to change focus emitted:

```
[storm] Warning: Multiple elements have isFocused={true}.
Only 'textinput-1' will be focused. Set isFocused={false} on others.
```

…even though the demo only sets `isFocused={true}` on exactly one
field at a time.

### Why it fires

React reconciles JSX elements by `element.type` reference equality.
When `Row` is defined inside `FormsSection`, every render of
`FormsSection` creates a *new* `Row` function reference. React sees a
new component type, **unmounts the old subtree, and remounts a fresh
one.** That cascades into every input the Row wraps — `TextInput`,
`MaskedInput`, `TextArea`, `ChatInput` — each of which:

- runs `useTextInputBehavior` / `useMaskedInputBehavior` / etc.
- generates a fresh `idRef` from the module-level counter
  (`textinput-N`, with N incrementing across mounts)
- re-runs the `if (!focusRegistered.current) { ... if (focusProp)
  focus.focus(idRef.current); }` block

If two different inputs end up with `focusProp === true` momentarily
across a single React commit pass — say, because a transitional
render leaves the previous "active" field's `isFocused` true while
the new one also goes true — both call `focus.focus()`, and the
focus manager's same-cycle detection trips the warning.

### Fix in the demo

Lift the helper to module scope:

```tsx
function FormRow(props: FormRowProps) { ... }

function FormsSection() {
  return (<>
    <FormRow label="Name" focused={field === "name"} onSelect={setField}>
      <TextInput .../>
    </FormRow>
    ...
  </>);
}
```

Stable component reference → no remounts → no focus thrash → no
warning. Regression test added at `src/__tests__/robustness.test.ts`
("toggling which sibling input has isFocused does NOT emit the
multi-handler warning").

### Suggested direction for reacterm

This is purely a React anti-pattern, not a framework bug. But given
how easy it is to trigger and how confusing the resulting warning
is, the framework could:

1. **Document it loudly** in `docs/pitfalls.md` — "if you see the
   multi-isFocused warning despite setting isFocused on exactly one
   sibling, check that no parent component is defining a wrapper
   component inline."
2. **Soften the warning** to mention this as a likely cause:
   "...this can also happen if a parent component re-creates a
   wrapper component on each render."
3. **Add a dev-only assertion** in `useTextInputBehavior` (and
   peers) that warns when the component remounts > N times within
   a short window — that's a near-perfect signal of the anti-pattern.

### Cross-reference

- React docs: <https://react.dev/learn/your-first-component#nesting-and-organizing-components>
- Demo bitten by it: `examples/reacterm-demo.tsx` (`FormsSection` →
  `FormRow` lifted out)
- Regression test: `src/__tests__/robustness.test.ts` (search for
  "Inline-component anti-pattern regression")
- Warning emitter: `src/core/focus.ts:144`
