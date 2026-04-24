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
