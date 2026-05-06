import { stringWidth } from "../core/unicode.js";
import { COL_WIDTH_SAMPLE_SIZE, padCell } from "./format.js";

// ─── Column width auto-sizing ───────────────────────────────────────────

export interface ColumnWidthInput {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
}

/**
 * Compute column widths by sampling data rows.
 * If a column has an explicit `width`, it is used as-is.
 * Otherwise the width is the max of the header length and the longest
 * value in the first COL_WIDTH_SAMPLE_SIZE rows.
 *
 * @param headerField  Which field on the column object holds the header text
 *                     ("header" for Table, "label" for DataGrid).
 */
export function computeColumnWidths<C extends { key: string; width?: number }>(
  columns: ReadonlyArray<C>,
  data: ReadonlyArray<Record<string, string | number>>,
  headerField: string = "header",
  extraPadding: number = 0,
): number[] {
  const sampleCount = Math.min(data.length, COL_WIDTH_SAMPLE_SIZE);
  return columns.map((col) => {
    if (col.width !== undefined) return col.width;
    const headerText = String((col as Record<string, unknown>)[headerField] ?? "");
    let max = stringWidth(headerText) + extraPadding;
    for (let i = 0; i < sampleCount; i++) {
      const row = data[i]!;
      const val = row[col.key];
      const len = val !== undefined ? stringWidth(String(val)) : 0;
      if (len > max) max = len;
    }
    return max;
  });
}

function tableChromeWidth(columnCount: number): number {
  if (columnCount <= 0) return 0;
  const separatorWidth = Math.max(0, columnCount - 1);
  const paddingWidth = columnCount * 2;
  return separatorWidth + paddingWidth;
}

function clampColumnWidth<C extends { minWidth?: number; maxWidth?: number }>(
  width: number,
  column: C,
  fallbackMinWidth: number,
): number {
  const min = Math.max(1, column.minWidth ?? fallbackMinWidth);
  const max = column.maxWidth !== undefined ? Math.max(min, column.maxWidth) : Number.POSITIVE_INFINITY;
  return Math.max(min, Math.min(max, width));
}

function shrinkColumnWidths<C extends { width?: number; minWidth?: number; flex?: number }>(
  columns: ReadonlyArray<C>,
  widths: number[],
  targetContentWidth: number,
  minColumnWidth: number,
): number[] {
  let currentContentWidth = widths.reduce((sum, width) => sum + width, 0);
  if (currentContentWidth <= targetContentWidth) return widths;

  const hasFlexColumns = columns.some((column) => (column.flex ?? 0) > 0);
  const shrinkableIndices = columns
    .map((column, index) => {
      if ((column.flex ?? 0) > 0) return index;
      if (!hasFlexColumns && column.width === undefined) return index;
      return -1;
    })
    .filter((index) => index >= 0);

  if (shrinkableIndices.length === 0) return widths;

  while (currentContentWidth > targetContentWidth) {
    let widestShrinkable = -1;
    for (const index of shrinkableIndices) {
      const min = Math.max(1, columns[index]?.minWidth ?? minColumnWidth);
      if (widths[index]! <= min) continue;
      if (widestShrinkable === -1 || widths[index]! > widths[widestShrinkable]!) {
        widestShrinkable = index;
      }
    }

    if (widestShrinkable === -1) break;

    widths[widestShrinkable] = widths[widestShrinkable]! - 1;
    currentContentWidth -= 1;
  }

  return widths;
}

function growFlexColumnWidths<C extends { flex?: number; minWidth?: number; maxWidth?: number }>(
  columns: ReadonlyArray<C>,
  widths: number[],
  targetContentWidth: number,
  minColumnWidth: number,
): number[] {
  let currentContentWidth = widths.reduce((sum, width) => sum + width, 0);
  if (currentContentWidth >= targetContentWidth) return widths;

  const flexIndices = columns
    .map((column, index) => ((column.flex ?? 0) > 0 ? index : -1))
    .filter((index) => index >= 0);
  if (flexIndices.length === 0) return widths;

  let remaining = targetContentWidth - currentContentWidth;
  const active = new Set(flexIndices);

  while (remaining > 0 && active.size > 0) {
    const totalFlex = [...active].reduce((sum, index) => sum + Math.max(0, columns[index]?.flex ?? 0), 0);
    if (totalFlex <= 0) break;

    let distributed = 0;
    for (const index of [...active]) {
      const column = columns[index]!;
      const share = Math.max(1, Math.floor((remaining * Math.max(0, column.flex ?? 0)) / totalFlex));
      const before = widths[index]!;
      const after = clampColumnWidth(before + share, column, minColumnWidth);
      widths[index] = after;
      const delta = after - before;
      distributed += delta;
      if (delta < share || after === column.maxWidth) active.delete(index);
      if (distributed >= remaining) break;
    }

    if (distributed <= 0) break;
    remaining -= distributed;
    currentContentWidth += distributed;
  }

  return widths;
}

