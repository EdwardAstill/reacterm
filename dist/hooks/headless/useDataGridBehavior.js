import { useRef, useCallback } from "react";
import { useInput } from "../useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { handleCellEdit } from "./cell-edit.js";
import { computeVirtualWindow, computeColumnWidths } from "../../utils/table-render.js";
export function useDataGridBehavior(options) {
    const { columns, rows, selectedRow, onSelect, sortColumn, sortDirection, onSort, isActive = true, maxVisibleRows = 100, onScrollChange, multiSelect = false, onSelectionChange, editable = false, onCellEdit, resizable = false, onColumnResize, } = options;
    const { requestRender } = useTui();
    // Clamp selectedRow to valid range
    const clampedSelectedRow = selectedRow !== undefined
        ? Math.max(0, Math.min(selectedRow, rows.length - 1))
        : undefined;
    // cursor.row: 0..n = data rows
    // cursor.col: column index
    // scrollOffset: first visible row index for virtualization
    // onHeaderRow: whether cursor is on the header row
    const cursorRef = useRef({ row: clampedSelectedRow ?? 0, col: 0, scrollOffset: 0, onHeaderRow: false });
    const selectedSetRef = useRef(new Set());
    const rangeAnchorRef = useRef(null);
    const editingRef = useRef(null);
    const colWidthOverridesRef = useRef({});
    // Clamp cursor
    if (cursorRef.current.row >= rows.length) {
        cursorRef.current.row = Math.max(0, rows.length - 1);
    }
    if (cursorRef.current.col >= columns.length) {
        cursorRef.current.col = Math.max(0, columns.length - 1);
    }
    // Virtualization: determine visible window
    const totalRows = rows.length;
    const needsVirtualization = totalRows > maxVisibleRows;
    if (needsVirtualization) {
        const cursor = cursorRef.current;
        if (cursor.row < cursor.scrollOffset) {
            cursor.scrollOffset = cursor.row;
        }
        else if (cursor.row >= cursor.scrollOffset + maxVisibleRows) {
            cursor.scrollOffset = cursor.row - maxVisibleRows + 1;
        }
    }
    const vw = computeVirtualWindow(totalRows, maxVisibleRows, cursorRef.current.scrollOffset);
    cursorRef.current.scrollOffset = vw.start;
    const visibleStart = vw.start;
    const visibleEnd = vw.end;
    const baseWidths = computeColumnWidths(columns, rows, "label", 2);
    const colWidths = columns.map((col, i) => {
        const override = colWidthOverridesRef.current[col.key];
        if (override !== undefined)
            return override;
        return baseWidths[i];
    });
    /** Notify onSelectionChange with current selected set */
    function notifySelectionChange() {
        if (onSelectionChange) {
            const sorted = [...selectedSetRef.current].sort((a, b) => a - b);
            onSelectionChange(sorted);
        }
    }
    /** Select a range from anchor to target (inclusive), replacing previous selection */
    function selectRange(anchor, target) {
        const lo = Math.min(anchor, target);
        const hi = Math.max(anchor, target);
        selectedSetRef.current.clear();
        for (let i = lo; i <= hi; i++) {
            selectedSetRef.current.add(i);
        }
    }
    /** Handle keyboard input while in inline cell editing mode. */
    function handleEditInput(event) {
        handleCellEdit(event, editingRef.current, (_row, col, value) => {
            const colKey = columns[col]?.key;
            if (colKey && onCellEdit)
                onCellEdit(_row, colKey, value);
            editingRef.current = null;
            requestRender();
        }, () => { editingRef.current = null; requestRender(); }, requestRender);
    }
    /** Handle +/- keys for column resizing when on the header row. Returns true if handled. */
    function handleResizeInput(event) {
        if (event.char === "+" || event.char === "-") {
            const col = columns[cursorRef.current.col];
            if (col) {
                const currentWidth = colWidths[cursorRef.current.col] ?? col.label.length + 2;
                const delta = event.char === "+" ? 1 : -1;
                const newWidth = Math.max(1, currentWidth + delta);
                colWidthOverridesRef.current[col.key] = newWidth;
                if (onColumnResize) {
                    onColumnResize(col.key, newWidth);
                }
                requestRender();
            }
            return true;
        }
        return false;
    }
    /** Handle arrow keys, including virtualization scroll adjustments. */
    function handleNavigationInput(event) {
        if (event.key === "up") {
            if (cursorRef.current.onHeaderRow) {
                // Already on header, nowhere to go
            }
            else if (cursorRef.current.row === 0) {
                cursorRef.current.onHeaderRow = true;
                requestRender();
            }
            else {
                cursorRef.current.row -= 1;
                rangeAnchorRef.current = null;
                if (needsVirtualization && cursorRef.current.row < cursorRef.current.scrollOffset) {
                    cursorRef.current.scrollOffset = cursorRef.current.row;
                }
                requestRender();
            }
            return true;
        }
        if (event.key === "down") {
            if (cursorRef.current.onHeaderRow) {
                cursorRef.current.onHeaderRow = false;
                cursorRef.current.row = 0;
                rangeAnchorRef.current = null;
                requestRender();
            }
            else if (cursorRef.current.row < rows.length - 1) {
                cursorRef.current.row += 1;
                rangeAnchorRef.current = null;
                if (needsVirtualization && cursorRef.current.row >= cursorRef.current.scrollOffset + maxVisibleRows) {
                    cursorRef.current.scrollOffset = cursorRef.current.row - maxVisibleRows + 1;
                }
                requestRender();
            }
            return true;
        }
        if (event.key === "left") {
            if (cursorRef.current.col > 0) {
                cursorRef.current.col -= 1;
                requestRender();
            }
            return true;
        }
        if (event.key === "right") {
            if (cursorRef.current.col < columns.length - 1) {
                cursorRef.current.col += 1;
                requestRender();
            }
            return true;
        }
        return false;
    }
    /** Handle Shift+arrow range selection and Space multi-select toggle. Returns true if handled. */
    function handleSelectionInput(event) {
        if (event.key === "up" && event.shift && multiSelect && !cursorRef.current.onHeaderRow) {
            if (rangeAnchorRef.current === null) {
                rangeAnchorRef.current = cursorRef.current.row;
            }
            if (cursorRef.current.row > 0) {
                cursorRef.current.row -= 1;
                selectRange(rangeAnchorRef.current, cursorRef.current.row);
                notifySelectionChange();
                if (needsVirtualization && cursorRef.current.row < cursorRef.current.scrollOffset) {
                    cursorRef.current.scrollOffset = cursorRef.current.row;
                }
            }
            requestRender();
            return true;
        }
        if (event.key === "down" && event.shift && multiSelect && !cursorRef.current.onHeaderRow) {
            if (rangeAnchorRef.current === null) {
                rangeAnchorRef.current = cursorRef.current.row;
            }
            if (cursorRef.current.row < rows.length - 1) {
                cursorRef.current.row += 1;
                selectRange(rangeAnchorRef.current, cursorRef.current.row);
                notifySelectionChange();
                if (needsVirtualization && cursorRef.current.row >= cursorRef.current.scrollOffset + maxVisibleRows) {
                    cursorRef.current.scrollOffset = cursorRef.current.row - maxVisibleRows + 1;
                }
            }
            requestRender();
            return true;
        }
        if (event.key === "space" && multiSelect && !cursorRef.current.onHeaderRow) {
            const row = cursorRef.current.row;
            if (selectedSetRef.current.has(row)) {
                selectedSetRef.current.delete(row);
            }
            else {
                selectedSetRef.current.add(row);
            }
            rangeAnchorRef.current = row;
            notifySelectionChange();
            requestRender();
            return true;
        }
        return false;
    }
    /** Handle Enter (sort/edit/select) and Escape actions. Returns true if handled. */
    function handleActionInput(event) {
        if (event.key === "return") {
            if (cursorRef.current.onHeaderRow) {
                if (onSort && columns[cursorRef.current.col]) {
                    onSort(columns[cursorRef.current.col].key);
                }
            }
            else if (editable) {
                const row = rows[cursorRef.current.row];
                const col = columns[cursorRef.current.col];
                if (row && col) {
                    const val = row[col.key];
                    const strVal = val !== undefined ? String(val) : "";
                    editingRef.current = {
                        row: cursorRef.current.row,
                        col: cursorRef.current.col,
                        value: strVal,
                        cursor: strVal.length,
                    };
                    requestRender();
                }
            }
            else {
                if (onSelect) {
                    onSelect(cursorRef.current.row);
                }
            }
            return true;
        }
        return false;
    }
    const handleInput = useCallback((event) => {
        const prevOffset = cursorRef.current.scrollOffset;
        // Editing mode: all input goes to the edit handler
        if (editingRef.current !== null) {
            handleEditInput(event);
            return;
        }
        // Column resize mode: +/- on header row
        if (resizable && cursorRef.current.onHeaderRow) {
            if (handleResizeInput(event))
                return;
        }
        // Selection (Shift+arrow, Space) takes priority over plain navigation
        if (!handleSelectionInput(event)) {
            // Actions: Enter, Escape
            if (!handleActionInput(event)) {
                // Plain navigation: arrow keys
                handleNavigationInput(event);
            }
        }
        if (onScrollChange && cursorRef.current.scrollOffset !== prevOffset) {
            onScrollChange(cursorRef.current.scrollOffset);
        }
    }, [rows, columns, onSelect, onSort, maxVisibleRows, needsVirtualization, onScrollChange, requestRender, multiSelect, onSelectionChange, editable, onCellEdit, resizable, onColumnResize, colWidths]);
    useInput(handleInput, { isActive });
    const activeRow = selectedRow ?? cursorRef.current.row;
    return {
        focusedCell: {
            row: cursorRef.current.row,
            col: cursorRef.current.col,
            onHeaderRow: cursorRef.current.onHeaderRow,
        },
        sortState: {
            column: sortColumn,
            direction: sortDirection,
        },
        selectionSet: selectedSetRef.current,
        editState: editingRef.current,
        resizeState: colWidthOverridesRef.current,
        virtualWindow: {
            start: visibleStart,
            end: visibleEnd,
            total: totalRows,
            needsVirtualization,
        },
        columnWidths: colWidths,
        activeRow,
        handleInput,
        rows,
        columns,
    };
}
//# sourceMappingURL=useDataGridBehavior.js.map