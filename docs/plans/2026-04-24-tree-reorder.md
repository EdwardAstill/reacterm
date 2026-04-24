# Tree Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task. For same-session manual execution, route back through `executor`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reorder feature to the `Tree` component — `live` mode (single-node, restructures as you navigate) and `stash` mode (multi-mark, splice on commit) — via an imperative controller that consuming apps drive with their own keybindings.

**Machine plan:** `2026-04-24-tree-reorder.yaml`

**Architecture:** A pure reducer owns the reorder state machine (idle / marking / grabbed:live / grabbed:stash) and produces a `scratchNodes` tree on each transition. `Tree.tsx` wires the reducer in via `useReducer`, renders `scratchNodes` when present (else falls back to the `nodes` prop), exposes a `controller` ref with imperative methods, and extends `renderNode` state with `isMarked` / `isGrabbed` / `isDropTarget`. Commit fires `onReorder(change)` **once**, carrying `nextNodes` + `expandedKeys`; cancel discards scratch.

**Tech Stack:** TypeScript strict · React 18 · Bun · Vitest · existing `renderForTest` harness (`src/testing/index.ts`).

**Spec:** `docs/specs/2026-04-24-tree-reorder-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/data/Tree.types.ts` (new) | `TreeController`, `ReorderState`, `MoveContext`, `ReorderChange`; exports reused by `Tree.tsx` and tests |
| `src/components/data/treeReorderReducer.ts` (new) | Pure reducer: state machine + motion math + splice/lift logic. No React. |
| `src/components/data/Tree.tsx` (modify) | Wire reducer via `useReducer`; expose controller ref; render scratch when grabbed; gate default keys when grabbed; pass new flags to `renderNode`; early-return mouse handler in grabbed |
| `src/__tests__/tree-reorder.test.ts` (new) | All reducer unit tests + Tree integration tests |
| `src/__tests__/tree.test.ts` (unchanged) | Existing navigation tests still pass — regression guardrail |
| `examples/ui-terminal/showcase/dock.tsx` (modify) | Add controller ref, keymap bindings, `onReorder` handler persisting `nextNodes` + `expandedKeys` |
| `docs/components.md` (modify) | Add "Reorder" section: API reference + consumer-wiring example |

**Key decomposition rationale:** the reducer is isolated so it is fully unit-testable without React render cycles. `Tree.tsx` becomes a thin wiring layer. `Tree.types.ts` is the public surface consumers import from.

---

## Ground rules

- TDD: every task is **red test → minimal impl → green → commit**.
- Run `bun x tsc --noEmit` after any change that touches types.
- Run targeted vitest first (`bun test src/__tests__/tree-reorder.test.ts`), then full suite (`bun test`) before commit.
- Commit after every task. Never amend.
- No default keybindings for reorder — app owns keys.

---

## Task 1: Public types module

**Files:**
- Create: `src/components/data/Tree.types.ts`

- [ ] **Step 1: Write the type file (no tests; types compile-check is the test)**

```ts
import type { TreeNode } from "./Tree.js";

export type ReorderState =
  | { phase: "idle" }
  | { phase: "marking"; marked: string[] }
  | { phase: "grabbed"; mode: "live" | "stash"; moving: string[] };

export interface MoveContext {
  movedKeys: string[];
  targetParentKey: string | null;
  targetIndex: number;
  mode: "live" | "stash";
}

export interface ReorderChange extends MoveContext {
  previousParents: Record<string, string | null>;
  previousIndices: Record<string, number>;
  nextNodes: TreeNode[];
  expandedKeys: string[];
}

export interface TreeController {
  toggleMark(key: string): void;
  clearMarks(): void;
  getMarked(): string[];
  grabLive(key?: string): boolean;
  grabStash(): boolean;
  commit(): void;
  cancel(): void;
  moveUp(): void;
  moveDown(): void;
  indent(): void;
  outdent(): void;
  getCursorKey(): string | null;
}
```

- [ ] **Step 2: Export `TreeNode` from `Tree.tsx` (already exported — verify)**

Run: `grep -n "export interface TreeNode" src/components/data/Tree.tsx`
Expected: one hit.

- [ ] **Step 3: Typecheck**

Run: `bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/data/Tree.types.ts
git commit -m "feat(tree): add reorder type surface"
```

---

## Task 2: Reducer — idle, marking, grab lifecycle (no motion)

