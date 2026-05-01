import type { RenderContext } from "../core/render-context.js";
import type { FocusableEntry } from "../core/focus.js";
import type { TuiElement, TuiRoot, TuiTextNode } from "../reconciler/types.js";

export interface TestBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TestFrame {
  index: number;
  output: string;
  styledOutput: string;
  screenHash: string;
  width: number;
  height: number;
}

export interface TestSemanticNode {
  id: string;
  type: string;
  role?: string;
  label?: string;
  testId?: string;
  text: string;
  focusId?: string;
  bounds: TestBounds;
  props: Record<string, unknown>;
}

export interface TestFocusableEntry {
  id: string;
  type: "input" | "scroll";
  bounds: TestBounds;
  disabled?: boolean;
  tabIndex?: number;
  groupId?: string;
}

export interface TestMetadata {
  frames: TestFrame[];
  semanticNodes: TestSemanticNode[];
  focusableEntries: TestFocusableEntry[];
  focusedId: string | null;
  warnings: string[];
  errors: string[];
  screenHash: string;
}

export function screenHash(output: string): string {
  let hash = 2166136261;
  for (let i = 0; i < output.length; i++) {
    hash ^= output.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

export function createFrame(
  index: number,
  output: string,
  styledOutput: string,
  width: number,
  height: number,
): TestFrame {
  return {
    index,
    output,
    styledOutput,
    screenHash: screenHash(output),
    width,
    height,
  };
}

export function collectTestMetadata(options: {
  root: TuiRoot;
  renderContext: RenderContext;
  frames: TestFrame[];
  warnings: string[];
  errors: string[];
  screenHash: string;
}): TestMetadata {
  const semanticNodes: TestSemanticNode[] = [];
  let nextId = 0;
  for (const child of options.root.children) {
    collectNode(child, semanticNodes, () => `node-${nextId++}`);
  }

  return {
    frames: [...options.frames],
    semanticNodes,
    focusableEntries: Array.from(options.renderContext.focus.entries.values()).map(toTestFocusableEntry),
    focusedId: options.renderContext.focus.focused,
    warnings: [...options.warnings],
    errors: [...options.errors],
    screenHash: options.screenHash,
  };
}

function collectNode(
  node: TuiElement | TuiTextNode,
  out: TestSemanticNode[],
  nextId: () => string,
): string {
  if (node.type === "TEXT_NODE") return node.text;

  const childText = node.children.map((child) => collectNode(child, out, nextId)).join("");
  const role = stringProp(node.props, "role");
  const label = stringProp(node.props, "aria-label");
  const testId =
    stringProp(node.props, "testId") ??
    stringProp(node.props, "data-testid") ??
    stringProp(node.props, "dataTestId");
  const focusId = stringProp(node.props, "_focusId");

  if (role !== undefined || label !== undefined || testId !== undefined || focusId !== undefined) {
    const semanticNode: TestSemanticNode = {
      id: nextId(),
      type: node.type,
      text: childText,
      bounds: layoutBounds(node),
      props: copyPublicProps(node.props),
    };
    if (role !== undefined) semanticNode.role = role;
    if (label !== undefined) semanticNode.label = label;
    if (testId !== undefined) semanticNode.testId = testId;
    if (focusId !== undefined) semanticNode.focusId = focusId;
    out.push(semanticNode);
  }

  return childText;
}

function layoutBounds(node: TuiElement): TestBounds {
  const layout = node.layoutNode.layout;
  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  };
}

function toTestFocusableEntry(entry: FocusableEntry): TestFocusableEntry {
  const out: TestFocusableEntry = {
    id: entry.id,
    type: entry.type,
    bounds: { ...entry.bounds },
  };
  if (entry.disabled !== undefined) out.disabled = entry.disabled;
  if (entry.tabIndex !== undefined) out.tabIndex = entry.tabIndex;
  if (entry.groupId !== undefined) out.groupId = entry.groupId;
  return out;
}

function stringProp(props: Record<string, unknown>, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function copyPublicProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") continue;
    if (typeof value === "function") continue;
    out[key] = value;
  }
  return out;
}
