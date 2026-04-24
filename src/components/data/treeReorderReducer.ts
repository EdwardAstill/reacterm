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
  _canMove?: (ctx: MoveContext) => boolean,
  _priorScratch?: TreeNode[],
  _priorEphemeral?: string[],
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
    // Motion + commit handled in later tasks; fall through unchanged for now.
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