**Files:**
- Create: `src/components/data/treeReorderReducer.ts`
- Test: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing tests for mark + grab lifecycle**

```ts
// src/__tests__/tree-reorder.test.ts
import { describe, it, expect } from "vitest";
import { reorderReducer, initialReorderState } from "../components/data/treeReorderReducer.js";
import type { TreeNode } from "../components/data/Tree.js";

const nodes: TreeNode[] = [
  { key: "a", label: "A" },
  { key: "b", label: "B", expanded: true, children: [
    { key: "b1", label: "B1" },
    { key: "b2", label: "B2" },
  ]},
  { key: "c", label: "C" },
];

describe("reorderReducer — idle / marking / grab lifecycle", () => {
  it("starts idle", () => {
    expect(initialReorderState.phase).toBe("idle");
  });

  it("toggleMark enters marking", () => {
    const next = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes);
    expect(next.state.phase).toBe("marking");
    if (next.state.phase === "marking") expect(next.state.marked).toEqual(["a"]);
  });

  it("second toggleMark on same key returns to idle", () => {
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes).state;
    s = reorderReducer(s, { type: "toggleMark", key: "a" }, nodes).state;
    expect(s.phase).toBe("idle");
  });

  it("grabLive rejected when >1 marked", () => {
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes).state;
    s = reorderReducer(s, { type: "toggleMark", key: "c" }, nodes).state;
    const result = reorderReducer(s, { type: "grabLive", key: "a" }, nodes);
    expect(result.rejected).toBe(true);
    expect(result.state.phase).toBe("marking");
  });

  it("grabStash with empty marks auto-marks cursor then grabs", () => {
    const result = reorderReducer(initialReorderState, { type: "grabStash", cursorKey: "a" }, nodes);
    expect(result.state.phase).toBe("grabbed");
    if (result.state.phase === "grabbed") {
      expect(result.state.mode).toBe("stash");
      expect(result.state.moving).toEqual(["a"]);
    }
  });

  it("cancel from grabbed returns to idle and reports scratch cleared", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes).state;
    const cancelled = reorderReducer(s, { type: "cancel" }, nodes);
    expect(cancelled.state.phase).toBe("idle");
    expect(cancelled.scratchNodes).toBeUndefined();
  });

  it("toggleMark during grabbed is ignored", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes).state;
    const result = reorderReducer(s, { type: "toggleMark", key: "b" }, nodes);
    expect(result.state).toBe(s);
  });
});
```

- [ ] **Step 2: Run tests — confirm fail**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the reducer**

```ts
// src/components/data/treeReorderReducer.ts
import type { TreeNode } from "./Tree.js";
import type { ReorderState, ReorderChange, MoveContext } from "./Tree.types.js";

export type ReorderAction =
  | { type: "toggleMark"; key: string }
  | { type: "clearMarks" }
  | { type: "grabLive"; key: string }
  | { type: "grabStash"; cursorKey: string }
  | { type: "moveUp" }
  | { type: "moveDown" }
  | { type: "indent" }
  | { type: "outdent" }
  | { type: "commit"; cursorKey: string }
  | { type: "cancel" }
  | { type: "externalNodesChange" };

export interface ReorderStep {
  state: ReorderState;
  scratchNodes?: TreeNode[];
  ephemeralExpanded?: string[];
  rejected?: boolean;
  change?: ReorderChange;
}

export const initialReorderState: ReorderState = { phase: "idle" };

export function reorderReducer(
  state: ReorderState,
  action: ReorderAction,
  nodes: TreeNode[],
  canMove?: (ctx: MoveContext) => boolean,
): ReorderStep {
  // toggleMark / clearMarks are ignored during grabbed:*
  if (state.phase === "grabbed") {
    if (action.type === "toggleMark" || action.type === "clearMarks" || action.type === "grabLive" || action.type === "grabStash") {
      return { state };
    }
  }

  if (action.type === "toggleMark") {
    const marked = state.phase === "marking" ? state.marked : [];
    const idx = marked.indexOf(action.key);
    const next = idx >= 0 ? marked.filter((_, i) => i !== idx) : [...marked, action.key];
    if (next.length === 0) return { state: { phase: "idle" } };
    return { state: { phase: "marking", marked: next } };
  }

  if (action.type === "clearMarks") {
    return { state: { phase: "idle" } };
  }

  if (action.type === "grabLive") {
    const marked = state.phase === "marking" ? state.marked : [];
    if (marked.length > 1) return { state, rejected: true };
    return { state: { phase: "grabbed", mode: "live", moving: [action.key] } };
  }

  if (action.type === "grabStash") {
    const raw = state.phase === "marking" ? state.marked : [action.cursorKey];
    const moving = topmostOnly(raw, nodes);
    return { state: { phase: "grabbed", mode: "stash", moving } };
  }

  if (action.type === "cancel" || action.type === "externalNodesChange") {
    return { state: { phase: "idle" } };
  }

  // motion + commit handled in Task 3/4
  return { state };
}

function topmostOnly(keys: string[], nodes: TreeNode[]): string[] {
  const keySet = new Set(keys);
  const parentOf = buildParentMap(nodes);
  return keys.filter((k) => {
    let p = parentOf.get(k) ?? null;
    while (p) {
      if (keySet.has(p)) return false;
      p = parentOf.get(p) ?? null;
    }
    return true;
  });
}

function buildParentMap(nodes: TreeNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  function walk(list: TreeNode[], parent: string | null) {
    for (const n of list) {
      map.set(n.key, parent);
      if (n.children) walk(n.children, n.key);
    }
  }
  walk(nodes, null);
  return map;
}
```

