import { useRef } from "react";
import { useForceUpdate } from "./useForceUpdate.js";
export function useSortable(options) {
    const { columns, defaultSort, isActive = true, onSort } = options;
    const forceUpdate = useForceUpdate();
    const sortKeyRef = useRef(defaultSort?.key ?? null);
    const sortDirRef = useRef(defaultSort?.direction ?? "asc");
    const onSortRef = useRef(onSort);
    onSortRef.current = onSort;
    const columnsRef = useRef(columns);
    columnsRef.current = columns;
    const toggleSort = (key) => {
        if (!isActive)
            return;
        if (!columnsRef.current.includes(key))
            return;
        if (sortKeyRef.current !== key) {
            // New column — start with asc
            sortKeyRef.current = key;
            sortDirRef.current = "asc";
            onSortRef.current?.(key, "asc");
        }
        else if (sortDirRef.current === "asc") {
            // Same column, asc -> desc
            sortDirRef.current = "desc";
            onSortRef.current?.(key, "desc");
        }
        else {
            // Same column, desc -> none
            sortKeyRef.current = null;
            sortDirRef.current = "asc";
        }
        forceUpdate();
    };
    const setSort = (key, direction) => {
        if (!isActive)
            return;
        if (!columnsRef.current.includes(key))
            return;
        sortKeyRef.current = key;
        sortDirRef.current = direction;
        onSortRef.current?.(key, direction);
        forceUpdate();
    };
    const clearSort = () => {
        if (sortKeyRef.current === null)
            return;
        sortKeyRef.current = null;
        sortDirRef.current = "asc";
        forceUpdate();
    };
    const indicator = (key) => {
        if (sortKeyRef.current !== key)
            return "";
        return sortDirRef.current === "asc" ? "\u25B2" : "\u25BC";
    };
    return {
        sortKey: sortKeyRef.current,
        sortDirection: sortDirRef.current,
        toggleSort,
        setSort,
        clearSort,
        indicator,
    };
}
//# sourceMappingURL=useSortable.js.map