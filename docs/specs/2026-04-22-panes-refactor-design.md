# Panes Refactor Design

## Status

Draft.

## Context

The dock showcase needs three real panes:

- `Sections` stacked above `Calcs / Files / Images`
- `Detail` spanning the full height to the right
- one connected border system with correct junctions

The current implementation proves the visual target, but `Panes` now contains a special-case compound renderer for exactly one shape: a row split with one nested column split and one sibling pane. That is enough for the dock demo, but it is not a good long-term component design.

## Problems To Fix

1. `Panes` has shape-specific logic.

   The current compound path only handles `row` with exactly two children, where one child is a `column` `Panes`. It does not generalize to:

   - column containing row
   - deeper nesting
   - more than two outer children
   - multiple nested split children

2. Border rendering is duplicated.

   `Panes` currently has separate logic for:

   - simple row
   - simple column
   - compound row-with-column

   This makes it easy for future fixes to update one path and miss another.

3. Component identity detection is brittle.

   The current implementation tags `Panes` with `__reactermPanes` to detect nested panes. That works, but it is an implementation smell and can break with wrappers, HOCs, alternate builds, or component re-exports.

4. Layout props are manually whitelisted in one wrapper path.

   The current `wrapperLayoutProps` copies only selected layout props. If the layout engine gains new props, nested pane wrappers may silently drop them.

5. Tests assert presence, not exact topology.

   The new test checks for `├`, `┤`, and a clean final row, but it does not fully assert the expected border graph across multiple nested shapes.

6. The flex allocator fix is correct, but needs dedicated regression coverage.

   The layout engine now distributes leftover cells after flooring flex shares. That should be preserved with explicit tests for odd terminal sizes and mixed flex ratios.

## Goals

- Support nested `Panes` as a first-class feature.
- Render any rectangular split tree with one connected border graph.
- Keep the public API simple: users compose `<Panes>` and `<Pane>`.
- Avoid fake divider lines for pane boundaries.
- Preserve existing simple row and column behavior.
- Keep `Panes` implementation small enough to reason about.

## Non-Goals

- Arbitrary overlapping panes.
- Drag-based resizing in the core component.
- Auto-managed focus or keyboard navigation in `Panes`.
- Pixel-perfect compatibility with every current private implementation detail.

## Proposed API

Keep the existing public API:

```tsx
<Panes direction="row" borderStyle="single" borderColor={C.border}>
  <Panes direction="column" flexBasis={treeWidth} flexShrink={0}>
    <Pane flex={46}>Sections</Pane>
    <Pane flex={54}>Calcs / Files / Images</Pane>
  </Panes>
  <Pane flex={1}>Detail</Pane>
</Panes>
```

No new public component is required for this use case.

Internally, support a private normalized tree:

```ts
type PaneNode =
  | {
      kind: "leaf";
      element: React.ReactElement;
      layoutProps: Record<string, unknown>;
    }
  | {
      kind: "split";
      direction: "row" | "column";
      children: PaneNode[];
      layoutProps: Record<string, unknown>;
    };
```

## Design

### 1. Normalize React Children Into A Pane Tree

Create a helper:

```ts
function normalizePaneTree(
  element: React.ReactElement,
  inherited: { borderStyle: BorderStyle; borderColor?: string | number },
): PaneNode
```

Rules:

- A `Pane` becomes a `leaf`.
- A `Panes` becomes a `split`.
- Other valid elements inside `Panes` are treated as leaf panes for backward compatibility.
- Normalize layout props generically by stripping only `Panes` control props (`children`, `direction`, `borderStyle`, `borderColor`) and preserving all layout props.

Avoid `__reactermPanes` if possible. Prefer an internal marker symbol exported only inside the module:

```ts
const PANES_MARKER = Symbol.for("reacterm.Panes");
const PANE_MARKER = Symbol.for("reacterm.Pane");
```

Assign markers to component functions. This is still identity tagging, but avoids string collisions and makes the intent explicit.

### 2. Render Borders From A Split Tree

Replace shape-specific row/column rendering with one recursive renderer:

```ts
function renderSplit(node: SplitNode, frame: FrameEdges): React.ReactElement
```

`FrameEdges` describes which outer edges should be drawn:

```ts
type FrameEdges = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};
```

For each split:

- `row` split inserts vertical separator tracks between children.
- `column` split inserts horizontal separator tracks between children.
- outer edges are owned by the parent frame.
- child panes do not draw their own adjacent duplicate borders.

### 3. Model Junctions Explicitly

Instead of manually choosing `┬`, `┴`, `├`, `┤` in each render path, add a small junction model.

```ts
type BorderMask = {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
};
```

Map masks to characters per border style:

| Mask | Single | Meaning |
|---|---:|---|
| left + right | `─` | horizontal |
| up + down | `│` | vertical |
| right + down | `┌` | top-left |
| left + down | `┐` | top-right |
| right + up | `└` | bottom-left |
| left + up | `┘` | bottom-right |
| up + down + right | `├` | left T |
| up + down + left | `┤` | right T |
| left + right + down | `┬` | top T |
| left + right + up | `┴` | bottom T |
| all four | `┼` | crossing |

This makes deeper split trees possible because junctions are derived from connectivity rather than branch-specific code.

### 4. Preserve Flex Behavior

The layout engine fix should remain:

- compute floored flex shares
- track distributed cells
- assign leftover cells to flex children until no remainder remains
- respect max constraints while doing so

Add a focused test in `layout.test.ts`:

```ts
it("distributes leftover flex cells instead of dropping them", () => {
  // parent height 10, two flex children, no gap:
  // child heights must sum to 10, not 9
});
```

### 5. Keep `Panes` Render Output Deterministic

When leftover cells are distributed, the first eligible flex child gets the first leftover. This matches the current allocator behavior and keeps snapshots stable.

Document that exact distribution is deterministic but not part of the public API.

## Implementation Plan

### Phase 1: Lock Current Behavior With Tests

Add tests for:

- simple row panes
- simple column panes
- row containing column on left
- row containing column on right
- column containing row on top
- column containing row on bottom
- three or more children at the outer level
- no duplicate borders (`││`, adjacent horizontal border rows)
- odd widths and heights where flex has a remainder

### Phase 2: Refactor Internals Behind Existing API

Create internal helpers in `src/components/core/Panes.tsx`:

- `isPaneElement`
- `isPanesElement`
- `extractLayoutProps`
- `normalizePaneTree`
- `renderPaneTree`
- `borderCharForMask`

Keep the exported `Pane` and `Panes` names unchanged.

### Phase 3: Replace Compound Special Case

Remove:

- `renderNestedColumnContent`
- `renderSinglePaneContent`
- `compoundVertCol`
- special `direction === "row" && kids.length === 2` path

Replace with recursive rendering for all nested shapes.

### Phase 4: Validate The Dock Showcase

The dock body should stay:

```tsx
<Panes direction="row" flex={1} borderStyle="single" borderColor={C.border}>
  <Panes direction="column" flexGrow={0} flexShrink={0} flexBasis={treeWidth}>
    <Pane flex={46}>...</Pane>
    <Pane flex={54}>...</Pane>
  </Panes>
  <Pane flex={1}>...</Pane>
</Panes>
```

Verify in tmux:

- top border has `┬`
- left internal split has `├`
- vertical separator has `┤` at the internal split
- bottom border has `┴`
- no wrapped orphan border row
- `r`, left, and right resize the left column while preserving junctions

## Test Plan

Run:

```bash
bun run build
bun test src/__tests__/layout.test.ts src/__tests__/panes.test.ts
bun test
```

Manual visual checks:

```bash
tmux new-session -d -s termtest -x 200 -y 50 'reacterm demo showcase dock'
tmux capture-pane -t termtest -p
tmux send-keys -t termtest r Right Right
tmux capture-pane -t termtest -p
tmux kill-session -t termtest
```

## Risks

- Recursive split rendering can get complicated if implemented as nested React elements only. Keep helpers small and test output directly.
- Border character selection can regress non-single styles. Include double, heavy, round, ascii, and storm tests.
- Changing flex allocation can affect existing visual snapshots. Current full test suite passes, but add explicit flex remainder tests before further changes.
- `Panes` may become too powerful. Avoid adding focus, resizing, or panel state to this component.

## Acceptance Criteria

- Dock showcase has three real panes, not a fake divider.
- Nested panes work in both row-in-column and column-in-row shapes.
- Any supported split tree renders as one connected border graph.
- No duplicate borders appear between panes.
- No orphan border rows appear at odd heights or widths.
- `bun run build` passes.
- Full `bun test` passes.