- [ ] **Step 4: Tests pass**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: PASS (6/6).

- [ ] **Step 5: Typecheck**

Run: `bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/data/treeReorderReducer.ts src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): reorder reducer — marking + grab lifecycle"
```

---

## Task 3: Reducer — live motion (moveUp / moveDown / outdent / indent + canMove + ephemeral expand)

**Files:**
- Modify: `src/components/data/treeReorderReducer.ts`
- Modify: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe("reorderReducer — live motion", () => {
  it("moveDown swaps siblings under same parent", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    s = reorderReducer(s.state, { type: "moveDown" }, nodes);
    // Expected scratchNodes: b now has children [b2, b1]
    expect(s.scratchNodes![1]!.children!.map((n) => n.key)).toEqual(["b2", "b1"]);
  });

  it("moveUp at first-sibling boundary is no-op", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    s = reorderReducer(s.state, { type: "moveUp" }, nodes);
    expect(s.scratchNodes?.[1]!.children!.map((n) => n.key)).toEqual(["b1", "b2"]);
  });

  it("outdent at root is no-op", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes);
    s = reorderReducer(s.state, { type: "outdent" }, nodes);
    expect(s.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "c"]);
  });

  it("outdent from nested places grabbed node after its parent", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    s = reorderReducer(s.state, { type: "outdent" }, nodes);
    expect(s.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "b1", "c"]);
    expect(s.scratchNodes?.[1]!.children!.map((n) => n.key)).toEqual(["b2"]);
  });

  it("indent into prev-sibling folder places grabbed as last child", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, nodes);
    s = reorderReducer(s.state, { type: "indent" }, nodes);
    expect(s.scratchNodes?.map((n) => n.key)).toEqual(["a", "b"]);
    expect(s.scratchNodes?.[1]!.children!.map((n) => n.key)).toEqual(["b1", "b2", "c"]);
  });

  it("indent into collapsed folder auto-expands ephemerally", () => {
    const collapsed: TreeNode[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B", expanded: false, children: [{ key: "b1", label: "B1" }] },
      { key: "c", label: "C" },
    ];
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, collapsed);
    s = reorderReducer(s.state, { type: "indent" }, collapsed);
    expect(s.ephemeralExpanded).toEqual(["b"]);
    expect(s.scratchNodes?.[1]!.expanded).toBe(true);
  });

  it("canMove=false makes motion a no-op", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes);
    const blocked = reorderReducer(s.state, { type: "moveDown" }, nodes, () => false);
    expect(blocked.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "c"]);
  });
});
```

- [ ] **Step 2: Run — fails on motion assertions**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 7 new failures.

- [ ] **Step 3: Implement motion in reducer**

Extend `reorderReducer` to:
- Track scratch baseline in the step output (recompute each call from `nodes` + accumulated scratch — for this project, the reducer is *stateless* across calls; the caller threads the most recent scratch back in).
- On second thought, let the reducer operate on `nodes` (baseline) for motion but receive accumulated `scratchNodes` from caller. Pragmatic shape — add `scratch?: TreeNode[]` param:

```ts
export function reorderReducer(
  state: ReorderState,
  action: ReorderAction,
  nodes: TreeNode[],
  canMove?: (ctx: MoveContext) => boolean,
  priorScratch?: TreeNode[],
  priorEphemeral?: string[],
): ReorderStep { ... }
```

Write helpers:
- `findNodePath(tree, key)` → array of indices from root to node
- `removeNodeAt(tree, path)` → `{ tree, removed }` (immutable splice)
- `insertNodeAt(tree, path, node)` → tree
- `swapSiblings(tree, path, direction)` → tree
- `getPrevSibling(tree, path)` → node or null
- `expandKey(tree, key)` → tree (with `expanded: true` on that node)

Handlers:
- **moveUp/moveDown**: find path; if path[last] is at edge, no-op; swap with neighbor. Check `canMove({ movedKeys: moving, targetParentKey: parentKey, targetIndex: newIdx, mode: "live" })`. If blocked, no-op.
- **outdent**: if depth 0, no-op. Remove from current path; insert at parent-path's parent, index = parent-path[last] + 1.
- **indent**: get prev sibling. If none, no-op. Remove; insert as last child of prev sibling. If prev sibling was collapsed, set `expanded: true` on scratch and push its key onto `ephemeralExpanded`. `canMove` consulted.

For each motion, return `{ state, scratchNodes: nextTree, ephemeralExpanded: [...priorEphemeral ?? [], ...maybeNewExpand] }`.

- [ ] **Step 4: Tests pass**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 13/13 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/data/treeReorderReducer.ts src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): reorder reducer — live motion + ephemeral expand"
```

