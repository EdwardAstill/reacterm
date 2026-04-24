# Tree Reorder — Design Spec

**Date:** 2026-04-24
**Component:** `src/components/data/Tree.tsx`
**Status:** Draft — awaiting user review

## Goal

Let users rearrange the contents of a `Tree` — promoting, demoting, and reparenting nodes — through an imperative controller that the host app drives with its own keybindings. Support two move modes: single-node **live** reorder (tree restructures as you navigate) and multi-node **stash** reorder (yazi-style lift + paste with any non-contiguous selection).

## Non-Goals

- No default keybindings for reorder (app wires its own keys to the controller).
- No mouse-drag reorder in v1 (mouse click-to-focus still works in `idle`/`marking`).
- No undo stack — the app controls persistence; Esc reverts the in-progress grab, not prior commits.
- No auto-expansion of folders during stash navigation (user expands manually before grabbing).

## Motivation

Existing `Tree` is read-only for structure. Consumers (e.g., Dock's `SECTIONS` pane in `examples/ui-terminal/showcase/dock.tsx:712-778`) need to let users reorder sections and move calcs between folders. A generic reorder primitive on `Tree` avoids ad-hoc per-app implementations and keeps Dock-style and future apps consistent.

## Prior Art Considered

| Pattern | Source | Verdict |
|---|---|---|
| Spring-loaded (auto-expand on hover) | Finder, Explorer | **Rejected** by user — surprising |
| Flat-visible traversal | OS file managers | Partial — works for live mode but ambiguous on collapsed folders |
| Explicit indent/outdent | Notion, Workflowy, Logseq | **Adopted** — clear semantics, no magic |
| Cut/stash + paste | vim, yazi, ranger | **Adopted** as stash mode |

## Guiding Principles

1. **App owns keys.** Tree exposes behavior primitives; consuming app binds keys to controller methods. Tree intercepts no new keys by default.
2. **One commit callback.** `onReorder` fires once per completed move — not per intermediate step — to keep consumer state simple.
3. **Scratch state is Tree's.** While a grab is in progress, Tree maintains an internal reordered copy and renders it; the app's `nodes` prop is baseline. Commit or cancel resolve the scratch.
4. **Caller constrains moves.** `canMove` predicate lets the app reject motions that violate its data model (e.g., files can't become folders).
5. **Two modes differ by selection shape.** Live = single-node, tree restructures live. Stash = any non-contiguous marks, origins stay put until paste.

## State Machine

```
idle          --toggleMark(k)-->     marking
marking       --toggleMark(k) / clearMarks()-->  marking | idle
marking       --grabStash()-->       grabbed:stash
idle          --grabLive(k?)-->      grabbed:live   (k defaults to cursor)
grabbed:*     --moveUp/Down-->       grabbed:*      (scratch updates in live)
grabbed:live  --indent/outdent-->    grabbed:live   (scratch updates)
grabbed:stash --moveUp/Down-->       grabbed:stash  (cursor only; no scratch change)
grabbed:*     --commit()-->          idle           (onReorder fires once)
grabbed:*     --cancel()-->          idle           (scratch discarded)
```

Rules:
- `grabLive` rejects (returns `false`) if `marked.size > 1`.
- `grabStash` with empty marks marks the cursor node, then transitions.
- External `nodes` prop change while grabbed → aborts grab, fires `onStateChange({phase:"idle"})`, discards scratch. **`commit` transitions phase to `idle` *before* firing `onReorder`**, so the app's subsequent `setState(change.nextNodes)` — which changes `nodes` on the next render — is not treated as an external abort (phase is already idle by then).

## API

### New Props

```ts
interface TreeProps {
  // existing: nodes, onToggle, onSelect, selectedKey, onHighlightChange,
  //           color, isFocused, maxVisible, renderNode

  reorderable?: boolean;                          // default false
  canMove?: (ctx: MoveContext) => boolean;        // consulted per motion step;
                                                   // rejection makes the step a no-op.
                                                   // NOT re-checked at commit.
  onReorder?: (change: ReorderChange) => void;    // fires once on commit
  onStateChange?: (state: ReorderState) => void;  // for status-bar UI, etc.
  controller?: React.Ref<TreeController>;
}
```

### Controller Handle

```ts
interface TreeController {
  // marking
  toggleMark(key: string): void;
  clearMarks(): void;
  getMarked(): string[];

  // grab lifecycle
  grabLive(key?: string): boolean;    // false if rejected (e.g., marked.size > 1)
  grabStash(): boolean;
  commit(): void;
  cancel(): void;

  // motion (valid only in grabbed:*)
  moveUp(): void;
  moveDown(): void;
  indent(): void;                     // live-only; no-op in stash
  outdent(): void;                    // live-only; no-op in stash

  // inspection (pull API; push via `onStateChange`)
  getCursorKey(): string | null;
}
```

### Payload Types

```ts
type ReorderState =
  | { phase: "idle" }
  | { phase: "marking"; marked: string[] }
  | { phase: "grabbed"; mode: "live" | "stash"; moving: string[] };

interface MoveContext {
  movedKeys: string[];
  targetParentKey: string | null;   // null = root
  targetIndex: number;
  mode: "live" | "stash";
}

interface ReorderChange extends MoveContext {
  previousParents: Record<string, string | null>;
  previousIndices: Record<string, number>;
  nextNodes: TreeNode[];            // fully reordered tree for convenience
  expandedKeys: string[];           // folder keys that Tree ephemerally expanded
                                    // during the grab and that must be persisted
                                    // alongside the reorder (live mode only)
}
```

### Render-State Additions

`renderNode` receives:

```ts
interface TreeRenderState {
  isExpanded: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  depth: number;
  // new
  isMarked: boolean;        // user marked for stash
  isGrabbed: boolean;       // currently being moved (live or stash)
  isDropTarget: boolean;    // row immediately following cursor in stash
}
```

### Default Rendering (no `renderNode`)

- **Marked**: label prefixed with `*` and tinted `colors.brand.accent`.
- **Grabbed-live**: whole row `inverse: true` + bold.
- **Grabbed-stash origin**: dim + `⋯` prefix.
- **Drop target in stash**: `▸` gutter marker above the row.

Consumer `renderNode` is responsible for its own styling when provided.

## Interaction Flows

### Live Mode (single node)

1. App calls `controller.grabLive()`. Phase becomes `grabbed:live`; moving set = `[cursorKey]`.
2. `moveUp` / `moveDown` swap grabbed node with prev / next **sibling under same parent**. Boundary = no-op.
3. `outdent` promotes grabbed node to be inserted immediately after its parent, in the grandparent's children.
4. `indent` demotes grabbed node to the last child of its previous sibling. If that sibling is a leaf, turning it into a folder requires `canMove` to return true. If that sibling is a collapsed folder, Tree visually expands it in scratch (ephemeral) — the app's `onToggle` is NOT fired yet.
5. `commit` fires `onReorder(change)` **once**. Any folder keys Tree ephemerally expanded during the grab and into which the grabbed node was ultimately dropped are listed in `change.expandedKeys`. The app is responsible for persisting both the reorder and those expansions in one state update. `onToggle` is **never** fired as a side effect of `commit`.
6. `cancel` discards scratch, reverts ephemeral expansion (no `onReorder` or `onToggle` fires).

### Stash Mode (any non-contiguous marks)

1. App calls `controller.toggleMark(key)` one or more times in `idle` / `marking`.
2. App calls `controller.grabStash()`. Phase becomes `grabbed:stash`; Tree snapshots the mark set and computes the moving set as the topmost-marked-only subset (ancestor-swallows-descendant). **Marks are frozen at this point** — `toggleMark` is ignored during `grabbed:*` (see Wrong-phase rules in Edge Cases).
3. Marked nodes stay rendered at origins with `isGrabbed=true`. Cursor roams freely via `moveUp` / `moveDown` (normal nav; no scratch changes).
4. `indent` / `outdent` are no-ops in stash (drop depth = cursor depth).
5. `commit` lifts all topmost-marked nodes, preserving mark-order, and splices them immediately **after** cursor row, as **siblings at the cursor's parent + depth**. If the cursor rests on a collapsed folder, the group is inserted after the folder as a sibling — never as children. This matches the "no auto-expansion" non-goal; to drop into a folder, the user expands it first, moves cursor inside, then commits. `onReorder` fires once (stash `expandedKeys` is always `[]`).
6. `cancel` clears marks and scratch, returns to `idle`.

### Marking Phase

Cursor keeps moving normally (idle-style nav). `toggleMark(cursorKey)` flips mark. `clearMarks()` returns to `idle`. App can display mark count in a status bar via `onStateChange`.

## Edge Cases

- **Ancestor + descendant both marked**: descendant dropped when computing lifted set. Only topmost-marked kept.
- **Cursor on marked row during stash commit**: drop target = first unmarked row after cursor; if none, end of cursor's original parent.
- **Root-level operations**: `outdent` at depth 0 no-op; `indent` at first child of root no-op (no prev sibling).
- **Cross-root stash moves**: allowed. Subtrees of folders carry their children.
- **Leaf → folder via live indent**: `canMove` must approve; app mutates node shape in its own state on `onReorder`.
- **`nodes` prop mutates during grab**: grab aborted, scratch discarded, `onStateChange` fires.
- **Wrong-phase controller calls**: no-op; dev-mode `console.warn` for `moveUp`/`commit`/etc. in `idle`.
- **`canMove` rejects all motions**: grab stays open; `canMove` is **not** consulted at `commit` time (commit ships whatever scratch position `canMove` allowed the user to reach). User resolves via `cancel` or `commit`.
- **Virtual scroll**: scratch participates identically. After each scratch reflow, `highlightRef` is re-derived by looking up the grabbed node's key in the new flat-node list — not by preserving the stale flat index. Scroll window then re-clamps around the new highlight index. This keeps the grabbed row visible across indent/outdent depth changes.
- **Mouse during grab**: `useMouseTarget.onMouse` early-returns in `grabbed:*`. The target still registers for layout/focus; only the click handling is skipped so focus can't jump mid-move.
- **React.memo + forwardRef**: Tree is currently `React.memo(function Tree(...))` (`src/components/data/Tree.tsx:96`). Adding `controller?: React.Ref<TreeController>` requires either (a) wrapping in `forwardRef` outside the memo — `React.memo(React.forwardRef(Tree))` — or (b) accepting the ref as a regular prop (`controller` is a ref-holding prop, not the React `ref` keyword). Prefer (b) — it avoids re-wrapping and sidesteps ref-typing gotchas.

## Performance

- Scratch = shallow clone of affected parent arrays only, not deep tree copy.
- 10k-node tree: each motion touches at most two parent arrays.
- `renderNode` memoization unchanged; marks/grabs pass through `TreeRenderState` flags.

## Testing

### Unit — state machine (`src/__tests__/tree.test.ts` additions)

1. `toggleMark` enters `marking`; second toggle returns `idle`.
2. `grabLive` with >1 marked returns `false` and leaves phase unchanged.
3. `grabStash` with empty marks auto-marks cursor then transitions.
4. `cancel` during grabbed discards scratch; rendered tree equals pre-grab tree.
5. `commit` fires `onReorder` exactly once with correct payload shape.
6. `canMove` returning false makes motion a no-op; phase unchanged.

### Unit — motion math

1. Live `moveUp` / `moveDown` swap siblings under same parent.
2. Live `indent` into leaf-prev-sibling turns it into a folder (when `canMove` permits).
3. Live `outdent` at root is no-op.
4. Stash lifts topmost-marked only (ancestor rule).
5. Stash splice preserves mark-order.
6. Stash across root boundaries re-parents correctly.

### Integration — rendering

1. Marked nodes carry `isMarked=true` in `renderNode` state.
2. Grabbed-live scratch reflects motion in render output.
3. Ephemeral indent auto-expansion reverts on cancel.
4. Ephemeral indent auto-expansion is surfaced in `change.expandedKeys` on commit (not via `onToggle`).

### Additional required tests (from review)

5. External `nodes` prop mutation while `grabbed:*` aborts the grab and fires `onStateChange({phase:"idle"})`.
6. Self-initiated `nodes` update (app setting `nodes = change.nextNodes` in `onReorder`) does **not** fire an abort (phase is already `idle` by that point).
7. Mouse click during `grabbed:*` is a no-op (no focus change, no toggle).
8. Cursor nav (moveUp/moveDown) during `marking` phase leaves marks intact and keeps phase = `marking` until last mark cleared.
9. Stash splice across root boundaries: marks drawn from two different root-level folders splice as flat siblings at drop target's parent + depth.
10. `toggleMark` called during `grabbed:*` is ignored; mark set snapshot remains what it was at `grabStash()`.

### Snapshot — Dock showcase

Wire the Dock `SECTIONS` tree to the controller; verify mark/grab/commit cycle produces expected ASCII output via tmux PTY capture. Follows the same pattern already used in `docs/specs/2026-04-22-panes-refactor-design.md` and existing Dock snapshot tests — reuse that harness.

## Consumer Wiring (illustrative)

```tsx
const ctrl = useRef<TreeController>(null);
const [sections, setSections] = useState(SECTIONS);

useInput((e) => {
  if (e.char === "m") ctrl.current?.toggleMark(focusedSectionId);
  else if (e.char === "g") ctrl.current?.grabLive();
  else if (e.char === "G") ctrl.current?.grabStash();
  else if (e.key === "return") ctrl.current?.commit();
  else if (e.key === "escape") ctrl.current?.cancel();
  else if (e.char === "K") ctrl.current?.moveUp();
  else if (e.char === "J") ctrl.current?.moveDown();
  else if (e.char === ">") ctrl.current?.indent();
  else if (e.char === "<") ctrl.current?.outdent();
});

<Tree
  nodes={sections}
  controller={ctrl}
  reorderable
  canMove={(ctx) => /* domain rule */ true}
  onReorder={(change) => {
    // Apply reorder; also persist any ephemeral expansions Tree surfaced.
    setSections(change.nextNodes);
    if (change.expandedKeys.length) {
      setExpandedIds((prev) => new Set([...prev, ...change.expandedKeys]));
    }
  }}
  onStateChange={(s) => setStatus(s)}
/>
```

## Deliverables

1. `src/components/data/Tree.tsx` — new props, state machine, controller, scratch renderer.
2. `src/components/data/Tree.types.ts` (new file) — `TreeController`, `ReorderState`, `ReorderChange`, `MoveContext` exported.
3. `src/__tests__/tree.test.ts` — unit + integration tests above.
4. `examples/ui-terminal/showcase/dock.tsx` — wire controller into Dock `SECTIONS` tree with a simple keymap, proving the API in a real app.
5. `docs/components.md` — add reorder section with API reference and the consumer-wiring example.

## Risks / Open Questions

- **Ephemeral expansion commit semantics:** decided — bundled into `ReorderChange.expandedKeys`. `onToggle` is never a side effect of `commit`. App applies both the reorder and the expansions in one atomic update.
- **`controller` ref ergonomics:** treat `controller` as a ref-holding prop (not React's `ref` keyword) to avoid re-wrapping `React.memo(Tree)` with `forwardRef`. Internal `useImperativeHandle`-equivalent assigns to `controller.current` on mount/change. Test with both object refs and callback refs.
- **Controller affordances deferred to v2:** `setCursor(key)` (programmatic cursor placement), `isGrabbed()` convenience, scratch-preview query. Add in v2 if consumers need them.
- **Very large selections in stash:** 1000+ marked nodes — profile to ensure splice stays O(total) not O(marked × depth).
- **Accessibility / screen reader**: out of scope for v1 (TUI), but worth noting for future.
