import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Tree } from "../components/index.js";
import { reorderReducer, initialReorderState } from "../components/data/treeReorderReducer.js";
import type { TreeNode } from "../components/data/Tree.js";
import type {
  TreeController,
  ReorderChange,
  ReorderState,
} from "../components/data/Tree.types.js";

const nodes: TreeNode[] = [
  { key: "a", label: "A" },
  {
    key: "b",
    label: "B",
    expanded: true,
    children: [
      { key: "b1", label: "B1" },
      { key: "b2", label: "B2" },
    ],
  },
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
    const s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes).state;
    const cancelled = reorderReducer(s, { type: "cancel" }, nodes);
    expect(cancelled.state.phase).toBe("idle");
    expect(cancelled.scratchNodes).toBeUndefined();
  });

  it("toggleMark during grabbed is ignored", () => {
    const s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes).state;
    const result = reorderReducer(s, { type: "toggleMark", key: "b" }, nodes);
    expect(result.state).toBe(s);
  });

  it("externalNodesChange from any phase returns to idle", () => {
    const s = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes).state;
    const result = reorderReducer(s, { type: "externalNodesChange" }, nodes);
    expect(result.state.phase).toBe("idle");
  });
});

describe("reorderReducer — live motion", () => {
  it("moveDown swaps siblings under same parent", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    const b = reorderReducer(a.state, { type: "moveDown" }, nodes);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b2", "b1"]);
  });

  it("moveUp at first-sibling boundary is no-op", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    const b = reorderReducer(a.state, { type: "moveUp" }, nodes);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b1", "b2"]);
  });

  it("moveDown at last-sibling boundary is no-op", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, nodes);
    const b = reorderReducer(a.state, { type: "moveDown" }, nodes);
    expect(b.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "c"]);
  });

  it("outdent at root is no-op", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes);
    const b = reorderReducer(a.state, { type: "outdent" }, nodes);
    expect(b.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "c"]);
  });

  it("outdent from nested places grabbed node after its parent", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    const b = reorderReducer(a.state, { type: "outdent" }, nodes);
    expect(b.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "b1", "c"]);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b2"]);
  });

  it("indent into prev-sibling folder places grabbed as last child", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, nodes);
    const b = reorderReducer(a.state, { type: "indent" }, nodes);
    expect(b.scratchNodes?.map((n) => n.key)).toEqual(["a", "b"]);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b1", "b2", "c"]);
  });

  it("indent with no prev sibling is no-op", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes);
    const b = reorderReducer(a.state, { type: "indent" }, nodes);
    expect(b.scratchNodes?.map((n) => n.key)).toEqual(["a", "b", "c"]);
  });

  it("indent into collapsed folder auto-expands ephemerally", () => {
    const collapsed: TreeNode[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B", expanded: false, children: [{ key: "b1", label: "B1" }] },
      { key: "c", label: "C" },
    ];
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, collapsed);
    const b = reorderReducer(a.state, { type: "indent" }, collapsed);
    expect(b.ephemeralExpanded).toEqual(["b"]);
    expect(b.scratchNodes?.[1]?.expanded).toBe(true);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b1", "c"]);
  });

  it("indent into leaf turns it into a folder (canMove permits)", () => {
    const leafNodes: TreeNode[] = [
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
    ];
    const g = reorderReducer(initialReorderState, { type: "grabLive", key: "y" }, leafNodes);
    const r = reorderReducer(g.state, { type: "indent" }, leafNodes);
    expect(r.scratchNodes?.[0]?.children?.map((n) => n.key)).toEqual(["y"]);
    expect(r.scratchNodes?.length).toBe(1);
  });

  it("canMove=false makes motion a no-op", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    const b = reorderReducer(a.state, { type: "moveDown" }, nodes, () => false);
    expect(b.scratchNodes?.[1]?.children?.map((n) => n.key)).toEqual(["b1", "b2"]);
  });

  it("repeat motion threads through priorScratch", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "a" }, nodes);
    const b = reorderReducer(a.state, { type: "moveDown" }, nodes);
    const c = reorderReducer(b.state, { type: "moveDown" }, nodes, undefined, b.scratchNodes, b.ephemeralExpanded);
    expect(c.scratchNodes?.map((n) => n.key)).toEqual(["b", "c", "a"]);
  });
});