---

## Task 4: Reducer — commit + stash splice + `ReorderChange` payload

**Files:**
- Modify: `src/components/data/treeReorderReducer.ts`
- Modify: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe("reorderReducer — commit + stash", () => {
  it("live commit fires change.nextNodes and change.expandedKeys", () => {
    let s = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    s = reorderReducer(s.state, { type: "outdent" }, nodes, undefined, s.scratchNodes, s.ephemeralExpanded);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "b1" }, nodes, undefined, s.scratchNodes, s.ephemeralExpanded);
    expect(committed.state.phase).toBe("idle");
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["a", "b", "b1", "c"]);
    expect(committed.change?.expandedKeys).toEqual([]);
    expect(committed.change?.movedKeys).toEqual(["b1"]);
    expect(committed.change?.mode).toBe("live");
  });

  it("stash commit splices marked group after cursor as siblings", () => {
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes);
    s = reorderReducer(s.state, { type: "toggleMark", key: "c" }, nodes);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, nodes);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "b" }, nodes);
    // After committing with cursor on "b": a + c spliced after b at root depth
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["b", "a", "c"]);
    expect(committed.change?.mode).toBe("stash");
    expect(committed.change?.movedKeys).toEqual(["a", "c"]);
  });

  it("stash skips ancestors-of-marked when lifting", () => {
    const deep: TreeNode[] = [
      { key: "p", label: "P", expanded: true, children: [{ key: "c", label: "C" }] },
      { key: "x", label: "X" },
    ];
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "p" }, deep);
    s = reorderReducer(s.state, { type: "toggleMark", key: "c" }, deep);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "p" }, deep);
    if (s.state.phase === "grabbed") expect(s.state.moving).toEqual(["p"]);
  });

  it("stash cursor on collapsed folder drops group AFTER folder (sibling)", () => {
    const coll: TreeNode[] = [
      { key: "a", label: "A" },
      { key: "f", label: "F", expanded: false, children: [{ key: "f1", label: "F1" }] },
    ];
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, coll);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, coll);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "f" }, coll);
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["f", "a"]);
    expect(committed.change?.targetParentKey).toBeNull();
  });
});
```

- [ ] **Step 2: Run — confirm fails**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 4 new failures.

- [ ] **Step 3: Implement commit + stash logic**

In `reorderReducer` handle `commit`:
- If `state.phase !== "grabbed"`: return `{ state }`.
- For **live**: `nextNodes = priorScratch ?? nodes`. Find moving node's path → `targetParentKey` = parent key (null if root), `targetIndex` = last path segment.
- For **stash**: lift all `moving` keys from `nodes` (preserve mark order), splice them immediately after cursorKey at cursorKey's parent + depth. If cursor itself is marked, drop at end of its pre-lift parent.
- Compute `previousParents` and `previousIndices` by walking `nodes` (pre-move) and recording each moved key's location.
- Build `change: ReorderChange`. Return `{ state: { phase: "idle" }, change }`.

- [ ] **Step 4: Tests pass**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 17/17 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/data/treeReorderReducer.ts src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): reorder reducer — commit + stash splice"
```