/**
 * Resolve column widths against available table width.
 *
 * Fixed-width columns (`column.width`) are preserved unless they also declare
 * `flex`. Auto-sized columns shrink to fit legacy compact tables. Columns with
 * `flex` receive leftover space proportionally and shrink before fixed columns.
 */
export function fitColumnWidthsToAvailableWidth<C extends { width?: number; minWidth?: number; maxWidth?: number; flex?: number }>(
  columns: ReadonlyArray<C>,
  widths: ReadonlyArray<number>,
  availableWidth: number,
  minColumnWidth: number = 1,
): number[] {
  if (columns.length === 0 || widths.length === 0 || availableWidth <= 0) {
    return [...widths];
  }

  const maxContentWidth = Math.max(
    minColumnWidth * columns.length,
    availableWidth - tableChromeWidth(columns.length),
  );

  const next = widths.map((width, index) => clampColumnWidth(width, columns[index]!, minColumnWidth));
  shrinkColumnWidths(columns, next, maxContentWidth, minColumnWidth);
  growFlexColumnWidths(columns, next, maxContentWidth, minColumnWidth);
  return next;
}

// ─── Separator / divider line ───────────────────────────────────────────

/**
 * Build a horizontal separator string that sits between header and body.
 * Each column segment is `─` repeated (colWidth + 2) for the 1-char padding
 * on each side, joined by the given `joiner` character.
 *
 * Table uses "┼" (`\u253C`), DataGrid uses "─" (`\u2500`).
 */
export function buildSeparatorText(colWidths: number[], joiner: string): string {
  return colWidths
    .map((w) => "\u2500".repeat(w + 2))
    .join(joiner);
}

// ─── Zebra stripe background ────────────────────────────────────────────

/**
 * Determine whether a row should receive the zebra-stripe background.
 * Returns `true` when striping is enabled, the row index is odd,
 * and the row is not in a highlighted/selected state.
 */
export function shouldStripe(
  rowIndex: number,
  stripeEnabled: boolean,
  isHighlighted: boolean,
): boolean {
  return stripeEnabled && rowIndex % 2 === 1 && !isHighlighted;
}

// ─── Virtualization window ──────────────────────────────────────────────

export interface VirtualWindow {
  /** Index of first visible row (inclusive). */
  start: number;
  /** Index past the last visible row (exclusive). */
  end: number;
  /** Total number of rows in the dataset. */
  total: number;
  /** Whether the dataset exceeds maxVisibleRows. */
  needsVirtualization: boolean;
}

/**
 * Compute the visible row window for virtualized rendering.
 */
export function computeVirtualWindow(
  totalRows: number,
  maxVisibleRows: number,
  scrollOffset: number,
): VirtualWindow {
  const needsVirtualization = totalRows > maxVisibleRows;
  const clampedOffset = needsVirtualization
    ? Math.max(0, Math.min(scrollOffset, totalRows - maxVisibleRows))
    : 0;
  const start = clampedOffset;
  const end = needsVirtualization
    ? Math.min(clampedOffset + maxVisibleRows, totalRows)
    : totalRows;
  return { start, end, total: totalRows, needsVirtualization };
}

// ─── Row count indicator text ───────────────────────────────────────────

/**
 * Format the "Showing X-Y of Z" (Table) or "X-Y of Z" (DataGrid) indicator.
 *
 * @param prefix  Text before the range, e.g. "Showing " or "" (empty).
 */
export function formatRowIndicator(
  start: number,
  end: number,
  total: number,
  prefix: string = "",
): string {
  return `${prefix}${start + 1}-${end} of ${total.toLocaleString()}`;
}

// ─── Header text with sort indicator ────────────────────────────────────

/**
 * Append a sort direction arrow (▲ or ▼) to a header label when the
 * column is the active sort column.
 */
export function headerTextWithSort(
  label: string,
  columnKey: string,
  sortColumn: string | null | undefined,
  sortDirection: "asc" | "desc" | null | undefined,
): string {
  if (sortColumn === columnKey && sortDirection) {
    return label + (sortDirection === "asc" ? " \u25B2" : " \u25BC");
  }
  return label;
}

// ─── Padded row line builder ────────────────────────────────────────────

/**
 * Build a single row line string: each cell is ` <padded> ` joined by the
 * given separator character (typically "│").
 */
export function buildRowLine(
  columns: ReadonlyArray<{ key: string; align?: "left" | "center" | "right" }>,
  row: Record<string, string | number>,
  colWidths: number[],
  separator: string = "\u2502",
): string {
  return columns.map((col, ci) => {
    const val = row[col.key];
    const text = val !== undefined ? String(val) : "";
    return " " + padCell(text, colWidths[ci]!, col.align ?? "left") + " ";
  }).join(separator);
}
