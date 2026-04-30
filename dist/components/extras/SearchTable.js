import React, { useCallback, useRef } from "react";
import { useColors } from "../../hooks/useColors.js";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { Table } from "../table/Table.js";
const DEFAULT_SEARCH_ICON = "🔍";
const SEARCH_TABLE_INPUT_PRIORITY = 1;
function applyFilter(data, query, searchableColumns, caseSensitive, customFilter) {
    if (query === "") {
        return { rows: data, originalIndices: data.map((_, i) => i) };
    }
    const q = caseSensitive ? query : query.toLowerCase();
    const rows = [];
    const originalIndices = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row)
            continue;
        let match;
        if (customFilter) {
            match = customFilter(row, q);
        }
        else {
            const keys = searchableColumns ?? Object.keys(row);
            match = false;
            for (const key of keys) {
                const cell = row[key];
                if (cell === undefined)
                    continue;
                const haystack = caseSensitive ? String(cell) : String(cell).toLowerCase();
                if (haystack.includes(q)) {
                    match = true;
                    break;
                }
            }
        }
        if (match) {
            rows.push(row);
            originalIndices.push(i);
        }
    }
    return { rows, originalIndices };
}
/**
 * Table + search input as one component with a single focus owner.
 *
 * Owns the query buffer; consumes printable / backspace / escape at higher
 * priority than the underlying Table so navigation keys (arrows, return, tab)
 * still reach the Table for row focus and selection. Callbacks (onRowSelect,
 * onRowPress, onCellPress) receive the row index from the ORIGINAL unfiltered
 * data array — translation happens here so consumers don't have to map back.
 *
 * @example
 * <SearchTable
 *   columns={cols}
 *   data={rows}
 *   rowHighlight
 *   onRowSelect={(i) => open(rows[i])}
 * />
 */
export function SearchTable(rawProps) {
    const colors = useColors();
    const props = usePluginProps("SearchTable", rawProps);
    const { columns, data, searchableColumns, filter, caseSensitive = false, placeholder = "Search…", searchIcon = DEFAULT_SEARCH_ICON, showResultCount = true, debounceMs = 0, hideTableUntilQuery = false, iconColor = colors.text.dim, isFocused = true, onCancel, onRowSelect, onRowPress, onCellPress, ...tableRest } = props;
    const { requestRender } = useTui();
    const forceUpdate = useForceUpdate();
    const onCancelRef = useRef(onCancel);
    onCancelRef.current = onCancel;
    const filterRef = useRef(filter);
    filterRef.current = filter;
    const dataRef = useRef(data);
    dataRef.current = data;
    const searchableColumnsRef = useRef(searchableColumns);
    searchableColumnsRef.current = searchableColumns;
    const caseSensitiveRef = useRef(caseSensitive);
    caseSensitiveRef.current = caseSensitive;
    const queryRef = useRef("");
    const filteredRef = useRef({
        rows: data,
        originalIndices: data.map((_, i) => i),
    });
    const debounceTimerRef = useRef(null);
    // Re-filter whenever the data array changes by reference.
    const lastDataRef = useRef(data);
    if (lastDataRef.current !== data) {
        lastDataRef.current = data;
        filteredRef.current = applyFilter(data, queryRef.current, searchableColumnsRef.current, caseSensitiveRef.current, filterRef.current);
    }
    const recomputeFiltered = useCallback(() => {
        filteredRef.current = applyFilter(dataRef.current, queryRef.current, searchableColumnsRef.current, caseSensitiveRef.current, filterRef.current);
    }, []);
    const setQueryAndRefresh = useCallback((next) => {
        queryRef.current = next;
        if (debounceMs <= 0) {
            recomputeFiltered();
            forceUpdate();
            requestRender();
            return;
        }
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            recomputeFiltered();
            forceUpdate();
            requestRender();
        }, debounceMs);
        forceUpdate();
        requestRender();
    }, [debounceMs, recomputeFiltered, forceUpdate, requestRender]);
    useCleanup(() => {
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    });
    const handleInput = useCallback((event) => {
        if (event.key === "escape") {
            event.consumed = true;
            if (queryRef.current.length > 0) {
                setQueryAndRefresh("");
            }
            else {
                onCancelRef.current?.();
            }
            return;
        }
        if (event.key === "backspace") {
            event.consumed = true;
            if (queryRef.current.length > 0) {
                setQueryAndRefresh(queryRef.current.slice(0, -1));
            }
            return;
        }
        if (event.char && event.char.length === 1 && !event.ctrl && !event.meta) {
            // Don't swallow whitespace navigation keys; everything else printable
            // becomes part of the query.
            event.consumed = true;
            setQueryAndRefresh(queryRef.current + event.char);
            return;
        }
        // Arrow keys, return, tab, etc. fall through (consumed not set) so the
        // underlying Table's input handler picks them up.
    }, [setQueryAndRefresh]);
    useInput(handleInput, { isActive: isFocused, priority: SEARCH_TABLE_INPUT_PRIORITY });
    const query = queryRef.current;
    const { rows: filteredRows, originalIndices } = filteredRef.current;
    const wrappedOnRowSelect = onRowSelect
        ? (filteredIndex) => {
            const original = originalIndices[filteredIndex];
            if (original !== undefined)
                onRowSelect(original);
        }
        : undefined;
    const wrappedOnRowPress = onRowPress
        ? (filteredIndex) => {
            const original = originalIndices[filteredIndex];
            if (original !== undefined)
                onRowPress(original);
        }
        : undefined;
    const wrappedOnCellPress = onCellPress
        ? (filteredIndex, columnKey) => {
            const original = originalIndices[filteredIndex];
            if (original !== undefined)
                onCellPress(original, columnKey);
        }
        : undefined;
    // ── Render input row ─────────────────────────────────────────────────
    const queryDisplay = query.length === 0
        ? React.createElement("tui-text", { key: "ph", color: colors.text.dim, dim: true }, placeholder)
        : React.createElement("tui-text", { key: "q", color: colors.text.primary }, query);
    const cursor = isFocused
        ? React.createElement("tui-text", { key: "cur", color: colors.text.primary, inverse: true }, " ")
        : null;
    const inputRow = [
        React.createElement("tui-text", { key: "icon", color: iconColor }, `${searchIcon} `),
        queryDisplay,
    ];
    if (cursor)
        inputRow.push(cursor);
    if (showResultCount && query.length > 0) {
        inputRow.push(React.createElement("tui-text", { key: "count", color: colors.text.dim, dim: true }, ` ${filteredRows.length} result${filteredRows.length === 1 ? "" : "s"}`));
    }
    const showTable = !(hideTableUntilQuery && query.length === 0);
    const tableProps = {
        ...tableRest,
        columns,
        data: filteredRows,
        isFocused,
    };
    if (wrappedOnRowSelect)
        tableProps.onRowSelect = wrappedOnRowSelect;
    if (wrappedOnRowPress)
        tableProps.onRowPress = wrappedOnRowPress;
    if (wrappedOnCellPress)
        tableProps.onCellPress = wrappedOnCellPress;
    const tableElement = showTable ? React.createElement(Table, tableProps) : null;
    return React.createElement("tui-box", {
        flexDirection: "column",
        "aria-label": props["aria-label"],
        ...pickLayoutProps(props),
    }, React.createElement("tui-box", { key: "input", flexDirection: "row", role: "search" }, ...inputRow), tableElement);
}
//# sourceMappingURL=SearchTable.js.map