---

## Task 5: Wire reducer into `Tree.tsx` — controller + renderNode flags

**Files:**
- Modify: `src/components/data/Tree.tsx`
- Modify: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing integration test**

```ts
import React, { useRef } from "react";
import { renderForTest } from "../testing/index.js";
import { Tree } from "../components/index.js";
import type { TreeController, ReorderChange } from "../components/data/Tree.types.js";

describe("Tree integration — controller + renderNode flags", () => {
  it("controller.toggleMark surfaces isMarked to renderNode", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const flags: Record<string, { m?: boolean; g?: boolean }> = {};
    const result = renderForTest(
      React.createElement(Tree, {
        nodes,
        reorderable: true,
        controller: ctrl,
        renderNode: (n, s) => {
          flags[n.key] = { m: s.isMarked, g: s.isGrabbed };
          return React.createElement("tui-text", {}, n.label);
        },
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.toggleMark("a");
    result.rerender();
    expect(flags.a?.m).toBe(true);
  });

  it("live grab + moveDown + commit fires onReorder with nextNodes", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    let change: ReorderChange | null = null;
    renderForTest(
      React.createElement(Tree, {
        nodes,
        reorderable: true,
        controller: ctrl,
        onReorder: (c: ReorderChange) => { change = c; },
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("b1");
    ctrl.current!.moveDown();
    ctrl.current!.commit();
    expect(change!.nextNodes[1]!.children!.map((n) => n.key)).toEqual(["b2", "b1"]);
  });
});
```

- [ ] **Step 2: Run — fails**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 2 new failures (controller is null or props not accepted).

- [ ] **Step 3: Wire reducer into Tree.tsx**

In `Tree` component:
- Add new props: `reorderable?`, `canMove?`, `onReorder?`, `onStateChange?`, `controller?: { current: TreeController | null }`.
- Use `useReducer` seeded with `initialReorderState`. Maintain `scratchNodes` + `ephemeralExpanded` in a ref (so motion results thread back through dispatch).
- Build the effective `nodes` for rendering: `reorderState.phase === "grabbed" ? (scratchRef.current ?? nodes) : nodes`.
- Pass new flags through `TreeRenderState` passed to `renderNode`.
- Assign to `controller.current` on every render via a `useEffect` so callers always see the latest handle. Methods dispatch reducer actions and, on commit, read the resulting `change` and call `onReorder(change)` **after** phase flip to idle. Ordering:
  ```ts
  commit() {
    const step = reorderReducer(state, { type: "commit", cursorKey: getCursorKey() ?? "" }, props.nodes, props.canMove, scratchRef.current, ephemeralRef.current);
    scratchRef.current = undefined;
    ephemeralRef.current = undefined;
    setState(step.state); // phase goes idle
    if (step.change) props.onReorder?.(step.change);
  }
  ```
- Gate built-in key handler: if `state.phase === "grabbed"`, early-return for up/down/left/right/space/return.
- Gate mouse handler: if `state.phase === "grabbed"`, early-return inside `useMouseTarget.onMouse`.
- Detect external `nodes` prop change during grab: compare with `useRef<TreeNode[]>`. If mismatch while grabbed, dispatch `externalNodesChange`, clear scratch.

- [ ] **Step 4: Tests pass + existing `tree.test.ts` still passes**

Run: `bun test src/__tests__/tree-reorder.test.ts src/__tests__/tree.test.ts`
Expected: all PASS.

- [ ] **Step 5: Typecheck**

Run: `bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/data/Tree.tsx src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): wire reorder reducer + controller into Tree"
```

---

## Task 6: Default rendering (when `renderNode` not provided)

