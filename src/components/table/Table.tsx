import React, { useRef, useCallback, createContext, useContext, useEffect, useId } from "react";
import { useInput } from "../../hooks/useInput.js";
import type { KeyEvent } from "../../input/types.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { useMeasure } from "../../hooks/useMeasure.js";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { DEFAULTS } from "../../styles/defaults.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { padCell } from "../../utils/format.js";
import { handleCellEdit, type CellEditState } from "../../hooks/headless/cell-edit.js";
import {
  computeColumnWidths,
  fitColumnWidthsToAvailableWidth,
  buildSeparatorText,
  shouldStripe,
  computeVirtualWindow,
  formatRowIndicator,
  headerTextWithSort,
} from "../../utils/table-render.js";

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  align?: "left" | "center" | "right";
  focusable?: boolean;
  editable?: boolean;
  locked?: boolean;
  /** Style applied to every body cell in this column (not the header). */
  color?: string | number;
  backgroundColor?: string | number;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type TableFocusMode = "row" | "column" | "cell";

export interface TableCellRef {
  row: number;
  column: string | number;
}

export interface TableCellStyle {
  color?: string | number;
  backgroundColor?: string | number;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
}

export interface TableStateStyles {
  header?: TableCellStyle;
  focusedRow?: TableCellStyle;
  focusedColumn?: TableCellStyle;
  focusedCell?: TableCellStyle;
  selectedRow?: TableCellStyle;
  selectedCell?: TableCellStyle;
  editedCell?: TableCellStyle;
  lockedCell?: TableCellStyle;
}

export interface TableRenderState {
  isFocusedRow: boolean;
  isFocusedColumn: boolean;
  isFocusedCell: boolean;
  isSelectedRow: boolean;
  isSelectedCell: boolean;
  isEdited: boolean;
  isLocked: boolean;
  isEditable: boolean;
  isFocusable: boolean;
  isEditing: boolean;
}

export interface TableProps extends StormContainerStyleProps {
  columns: TableColumn[];
  data: Record<string, string | number>[];
  headerColor?: string | number;
  stripe?: boolean;
  /** Maximum rows rendered at once (default 100). Rows beyond this are virtualized. */
  maxVisibleRows?: number;
  /** Current scroll offset into the data array (default 0). */
  scrollOffset?: number;
  /** Called when the scroll offset changes due to virtualization. */
  onScrollChange?: (offset: number) => void;
  /** Whether the table is focused for keyboard input. */
  isFocused?: boolean;
  /** Called when Enter is pressed on a data row. Receives the row index. */
  onRowSelect?: (rowIndex: number) => void;
  /** When true, highlight the current row with inverse styling. */
  rowHighlight?: boolean;
  /** Visible width of the table in columns for horizontal scroll (default: total column width). */
  visibleWidth?: number;
  /** Enable column sorting. Press "s" to cycle sort on the current column header. */
  sortable?: boolean;
  /** Called when a column sort is triggered. */
  onSort?: (columnKey: string, direction: "asc" | "desc") => void;
  /** Custom renderer for individual cells. */
  renderCell?: (value: string | number, column: TableColumn, rowIndex: number, state: TableRenderState) => React.ReactNode;
  /** Custom renderer for header cells. */
  renderHeader?: (column: TableColumn) => React.ReactNode;
  /** Called when a data row is clicked. */
  onRowPress?: (rowIndex: number) => void;
  /** Called when a data cell is clicked. */
  onCellPress?: (rowIndex: number, columnKey: string) => void;
  /** Called when a header cell is clicked. */
  onHeaderPress?: (columnKey: string) => void;
  /** Visual focus model for controlled table state. */
  focusMode?: TableFocusMode;
  focusedRow?: number;
  focusedColumn?: string | number;
  focusedCell?: TableCellRef | null;
  selectedRows?: number[];
  selectedCells?: TableCellRef[];
  editedCells?: TableCellRef[];
  lockedCells?: TableCellRef[];
  stateStyles?: TableStateStyles;
  /** Predicate-based row style. Merged AFTER per-column style and BEFORE state styles (state always wins). */
  rowStyle?: (row: Record<string, string | number>, rowIndex: number) => TableCellStyle | undefined;
  /** Predicate-based per-cell style. Merged AFTER rowStyle and BEFORE state styles. */
  cellStyle?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => TableCellStyle | undefined;
  editable?: boolean;
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: string) => void;
  isCellLocked?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
  isCellEditable?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
  isCellFocusable?: (value: string | number, column: TableColumn, rowIndex: number, row: Record<string, string | number>) => boolean;
}