describe("reorderReducer — commit + stash", () => {
  it("live commit fires change with nextNodes, expandedKeys, movedKeys, mode", () => {
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "b1" }, nodes);
    const b = reorderReducer(a.state, { type: "outdent" }, nodes, undefined, a.scratchNodes, a.ephemeralExpanded);
    const c = reorderReducer(b.state, { type: "commit", cursorKey: "b1" }, nodes, undefined, b.scratchNodes, b.ephemeralExpanded);
    expect(c.state.phase).toBe("idle");
    expect(c.change?.nextNodes.map((n) => n.key)).toEqual(["a", "b", "b1", "c"]);
    expect(c.change?.expandedKeys).toEqual([]);
    expect(c.change?.movedKeys).toEqual(["b1"]);
    expect(c.change?.mode).toBe("live");
    expect(c.change?.targetParentKey).toBeNull();
    expect(c.change?.targetIndex).toBe(2);
    expect(c.change?.previousParents).toEqual({ b1: "b" });
    expect(c.change?.previousIndices).toEqual({ b1: 0 });
  });

  it("live commit surfaces ephemerally expanded folders in expandedKeys", () => {
    const collapsed: TreeNode[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B", expanded: false, children: [{ key: "b1", label: "B1" }] },
      { key: "c", label: "C" },
    ];
    const a = reorderReducer(initialReorderState, { type: "grabLive", key: "c" }, collapsed);
    const b = reorderReducer(a.state, { type: "indent" }, collapsed, undefined, a.scratchNodes, a.ephemeralExpanded);
    const c = reorderReducer(b.state, { type: "commit", cursorKey: "c" }, collapsed, undefined, b.scratchNodes, b.ephemeralExpanded);
    expect(c.change?.expandedKeys).toEqual(["b"]);
  });

  it("stash commit splices marked group after cursor as siblings", () => {
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes);
    s = reorderReducer(s.state, { type: "toggleMark", key: "c" }, nodes);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, nodes);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "b" }, nodes);
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["b", "a", "c"]);
    expect(committed.change?.mode).toBe("stash");
    expect(committed.change?.movedKeys).toEqual(["a", "c"]);
    expect(committed.change?.targetParentKey).toBeNull();
    expect(committed.change?.expandedKeys).toEqual([]);
  });

  it("stash skips ancestors-of-marked when lifting (topmost only)", () => {
    const deep: TreeNode[] = [
      { key: "p", label: "P", expanded: true, children: [{ key: "c", label: "C" }] },
      { key: "x", label: "X" },
    ];
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "p" }, deep);
    s = reorderReducer(s.state, { type: "toggleMark", key: "c" }, deep);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "p" }, deep);
    if (s.state.phase === "grabbed") expect(s.state.moving).toEqual(["p"]);
  });

  it("stash cursor on collapsed folder drops group AFTER folder (sibling, not child)", () => {
    const coll: TreeNode[] = [
      { key: "a", label: "A" },
      { key: "f", label: "F", expanded: false, children: [{ key: "f1", label: "F1" }] },
    ];
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, coll);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, coll);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "f" }, coll);
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["f", "a"]);
    expect(committed.change?.targetParentKey).toBeNull();
    // f still has its original (collapsed) children intact
    expect(committed.change?.nextNodes[0]?.children?.map((n) => n.key)).toEqual(["f1"]);
  });

  it("stash cursor on a marked row drops group at end of cursor's original parent (first unmarked after cursor = none)", () => {
    // Mark a + c (both root-level). Cursor = a (which is itself marked).
    // Expected: group lifted; drop at end of cursor's original parent (root).
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes);
    s = reorderReducer(s.state, { type: "toggleMark", key: "c" }, nodes);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, nodes);
    const committed = reorderReducer(s.state, { type: "commit", cursorKey: "a" }, nodes);
    // Lift a + c. Drop at end of root (only b remains, unmarked, before drop). Final order: b, a, c.
    expect(committed.change?.nextNodes.map((n) => n.key)).toEqual(["b", "a", "c"]);
  });

  it("motion actions during stash are no-ops", () => {
    let s = reorderReducer(initialReorderState, { type: "toggleMark", key: "a" }, nodes);
    s = reorderReducer(s.state, { type: "grabStash", cursorKey: "a" }, nodes);
    const prior = s;
    const moved = reorderReducer(s.state, { type: "moveDown" }, nodes);
    expect(moved.state).toEqual(prior.state);
    expect(moved.scratchNodes).toBeUndefined();
  });
});

