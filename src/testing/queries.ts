import type { TestMetadata, TestSemanticNode } from "./metadata.js";

export type TextMatcher = string | RegExp;

export interface RoleQuery {
  role: string;
  name?: TextMatcher;
}

export type ClickTarget =
  | { x: number; y: number }
  | { role: string; name?: TextMatcher }
  | { label: TextMatcher }
  | { text: TextMatcher }
  | { testId: string };

export function getByText(metadata: TestMetadata, text: TextMatcher): TestSemanticNode {
  const found = queryByText(metadata, text);
  if (!found) throw queryError(`Unable to find text ${describeMatcher(text)}`, metadata);
  return found;
}

export function queryByText(metadata: TestMetadata, text: TextMatcher): TestSemanticNode | null {
  return metadata.semanticNodes.find((node) => matches(text, node.text) || (node.label !== undefined && matches(text, node.label))) ?? null;
}

export function getByRole(metadata: TestMetadata, role: string, options?: { name?: TextMatcher }): TestSemanticNode {
  const found = metadata.semanticNodes.find((node) =>
    node.role === role &&
    (options?.name === undefined || matches(options.name, node.label ?? node.text)),
  );
  if (!found) {
    const suffix = options?.name === undefined ? "" : ` named ${describeMatcher(options.name)}`;
    throw queryError(`Unable to find role "${role}"${suffix}`, metadata);
  }
  return found;
}

export function getByLabel(metadata: TestMetadata, label: TextMatcher): TestSemanticNode {
  const found = metadata.semanticNodes.find((node) => node.label !== undefined && matches(label, node.label));
  if (!found) throw queryError(`Unable to find label ${describeMatcher(label)}`, metadata);
  return found;
}

export function getByTestId(metadata: TestMetadata, testId: string): TestSemanticNode {
  const found = metadata.semanticNodes.find((node) => node.testId === testId);
  if (!found) throw queryError(`Unable to find testId "${testId}"`, metadata);
  return found;
}

export function getFocused(metadata: TestMetadata): TestSemanticNode | null {
  if (metadata.focusedId === null) return null;
  return metadata.semanticNodes.find((node) => node.focusId === metadata.focusedId) ?? null;
}

export function resolveClickTarget(metadata: TestMetadata, target: ClickTarget): { x: number; y: number } {
  if ("x" in target) return { x: target.x, y: target.y };

  if ("text" in target) {
    const semantic = queryByText(metadata, target.text);
    if (semantic !== null) return centerOf(semantic);
    const point = findTextPoint(metadata, target.text);
    if (point !== null) return point;
    throw queryError(`Unable to find text ${describeMatcher(target.text)}`, metadata);
  }

  const node =
    "role" in target ? getByRole(metadata, target.role, target.name === undefined ? undefined : { name: target.name }) :
    "label" in target ? getByLabel(metadata, target.label) :
    getByTestId(metadata, target.testId);

  return centerOf(node);
}

function centerOf(node: TestSemanticNode): { x: number; y: number } {
  const width = Math.max(1, node.bounds.width);
  const height = Math.max(1, node.bounds.height);
  return {
    x: node.bounds.x + Math.floor(width / 2),
    y: node.bounds.y + Math.floor(height / 2),
  };
}

function findTextPoint(metadata: TestMetadata, matcher: TextMatcher): { x: number; y: number } | null {
  const output = metadata.frames.at(-1)?.output ?? "";
  const lines = output.split("\n");
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y] ?? "";
    if (typeof matcher === "string") {
      const x = line.indexOf(matcher);
      if (x >= 0) return { x, y };
    } else {
      const match = matcher.exec(line);
      if (match?.index !== undefined) return { x: match.index, y };
    }
  }
  return null;
}

export function matches(matcher: TextMatcher, value: string): boolean {
  return typeof matcher === "string" ? value.includes(matcher) : matcher.test(value);
}

function describeMatcher(matcher: TextMatcher): string {
  return typeof matcher === "string" ? `"${matcher}"` : String(matcher);
}

function queryError(message: string, metadata: TestMetadata): Error {
  const nodes = metadata.semanticNodes
    .map((node) => `- ${node.role ?? node.type}${node.label ? ` "${node.label}"` : ""}: ${node.text}`)
    .join("\n");
  return new Error(`${message}.\n\nSemantic nodes:\n${nodes}`);
}
