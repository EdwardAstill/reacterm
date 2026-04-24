import { describe, it, expect } from "vitest";
import { reorderReducer, initialReorderState } from "../components/data/treeReorderReducer.js";
import type { TreeNode } from "../components/data/Tree.js";

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
