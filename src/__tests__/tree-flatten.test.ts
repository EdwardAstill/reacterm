import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_TREE_DEPTH,
  flattenVisibleTree,
} from "../utils/tree-flatten.js";

interface Node {
  key: string;
  expanded?: boolean;
  children?: Node[];
  isDir?: boolean;
}

describe("flattenVisibleTree", () => {
  it("flattens expanded nodes with depth and position metadata", () => {
    const nodes: Node[] = [
      {
        key: "a",
        expanded: true,
        children: [
          { key: "a1" },
          { key: "a2" },
        ],
      },
      { key: "b" },
    ];

    const flat = flattenVisibleTree(nodes);

    expect(flat.map(entry => entry.node.key)).toEqual(["a", "a1", "a2", "b"]);
    expect(flat[0]).toMatchObject({ depth: 0, isLast: false, hasChildren: true, siblingIndex: 0, path: [0], parent: null });
    expect(flat[1]).toMatchObject({ depth: 1, isLast: false, hasChildren: false, siblingIndex: 0, path: [0, 0] });
    expect(flat[1]?.parent?.key).toBe("a");
    expect(flat[2]).toMatchObject({ depth: 1, isLast: true, parentIsLast: [false], path: [0, 1] });
    expect(flat[3]).toMatchObject({ depth: 0, isLast: true, parentIsLast: [], path: [1] });
  });

  it("hides collapsed children", () => {
    const nodes: Node[] = [
      { key: "a", expanded: false, children: [{ key: "a1" }] },
      { key: "b" },
    ];

    expect(flattenVisibleTree(nodes).map(entry => entry.node.key)).toEqual(["a", "b"]);
  });

  it("supports custom child and expansion predicates", () => {
    const nodes: Node[] = [
      { key: "dir", isDir: true, expanded: true, children: [{ key: "file", children: [{ key: "hidden" }] }] },
    ];

    const flat = flattenVisibleTree(nodes, {
      getChildren: node => node.children,
      isExpanded: node => Boolean(node.isDir && node.expanded),
    });

    expect(flat.map(entry => entry.node.key)).toEqual(["dir", "file"]);
  });

  it("stops at the configured max depth", () => {
    const cyclic: Node = { key: "x", expanded: true };
    cyclic.children = [cyclic];

    const flat = flattenVisibleTree([cyclic], { maxDepth: DEFAULT_MAX_TREE_DEPTH });

    expect(flat.length).toBeLessThanOrEqual(DEFAULT_MAX_TREE_DEPTH + 1);
  });
});
