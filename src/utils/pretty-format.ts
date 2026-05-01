import type { StormColors } from "../theme/colors.js";

export interface Line {
  text: string;
  color?: string;
  bold?: boolean;
  /** JSON path for this line (used for collapse tracking). */
  path?: string;
  /** Whether this line is the opening of a collapsible node. */
  collapsible?: boolean;
  /** Whether this is an inline collapsed representation. */
  isCollapsed?: boolean;
}

export function formatValue(
  data: unknown,
  indent: number,
  useColor: boolean,
  maxDepth: number,
  currentDepth: number,
  prefix: string,
  currentPath: string,
  collapsedPaths: Set<string>,
  colors: StormColors,
  visited: Set<object> = new Set(),
): Line[] {
  const pad = " ".repeat(currentDepth * indent);
  const innerPad = " ".repeat((currentDepth + 1) * indent);

  if (data === null) {
    return [{ text: `${prefix}null`, ...(useColor ? { color: colors.text.dim } : {}), path: currentPath }];
  }

  if (data === undefined) {
    return [{ text: `${prefix}undefined`, ...(useColor ? { color: colors.text.dim } : {}), path: currentPath }];
  }

  if (typeof data === "string") {
    return [{ text: `${prefix}"${data}"`, ...(useColor ? { color: colors.success } : {}), path: currentPath }];
  }

  if (typeof data === "number") {
    return [{ text: `${prefix}${data}`, ...(useColor ? { color: colors.brand.light } : {}), path: currentPath }];
  }

  if (typeof data === "boolean") {
    return [{ text: `${prefix}${data}`, ...(useColor ? { color: colors.brand.primary } : {}), path: currentPath }];
  }

  if (currentDepth >= maxDepth) {
    return [{ text: `${prefix}...`, ...(useColor ? { color: colors.text.dim } : {}), path: currentPath }];
  }

  if (Array.isArray(data)) {
    if (visited.has(data)) {
      return [{ text: `${prefix}[Circular]`, ...(useColor ? { color: colors.text.dim } : {}), path: currentPath }];
    }
    visited.add(data);
    if (data.length === 0) {
      return [{ text: `${prefix}[]`, path: currentPath }];
    }

    if (collapsedPaths.has(currentPath)) {
      return [{
        text: `${prefix}[...${data.length}]`,
        ...(useColor ? { color: colors.text.dim } : {}),
        path: currentPath,
        collapsible: true,
        isCollapsed: true,
      }];
    }

    const lines: Line[] = [];
    lines.push({ text: `${prefix}[`, path: currentPath, collapsible: true });
    for (let i = 0; i < data.length; i++) {
      const comma = i < data.length - 1 ? "," : "";
      const itemPath = `${currentPath}[${i}]`;
      const itemLines = formatValue(data[i], indent, useColor, maxDepth, currentDepth + 1, innerPad, itemPath, collapsedPaths, colors, visited);
      if (itemLines.length === 1) {
        lines.push({ ...itemLines[0]!, text: itemLines[0]!.text + comma });
      } else {
        for (let j = 0; j < itemLines.length; j++) {
          if (j === itemLines.length - 1) {
            lines.push({ ...itemLines[j]!, text: itemLines[j]!.text + comma });
          } else {
            lines.push(itemLines[j]!);
          }
        }
      }
    }
    lines.push({ text: `${pad}]`, path: currentPath });
    return lines;
  }

  if (typeof data === "object") {
    if (visited.has(data as object)) {
      return [{ text: `${prefix}[Circular]`, ...(useColor ? { color: colors.text.dim } : {}), path: currentPath }];
    }
    visited.add(data as object);
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) {
      return [{ text: `${prefix}{}`, path: currentPath }];
    }

    if (collapsedPaths.has(currentPath)) {
      return [{
        text: `${prefix}{...${entries.length}}`,
        ...(useColor ? { color: colors.text.dim } : {}),
        path: currentPath,
        collapsible: true,
        isCollapsed: true,
      }];
    }

    const lines: Line[] = [];
    lines.push({ text: `${prefix}{`, path: currentPath, collapsible: true });
    for (let i = 0; i < entries.length; i++) {
      const [key, val] = entries[i]!;
      const comma = i < entries.length - 1 ? "," : "";
      const valPath = `${currentPath}.${key}`;
      const valLines = formatValue(val, indent, useColor, maxDepth, currentDepth + 1, "", valPath, collapsedPaths, colors, visited);
      if (valLines.length === 1) {
        lines.push({
          text: `${innerPad}${key}: ${valLines[0]!.text.trimStart()}${comma}`,
          ...(valLines[0]!.color ? { color: valLines[0]!.color } : {}),
          ...(valLines[0]!.collapsible ? { path: valPath, collapsible: valLines[0]!.collapsible } : {}),
        });
      } else {
        lines.push({
          text: `${innerPad}${key}: ${valLines[0]!.text.trimStart()}`,
          ...(valLines[0]!.collapsible ? { path: valPath, collapsible: valLines[0]!.collapsible } : {}),
        });
        for (let j = 1; j < valLines.length; j++) {
          if (j === valLines.length - 1) {
            lines.push({ ...valLines[j]!, text: valLines[j]!.text + comma });
          } else {
            lines.push(valLines[j]!);
          }
        }
      }
    }
    lines.push({ text: `${pad}}`, path: currentPath });
    return lines;
  }

  return [{ text: `${prefix}${String(data)}`, path: currentPath }];
}