export interface TableContextValue {
  columns: TableColumn[];
  registerColumn: (col: TableColumn) => void;
}

export const TableContext = createContext<TableContextValue | null>(null);

export function useTableContext(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("Table sub-components must be used inside Table.Root");
  return ctx;
}

export interface TableRootProps {
  headerColor?: string | number;
  stripe?: boolean;
  isFocused?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}

function TableRoot({ headerColor, stripe, isFocused, children, ...rest }: TableRootProps): React.ReactElement {
  const colors = useColors();
  const columnsRef = useRef<TableColumn[]>([]);

  const ctx: TableContextValue = {
    columns: columnsRef.current,
    registerColumn: (col: TableColumn) => {
      if (!columnsRef.current.find((c) => c.key === col.key)) {
        columnsRef.current.push(col);
      }
    },
  };

  return React.createElement(
    TableContext.Provider,
    { value: ctx },
    React.createElement(
      "tui-box",
      {
        flexDirection: "column",
        borderStyle: DEFAULTS.table.borderStyle,
        borderColor: colors.divider,
        ...(rest["aria-label"] !== undefined ? { "aria-label": rest["aria-label"] } : {}),
      },
      children,
    ),
  );
}

export interface TableCompoundHeaderProps {
  children: React.ReactNode;
}

function TableCompoundHeader({ children }: TableCompoundHeaderProps): React.ReactElement {
  return React.createElement(
    "tui-box",
    { flexDirection: "row" },
    children,
  );
}

export interface TableCompoundBodyProps {
  children: React.ReactNode;
}

function TableCompoundBody({ children }: TableCompoundBodyProps): React.ReactElement {
  return React.createElement(
    "tui-box",
    { flexDirection: "column" },
    children,
  );
}

export interface TableCompoundRowProps {
  children: React.ReactNode;
  highlighted?: boolean;
}

function TableCompoundRow({ children, highlighted = false }: TableCompoundRowProps): React.ReactElement {
  return React.createElement(
    "tui-box",
    {
      flexDirection: "row",
      ...(highlighted ? { inverse: true } : {}),
    },
    children,
  );
}

export interface TableCompoundCellProps {
  children: React.ReactNode;
  width?: number;
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: string | number;
}

function TableCompoundCell({ children, width, align, bold, color: cellColor }: TableCompoundCellProps): React.ReactElement {
  const colors = useColors();
  const props: Record<string, unknown> = {};
  if (width !== undefined) props["width"] = width;
  if (bold) props["bold"] = true;
  if (cellColor !== undefined) props["color"] = cellColor;

  return React.createElement("tui-text", props, children);
}

