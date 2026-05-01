import React, { useCallback, useEffect, useId, useRef } from "react";
import { useInput } from "../../hooks/useInput.js";
import type { KeyEvent } from "../../input/types.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { useMeasure } from "../../hooks/useMeasure.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { DEFAULTS } from "../../styles/defaults.js";
import { padCell } from "../../utils/format.js";
import { padEndCells, stringWidth } from "../../core/unicode.js";
import {
  computeColumnWidths,
  fitColumnWidthsToAvailableWidth,
  buildSeparatorText,
  computeVirtualWindow,
  formatRowIndicator,
  headerTextWithSort,
  shouldStripe,
} from "../../utils/table-render.js";
import {
  flattenVisible,
  MAX_TREE_DEPTH,
  type FlatTreeTableRow,
  type TreeTableRow,
} from "./TreeTable.flatten.js";
import type { TableColumn, TableCellStyle, TableStateStyles, TableRenderState } from "../table/Table.js";

export type { TreeTableRow } from "./TreeTable.flatten.js";

export interface TreeTableProps extends StormContainerStyleProps {
  columns: TableColumn[];
  data: TreeTableRow[];
  treeColumnKey?: string;
  onToggle?: (key: string, row: TreeTableRow) => void;
  onRowSelect?: (key: string, row: TreeTableRow) => void;
  onRowPress?: (key: string, row: TreeTableRow) => void;
  onSort?: (columnKey: string, direction: "asc" | "desc") => void;
  onHeaderPress?: (columnKey: string) => void;
  isFocused?: boolean;
  rowHighlight?: boolean;
  sortable?: boolean;
  stripe?: boolean;
  headerColor?: string | number;
  maxVisibleRows?: number;
  scrollOffset?: number;
  onScrollChange?: (offset: number) => void;
  visibleWidth?: number;
  stateStyles?: TableStateStyles;
  renderCell?: (
    value: string | number,
    column: TableColumn,
    row: TreeTableRow,
    state: TableRenderState,
  ) => React.ReactNode;
  renderHeader?: (column: TableColumn) => React.ReactNode;
  renderTreeCell?: (
    value: string | number,
    row: TreeTableRow,
    depth: number,
    state: TableRenderState & { isExpanded: boolean; hasChildren: boolean },
  ) => React.ReactNode;
}

function buildTreePrefix(entry: FlatTreeTableRow): string {
  if (entry.depth >= MAX_TREE_DEPTH) return "";
  let prefix = "";
  for (let d = 0; d < entry.depth; d++) {
    prefix += entry.parentIsLast[d] ? "   " : "│  ";
  }
  if (entry.depth > 0) {
    prefix = prefix.slice(0, -3) + (entry.isLast ? "└──" : "├──");
  }
  return prefix;
}

function mergeStyles(...styles: Array<TableCellStyle | undefined>): TableCellStyle {
  const out: TableCellStyle = {};
  for (const style of styles) {
    if (!style) continue;
    Object.assign(out, style);
  }
  return out;
}

