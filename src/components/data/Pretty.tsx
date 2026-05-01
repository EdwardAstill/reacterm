import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import type { KeyEvent } from "../../input/types.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { renderHighlightedText } from "../../utils/highlight.js";
import { formatValue } from "../../utils/pretty-format.js";

export interface PrettyProps {
  data: unknown;
  indent?: number;
  color?: boolean;
  maxDepth?: number;
  /** Enable interactive mode: collapse/expand objects and arrays. */
  interactive?: boolean;
  /** Whether the component is focused for keyboard navigation. */
  isFocused?: boolean;
  /** When provided, highlight all matching text (case-insensitive) in the JSON output with inverse styling. */
  searchQuery?: string;
  /** Custom value renderer. Return null to use default rendering. */
  renderValue?: (value: unknown, path: string, depth: number) => React.ReactNode | null;
}

export interface PrettyContextValue {
  collapsedPaths: ReadonlySet<string>;
  toggleCollapsed: (path: string) => void;
  cursor: number;
  setCursor: (index: number) => void;
}

export const PrettyContext = createContext<PrettyContextValue | null>(null);

export function usePrettyContext(): PrettyContextValue {
  const ctx = useContext(PrettyContext);
  if (!ctx) throw new Error("Pretty sub-components must be used inside Pretty.Root");
  return ctx;
}

export interface PrettyRootProps {
  collapsedPaths?: ReadonlySet<string>;
  onToggleCollapsed?: (path: string) => void;
  cursor?: number;
  onCursorChange?: (index: number) => void;
  children: React.ReactNode;
}

function PrettyRoot({
  collapsedPaths = new Set(),
  onToggleCollapsed,
  cursor = 0,
  onCursorChange,
  children,
}: PrettyRootProps): React.ReactElement {
  const { requestRender } = useTui();
  const onToggleRef = useRef(onToggleCollapsed);
  onToggleRef.current = onToggleCollapsed;
  const onCursorRef = useRef(onCursorChange);
  onCursorRef.current = onCursorChange;

  const ctx: PrettyContextValue = {
    collapsedPaths,
    toggleCollapsed: (p: string) => { onToggleRef.current?.(p); requestRender(); },
    cursor,
    setCursor: (i: number) => { onCursorRef.current?.(i); requestRender(); },
  };

  return React.createElement(
    PrettyContext.Provider,
    { value: ctx },
    React.createElement("tui-box", { flexDirection: "column" }, children),
  );
}

export interface PrettyCompoundNodeProps {
  text: string;
  path?: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
  color?: string;
  bold?: boolean;
  children?: React.ReactNode;
}

function PrettyCompoundNode({ text, path, collapsible, isCollapsed, color, bold, children }: PrettyCompoundNodeProps): React.ReactElement {
  const colors = useColors();
  const { collapsedPaths } = usePrettyContext();
  const collapsed = isCollapsed || (path ? collapsedPaths.has(path) : false);

  if (children) {
    return React.createElement("tui-box", { flexDirection: "row" }, children);
  }

  let displayText = text;
  if (collapsible) {
    const indicator = collapsed ? "\u25B8 " : "\u25BE ";
    const leading = text.match(/^(\s*)/)?.[1] ?? "";
    displayText = leading + indicator + text.trimStart();
  }

  const textProps: Record<string, unknown> = {};
  if (color) textProps.color = color;
  if (bold) textProps.bold = true;

  return React.createElement("tui-text", textProps, displayText);
}