**Files:**
- Modify: `src/components/data/Tree.tsx`
- Modify: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe("Tree default rendering — reorder states", () => {
  it("renders asterisk prefix on marked nodes", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const result = renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    ctrl.current!.toggleMark("a");
    result.rerender();
    expect(result.hasText("* A")).toBe(true);
  });

  it("renders grabbed-stash origin with ⋯ prefix", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const result = renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    ctrl.current!.toggleMark("a");
    ctrl.current!.grabStash();
    result.rerender();
    expect(result.hasText("⋯ A")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fails**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: 2 new failures.

- [ ] **Step 3: Implement default-render branch**

In the no-`renderNode` path in `Tree.tsx`, inspect the flags that would be passed to `renderNode` and mutate the label prefix + styling:
- `isMarked`: prepend `"* "`, color `colors.brand.accent`.
- `isGrabbed` in `grabbed:live`: `inverse: true`, bold.
- `isGrabbed` in `grabbed:stash`: prepend `"⋯ "`, `dim: true`.
- `isDropTarget` in stash: insert an extra `tui-text` row above with `"▸"` gutter marker (optional for v1 — skip if allElements reshape is noisy; gate behind a later task if needed).

Keep logic additive — don't break existing rendering.

- [ ] **Step 4: Tests pass**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/data/Tree.tsx src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): default rendering for marked/grabbed states"
```

---

## Task 7: Edge cases — nodes-prop abort, wrong-phase, canMove, mouse swallow

**Files:**
- Modify: `src/components/data/Tree.tsx` (if any fix needed)
- Modify: `src/__tests__/tree-reorder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe("Tree edge cases", () => {
  it("external nodes-prop change while grabbed aborts grab", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const states: string[] = [];
    const result = renderForTest(
      React.createElement(Tree, {
        nodes, reorderable: true, controller: ctrl,
        onStateChange: (s: any) => states.push(s.phase),
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("a");
    result.rerender(React.createElement(Tree, {
      nodes: [...nodes, { key: "d", label: "D" }],
      reorderable: true, controller: ctrl,
    }));
    expect(states.at(-1)).toBe("idle");
  });

  it("self-initiated nodes update (in onReorder) does NOT re-abort", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    let capturedChange: ReorderChange | null = null;
    let currentNodes = nodes;
    const Harness = () => {
      const [n, setN] = React.useState(currentNodes);
      currentNodes = n;
      return React.createElement(Tree, {
        nodes: n, reorderable: true, controller: ctrl,
        onReorder: (c: ReorderChange) => { capturedChange = c; setN(c.nextNodes); },
      });
    };
    renderForTest(React.createElement(Harness), { width: 40, height: 10 });
    ctrl.current!.grabLive("b1");
    ctrl.current!.moveDown();
    ctrl.current!.commit();
    expect(capturedChange).not.toBeNull();
    // Grab should NOT re-fire — controller state is idle
    expect(ctrl.current!.grabLive("a")).toBe(true);
  });

  it("canMove=false prevents motion but allows commit at starting position", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    let change: ReorderChange | null = null;
    renderForTest(
      React.createElement(Tree, {
        nodes, reorderable: true, controller: ctrl,
        canMove: () => false,
        onReorder: (c: ReorderChange) => { change = c; },
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("b1");
    ctrl.current!.moveDown();  // blocked
    ctrl.current!.commit();
    expect(change!.nextNodes[1]!.children!.map((n) => n.key)).toEqual(["b1", "b2"]);
  });

  it("wrong-phase controller calls are no-ops", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    expect(() => ctrl.current!.moveUp()).not.toThrow();
    expect(() => ctrl.current!.commit()).not.toThrow();
  });

  it("mouse click during grabbed does not change focus", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    let selected: string | null = null;
    const result = renderForTest(
      React.createElement(Tree, {
        nodes, reorderable: true, controller: ctrl,
        onSelect: (k: string) => { selected = k; },
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("a");
    result.click(0, 2); // click row C
    expect(selected).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test src/__tests__/tree-reorder.test.ts`
Expected: most PASS already if Task 5 wired everything right; fix any regressions.

- [ ] **Step 3: Patch `Tree.tsx` for any remaining gaps**

Likely needed:
- Compare `nodes` prop by reference in a `useEffect`; on change during `phase === "grabbed"`, dispatch `externalNodesChange`.
- Ensure commit sets phase to idle **before** calling `onReorder` (already done in Task 5; verify).

- [ ] **Step 4: Tests pass**

Run: `bun test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/data/Tree.tsx src/__tests__/tree-reorder.test.ts
git commit -m "feat(tree): reorder edge cases — abort, canMove, mouse, wrong-phase"
```

---

## Task 8: Dock showcase — wire controller

**Files:**
- Modify: `examples/ui-terminal/showcase/dock.tsx`

- [ ] **Step 1: Add controller ref + state handler**

```tsx
const treeCtrl = useRef<TreeController>(null);
const [reorderPhase, setReorderPhase] = useState<"idle" | "marking" | "grabbed">("idle");
```

- [ ] **Step 2: Extend `useInput` handler — add keys inside `activePane === "tree"` branch**

```tsx
if (e.char === "m") treeCtrl.current?.toggleMark(focusedSectionId);
else if (e.char === "g") treeCtrl.current?.grabLive();
else if (e.char === "G") treeCtrl.current?.grabStash();
else if (reorderPhase === "grabbed" && e.key === "return") treeCtrl.current?.commit();
else if (reorderPhase === "grabbed" && e.key === "escape") treeCtrl.current?.cancel();
else if (reorderPhase === "grabbed" && e.char === "J") treeCtrl.current?.moveDown();
else if (reorderPhase === "grabbed" && e.char === "K") treeCtrl.current?.moveUp();
else if (reorderPhase === "grabbed" && e.char === ">") treeCtrl.current?.indent();
else if (reorderPhase === "grabbed" && e.char === "<") treeCtrl.current?.outdent();
```

- [ ] **Step 3: Wire props on `<Tree>`**

```tsx
<Tree
  // existing props...
  controller={treeCtrl}
  reorderable
  onReorder={(change) => {
    setSections(change.nextNodes as any);
    if (change.expandedKeys.length) {
      setExpandedIds((prev) => new Set([...prev, ...change.expandedKeys]));
    }
  }}
  onStateChange={(s) => setReorderPhase(s.phase)}
/>
```

- [ ] **Step 4: Update Footer bindings when grabbed**

Add a footer variant for grabbed phase: `m mark · g grab · G stash-grab · </> indent · J/K move · Enter commit · Esc cancel`.

- [ ] **Step 5: Manual smoke test**

Run: `bun run examples/ui-terminal/showcase/dock.tsx`
Manually: mark 2 sections (m), grab stash (G), move cursor, commit. Verify tree reflects the move. Verify Esc reverts in live mode (g on cursor, J, Esc — back to original).

- [ ] **Step 6: Commit**

```bash
git add examples/ui-terminal/showcase/dock.tsx
git commit -m "feat(dock): wire Tree reorder controller into SECTIONS pane"
```

---

## Task 9: Docs

**Files:**
- Modify: `docs/components.md`

- [ ] **Step 1: Add "Reorder" section under the `Tree` component docs**

Include:
- Summary: `Tree` supports user-driven reorder via an imperative controller.
- Modes: live (single node) vs stash (multi-mark).
- API snippet: `TreeController` interface + relevant props.
- Consumer wiring example (copy from spec § Consumer Wiring, trimmed to minimum).
- Link to spec: `docs/specs/2026-04-24-tree-reorder-design.md`.

- [ ] **Step 2: Verify build of docs (if there's a docs pipeline) or lint markdown**

Run: `grep -n "^## Tree" docs/components.md`
Expected: section exists + new "Reorder" sub-section under it.

- [ ] **Step 3: Commit**

```bash
git add docs/components.md
git commit -m "docs: Tree reorder API + wiring example"
```

---

## Final verification

- [ ] Run full suite: `bun test`
- [ ] Typecheck: `bun x tsc --noEmit`
- [ ] Manual Dock smoke: run showcase, exercise mark / grab-live / grab-stash / commit / cancel.
- [ ] Confirm no regression in existing Tree tests (`src/__tests__/tree.test.ts`).

---

## Risks / mid-flight escalations

- **Virtual scroll highlight re-derivation** (spec Edge Cases): implemented as part of Task 5 (`highlightRef` lookup by grabbed key after each dispatch). If tests show stale scroll, add a specific test + fix.
- **Ephemeral expansion for a node that's then moved out of via outdent**: `expandedKeys` still contains the folder. That's fine — the user saw it expand, and persisting that is defensible. If flagged in review, add logic to prune `expandedKeys` to only folders that actually contain grabbed node at commit time.
- **`React.memo` + controller prop**: props equality is shallow; `controller` is a stable ref object reference, `onReorder` may be an inline callback. If stale-closure bugs appear, advise callers to wrap in `useCallback` — this is standard React. Don't over-engineer around it.