export const TreeTable = React.memo(function TreeTable(rawProps: TreeTableProps): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps("TreeTable", rawProps);
  const {
    columns,
    data,
    treeColumnKey,
    onToggle,
    onRowSelect,
    onRowPress,
    onSort,
    onHeaderPress,
    isFocused = false,
    rowHighlight = false,
    sortable = false,
    stripe = false,
    headerColor = colors.brand.primary,
    maxVisibleRows = 100,
    scrollOffset = 0,
    onScrollChange,
    visibleWidth,
    stateStyles,
    renderCell,
    renderHeader,
    renderTreeCell,
  } = props;

  const { requestRender } = useTui();
  const cursorRowRef = useRef(0);
  const cursorColRef = useRef(0);
  const onHeaderRowRef = useRef(false);
  const scrollOffsetRef = useRef(scrollOffset);
  const sortStateRef = useRef<{ column: string; direction: "asc" | "desc" } | null>(null);
  const warnedTreeColumnRef = useRef(false);

  scrollOffsetRef.current = scrollOffset;

  const userStyles = pickStyleProps(props);
  const borderStyle = (userStyles.borderStyle as string | undefined) ?? DEFAULTS.table.borderStyle;
  const borderColor = (userStyles.borderColor as string | number | undefined) ?? colors.divider;
  const borderInset = borderStyle && borderStyle !== "none" ? 1 : 0;
  const explicitTableWidth = typeof userStyles.width === "number" ? userStyles.width : undefined;

  const measureId = useId();
  const measuredLayout = useMeasure(visibleWidth === undefined ? `tree-table-${measureId}` : "");

  const defaultStateStyles: TableStateStyles = {
    header: { color: headerColor, bold: true, underline: true },
    focusedRow: { backgroundColor: colors.surface.highlight },
    focusedColumn: { color: colors.brand.light, underline: true },
    focusedCell: { color: colors.surface.base, backgroundColor: colors.brand.primary, bold: true },
    selectedRow: { backgroundColor: colors.surface.raised },
    selectedCell: { backgroundColor: colors.surface.highlight },
    editedCell: { color: colors.warning, bold: true },
    lockedCell: { color: colors.text.dim, dim: true },
  };
  const resolvedStateStyles: TableStateStyles = { ...defaultStateStyles, ...stateStyles };

  const flat = flattenVisible(data);
  const totalFlat = flat.length;

  const resolvedTreeKey = (() => {
    if (treeColumnKey === undefined) return columns[0]?.key;
    const found = columns.find((c) => c.key === treeColumnKey);
    if (found) return found.key;
    if (!warnedTreeColumnRef.current) {
      warnedTreeColumnRef.current = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[TreeTable] treeColumnKey "${treeColumnKey}" not found in columns; falling back to columns[0].`,
      );
    }
    return columns[0]?.key;
  })();

  if (cursorRowRef.current >= totalFlat) {
    cursorRowRef.current = Math.max(0, totalFlat - 1);
  }
  if (cursorColRef.current >= columns.length) {
    cursorColRef.current = Math.max(0, columns.length - 1);
  }

  if (totalFlat > maxVisibleRows) {
    if (cursorRowRef.current < scrollOffsetRef.current) {
      scrollOffsetRef.current = cursorRowRef.current;
    } else if (cursorRowRef.current >= scrollOffsetRef.current + maxVisibleRows) {
      scrollOffsetRef.current = cursorRowRef.current - maxVisibleRows + 1;
    }
  } else {
    scrollOffsetRef.current = 0;
  }

  const vw = computeVirtualWindow(totalFlat, maxVisibleRows, scrollOffsetRef.current);
  scrollOffsetRef.current = vw.start;
  const { start: visibleStart, end: visibleEnd, needsVirtualization } = vw;

  const baseColWidths = computeColumnWidths(
    columns,
    flat.map((f) => f.row.values),
    "header",
  );

  // Reserve space in the tree column for "prefix + marker + icon + space" so
  // the value isn't truncated by the tree decoration.
  const treeColumnIndexEarly = columns.findIndex((c) => c.key === resolvedTreeKey);
  if (treeColumnIndexEarly >= 0 && columns[treeColumnIndexEarly]!.width === undefined) {
    let maxHead = 0;
    for (const f of flat) {
      const prefixW = stringWidth(buildTreePrefix(f));
      const markerW = 2;
      const iconW = f.row.icon !== undefined ? 3 : 0;
      const head = prefixW + markerW + iconW;
      if (head > maxHead) maxHead = head;
    }
    baseColWidths[treeColumnIndexEarly] = (baseColWidths[treeColumnIndexEarly] ?? 0) + maxHead;
  }

  const availableAutoWidth = explicitTableWidth !== undefined
    ? Math.max(1, explicitTableWidth - borderInset * 2)
    : measuredLayout
      ? Math.max(1, measuredLayout.width - borderInset * 2)
      : undefined;
  const colWidths = visibleWidth === undefined && availableAutoWidth !== undefined
    ? fitColumnWidthsToAvailableWidth(columns, baseColWidths, availableAutoWidth)
    : baseColWidths;

  useEffect(() => {
    if (visibleWidth === undefined && explicitTableWidth === undefined && measuredLayout === null) {
      requestRender();
    }
  }, [explicitTableWidth, measuredLayout, requestRender, visibleWidth]);

  const cycleSort = useCallback((columnKey: string) => {
    const prev = sortStateRef.current;
    let dir: "asc" | "desc" = "asc";
    if (prev && prev.column === columnKey && prev.direction === "asc") dir = "desc";
    sortStateRef.current = { column: columnKey, direction: dir };
    onSort?.(columnKey, dir);
  }, [onSort]);

  const handleInput = useCallback(
    (event: KeyEvent) => {
      const prevOffset = scrollOffsetRef.current;
      const cursor = cursorRowRef.current;
      const flatEntry = flat[cursor];
      const onHeader = onHeaderRowRef.current;

      if (event.key === "up") {
        if (onHeader) {
          // already on header — no-op
        } else if (cursor === 0 && sortable) {
          onHeaderRowRef.current = true;
          requestRender();
        } else if (cursor > 0) {
          cursorRowRef.current = cursor - 1;
          requestRender();
        }
      } else if (event.key === "down") {
        if (onHeader) {
          onHeaderRowRef.current = false;
          cursorRowRef.current = 0;
          requestRender();
        } else if (cursor < totalFlat - 1) {
          cursorRowRef.current = cursor + 1;
          requestRender();
        }
      } else if (event.key === "left") {
        if (onHeader) {
          if (cursorColRef.current > 0) {
            cursorColRef.current -= 1;
            requestRender();
          }
        } else if (flatEntry && flatEntry.hasChildren && flatEntry.row.expanded) {
          onToggle?.(flatEntry.row.key, flatEntry.row);
          requestRender();
        } else if (cursorColRef.current > 0) {
          cursorColRef.current -= 1;
          requestRender();
        }
      } else if (event.key === "right") {
        if (onHeader) {
          if (cursorColRef.current < columns.length - 1) {
            cursorColRef.current += 1;
            requestRender();
          }
        } else if (flatEntry && flatEntry.hasChildren && !flatEntry.row.expanded) {
          onToggle?.(flatEntry.row.key, flatEntry.row);
          requestRender();
        } else if (cursorColRef.current < columns.length - 1) {
          cursorColRef.current += 1;
          requestRender();
        }
      } else if (event.key === "pageup") {
        cursorRowRef.current = Math.max(0, cursor - maxVisibleRows);
        requestRender();
      } else if (event.key === "pagedown") {
        cursorRowRef.current = Math.min(totalFlat - 1, cursor + maxVisibleRows);
        requestRender();
      } else if (event.key === "return") {
        if (onHeader) {
          const col = columns[cursorColRef.current];
          if (col) cycleSort(col.key);
        } else if (flatEntry) {
          onRowSelect?.(flatEntry.row.key, flatEntry.row);
        }
      } else if (sortable && !onHeader && (event.char === "s" || event.char === "S")) {
        const col = columns[cursorColRef.current];
        if (col) cycleSort(col.key);
      }

      if (onScrollChange && scrollOffsetRef.current !== prevOffset) {
        onScrollChange(scrollOffsetRef.current);
      }
    },
    [flat, totalFlat, sortable, columns, maxVisibleRows, onToggle, onRowSelect, cycleSort, requestRender, onScrollChange],
  );

  useInput(handleInput, { isActive: isFocused });

  const treeColumnIndex = columns.findIndex((c) => c.key === resolvedTreeKey);

  const mouseTarget = useMouseTarget({
    disabled: totalFlat === 0,
    onMouse: (event, localX, localY) => {
      if (event.button !== "left" || event.action !== "press") return;
      const innerX = localX - borderInset;
      const innerY = localY - borderInset;
      if (innerX < 0 || innerY < 0) return;

      let columnStart = 0;
      let hitColumnIndex = -1;
      let hitColumnInnerX = 0;
      for (let index = 0; index < columns.length; index++) {
        const cellWidth = (colWidths[index] ?? 0) + 2;
        if (innerX >= columnStart && innerX < columnStart + cellWidth) {
          hitColumnIndex = index;
          hitColumnInnerX = innerX - columnStart;
          break;
        }
        columnStart += cellWidth;
        if (index < columns.length - 1) {
          if (innerX === columnStart) return;
          columnStart += 1;
        }
      }
      if (hitColumnIndex === -1) return;
      const hitColumn = columns[hitColumnIndex]!;
      cursorColRef.current = hitColumnIndex;

      if (innerY === 0) {
        onHeaderPress?.(hitColumn.key);
        if (sortable) cycleSort(hitColumn.key);
        requestRender();
        return;
      }
      if (innerY === 1) return;

      const dataRowOffset = innerY - 2;
      const flatIndex = visibleStart + dataRowOffset;
      if (flatIndex < visibleStart || flatIndex >= visibleEnd || flatIndex >= totalFlat) return;
      const entry = flat[flatIndex];
      if (!entry) return;

      cursorRowRef.current = flatIndex;
      onHeaderRowRef.current = false;

      if (hitColumnIndex === treeColumnIndex && entry.hasChildren) {
        const prefixWidth = stringWidth(buildTreePrefix(entry));
        // Layout inside cell: " " + prefix + marker(2 cells) + ...
        const markerStart = 1 + prefixWidth;
        if (hitColumnInnerX >= markerStart && hitColumnInnerX < markerStart + 2) {
          onToggle?.(entry.row.key, entry.row);
          requestRender();
          return;
        }
      }

      onRowPress?.(entry.row.key, entry.row);
      requestRender();
    },
  });

  if (totalFlat === 0) {
    return React.createElement(
      "tui-text",
      { color: colors.text.dim, dim: true },
      "No data",
    );
  }

  function buildHeaderState(isCursorColOnHeader: boolean): TableCellStyle {
    return mergeStyles(
      resolvedStateStyles.header,
      isCursorColOnHeader && isFocused ? resolvedStateStyles.focusedColumn : undefined,
    );
  }

  const elements: React.ReactElement[] = [];

  if (renderHeader) {
    const headerCells: React.ReactNode[] = [];
    columns.forEach((col, ci) => {
      const rendered = renderHeader(col);
      const inner = typeof rendered === "string"
        ? React.createElement("tui-text", null, " " + rendered + " ")
        : rendered;
      headerCells.push(
        React.createElement(
          "tui-box",
          { key: col.key, flexDirection: "row", width: (colWidths[ci] ?? 0) + 2 },
          inner,
        ),
      );
      if (ci < columns.length - 1) {
        headerCells.push(
          React.createElement("tui-text", { key: `hsep-${col.key}`, color: borderColor }, "│"),
        );
      }
    });
    elements.push(
      React.createElement("tui-box", { key: "header", flexDirection: "row" }, ...headerCells),
    );
  } else {
    elements.push(
      React.createElement(
        "tui-box",
        { key: "header", flexDirection: "row" },
        ...columns.flatMap((col, ci) => {
          const headerText = headerTextWithSort(
            col.header,
            col.key,
            sortable ? sortStateRef.current?.column ?? null : null,
            sortable ? sortStateRef.current?.direction ?? null : null,
          );
          const isCursorColOnHeader = onHeaderRowRef.current && ci === cursorColRef.current;
          const style = buildHeaderState(isCursorColOnHeader);
          const nodes: React.ReactNode[] = [
            React.createElement(
              "tui-box",
              {
                key: col.key,
                width: (colWidths[ci] ?? 0) + 2,
                ...(style.backgroundColor !== undefined ? { backgroundColor: style.backgroundColor } : {}),
              },
              React.createElement(
                "tui-text",
                {
                  ...(style.color !== undefined ? { color: style.color } : {}),
                  ...(style.bold ? { bold: true } : {}),
                  ...(style.dim ? { dim: true } : {}),
                  ...(style.italic ? { italic: true } : {}),
                  ...(style.underline ? { underline: true } : {}),
                  ...(style.inverse ? { inverse: true } : {}),
                },
                " " + padCell(headerText, colWidths[ci] ?? 0, col.align ?? "left") + " ",
              ),
            ),
          ];
          if (ci < columns.length - 1) {
            nodes.push(
              React.createElement("tui-text", { key: `hsep-${col.key}`, color: borderColor }, "│"),
            );
          }
          return nodes;
        }),
      ),
    );
  }

  const separatorText = buildSeparatorText(colWidths, "┼");
  elements.push(
    React.createElement("tui-text", { key: "sep", color: borderColor }, separatorText),
  );

  for (let i = visibleStart; i < visibleEnd; i++) {
    const entry = flat[i]!;
    const row = entry.row;
    const isCursorRow = !onHeaderRowRef.current && i === cursorRowRef.current;
    const isFocusedRow = isFocused && rowHighlight && isCursorRow;

    const rowBoxProps: Record<string, unknown> = { key: `row-${i}`, flexDirection: "row" };
    if (shouldStripe(i, stripe, isFocusedRow)) {
      rowBoxProps["backgroundColor"] = colors.surface.raised;
    }

    const cellElements = columns.flatMap((col, ci) => {
      const colWidth = colWidths[ci] ?? 0;
      const value = row.values[col.key] ?? "";
      const isFocusedCell = isFocused && isCursorRow && ci === cursorColRef.current;
      const state: TableRenderState = {
        isFocusedRow,
        isFocusedColumn: false,
        isFocusedCell,
        isSelectedRow: false,
        isSelectedCell: false,
        isEdited: false,
        isLocked: false,
        isEditable: false,
        isFocusable: true,
        isEditing: false,
      };

      const style = mergeStyles(
        col.color !== undefined || col.bold !== undefined || col.dim !== undefined
          ? {
              ...(col.color !== undefined ? { color: col.color } : {}),
              ...(col.backgroundColor !== undefined ? { backgroundColor: col.backgroundColor } : {}),
              ...(col.bold ? { bold: true } : {}),
              ...(col.dim ? { dim: true } : {}),
              ...(col.italic ? { italic: true } : {}),
              ...(col.underline ? { underline: true } : {}),
            }
          : undefined,
        state.isFocusedRow ? resolvedStateStyles.focusedRow : undefined,
        state.isFocusedCell ? resolvedStateStyles.focusedCell : undefined,
      );

      const valueStr = String(value);
      let content: React.ReactNode;
      if (ci === treeColumnIndex) {
        const prefix = buildTreePrefix(entry);
        const marker = entry.hasChildren ? (row.expanded ? "▾" : "▸") : " ";
        const iconText = row.icon !== undefined ? padEndCells(row.icon, 2) + " " : "";

        if (renderTreeCell) {
          const treeState = { ...state, isExpanded: !!row.expanded, hasChildren: entry.hasChildren };
          content = renderTreeCell(value, row, entry.depth, treeState);
        } else {
          const head = prefix + marker + " " + iconText;
          const headWidth = stringWidth(head);
          const remaining = Math.max(1, colWidth - headWidth);
          const padded = padCell(valueStr, remaining, col.align ?? "left");
          content = head + padded;
        }
      } else if (renderCell) {
        content = renderCell(value, col, row, state);
      } else {
        content = padCell(valueStr, colWidth, col.align ?? "left");
      }

      const textProps: Record<string, unknown> = {
        ...(style.color !== undefined ? { color: style.color } : {}),
        ...(style.bold ? { bold: true } : {}),
        ...(style.dim ? { dim: true } : {}),
        ...(style.italic ? { italic: true } : {}),
        ...(style.underline ? { underline: true } : {}),
        ...(style.inverse ? { inverse: true } : {}),
      };

      // For tree-column default render the head + padded value already equals
      // colWidth, so we only need surrounding padding spaces. For renderCell
      // and renderTreeCell with string returns, render verbatim — trust caller.
      let textBody: string;
      if (typeof content === "string") {
        if (ci === treeColumnIndex && !renderTreeCell) {
          textBody = " " + padCell(content, colWidth, "left") + " ";
        } else if (renderCell || renderTreeCell) {
          textBody = " " + content + " ";
        } else {
          textBody = " " + padCell(content, colWidth, col.align ?? "left") + " ";
        }
      } else {
        textBody = "";
      }

      const nodes: React.ReactNode[] = [
        React.createElement(
          "tui-box",
          {
            key: `${i}:${col.key}`,
            width: colWidth + 2,
            ...(style.backgroundColor !== undefined ? { backgroundColor: style.backgroundColor } : {}),
          },
          typeof content === "string"
            ? React.createElement("tui-text", textProps, textBody)
            : content,
        ),
      ];
      if (ci < columns.length - 1) {
        nodes.push(
          React.createElement("tui-text", { key: `sep-${i}:${col.key}`, color: borderColor }, "│"),
        );
      }
      return nodes;
    });

    elements.push(React.createElement("tui-box", rowBoxProps, ...cellElements));
  }

  if (needsVirtualization) {
    elements.push(
      React.createElement(
        "tui-text",
        { key: "row-indicator", color: colors.text.dim, dim: true },
        formatRowIndicator(visibleStart, visibleEnd, totalFlat, "Showing "),
      ),
    );
  }

  const boxProps = mergeBoxStyles(
    {
      role: "treegrid",
      flexDirection: "column",
      overflow: "hidden",
      borderStyle,
      borderColor,
      ...(visibleWidth === undefined ? { measureId: `tree-table-${measureId}` } : {}),
      ...mouseTarget.targetProps,
    },
    userStyles,
  );

  return React.createElement("tui-box", boxProps, ...elements);
});
