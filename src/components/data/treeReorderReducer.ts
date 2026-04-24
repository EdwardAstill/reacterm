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
  priorScratch?: TreeNode[],
  priorEphemeral?: string[],
): ReorderStep {
  // Any externalNodesChange or cancel returns to idle, discarding scratch.
  if (action.type === "externalNodesChange" || action.type === "cancel") {
    return { state: { phase: "idle" } };
  }

  // During grabbed:*, mark-related + grab-start actions are ignored.
  if (state.phase === "grabbed") {
    if (
      action.type === "toggleMark" ||
      action.type === "clearMarks" ||
      action.type === "grabLive" ||
      action.type === "grabStash"
    ) {
      return { state };
    }

    if (
      state.mode === "live" &&
      (action.type === "moveUp" ||
        action.type === "moveDown" ||
        action.type === "indent" ||
        action.type === "outdent")
    ) {
      return handleLiveMotion(state, action, nodes, canMove, priorScratch, priorEphemeral);
    }

    // commit handled in a later task; fall-through no-op for now.
    return { state };
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

  // Motion / commit not valid outside grabbed — no-op.
  return { state };
}

function handleLiveMotion(
  state: { phase: "grabbed"; mode: "live" | "stash"; moving: string[] },
  action: { type: "moveUp" | "moveDown" | "indent" | "outdent" },
  nodes: TreeNode[],
  canMove: ((ctx: MoveContext) => boolean) | undefined,
  priorScratch: TreeNode[] | undefined,
  priorEphemeral: string[] | undefined,
): ReorderStep {
  const baseline = priorScratch ?? nodes;
  const build = (scratch: TreeNode[], ephemeral: string[] | undefined): ReorderStep =>
    ephemeral !== undefined
      ? { state, scratchNodes: scratch, ephemeralExpanded: ephemeral }
      : { state, scratchNodes: scratch };
  const movingKey = state.moving[0];
  if (!movingKey) return build(baseline, priorEphemeral);

  const path = findPath(baseline, movingKey);
  if (!path) return build(baseline, priorEphemeral);

  const noop = (): ReorderStep => build(baseline, priorEphemeral);

  const parentPath = getParentPath(path);
  const idx = path[path.length - 1]!;
  const parentKey = parentPath.length === 0 ? null : getNodeAtPath(baseline, parentPath)?.key ?? null;

  if (action.type === "moveUp" || action.type === "moveDown") {
    const direction = action.type === "moveUp" ? -1 : 1;
    const newIdx = idx + direction;
    const siblings = parentPath.length === 0 ? baseline : getNodeAtPath(baseline, parentPath)?.children ?? [];
    if (newIdx < 0 || newIdx >= siblings.length) return noop();
    if (canMove && !canMove({ movedKeys: [movingKey], targetParentKey: parentKey, targetIndex: newIdx, mode: "live" })) {
      return noop();
    }
    const swapped = swapSiblings(baseline, parentPath, idx, newIdx);
    return build(swapped, priorEphemeral);
  }

  if (action.type === "outdent") {
    if (path.length < 2) return noop();
    const grandparentPath = parentPath.slice(0, -1);
    const parentIdx = parentPath[parentPath.length - 1]!;
    const insertionIdx = parentIdx + 1;
    const grandparentKey =
      grandparentPath.length === 0 ? null : getNodeAtPath(baseline, grandparentPath)?.key ?? null;
    if (
      canMove &&
      !canMove({ movedKeys: [movingKey], targetParentKey: grandparentKey, targetIndex: insertionIdx, mode: "live" })
    ) {
      return noop();
    }
    const { next: afterRemove, removed } = removeAtPath(baseline, path);
    if (!removed) return noop();
    const inserted = insertAtPath(afterRemove, grandparentPath.concat(insertionIdx), removed);
    return build(inserted, priorEphemeral);
  }

  if (action.type === "indent") {
    if (idx === 0) return noop();
    const prevSiblingPath = [...parentPath, idx - 1];
    const prevSibling = getNodeAtPath(baseline, prevSiblingPath);
    if (!prevSibling) return noop();
    const targetIndex = prevSibling.children?.length ?? 0;
    if (
      canMove &&
      !canMove({ movedKeys: [movingKey], targetParentKey: prevSibling.key, targetIndex, mode: "live" })
    ) {
      return noop();
    }

    // First: remove moving from its current location.
    const { next: afterRemove, removed } = removeAtPath(baseline, path);
    if (!removed) return noop();

    // After removal, prevSiblingPath is still valid (we only shifted items at or after `idx`
    // in the same sibling list; prev sibling sits at idx-1, unaffected).
    // Handle auto-expand + leaf-to-folder.
    let ephemeralOut = priorEphemeral;
    let afterExpand = afterRemove;
    const prevAfterRemove = getNodeAtPath(afterRemove, prevSiblingPath);
    if (!prevAfterRemove) return noop();
    const hasChildrenArray = Array.isArray(prevAfterRemove.children);
    if (hasChildrenArray && prevAfterRemove.expanded === false) {
      afterExpand = setExpanded(afterRemove, prevSibling.key);
      if (!ephemeralOut || !ephemeralOut.includes(prevSibling.key)) {
        ephemeralOut = [...(ephemeralOut ?? []), prevSibling.key];
      }
    } else if (!hasChildrenArray) {
      // Leaf becomes folder: set children to [] (and mark expanded) so appendTo works.
      afterExpand = makeFolder(afterRemove, prevSibling.key);
    }

    const appendIdx = getNodeAtPath(afterExpand, prevSiblingPath)?.children?.length ?? 0;
    const inserted = insertAtPath(afterExpand, [...prevSiblingPath, appendIdx], removed);
    return build(inserted, ephemeralOut);
  }

  return build(baseline, priorEphemeral);
}

function findPath(tree: TreeNode[], key: string): number[] | null {
  for (let i = 0; i < tree.length; i++) {
    const n = tree[i]!;
    if (n.key === key) return [i];
    if (n.children) {
      const sub = findPath(n.children, key);
      if (sub) return [i, ...sub];
    }
  }
  return null;
}

function getNodeAtPath(tree: TreeNode[], path: number[]): TreeNode | null {
  if (path.length === 0) return null;
  let list: TreeNode[] | undefined = tree;
  let node: TreeNode | null = null;
  for (const i of path) {
    if (!list || i < 0 || i >= list.length) return null;
    node = list[i]!;
    list = node.children;
  }
  return node;
}

function getParentPath(path: number[]): number[] {
  return path.slice(0, -1);
}

function removeAtPath(
  tree: TreeNode[],
  path: number[],
): { next: TreeNode[]; removed: TreeNode | null } {
  if (path.length === 0) return { next: tree, removed: null };
  const [head, ...rest] = path;
  const idx = head!;
  if (idx < 0 || idx >= tree.length) return { next: tree, removed: null };
  if (rest.length === 0) {
    const removed = tree[idx]!;
    const next = tree.slice(0, idx).concat(tree.slice(idx + 1));
    return { next, removed };
  }
  const child = tree[idx]!;
  const childChildren = child.children ?? [];
  const { next: nextChildren, removed } = removeAtPath(childChildren, rest);
  if (!removed) return { next: tree, removed: null };
  const nextNode: TreeNode = { ...child, children: nextChildren };
  const next = tree.slice();
  next[idx] = nextNode;
  return { next, removed };
}

function insertAtPath(tree: TreeNode[], path: number[], node: TreeNode): TreeNode[] {
  if (path.length === 0) return tree;
  const [head, ...rest] = path;
  const idx = head!;
  if (rest.length === 0) {
    const clamped = Math.max(0, Math.min(idx, tree.length));
    const next = tree.slice(0, clamped).concat([node], tree.slice(clamped));
    return next;
  }
  if (idx < 0 || idx >= tree.length) return tree;
  const child = tree[idx]!;
  const childChildren = child.children ?? [];
  const nextChildren = insertAtPath(childChildren, rest, node);
  const nextNode: TreeNode = { ...child, children: nextChildren };
  const next = tree.slice();
  next[idx] = nextNode;
  return next;
}

function swapSiblings(tree: TreeNode[], parentPath: number[], i: number, j: number): TreeNode[] {
  if (parentPath.length === 0) {
    const next = tree.slice();
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    return next;
  }
  const [head, ...rest] = parentPath;
  const headIdx = head!;
  const child = tree[headIdx]!;
  const childChildren = child.children ?? [];
  const nextChildren = swapSiblings(childChildren, rest, i, j);
  const nextNode: TreeNode = { ...child, children: nextChildren };
  const next = tree.slice();
  next[headIdx] = nextNode;
  return next;
}

function setExpanded(tree: TreeNode[], key: string): TreeNode[] {
  let changed = false;
  const next = tree.map((n) => {
    if (n.key === key) {
      changed = true;
      return { ...n, expanded: true };
    }
    if (n.children) {
      const nextChildren = setExpanded(n.children, key);
      if (nextChildren !== n.children) {
        changed = true;
        return { ...n, children: nextChildren };
      }
    }
    return n;
  });
  return changed ? next : tree;
}

function makeFolder(tree: TreeNode[], key: string): TreeNode[] {
  let changed = false;
  const next = tree.map((n) => {
    if (n.key === key) {
      changed = true;
      return { ...n, expanded: true, children: n.children ?? [] };
    }
    if (n.children) {
      const nextChildren = makeFolder(n.children, key);
      if (nextChildren !== n.children) {
        changed = true;
        return { ...n, children: nextChildren };
      }
    }
    return n;
  });
  return changed ? next : tree;
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