const TableBase = React.memo(function Table(rawProps: TableProps): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps("Table", rawProps);
  const {
    columns,
    data,
    headerColor = colors.brand.primary,
    stripe = false,
    maxVisibleRows = 100,
    scrollOffset = 0,
    onScrollChange,
    isFocused = false,
    onRowSelect,
    rowHighlight = false,
    visibleWidth,
    sortable = false,
    onSort,
    renderCell,
    renderHeader,
    onRowPress,
    onCellPress,
    onHeaderPress,
    focusMode = "row",
    focusedRow,
    focusedColumn,
    focusedCell = null,
    selectedRows = [],
    selectedCells = [],
    editedCells = [],
    lockedCells = [],
    stateStyles,
    rowStyle,
    cellStyle,
    editable = false,
    onCellEdit,
    isCellLocked,
    isCellEditable,
    isCellFocusable,
  } = props;

  const { requestRender } = useTui();
  const scrollRef = useRef(scrollOffset);
  const cursorRowRef = useRef(0);
  const hScrollRef = useRef(0);
  const sortStateRef = useRef<{ column: string; direction: "asc" | "desc" } | null>(null);
  const cursorColRef = useRef(0);
  const editingRef = useRef<CellEditState | null>(null);

  const userStyles = pickStyleProps(props);
  const borderStyle = (userStyles.borderStyle as string | undefined) ?? DEFAULTS.table.borderStyle;
  const borderColor = (userStyles.borderColor as string | number | undefined) ?? colors.divider;
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

  function resolveColumnIndex(columnRef: string | number | undefined | null): number {
    if (columnRef === undefined || columnRef === null) return -1;
    if (typeof columnRef === "number") return columnRef;
    return columns.findIndex((col) => col.key === columnRef);
  }

  function cellRefKey(row: number, columnRef: string | number): string {
    return `${row}:${typeof columnRef === "number" ? columns[columnRef]?.key ?? columnRef : columnRef}`;
  }

  const selectedRowSet = new Set(selectedRows);
  const selectedCellSet = new Set(selectedCells.map((ref) => cellRefKey(ref.row, ref.column)));
  const editedCellSet = new Set(editedCells.map((ref) => cellRefKey(ref.row, ref.column)));
  const lockedCellSet = new Set(lockedCells.map((ref) => cellRefKey(ref.row, ref.column)));
  const focusedColumnIndex = resolveColumnIndex(focusedColumn);
  const focusedCellColumnIndex = resolveColumnIndex(focusedCell?.column);
  const hasControlledFocus = focusedRow !== undefined || focusedColumn !== undefined || focusedCell !== null;
  const borderInset = borderStyle && borderStyle !== "none" ? 1 : 0;
  const measureId = useId();
  const measuredLayout = useMeasure(visibleWidth === undefined ? `table-${measureId}` : "");
  const explicitTableWidth = typeof userStyles.width === "number" ? userStyles.width : undefined;

  function mergeStyles(...styles: Array<TableCellStyle | undefined>): TableCellStyle {
    const out: TableCellStyle = {};
    for (const style of styles) {
      if (!style) continue;
      Object.assign(out, style);
    }
    return out;
  }

  function getCellState(row: Record<string, string | number>, rowIndex: number, column: TableColumn, colIndex: number): TableRenderState {
    const value = row[column.key] ?? "";
    const refKey = cellRefKey(rowIndex, column.key);
    const locked = lockedCellSet.has(refKey)
      || column.locked === true
      || isCellLocked?.(value, column, rowIndex, row) === true;
    const editableCell = !locked
      && (isCellEditable ? isCellEditable(value, column, rowIndex, row) : (column.editable ?? editable));
    const focusableCell = isCellFocusable
      ? isCellFocusable(value, column, rowIndex, row)
      : (column.focusable ?? true);

    const controlledFocusedRow = focusMode === "row" && focusedRow === rowIndex;
    const controlledFocusedColumn = focusMode === "column" && focusedColumnIndex === colIndex;
    const controlledFocusedCell = focusMode === "cell"
      && focusedCell?.row === rowIndex
      && focusedCellColumnIndex === colIndex;
    const legacyFocusedRow = !hasControlledFocus && rowHighlight && rowIndex === cursorRowRef.current;
    const isFocusedRow = isFocused && (controlledFocusedRow || legacyFocusedRow);
    const isFocusedColumn = isFocused && controlledFocusedColumn;
    const isFocusedCell = isFocused && controlledFocusedCell;

    return {
      isFocusedRow,
      isFocusedColumn,
      isFocusedCell,
      isSelectedRow: selectedRowSet.has(rowIndex),
      isSelectedCell: selectedCellSet.has(refKey),
      isEdited: editedCellSet.has(refKey),
      isLocked: locked,
      isEditable: editableCell,
      isFocusable: focusableCell,
      isEditing: editingRef.current?.row === rowIndex && editingRef.current?.col === colIndex,
    };
  }

  function columnToStyle(col: TableColumn): TableCellStyle | undefined {
    if (
      col.color === undefined &&
      col.backgroundColor === undefined &&
      col.bold === undefined &&
      col.dim === undefined &&
      col.italic === undefined &&
      col.underline === undefined
    ) return undefined;
    const out: TableCellStyle = {};
    if (col.color !== undefined) out.color = col.color;
    if (col.backgroundColor !== undefined) out.backgroundColor = col.backgroundColor;
    if (col.bold !== undefined) out.bold = col.bold;
    if (col.dim !== undefined) out.dim = col.dim;
    if (col.italic !== undefined) out.italic = col.italic;
    if (col.underline !== undefined) out.underline = col.underline;
    return out;
  }

  const columnStyles: Array<TableCellStyle | undefined> = columns.map(columnToStyle);

  function getCellStyle(
    state: TableRenderState,
    row: Record<string, string | number>,
    rowIndex: number,
    column: TableColumn,
    columnIndex: number,
    value: string | number,
  ): TableCellStyle {
    return mergeStyles(
      columnStyles[columnIndex],
      rowStyle?.(row, rowIndex),
      cellStyle?.(value, column, rowIndex, row),
      state.isLocked ? resolvedStateStyles.lockedCell : undefined,
      state.isEdited ? resolvedStateStyles.editedCell : undefined,
      state.isSelectedRow ? resolvedStateStyles.selectedRow : undefined,
      state.isSelectedCell ? resolvedStateStyles.selectedCell : undefined,
      state.isFocusedRow ? resolvedStateStyles.focusedRow : undefined,
      state.isFocusedColumn ? resolvedStateStyles.focusedColumn : undefined,
      state.isFocusedCell ? resolvedStateStyles.focusedCell : undefined,
    );
  }

  // Sync scrollRef with controlled prop
  scrollRef.current = scrollOffset;

  const applySort = useCallback((columnKey: string) => {
    if (!sortable) return;
    const prev = sortStateRef.current;
    let newDir: "asc" | "desc" = "asc";
    if (prev && prev.column === columnKey && prev.direction === "asc") {
      newDir = "desc";
    }
    sortStateRef.current = { column: columnKey, direction: newDir };
    onSort?.(columnKey, newDir);
  }, [onSort, sortable]);

  useEffect(() => {
    if (visibleWidth === undefined && explicitTableWidth === undefined && measuredLayout === null) {
      requestRender();
    }
  }, [explicitTableWidth, measuredLayout, requestRender, visibleWidth]);

  const availableAutoWidth = explicitTableWidth !== undefined
    ? Math.max(1, explicitTableWidth - borderInset * 2)
    : measuredLayout
      ? Math.max(1, measuredLayout.width - borderInset * 2)
      : undefined;

  const baseColWidths = computeColumnWidths(columns, data, "header");
  const colWidths = visibleWidth === undefined && availableAutoWidth !== undefined
    ? fitColumnWidthsToAvailableWidth(columns, baseColWidths, availableAutoWidth)
    : baseColWidths;

  // Total content width (each cell has 1-char padding on each side)
  const totalContentWidth = colWidths.reduce((sum, w) => sum + w + 2, 0) + (colWidths.length - 1); // +separators
  const effectiveVisibleWidth = visibleWidth ?? availableAutoWidth ?? totalContentWidth;
  const canHScroll = totalContentWidth > effectiveVisibleWidth;
  const maxHScroll = Math.max(0, totalContentWidth - effectiveVisibleWidth);
  const virtualWindow = computeVirtualWindow(data.length, maxVisibleRows, scrollOffset);
  const { start: visibleStart, end: visibleEnd, needsVirtualization } = virtualWindow;

  // Clamp hScroll
  if (hScrollRef.current > maxHScroll) hScrollRef.current = maxHScroll;
  if (hScrollRef.current < 0) hScrollRef.current = 0;

  // Clamp cursor row
  if (data.length > 0 && cursorRowRef.current >= data.length) {
    cursorRowRef.current = data.length - 1;
  }

  const handleInput = useCallback(
    (event: KeyEvent) => {
      if (editingRef.current !== null) {
        handleCellEdit(
          event,
          editingRef.current,
          (rowIndex, colIndex, nextValue) => {
            const column = columns[colIndex];
            if (column && onCellEdit) onCellEdit(rowIndex, column.key, nextValue);
            editingRef.current = null;
            requestRender();
          },
          () => {
            editingRef.current = null;
            requestRender();
          },
          requestRender,
        );
        return;
      }

      const maxOffset = Math.max(0, data.length - maxVisibleRows);
      const prev = scrollRef.current;
      let changed = false;

      if (event.key === "up") {
        if (rowHighlight && cursorRowRef.current > 0) {
          cursorRowRef.current -= 1;
          // Adjust vertical scroll to keep cursor visible
          if (cursorRowRef.current < scrollRef.current) {
            scrollRef.current = cursorRowRef.current;
          }
          changed = true;
        } else if (!rowHighlight) {
          scrollRef.current = Math.max(0, scrollRef.current - 1);
          changed = scrollRef.current !== prev;
        }
      } else if (event.key === "down") {
        if (rowHighlight && cursorRowRef.current < data.length - 1) {
          cursorRowRef.current += 1;
          // Adjust vertical scroll to keep cursor visible
          if (cursorRowRef.current >= scrollRef.current + maxVisibleRows) {
            scrollRef.current = cursorRowRef.current - maxVisibleRows + 1;
          }
          changed = true;
        } else if (!rowHighlight) {
          scrollRef.current = Math.min(maxOffset, scrollRef.current + 1);
          changed = scrollRef.current !== prev;
        }
      } else if (event.key === "left") {
        if ((sortable || editable || focusMode !== "row") && cursorColRef.current > 0) {
          cursorColRef.current -= 1;
          changed = true;
        }
        if (canHScroll) {
          const prevH = hScrollRef.current;
          hScrollRef.current = Math.max(0, hScrollRef.current - 3);
          changed = changed || hScrollRef.current !== prevH;
        }
      } else if (event.key === "right") {
        if ((sortable || editable || focusMode !== "row") && cursorColRef.current < columns.length - 1) {
          cursorColRef.current += 1;
          changed = true;
        }
        if (canHScroll) {
          const prevH = hScrollRef.current;
          hScrollRef.current = Math.min(maxHScroll, hScrollRef.current + 3);
          changed = changed || hScrollRef.current !== prevH;
        }
      } else if (event.key === "pageup") {
        scrollRef.current = Math.max(0, scrollRef.current - maxVisibleRows);
        if (rowHighlight) {
          cursorRowRef.current = Math.max(0, cursorRowRef.current - maxVisibleRows);
        }
        changed = scrollRef.current !== prev;
      } else if (event.key === "pagedown") {
        scrollRef.current = Math.min(maxOffset, scrollRef.current + maxVisibleRows);
        if (rowHighlight) {
          cursorRowRef.current = Math.min(data.length - 1, cursorRowRef.current + maxVisibleRows);
        }
        changed = scrollRef.current !== prev;
      } else if (event.key === "return") {
        const rowIndex = cursorRowRef.current;
        const colIndex = cursorColRef.current;
        const row = data[rowIndex];
        const column = columns[colIndex];
        if (editable && row && column) {
          const state = getCellState(row, rowIndex, column, colIndex);
          if (state.isEditable && !state.isLocked) {
            const nextValue = row[column.key] !== undefined ? String(row[column.key]) : "";
            editingRef.current = {
              row: rowIndex,
              col: colIndex,
              value: nextValue,
              cursor: nextValue.length,
            };
            requestRender();
            return;
          }
        }
        if (rowHighlight && onRowSelect) {
          onRowSelect(cursorRowRef.current);
          return;
        }
      } else if (sortable && (event.char === "s" || event.char === "S")) {
        const col = columns[cursorColRef.current];
        if (col) applySort(col.key);
        requestRender();
        return;
      }

      if (changed) {
        if (scrollRef.current !== prev) {
          onScrollChange?.(scrollRef.current);
        }
        requestRender();
      }
    },
    [data.length, maxVisibleRows, onScrollChange, requestRender, rowHighlight, onRowSelect, canHScroll, maxHScroll, sortable, applySort, columns, editable, focusMode, onCellEdit],
  );

  useInput(handleInput, { isActive: isFocused });

  const mouseTarget = useMouseTarget({
    disabled: data.length === 0 && !renderHeader,
    onMouse: (event, localX, localY) => {
      if (event.button !== "left" || event.action !== "press") return;
      const innerX = localX - borderInset;
      const innerY = localY - borderInset;
      if (innerX < 0 || innerY < 0) return;

      let columnStart = 0;
      let hitColumnIndex = -1;
      for (let index = 0; index < columns.length; index++) {
        const cellWidth = colWidths[index]! + 2;
        if (innerX >= columnStart && innerX < columnStart + cellWidth) {
          hitColumnIndex = index;
          break;
        }
        columnStart += cellWidth;
        if (index < columns.length - 1) {
          if (innerX === columnStart) return;
          columnStart += 1;
        }
      }
      if (hitColumnIndex === -1) return;

      cursorColRef.current = hitColumnIndex;
      const hitColumn = columns[hitColumnIndex]!;

      if (innerY === 0) {
        onHeaderPress?.(hitColumn.key);
        if (sortable) applySort(hitColumn.key);
        requestRender();
        return;
      }

      if (innerY === 1) return;

      const dataRowOffset = innerY - 2;
      const rowIndex = visibleStart + dataRowOffset;
      if (rowIndex < visibleStart || rowIndex >= visibleEnd || rowIndex >= data.length) return;

      cursorRowRef.current = rowIndex;
      onRowPress?.(rowIndex);
      onCellPress?.(rowIndex, hitColumn.key);
      requestRender();
    },
  });

  if (data.length === 0) {
    return React.createElement(
      "tui-text",
      { color: colors.text.dim, dim: true },
      "No data",
    );
  }

  /** Apply horizontal scroll: slice a rendered line to the visible window */
  function applyHScroll(line: string): string {
    if (!canHScroll) return line;
    const sliced = line.slice(hScrollRef.current, hScrollRef.current + effectiveVisibleWidth);
    const leftArrow = hScrollRef.current > 0 ? "\u25C0" : " ";
    const rightArrow = hScrollRef.current < maxHScroll ? "\u25B6" : " ";
    return leftArrow + sliced.slice(1, -1) + rightArrow;
  }

  const elements: React.ReactElement[] = [];

  // Header row — bold + secondary color for visual hierarchy, with sort indicators
  if (renderHeader) {
    const headerCells: React.ReactNode[] = [];
    columns.forEach((col, ci) => {
      headerCells.push(
        React.createElement("tui-box", { key: col.key, flexDirection: "row" }, renderHeader(col)),
      );
      if (ci < columns.length - 1) {
        headerCells.push(React.createElement("tui-text", { key: `hsep-${col.key}`, color: borderColor }, "\u2502"));
      }
    });
    elements.push(
      React.createElement(
        "tui-box",
        { key: "header", flexDirection: "row" },
        ...headerCells,
      ),
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
          const isFocusedHeader = isFocused && focusMode === "column" && focusedColumnIndex === ci;
          const style = mergeStyles(
            resolvedStateStyles.header,
            isFocusedHeader ? resolvedStateStyles.focusedColumn : undefined,
          );
          const nodes: React.ReactNode[] = [
            React.createElement(
              "tui-box",
              {
                key: col.key,
                width: colWidths[ci]! + 2,
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
                " " + padCell(headerText, colWidths[ci]!, col.align ?? "left") + " ",
              ),
            ),
          ];
          if (ci < columns.length - 1) {
            nodes.push(React.createElement("tui-text", { key: `hsep-${col.key}`, color: borderColor }, "\u2502"));
          }
          return nodes;
        }),
      ),
    );
  }

  // Separator — solid line between header and body
  const separatorText = buildSeparatorText(colWidths, "\u253C");
  elements.push(
    React.createElement(
      "tui-text",
      { key: "sep", color: borderColor },
      applyHScroll(separatorText),
    ),
  );

  // Data rows (only the visible window) — zebra striping via background color
  for (let ri = visibleStart; ri < visibleEnd; ri++) {
    const row = data[ri]!;
    const isCursorRow = rowHighlight && ri === cursorRowRef.current;

    const rowBoxProps: Record<string, unknown> = {
      key: `rowbox-${ri}`,
      flexDirection: "row",
    };
    // Zebra striping: odd rows get a raised surface background
    if (shouldStripe(ri, stripe, isCursorRow)) {
      rowBoxProps["backgroundColor"] = colors.surface.raised;
    }

    const cellElements = columns.flatMap((col, ci) => {
      const val = row[col.key];
      const displayValue = val !== undefined ? String(val) : "";
      const state = getCellState(row, ri, col, ci);
      const style = getCellStyle(state, row, ri, col, ci, val !== undefined ? val : "");
      let content: React.ReactNode;

      if (state.isEditing && editingRef.current) {
        const edit = editingRef.current;
        const before = edit.value.slice(0, edit.cursor);
        const cursorChar = edit.cursor < edit.value.length ? edit.value[edit.cursor]! : " ";
        const after = edit.value.slice(edit.cursor + 1);
        content = before + "\u2588" + after;
      } else if (renderCell) {
        content = renderCell(val !== undefined ? val : "", col, ri, state);
      } else {
        content = padCell(displayValue, colWidths[ci]!, col.align ?? "left");
      }

      const textProps: Record<string, unknown> = {
        ...(style.color !== undefined ? { color: style.color } : {}),
        ...(style.bold ? { bold: true } : {}),
        ...(style.dim ? { dim: true } : {}),
        ...(style.italic ? { italic: true } : {}),
        ...(style.underline ? { underline: true } : {}),
        ...(style.inverse ? { inverse: true } : {}),
      };

      const nodes: React.ReactNode[] = [React.createElement(
        "tui-box",
        {
          key: `${ri}:${col.key}`,
          width: colWidths[ci]! + 2,
          ...(style.backgroundColor !== undefined ? { backgroundColor: style.backgroundColor } : {}),
        },
        typeof content === "string"
          ? React.createElement("tui-text", textProps, " " + padCell(content, colWidths[ci]!, col.align ?? "left") + " ")
          : content,
      )];
      if (ci < columns.length - 1) {
        nodes.push(React.createElement("tui-text", { key: `sep-${ri}:${col.key}`, color: borderColor }, "\u2502"));
      }
      return nodes;
    });

    elements.push(
      React.createElement("tui-box", rowBoxProps, ...cellElements),
    );
  }

  // Row count indicator when virtualized
  if (needsVirtualization) {
    elements.push(
      React.createElement(
        "tui-text",
        { key: "row-indicator", color: colors.text.dim, dim: true },
        formatRowIndicator(visibleStart, visibleEnd, data.length, "Showing "),
      ),
    );
  }

  // Horizontal scroll indicator
  if (canHScroll) {
    const pct = maxHScroll > 0 ? Math.round((hScrollRef.current / maxHScroll) * 100) : 0;
    elements.push(
      React.createElement(
        "tui-text",
        { key: "hscroll-indicator", color: colors.text.dim, dim: true },
        `\u2190\u2192 Scroll: ${pct}%`,
      ),
    );
  }

  const boxProps = mergeBoxStyles(
    {
      role: "table",
      flexDirection: "column",
      overflow: "hidden",
      borderStyle,
      borderColor,
      ...(visibleWidth === undefined ? { measureId: `table-${measureId}` } : {}),
      ...mouseTarget.targetProps,
    },
    userStyles,
  );

  return React.createElement(
    "tui-box",
    boxProps,
    ...elements,
  );
});

export const Table = Object.assign(TableBase, {
  Root: TableRoot,
  Header: TableCompoundHeader,
  Body: TableCompoundBody,
  Row: TableCompoundRow,
  Cell: TableCompoundCell,
});
