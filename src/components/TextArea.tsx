/**
 * TextArea — multi-line text editor with cursor, selection, scrolling,
 * undo/redo, word navigation, line numbers, and optional syntax highlighting.
 *
 * All handlers registered ONCE eagerly. Uses refs for latest props.
 * No useEffect for event handlers (cleanup doesn't fire in our reconciler).
 *
 * Internal model: lines[] split on "\n". Cursor is (row, col). Selection
 * stored as (startRow, startCol, endRow, endCol). Scroll offset tracks the
 * first visible line. Rendering builds tui-text elements per visible line,
 * with inverse segments for cursor/selection and optional line-number gutter.
 */

import React, { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "../hooks/useCleanup.js";
import { useColors } from "../hooks/useColors.js";
import { usePersonality } from "../core/personality.js";
import { usePluginProps } from "../hooks/usePluginProps.js";
import { ScrollView } from "./ScrollView.js";
import type { StormLayoutStyleProps } from "../styles/styleProps.js";

// ── Types ──────────────────────────────────────────────────────────

/** A colored span returned by user-provided syntax highlighters. */
export interface HighlightSpan {
  text: string;
  color?: string | number;
  bold?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export interface TextAreaProps extends StormLayoutStyleProps {
  /** Current text value (controlled). */
  value: string;
  /** Called on every text change with the full new value. */
  onChange: (value: string) => void;
  /** Called when the submit key is pressed (default: ctrl+enter). */
  onSubmit?: (value: string) => void;
  /** Key combo that triggers onSubmit. @default "ctrl+enter" */
  submitKey?: "ctrl+enter" | "meta+enter" | "ctrl+s";
  /** Placeholder shown when value is empty. */
  placeholder?: string;
  /** Whether the component is focused. @default true */
  isFocused?: boolean;
  /** Read-only mode — cursor moves but text cannot be edited. */
  readOnly?: boolean;
  /** When true, input is non-interactive (no cursor, no key handling). */
  disabled?: boolean;
  /** Show line numbers in a left gutter. @default false */
  lineNumbers?: boolean;
  /** Enable soft word wrapping at the editor width. @default false */
  wordWrap?: boolean;
  /** Number of spaces inserted for Tab key. @default 2 */
  tabSize?: number;
  /** Maximum visible lines before scrolling. When undefined, grows unbounded. */
  maxLines?: number;
  /** Maximum character count. */
  maxLength?: number;
  /** Text color. */
  color?: string | number;
  /** Placeholder text color. */
  placeholderColor?: string | number;
  /** Line number gutter color. */
  lineNumberColor?: string | number;
  /** Called when text selection changes. */
  onSelectionChange?: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  /** Optional syntax highlighter — receives a line of text and its 0-based index,
   *  returns an array of colored spans whose text concatenated equals the input line. */
  highlight?: (line: string, lineIndex: number) => HighlightSpan[];
  /** Flex sizing. */
  flex?: number;
  "aria-label"?: string;
}

// ── Cursor position type ───────────────────────────────────────────

interface Pos {
  row: number;
  col: number;
}

// ── Helpers ────────────────────────────────────────────────────────

/** Split text into lines on newline boundaries. Always returns at least one line. */
function splitLines(text: string): string[] {
  const lines = text.split("\n");
  return lines.length === 0 ? [""] : lines;
}

/** Join lines back into a single string. */
function joinLines(lines: string[]): string {
  return lines.join("\n");
}

/** Clamp a position to valid bounds within the given lines array. */
function clampPos(pos: Pos, lines: string[]): Pos {
  const row = Math.max(0, Math.min(pos.row, lines.length - 1));
  const col = Math.max(0, Math.min(pos.col, lines[row]!.length));
  return { row, col };
}

/** Compare two positions. Returns <0 if a before b, 0 if equal, >0 if a after b. */
function comparePos(a: Pos, b: Pos): number {
  if (a.row !== b.row) return a.row - b.row;
  return a.col - b.col;
}

/** Return the earlier and later of two positions (selection-order independent). */
function orderedSelection(a: Pos, b: Pos): { start: Pos; end: Pos } {
  return comparePos(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/** Convert (row, col) to a flat character offset within the joined text. */
function posToOffset(pos: Pos, lines: string[]): number {
  let offset = 0;
  for (let r = 0; r < pos.row && r < lines.length; r++) {
    offset += lines[r]!.length + 1; // +1 for \n
  }
  return offset + Math.min(pos.col, lines[pos.row]?.length ?? 0);
}

/** Find the start of the current word (for ctrl+left). */
function wordLeft(line: string, col: number): number {
  let c = col;
  // Skip whitespace
  while (c > 0 && /\s/.test(line[c - 1]!)) c--;
  // Skip word chars
  while (c > 0 && !/\s/.test(line[c - 1]!)) c--;
  return c;
}

/** Find the end of the current word (for ctrl+right). */
function wordRight(line: string, col: number): number {
  let c = col;
  // Skip word chars
  while (c < line.length && !/\s/.test(line[c]!)) c++;
  // Skip whitespace
  while (c < line.length && /\s/.test(line[c]!)) c++;
  return c;
}

// ── Component ──────────────────────────────────────────────────────

let textAreaCounter = 0;

export const TextArea = React.memo(function TextArea(rawProps: TextAreaProps): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps("TextArea", rawProps as unknown as Record<string, unknown>) as unknown as TextAreaProps;
  const personality = usePersonality();

  const {
    value,
    onChange,
    onSubmit,
    submitKey = "ctrl+enter",
    placeholder,
    isFocused: isFocusedProp = true,
    readOnly = false,
    disabled = false,
    lineNumbers = false,
    wordWrap = false,
    tabSize = 2,
    maxLines,
    maxLength,
    color: colorProp,
    placeholderColor,
    lineNumberColor,
    highlight,
    "aria-label": ariaLabel,
    ...layoutProps
  } = props;

  const color = colorProp ?? colors.text.primary;

  const { input, focus, requestRender, screen } = useTui();

  // ── Refs for mutable state ─────────────────────────────────────

  const linesRef = useRef<string[]>(splitLines(value));
  const cursorRef = useRef<Pos>({ row: 0, col: 0 });
  const scrollOffsetRef = useRef(0);
  const selAnchorRef = useRef<Pos | null>(null); // selection anchor (where shift-select started)
  const selEndRef = useRef<Pos | null>(null);     // selection moving end
  const undoStackRef = useRef<Array<{ lines: string[]; cursor: Pos }>>([]);
  const redoStackRef = useRef<Array<{ lines: string[]; cursor: Pos }>>([]);
  const idRef = useRef(`textarea-${textAreaCounter++}`);
  const unsubKeyRef = useRef<(() => void) | null>(null);
  const unsubPasteRef = useRef<(() => void) | null>(null);
  /** Tracks the "desired" column when moving vertically through lines of different lengths. */
  const stickyColRef = useRef<number | null>(null);

  // ── Refs for latest prop values ────────────────────────────────

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const isFocusedRef = useRef(isFocusedProp);
  isFocusedRef.current = isFocusedProp;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const tabSizeRef = useRef(tabSize);
  tabSizeRef.current = tabSize;
  const maxLengthRef = useRef(maxLength);
  maxLengthRef.current = maxLength;
  const maxLinesRef = useRef(maxLines);
  maxLinesRef.current = maxLines;
  const submitKeyRef = useRef(submitKey);
  submitKeyRef.current = submitKey;
  const onSelectionChangeRef = useRef(props.onSelectionChange);
  onSelectionChangeRef.current = props.onSelectionChange;

  // ── Sync lines from value prop ─────────────────────────────────

  // Always keep linesRef in sync with the controlled value.
  // This runs on every render (no stale data).
  const newLines = splitLines(value);
  linesRef.current = newLines;

  // Clamp cursor to valid position if value changed externally
  const cursor = cursorRef.current;
  if (cursor.row >= newLines.length || cursor.col > (newLines[cursor.row]?.length ?? 0)) {
    cursorRef.current = clampPos(cursor, newLines);
  }

  // ── Focus registration ─────────────────────────────────────────

  const focusRegistered = useRef(false);
  if (!focusRegistered.current) {
    focusRegistered.current = true;
    focus.register({
      id: idRef.current,
      type: "input",
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    });
    if (isFocusedProp) focus.focus(idRef.current);
  }

  // ── Key handler (registered ONCE) ──────────────────────────────

  const keyRegistered = useRef(false);
  if (!keyRegistered.current) {
    keyRegistered.current = true;

    // ── Selection helpers ───────────────────────────────────────

    const hasSelection = (): boolean => {
      const a = selAnchorRef.current;
      const e = selEndRef.current;
      return a !== null && e !== null && comparePos(a, e) !== 0;
    };

    const clearSelection = () => {
      if (selAnchorRef.current !== null || selEndRef.current !== null) {
        selAnchorRef.current = null;
        selEndRef.current = null;
        onSelectionChangeRef.current?.(0, 0, 0, 0);
      }
    };

    const setSelection = (anchor: Pos, end: Pos) => {
      selAnchorRef.current = { ...anchor };
      selEndRef.current = { ...end };
      const { start, end: e } = orderedSelection(anchor, end);
      onSelectionChangeRef.current?.(start.row, start.col, e.row, e.col);
    };

    /** Delete selected text from lines, return new lines and cursor. */
    const deleteSelection = (lines: string[]): { lines: string[]; cursor: Pos } => {
      const { start, end } = orderedSelection(selAnchorRef.current!, selEndRef.current!);
      clearSelection();
      const before = lines[start.row]!.slice(0, start.col);
      const after = lines[end.row]!.slice(end.col);
      const newLines = [
        ...lines.slice(0, start.row),
        before + after,
        ...lines.slice(end.row + 1),
      ];
      return { lines: newLines, cursor: { ...start } };
    };

    /** Get the selected text as a string. */
    const getSelectedText = (lines: string[]): string => {
      if (!hasSelection()) return "";
      const { start, end } = orderedSelection(selAnchorRef.current!, selEndRef.current!);
      if (start.row === end.row) {
        return lines[start.row]!.slice(start.col, end.col);
      }
      const parts: string[] = [];
      parts.push(lines[start.row]!.slice(start.col));
      for (let r = start.row + 1; r < end.row; r++) {
        parts.push(lines[r]!);
      }
      parts.push(lines[end.row]!.slice(0, end.col));
      return parts.join("\n");
    };

    // ── Undo/redo helpers ──────────────────────────────────────

    const pushUndo = (lines: string[], cursor: Pos) => {
      undoStackRef.current.push({ lines: [...lines], cursor: { ...cursor } });
      if (undoStackRef.current.length > 200) undoStackRef.current.shift();
      redoStackRef.current.length = 0;
    };

    // ── Emit change ────────────────────────────────────────────

    const emitChange = (lines: string[]) => {
      const newVal = joinLines(lines);
      if (newVal !== valueRef.current) {
        linesRef.current = lines;
        onChangeRef.current(newVal);
      }
    };

    // ── Scroll adjustment ──────────────────────────────────────

    const ensureCursorVisible = (cursorRow: number) => {
      const ml = maxLinesRef.current;
      if (ml === undefined) {
        // No max height, no scroll needed
        scrollOffsetRef.current = 0;
        return;
      }
      if (cursorRow < scrollOffsetRef.current) {
        scrollOffsetRef.current = cursorRow;
      } else if (cursorRow >= scrollOffsetRef.current + ml) {
        scrollOffsetRef.current = cursorRow - ml + 1;
      }
    };

    // ── Submit check ───────────────────────────────────────────

    const isSubmitKey = (event: any): boolean => {
      const sk = submitKeyRef.current;
      if (sk === "ctrl+enter" && event.ctrl && event.key === "return") return true;
      if (sk === "meta+enter" && event.meta && event.key === "return") return true;
      if (sk === "ctrl+s" && event.ctrl && event.key === "s") return true;
      return false;
    };

    // ── Main key handler ───────────────────────────────────────

    unsubKeyRef.current = input.onKey((event) => {
      if (!isFocusedRef.current) return;
      if (disabledRef.current) return;

      let lines = linesRef.current;
      let cur = { ...cursorRef.current };
      const prevLines = lines;
      const prevCursor = { ...cur };

      // Submit key
      if (isSubmitKey(event)) {
        clearSelection();
        onSubmitRef.current?.(joinLines(lines));
        requestRender();
        return;
      }

      // Ctrl+A — select all
      if (event.ctrl && event.key === "a") {
        const lastRow = lines.length - 1;
        setSelection({ row: 0, col: 0 }, { row: lastRow, col: lines[lastRow]!.length });
        cursorRef.current = { row: lastRow, col: lines[lastRow]!.length };
        stickyColRef.current = null;
        requestRender();
        return;
      }

      // Ctrl+C — copy (write selected text to clipboard via process.stdout)
      if (event.ctrl && event.key === "c") {
        // Copy is handled via terminal OSC52 or external clipboard integration.
        // We expose the text for the system to handle. No mutation needed.
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (check BEFORE undo)
      if ((event.ctrl && event.key === "y") || (event.ctrl && event.shift && event.key === "z")) {
        if (readOnlyRef.current) return;
        clearSelection();
        const stack = redoStackRef.current;
        if (stack.length === 0) return;
        undoStackRef.current.push({ lines: [...lines], cursor: { ...cur } });
        const state = stack.pop()!;
        linesRef.current = state.lines;
        cursorRef.current = { ...state.cursor };
        stickyColRef.current = null;
        ensureCursorVisible(state.cursor.row);
        emitChange(state.lines);
        requestRender();
        return;
      }

      // Undo: Ctrl+Z
      if (event.ctrl && event.key === "z") {
        if (readOnlyRef.current) return;
        clearSelection();
        const stack = undoStackRef.current;
        if (stack.length === 0) return;
        redoStackRef.current.push({ lines: [...lines], cursor: { ...cur } });
        const state = stack.pop()!;
        linesRef.current = state.lines;
        cursorRef.current = { ...state.cursor };
        stickyColRef.current = null;
        ensureCursorVisible(state.cursor.row);
        emitChange(state.lines);
        requestRender();
        return;
      }

      // ── Shift+Ctrl word-level selection extension ──────────

      if (event.shift && (event.ctrl || event.meta)) {
        if (selAnchorRef.current === null) {
          selAnchorRef.current = { ...cur };
          selEndRef.current = { ...cur };
        }

        if (event.key === "left") {
          cur.col = wordLeft(lines[cur.row]!, cur.col);
          // If at start of line, jump to end of previous line
          if (cur.col === 0 && prevCursor.col === 0 && cur.row > 0) {
            cur.row--;
            cur.col = lines[cur.row]!.length;
          }
        } else if (event.key === "right") {
          const lineLen = lines[cur.row]!.length;
          cur.col = wordRight(lines[cur.row]!, cur.col);
          // If at end of line, jump to start of next line
          if (cur.col === lineLen && prevCursor.col === lineLen && cur.row < lines.length - 1) {
            cur.row++;
            cur.col = 0;
          }
        } else if (event.key === "up") {
          // Select to start of text
          cur = { row: 0, col: 0 };
        } else if (event.key === "down") {
          // Select to end of text
          const lastRow = lines.length - 1;
          cur = { row: lastRow, col: lines[lastRow]!.length };
        } else if (event.key === "home") {
          cur = { row: 0, col: 0 };
        } else if (event.key === "end") {
          const lastRow = lines.length - 1;
          cur = { row: lastRow, col: lines[lastRow]!.length };
        } else {
          return;
        }

        cursorRef.current = cur;
        stickyColRef.current = null;
        setSelection(selAnchorRef.current!, cur);
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      // ── Ctrl/Meta word-level navigation & deletion ─────────

      if (event.ctrl || event.meta) {
        // Delete selection on destructive ops
        if (hasSelection() && (event.key === "backspace" || event.key === "delete")) {
          if (readOnlyRef.current) return;
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
          cursorRef.current = cur;
          stickyColRef.current = null;
          ensureCursorVisible(cur.row);
          emitChange(lines);
          requestRender();
          return;
        }

        clearSelection();

        if (event.key === "left") {
          cur.col = wordLeft(lines[cur.row]!, cur.col);
          if (cur.col === 0 && prevCursor.col === 0 && cur.row > 0) {
            cur.row--;
            cur.col = lines[cur.row]!.length;
          }
        } else if (event.key === "right") {
          const lineLen = lines[cur.row]!.length;
          cur.col = wordRight(lines[cur.row]!, cur.col);
          if (cur.col === lineLen && prevCursor.col === lineLen && cur.row < lines.length - 1) {
            cur.row++;
            cur.col = 0;
          }
        } else if (event.key === "backspace") {
          if (readOnlyRef.current) return;
          pushUndo(lines, prevCursor);
          const newCol = wordLeft(lines[cur.row]!, cur.col);
          if (newCol < cur.col) {
            const line = lines[cur.row]!;
            lines = [...lines];
            lines[cur.row] = line.slice(0, newCol) + line.slice(cur.col);
            cur.col = newCol;
          } else if (cur.row > 0) {
            // At start of line — merge with previous
            const prevLen = lines[cur.row - 1]!.length;
            lines = [...lines];
            lines[cur.row - 1] = lines[cur.row - 1]! + lines[cur.row]!;
            lines.splice(cur.row, 1);
            cur.row--;
            cur.col = prevLen;
          } else {
            return;
          }
          cursorRef.current = cur;
          stickyColRef.current = null;
          ensureCursorVisible(cur.row);
          emitChange(lines);
          requestRender();
          return;
        } else if (event.key === "delete") {
          if (readOnlyRef.current) return;
          pushUndo(lines, prevCursor);
          const newCol = wordRight(lines[cur.row]!, cur.col);
          if (newCol > cur.col) {
            const line = lines[cur.row]!;
            lines = [...lines];
            lines[cur.row] = line.slice(0, cur.col) + line.slice(newCol);
          } else if (cur.row < lines.length - 1) {
            // At end of line — merge with next
            lines = [...lines];
            lines[cur.row] = lines[cur.row]! + lines[cur.row + 1]!;
            lines.splice(cur.row + 1, 1);
          } else {
            return;
          }
          cursorRef.current = cur;
          stickyColRef.current = null;
          emitChange(lines);
          requestRender();
          return;
        } else if (event.key === "home") {
          // Jump to start of document
          cur = { row: 0, col: 0 };
        } else if (event.key === "end") {
          // Jump to end of document
          const lastRow = lines.length - 1;
          cur = { row: lastRow, col: lines[lastRow]!.length };
        } else {
          return;
        }

        cursorRef.current = cur;
        stickyColRef.current = null;
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      // ── Shift+arrow extends selection ──────────────────────

      if (event.shift && (event.key === "left" || event.key === "right" ||
          event.key === "up" || event.key === "down" ||
          event.key === "home" || event.key === "end")) {
        if (selAnchorRef.current === null) {
          selAnchorRef.current = { ...cur };
          selEndRef.current = { ...cur };
        }

        if (event.key === "left") {
          if (cur.col > 0) {
            cur.col--;
          } else if (cur.row > 0) {
            cur.row--;
            cur.col = lines[cur.row]!.length;
          }
          stickyColRef.current = null;
        } else if (event.key === "right") {
          if (cur.col < lines[cur.row]!.length) {
            cur.col++;
          } else if (cur.row < lines.length - 1) {
            cur.row++;
            cur.col = 0;
          }
          stickyColRef.current = null;
        } else if (event.key === "up") {
          if (cur.row > 0) {
            if (stickyColRef.current === null) stickyColRef.current = cur.col;
            cur.row--;
            cur.col = Math.min(stickyColRef.current, lines[cur.row]!.length);
          }
        } else if (event.key === "down") {
          if (cur.row < lines.length - 1) {
            if (stickyColRef.current === null) stickyColRef.current = cur.col;
            cur.row++;
            cur.col = Math.min(stickyColRef.current, lines[cur.row]!.length);
          }
        } else if (event.key === "home") {
          cur.col = 0;
          stickyColRef.current = null;
        } else if (event.key === "end") {
          cur.col = lines[cur.row]!.length;
          stickyColRef.current = null;
        }

        cursorRef.current = cur;
        setSelection(selAnchorRef.current!, cur);
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      // ── Navigation keys ────────────────────────────────────

      if (event.key === "left") {
        // If selection was active, move cursor to selection start
        if (hasSelection()) {
          const { start } = orderedSelection(selAnchorRef.current!, selEndRef.current!);
          cur = { ...start };
          clearSelection();
        } else if (cur.col > 0) {
          cur.col--;
        } else if (cur.row > 0) {
          cur.row--;
          cur.col = lines[cur.row]!.length;
        }
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      if (event.key === "right") {
        if (hasSelection()) {
          const { end } = orderedSelection(selAnchorRef.current!, selEndRef.current!);
          cur = { ...end };
          clearSelection();
        } else if (cur.col < lines[cur.row]!.length) {
          cur.col++;
        } else if (cur.row < lines.length - 1) {
          cur.row++;
          cur.col = 0;
        }
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      if (event.key === "up") {
        clearSelection();
        if (cur.row > 0) {
          if (stickyColRef.current === null) stickyColRef.current = cur.col;
          cur.row--;
          cur.col = Math.min(stickyColRef.current, lines[cur.row]!.length);
          cursorRef.current = cur;
          ensureCursorVisible(cur.row);
          requestRender();
        }
        return;
      }

      if (event.key === "down") {
        clearSelection();
        if (cur.row < lines.length - 1) {
          if (stickyColRef.current === null) stickyColRef.current = cur.col;
          cur.row++;
          cur.col = Math.min(stickyColRef.current, lines[cur.row]!.length);
          cursorRef.current = cur;
          ensureCursorVisible(cur.row);
          requestRender();
        }
        return;
      }

      if (event.key === "home") {
        clearSelection();
        cur.col = 0;
        stickyColRef.current = null;
        cursorRef.current = cur;
        requestRender();
        return;
      }

      if (event.key === "end") {
        clearSelection();
        cur.col = lines[cur.row]!.length;
        stickyColRef.current = null;
        cursorRef.current = cur;
        requestRender();
        return;
      }

      if (event.key === "pageup") {
        clearSelection();
        const jump = maxLinesRef.current ?? 10;
        cur.row = Math.max(0, cur.row - jump);
        cur.col = Math.min(cur.col, lines[cur.row]!.length);
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      if (event.key === "pagedown") {
        clearSelection();
        const jump = maxLinesRef.current ?? 10;
        cur.row = Math.min(lines.length - 1, cur.row + jump);
        cur.col = Math.min(cur.col, lines[cur.row]!.length);
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        requestRender();
        return;
      }

      // ── Editing keys (blocked in readOnly mode) ────────────

      if (event.key === "return") {
        if (readOnlyRef.current) return;
        if (hasSelection()) {
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
        } else {
          pushUndo(lines, prevCursor);
        }
        // Enforce maxLength
        const ml = maxLengthRef.current;
        if (ml !== undefined && joinLines(lines).length >= ml) return;
        // Split current line at cursor
        const before = lines[cur.row]!.slice(0, cur.col);
        const after = lines[cur.row]!.slice(cur.col);
        lines = [...lines];
        lines.splice(cur.row, 1, before, after);
        cur.row++;
        cur.col = 0;
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        emitChange(lines);
        requestRender();
        return;
      }

      if (event.key === "backspace") {
        if (readOnlyRef.current) return;
        if (hasSelection()) {
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
        } else if (cur.col > 0) {
          pushUndo(lines, prevCursor);
          const line = lines[cur.row]!;
          lines = [...lines];
          lines[cur.row] = line.slice(0, cur.col - 1) + line.slice(cur.col);
          cur.col--;
        } else if (cur.row > 0) {
          pushUndo(lines, prevCursor);
          const prevLen = lines[cur.row - 1]!.length;
          lines = [...lines];
          lines[cur.row - 1] = lines[cur.row - 1]! + lines[cur.row]!;
          lines.splice(cur.row, 1);
          cur.row--;
          cur.col = prevLen;
        } else {
          return;
        }
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        emitChange(lines);
        requestRender();
        return;
      }

      if (event.key === "delete") {
        if (readOnlyRef.current) return;
        if (hasSelection()) {
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
        } else if (cur.col < lines[cur.row]!.length) {
          pushUndo(lines, prevCursor);
          const line = lines[cur.row]!;
          lines = [...lines];
          lines[cur.row] = line.slice(0, cur.col) + line.slice(cur.col + 1);
        } else if (cur.row < lines.length - 1) {
          pushUndo(lines, prevCursor);
          lines = [...lines];
          lines[cur.row] = lines[cur.row]! + lines[cur.row + 1]!;
          lines.splice(cur.row + 1, 1);
        } else {
          return;
        }
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        emitChange(lines);
        requestRender();
        return;
      }

      if (event.key === "tab") {
        if (readOnlyRef.current) return;
        const spaces = " ".repeat(tabSizeRef.current);
        if (hasSelection()) {
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
        } else {
          pushUndo(lines, prevCursor);
        }
        // Enforce maxLength
        const ml = maxLengthRef.current;
        const currentLen = joinLines(lines).length;
        if (ml !== undefined && currentLen + spaces.length > ml) return;
        const line = lines[cur.row]!;
        lines = [...lines];
        lines[cur.row] = line.slice(0, cur.col) + spaces + line.slice(cur.col);
        cur.col += spaces.length;
        stickyColRef.current = null;
        cursorRef.current = cur;
        emitChange(lines);
        requestRender();
        return;
      }

      // ── Character input ────────────────────────────────────

      if (event.char) {
        if (readOnlyRef.current) return;
        if (hasSelection()) {
          pushUndo(lines, prevCursor);
          const result = deleteSelection(lines);
          lines = result.lines;
          cur = result.cursor;
        } else {
          pushUndo(lines, prevCursor);
        }
        // Enforce maxLength
        const ml = maxLengthRef.current;
        if (ml !== undefined && joinLines(lines).length >= ml) return;
        const line = lines[cur.row]!;
        lines = [...lines];
        lines[cur.row] = line.slice(0, cur.col) + event.char + line.slice(cur.col);
        cur.col += event.char.length;
        // Truncate if over maxLength
        if (ml !== undefined) {
          const joined = joinLines(lines);
          if (joined.length > ml) {
            lines = splitLines(joined.slice(0, ml));
            cur = clampPos(cur, lines);
          }
        }
        stickyColRef.current = null;
        cursorRef.current = cur;
        ensureCursorVisible(cur.row);
        emitChange(lines);
        requestRender();
        return;
      }
    });

    // ── Paste handler ──────────────────────────────────────────

    unsubPasteRef.current = input.onPaste((event) => {
      if (!isFocusedRef.current) return;
      if (disabledRef.current) return;
      if (readOnlyRef.current) return;

      let text = event.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      let lines = linesRef.current;
      let cur = { ...cursorRef.current };

      pushUndo(lines, cur);

      // Delete selection if active
      if (hasSelection()) {
        const result = deleteSelection(lines);
        lines = result.lines;
        cur = result.cursor;
      }

      // Enforce maxLength
      const ml = maxLengthRef.current;
      if (ml !== undefined) {
        const remaining = ml - joinLines(lines).length;
        if (remaining <= 0) return;
        text = text.slice(0, remaining);
      }

      // Insert pasted text (may contain newlines)
      const pastedLines = text.split("\n");
      const lineAfterCursor = lines[cur.row]!.slice(cur.col);
      const lineBeforeCursor = lines[cur.row]!.slice(0, cur.col);

      lines = [...lines];

      if (pastedLines.length === 1) {
        // Single line paste
        lines[cur.row] = lineBeforeCursor + pastedLines[0]! + lineAfterCursor;
        cur.col += pastedLines[0]!.length;
      } else {
        // Multi-line paste
        const newLines: string[] = [];
        newLines.push(lineBeforeCursor + pastedLines[0]!);
        for (let i = 1; i < pastedLines.length - 1; i++) {
          newLines.push(pastedLines[i]!);
        }
        const lastPasted = pastedLines[pastedLines.length - 1]!;
        newLines.push(lastPasted + lineAfterCursor);
        lines.splice(cur.row, 1, ...newLines);
        cur.row += pastedLines.length - 1;
        cur.col = lastPasted.length;
      }

      stickyColRef.current = null;
      cursorRef.current = cur;
      linesRef.current = lines;
      ensureCursorVisible(cur.row);
      emitChange(lines);
      requestRender();
    });
  }

  // ── Cleanup ────────────────────────────────────────────────────

  useCleanup(() => {
    unsubKeyRef.current?.();
    unsubPasteRef.current?.();
  });

  // ── Rendering ──────────────────────────────────────────────────

  const lines = linesRef.current;
  const curPos = cursorRef.current;
  const scrollOffset = scrollOffsetRef.current;
  const showPlaceholder = value.length === 0;

  // Visible line range
  const totalLines = lines.length;
  const visibleLines = maxLines ?? totalLines;
  const viewStart = scrollOffset;
  const viewEnd = Math.min(totalLines, viewStart + visibleLines);
  const actualHeight = maxLines ? Math.min(maxLines, totalLines) : totalLines;

  // Line number gutter width
  const gutterWidth = lineNumbers ? Math.max(3, String(totalLines).length + 1) : 0;

  // Selection range (normalized)
  const selA = selAnchorRef.current;
  const selE = selEndRef.current;
  const hasSel = selA !== null && selE !== null && comparePos(selA, selE) !== 0;
  const selStart = hasSel ? orderedSelection(selA!, selE!).start : null;
  const selEnd = hasSel ? orderedSelection(selA!, selE!).end : null;

  /** Check if a (row, col) position falls within the current selection. */
  const isSelected = (row: number, col: number): boolean => {
    if (!hasSel || !selStart || !selEnd) return false;
    const pos: Pos = { row, col };
    return comparePos(pos, selStart) >= 0 && comparePos(pos, selEnd) < 0;
  };

  // ── Build row elements ─────────────────────────────────────

  const rowElements: React.ReactElement[] = [];

  if (showPlaceholder) {
    const placeholderElements: React.ReactElement[] = [];
    if (lineNumbers) {
      placeholderElements.push(
        React.createElement("tui-text", {
          key: "gutter-ph",
          color: lineNumberColor ?? colors.text.disabled,
          dim: true,
        }, "1".padStart(gutterWidth - 1) + " "),
      );
    }
    placeholderElements.push(
      React.createElement("tui-text", {
        key: "ph-text",
        color: placeholderColor ?? colors.text.disabled,
        dim: true,
      }, placeholder ?? ""),
    );
    // Show cursor at start if focused
    if (isFocusedProp && !disabled) {
      placeholderElements.push(
        React.createElement("tui-text", {
          key: "ph-cursor",
          color,
          inverse: true,
        }, " "),
      );
    }
    rowElements.push(
      React.createElement("tui-box", {
        key: "row-ph",
        flexDirection: "row",
        height: 1,
      }, ...placeholderElements),
    );
  } else {
    for (let i = viewStart; i < viewEnd; i++) {
      const lineText = lines[i]!;
      const lineElements: React.ReactElement[] = [];

      // ── Line number gutter ─────────────────────────────
      if (lineNumbers) {
        const num = String(i + 1).padStart(gutterWidth - 1) + " ";
        lineElements.push(
          React.createElement("tui-text", {
            key: `gutter-${i}`,
            color: lineNumberColor ?? colors.text.disabled,
            dim: true,
          }, num),
        );
      }

      // ── Line content with cursor/selection highlighting ─
      if (isFocusedProp && !disabled) {
        // Apply syntax highlighting if provided
        const spans: HighlightSpan[] = highlight
          ? highlight(lineText, i)
          : [{ text: lineText }];

        // Flatten spans into character-level info for cursor/selection overlay
        const segments: React.ReactElement[] = [];
        let charIdx = 0;
        let segIdx = 0;

        for (const span of spans) {
          const spanChars = Array.from(span.text);
          let buf = "";
          let bufInverse = false;
          let bufColor = span.color ?? color;
          let bufBold = span.bold;
          let bufDim = span.dim;

          const flushBuf = () => {
            if (buf.length > 0) {
              segments.push(
                React.createElement("tui-text", {
                  key: `s${segIdx}`,
                  color: bufColor,
                  ...(bufBold ? { bold: true } : {}),
                  ...(bufDim ? { dim: true } : {}),
                  ...(bufInverse ? { inverse: true } : {}),
                }, buf),
              );
              segIdx++;
              buf = "";
            }
          };

          for (const ch of spanChars) {
            const isCur = i === curPos.row && charIdx === curPos.col;
            const isSel = isSelected(i, charIdx);
            const shouldInverse = isCur || isSel;

            if (shouldInverse !== bufInverse) {
              flushBuf();
              bufInverse = shouldInverse;
            }
            buf += ch;
            charIdx++;
          }

          flushBuf();
        }

        // Cursor at end of line
        if (i === curPos.row && curPos.col >= lineText.length) {
          segments.push(
            React.createElement("tui-text", {
              key: "cursor-eol",
              color,
              inverse: true,
            }, " "),
          );
        }

        // Handle empty lines — still show cursor if on this line
        if (lineText.length === 0 && i !== curPos.row) {
          segments.push(
            React.createElement("tui-text", { key: "empty", color }, " "),
          );
        }

        lineElements.push(...segments);
      } else {
        // Not focused or disabled — plain text
        if (highlight) {
          const spans = highlight(lineText, i);
          let si = 0;
          for (const span of spans) {
            lineElements.push(
              React.createElement("tui-text", {
                key: `hl-${si}`,
                color: span.color ?? color,
                ...(span.bold ? { bold: true } : {}),
                ...(span.dim ? { dim: true } : {}),
                ...(disabled ? { dim: true } : {}),
              }, span.text),
            );
            si++;
          }
        } else {
          lineElements.push(
            React.createElement("tui-text", {
              key: `line-${i}`,
              color,
              ...(disabled ? { dim: true } : {}),
            }, lineText || " "),
          );
        }
      }

      rowElements.push(
        React.createElement("tui-box", {
          key: `row-${i}`,
          flexDirection: "row",
          height: 1,
        }, ...lineElements),
      );
    }
  }

  // ── Wrap in ScrollView if content exceeds maxLines ─────────

  if (maxLines !== undefined && totalLines > maxLines) {
    return React.createElement(ScrollView, {
      height: maxLines,
      scrollSpeed: 1,
      stickToBottom: false,
      ...(layoutProps.flex !== undefined ? { flex: layoutProps.flex } : {}),
      ...(layoutProps.width !== undefined ? { width: layoutProps.width } : {}),
    },
      React.createElement("tui-box", {
        flexDirection: "column",
        role: "textbox",
        "aria-label": ariaLabel,
        "aria-multiline": true,
        "aria-readonly": readOnly,
      }, ...rowElements),
    );
  }

  return React.createElement("tui-box", {
    flexDirection: "column",
    height: actualHeight || 1,
    role: "textbox",
    "aria-label": ariaLabel,
    "aria-multiline": true,
    "aria-readonly": readOnly,
    ...layoutProps,
  }, ...rowElements);
});
