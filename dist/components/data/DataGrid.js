import React, { createContext, useContext } from "react";
import { useColors } from "../../hooks/useColors.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { padCell } from "../../utils/format.js";
import { useDataGridBehavior } from "../../hooks/headless/useDataGridBehavior.js";
import { buildSeparatorText, shouldStripe, formatRowIndicator, headerTextWithSort, } from "../../utils/table-render.js";
export const DataGridContext = createContext(null);
export function useDataGridContext() {
    const ctx = useContext(DataGridContext);
    if (!ctx)
        throw new Error("DataGrid sub-components must be used inside DataGrid.Root");
    return ctx;
}
function DataGridRoot({ selectedRow, onSelect, sortColumn, sortDirection, onSort, headerColor: headerColorProp, selectedColor: selectedColorProp, children, ...rest }) {
    const colors = useColors();
    const headerColor = headerColorProp ?? colors.brand.primary;
    const selectedColor = selectedColorProp ?? colors.brand.light;
    const ctx = {
        columns: [],
        selectedRow,
        onSelect,
        sortColumn,
        sortDirection,
        onSort,
        headerColor,
        selectedColor,
    };
    return React.createElement(DataGridContext.Provider, { value: ctx }, React.createElement("tui-box", {
        flexDirection: "column",
        ...(rest["aria-label"] !== undefined ? { "aria-label": rest["aria-label"] } : {}),
    }, children));
}
function DataGridCompoundColumn({ columnKey, label, width, align, children }) {
    const { headerColor, sortColumn, sortDirection } = useDataGridContext();
    if (children) {
        return React.createElement("tui-box", { flexDirection: "row" }, children);
    }
    const displayLabel = headerTextWithSort(label, columnKey, sortColumn, sortDirection);
    return React.createElement("tui-text", { bold: true, color: headerColor }, ` ${displayLabel} `);
}
function DataGridCompoundRow({ index, children }) {
    const colors = useColors();
    const { selectedRow, selectedColor } = useDataGridContext();
    const isSelected = index === selectedRow;
    const rowProps = {
        flexDirection: "row",
    };
    if (!isSelected && shouldStripe(index, true, false)) {
        rowProps["backgroundColor"] = colors.surface.raised;
    }
    return React.createElement("tui-box", rowProps, children);
}
const DataGridBase = React.memo(function DataGrid(rawProps) {
    const colors = useColors();
    const props = usePluginProps("DataGrid", rawProps);
    const { columns, rows, selectedRow, onSelect, sortColumn, sortDirection, onSort, isFocused = true, headerColor: headerColorProp, selectedColor: selectedColorProp, maxVisibleRows = 100, onScrollChange, multiSelect = false, onSelectionChange, editable = false, onCellEdit, resizable = false, onColumnResize, } = props;
    const headerColor = headerColorProp ?? colors.brand.primary;
    const selectedColor = selectedColorProp ?? colors.brand.light;
    const userStyles = pickStyleProps(props);
    const borderColor = userStyles.borderColor ?? colors.divider;
    if (rows.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "No data");
    }
    const behavior = useDataGridBehavior({
        columns,
        rows,
        selectedRow,
        onSelect,
        sortColumn,
        sortDirection,
        onSort,
        isActive: isFocused,
        maxVisibleRows,
        onScrollChange,
        multiSelect,
        onSelectionChange,
        editable,
        onCellEdit,
        resizable,
        onColumnResize,
    });
    const { columnWidths: colWidths, virtualWindow, activeRow, editState, selectionSet, sortState, } = behavior;
    const visibleStart = virtualWindow.start;
    const visibleEnd = virtualWindow.end;
    const elements = [];
    // Header row
    const headerCells = columns.map((col, ci) => {
        const label = headerTextWithSort(col.label, col.key, sortState.column, sortState.direction);
        return React.createElement("tui-text", { key: col.key, bold: true, color: headerColor }, " " + padCell(label, colWidths[ci], col.align ?? "left") + " ");
    });
    elements.push(React.createElement("tui-box", { key: "header", flexDirection: "row" }, ...headerCells));
    // Border line between header and data
    const borderText = buildSeparatorText(colWidths, "\u2500");
    elements.push(React.createElement("tui-text", { key: "border", color: borderColor, dim: true }, borderText));
    // Data rows (only the visible window) — zebra striping + selected highlight
    for (let ri = visibleStart; ri < visibleEnd; ri++) {
        const row = rows[ri];
        const isSelected = ri === activeRow;
        const isMultiSelected = multiSelect && selectionSet.has(ri);
        const cellElements = [];
        // Multi-select checkbox indicator
        if (multiSelect) {
            cellElements.push(React.createElement("tui-text", { key: "__chk", color: isMultiSelected ? colors.success : colors.text.dim }, isMultiSelected ? " \u25C9 " : " \u25CB "));
        }
        for (let ci = 0; ci < columns.length; ci++) {
            const col = columns[ci];
            const val = row[col.key];
            const text = val !== undefined ? String(val) : "";
            const isEditing = editState !== null
                && editState.row === ri
                && editState.col === ci;
            if (props.renderCell && !isEditing) {
                cellElements.push(React.createElement("tui-box", { key: col.key, flexDirection: "row" }, props.renderCell(val !== undefined ? val : "", col, ri, { isSelected, isEditing: false })));
            }
            else if (isEditing) {
                const edit = editState;
                const before = edit.value.slice(0, edit.cursor);
                const cursorChar = edit.cursor < edit.value.length ? edit.value[edit.cursor] : " ";
                const after = edit.value.slice(edit.cursor + 1);
                const editDisplay = before + "\u2588" + after; // block cursor
                cellElements.push(React.createElement("tui-text", { key: col.key, inverse: true, bold: true }, " " + padCell(editDisplay, colWidths[ci], col.align ?? "left") + " "));
            }
            else {
                const cellProps = {
                    key: col.key,
                };
                if (isSelected) {
                    // Selected row: brand background with inverse text
                    cellProps["color"] = selectedColor;
                    cellProps["bold"] = true;
                    cellProps["inverse"] = true;
                }
                else if (isMultiSelected) {
                    cellProps["color"] = colors.brand.light;
                    cellProps["bold"] = true;
                }
                cellElements.push(React.createElement("tui-text", cellProps, " " + padCell(text, colWidths[ci], col.align ?? "left") + " "));
            }
        }
        const rowProps = {
            key: `row-${ri}`,
            flexDirection: "row",
        };
        // Zebra striping: odd rows get a raised surface background
        if (shouldStripe(ri, true, isSelected || isMultiSelected)) {
            rowProps["backgroundColor"] = colors.surface.raised;
        }
        elements.push(React.createElement("tui-box", rowProps, ...cellElements));
    }
    // Row range indicator when virtualized
    if (virtualWindow.needsVirtualization) {
        elements.push(React.createElement("tui-text", { key: "row-indicator", color: colors.text.dim, dim: true }, formatRowIndicator(visibleStart, visibleEnd, virtualWindow.total)));
    }
    // Multi-select count indicator
    if (multiSelect && selectionSet.size > 0) {
        elements.push(React.createElement("tui-text", { key: "sel-indicator", color: colors.brand.primary, dim: true }, `${selectionSet.size} row${selectionSet.size === 1 ? "" : "s"} selected`));
    }
    const boxProps = mergeBoxStyles({ flexDirection: "column", overflow: "hidden", role: "grid", "aria-label": props["aria-label"] }, userStyles);
    return React.createElement("tui-box", boxProps, ...elements);
});
export const DataGrid = Object.assign(DataGridBase, {
    Root: DataGridRoot,
    Column: DataGridCompoundColumn,
    Row: DataGridCompoundRow,
});
//# sourceMappingURL=DataGrid.js.map