describe("Tree integration — controller + renderNode flags", () => {
  it("controller.toggleMark surfaces isMarked to renderNode", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const flags: Record<string, { m?: boolean; g?: boolean }> = {};
    const element = React.createElement(Tree, {
      nodes,
      reorderable: true,
      controller: ctrl,
      renderNode: (n: TreeNode, s: { isMarked: boolean; isGrabbed: boolean }) => {
        flags[n.key] = { m: s.isMarked, g: s.isGrabbed };
        return React.createElement("tui-text", {}, n.label);
      },
    });
    const result = renderForTest(element, { width: 40, height: 10 });
    expect(ctrl.current).not.toBeNull();
    ctrl.current!.toggleMark("a");
    result.rerender(element);
    expect(flags.a?.m).toBe(true);
    expect(flags.b?.m ?? false).toBe(false);
  });

  it("live grab + moveDown + commit fires onReorder with correct nextNodes", () => {
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
    expect(change).not.toBeNull();
    expect(change!.nextNodes[1]!.children!.map((n) => n.key)).toEqual(["b2", "b1"]);
    expect(change!.mode).toBe("live");
  });

  it("cancel discards scratch and returns state to idle", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const states: string[] = [];
    renderForTest(
      React.createElement(Tree, {
        nodes,
        reorderable: true,
        controller: ctrl,
        onStateChange: (s: ReorderState) => states.push(s.phase),
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("a");
    ctrl.current!.moveDown();
    ctrl.current!.cancel();
    expect(states.at(-1)).toBe("idle");
  });

  it("grabLive returns false when >1 marked", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    ctrl.current!.toggleMark("a");
    ctrl.current!.toggleMark("c");
    expect(ctrl.current!.grabLive("a")).toBe(false);
  });

  it("onStateChange fires on phase transitions", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const phases: string[] = [];
    renderForTest(
      React.createElement(Tree, {
        nodes,
        reorderable: true,
        controller: ctrl,
        onStateChange: (s: ReorderState) => phases.push(s.phase),
      }),
      { width: 40, height: 10 },
    );
    ctrl.current!.toggleMark("a");
    ctrl.current!.grabStash();
    ctrl.current!.commit();
    expect(phases).toContain("marking");
    expect(phases).toContain("grabbed");
    expect(phases.at(-1)).toBe("idle");
  });

  it("stash commit via controller reorders correctly", () => {
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
    ctrl.current!.toggleMark("a");
    ctrl.current!.toggleMark("c");
    ctrl.current!.grabStash();
    ctrl.current!.commit();
    expect(change).not.toBeNull();
    expect(change!.movedKeys).toEqual(["a", "c"]);
  });
});

describe("Tree edge cases", () => {
  it("external nodes-prop change while grabbed aborts grab", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const states: string[] = [];
    const result = renderForTest(
      React.createElement(Tree, {
        nodes, reorderable: true, controller: ctrl,
        onStateChange: (s: ReorderState) => states.push(s.phase),
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

  it("self-initiated nodes update (app responding to onReorder) does NOT re-abort", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    let capturedChange: ReorderChange | null = null;
    const Harness: React.FC = () => {
      const [n, setN] = React.useState<TreeNode[]>(nodes);
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
    // After commit app updated nodes; controller should be idle and accept a fresh grab.
    expect(ctrl.current!.grabLive("a")).toBe(true);
  });

  it("canMove=false blocks motion but commit still fires at starting position", () => {
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
    ctrl.current!.moveDown();
    ctrl.current!.commit();
    expect(change).not.toBeNull();
    // b1 remained in original position
    expect(change!.nextNodes[1]!.children!.map((n) => n.key)).toEqual(["b1", "b2"]);
  });

  it("wrong-phase controller calls are no-ops (no throw)", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    expect(() => ctrl.current!.moveUp()).not.toThrow();
    expect(() => ctrl.current!.commit()).not.toThrow();
    expect(() => ctrl.current!.indent()).not.toThrow();
  });

  it("toggleMark during grabbed is silently ignored", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    renderForTest(
      React.createElement(Tree, { nodes, reorderable: true, controller: ctrl }),
      { width: 40, height: 10 },
    );
    ctrl.current!.grabLive("a");
    ctrl.current!.toggleMark("b");
    // marks not surfaced via getMarked in grabbed state
    expect(ctrl.current!.getMarked()).toEqual([]);
  });

  it("renders * prefix on marked node by default", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const element = React.createElement(Tree, { nodes, reorderable: true, controller: ctrl });
    const result = renderForTest(element, { width: 40, height: 10 });
    ctrl.current!.toggleMark("a");
    result.rerender(element);
    expect(result.hasText("* A")).toBe(true);
  });

  it("renders ⋯ prefix on stash-grabbed origin", () => {
    const ctrl: { current: TreeController | null } = { current: null };
    const element = React.createElement(Tree, { nodes, reorderable: true, controller: ctrl });
    const result = renderForTest(element, { width: 40, height: 10 });
    ctrl.current!.toggleMark("a");
    ctrl.current!.grabStash();
    result.rerender(element);
    expect(result.hasText("⋯ A")).toBe(true);
  });
});