const PrettyBase = React.memo(function Pretty(rawProps: PrettyProps): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps("Pretty", rawProps);
  const {
    data,
    indent = 2,
    color = true,
    maxDepth = 5,
    interactive = false,
    isFocused = false,
    searchQuery,
  } = props;

  const { requestRender } = useTui();
  const collapsedPathsRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef(0);

  const lines = formatValue(data, indent, color, maxDepth, 0, "", "$", collapsedPathsRef.current, colors);

  const navigableIndices: number[] = [];
  if (interactive) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.collapsible) {
        navigableIndices.push(i);
      }
    }
  }

  // Clamp cursor
  if (cursorRef.current >= navigableIndices.length) {
    cursorRef.current = Math.max(0, navigableIndices.length - 1);
  }

  const handleInput = useCallback(
    (event: KeyEvent) => {
      if (!interactive || navigableIndices.length === 0) return;

      if (event.key === "up") {
        if (cursorRef.current > 0) {
          cursorRef.current -= 1;
          requestRender();
        }
      } else if (event.key === "down") {
        if (cursorRef.current < navigableIndices.length - 1) {
          cursorRef.current += 1;
          requestRender();
        }
      } else if (event.key === "return" || event.key === "space") {
        const lineIdx = navigableIndices[cursorRef.current];
        if (lineIdx !== undefined) {
          const line = lines[lineIdx];
          if (line?.path) {
            if (collapsedPathsRef.current.has(line.path)) {
              collapsedPathsRef.current.delete(line.path);
            } else {
              collapsedPathsRef.current.add(line.path);
            }
            requestRender();
          }
        }
      }
    },
    [interactive, navigableIndices, lines, requestRender],
  );

  useInput(handleInput, { isActive: interactive && isFocused });

  const currentNavigableLineIdx = navigableIndices.length > 0
    ? navigableIndices[cursorRef.current]
    : -1;

  // Count search matches across all lines
  const hasSearch = searchQuery !== undefined && searchQuery.length > 0;
  let totalMatches = 0;
  if (hasSearch) {
    const lowerQuery = searchQuery!.toLowerCase();
    for (const line of lines) {
      let searchIdx = 0;
      const lowerText = line.text.toLowerCase();
      while (searchIdx < lowerText.length) {
        const found = lowerText.indexOf(lowerQuery, searchIdx);
        if (found === -1) break;
        totalMatches += 1;
        searchIdx = found + lowerQuery.length;
      }
    }
  }

  // renderWithHighlights is now the shared renderHighlightedText from ../utils/highlight.js

  const children: React.ReactElement[] = [];

  // Show match count header when searching
  if (hasSearch) {
    children.push(
      React.createElement(
        "tui-text",
        { key: "__match-count", color: colors.brand.primary, bold: true },
        `${totalMatches} match${totalMatches === 1 ? "" : "es"}`,
      ),
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Try custom renderValue if provided
    if (props.renderValue && line.path) {
      const pathDepth = (line.path.match(/\./g) || []).length + (line.path.match(/\[/g) || []).length;
      const customResult = props.renderValue(line.text, line.path, pathDepth);
      if (customResult !== null) {
        children.push(
          React.createElement("tui-box", { key: i, flexDirection: "row" }, customResult),
        );
        continue;
      }
    }

    const textProps: Record<string, unknown> = {};
    if (line.color) {
      textProps.color = line.color;
    }
    if (line.bold) {
      textProps.bold = true;
    }

    const isCurrentNode = interactive && isFocused && i === currentNavigableLineIdx;
    if (isCurrentNode) {
      textProps.inverse = true;
      textProps.bold = true;
    }

    // Add collapse indicator for collapsible lines
    let displayText = line.text;
    if (interactive && line.collapsible) {
      const collapsed = line.isCollapsed || (line.path ? collapsedPathsRef.current.has(line.path) : false);
      const indicator = collapsed ? "\u25B8 " : "\u25BE "; // ▸ or ▾
      displayText = indicator + displayText.trimStart();
      // Preserve original indentation
      const leading = line.text.match(/^(\s*)/)?.[1] ?? "";
      displayText = leading + displayText;
    }

    if (hasSearch && !isCurrentNode) {
      const segments = renderHighlightedText(displayText, searchQuery!, textProps, i);
      children.push(
        React.createElement("tui-box", { key: i, flexDirection: "row" }, ...segments),
      );
    } else {
      children.push(React.createElement("tui-text", { ...textProps, key: i }, displayText));
    }
  }

  return React.createElement(
    "tui-box",
    { flexDirection: "column", role: "document" },
    ...children,
  );
});

export const Pretty = Object.assign(PrettyBase, {
  Root: PrettyRoot,
  Node: PrettyCompoundNode,
});
