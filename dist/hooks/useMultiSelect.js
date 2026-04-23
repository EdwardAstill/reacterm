import { useRef } from "react";
import { useInput } from "./useInput.js";
import { useForceUpdate } from "./useForceUpdate.js";
export function useMultiSelect(options) {
    const { itemCount, isActive = true, onChange } = options;
    const forceUpdate = useForceUpdate();
    const selectedRef = useRef(new Set());
    const cursorRef = useRef(0);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const notify = () => {
        onChangeRef.current?.(new Set(selectedRef.current));
        forceUpdate();
    };
    const toggle = (index) => {
        if (index < 0 || index >= itemCount)
            return;
        const set = selectedRef.current;
        if (set.has(index)) {
            set.delete(index);
        }
        else {
            set.add(index);
        }
        notify();
    };
    const selectRange = (from, to) => {
        const lo = Math.max(0, Math.min(from, to));
        const hi = Math.min(itemCount - 1, Math.max(from, to));
        const set = selectedRef.current;
        for (let i = lo; i <= hi; i++) {
            set.add(i);
        }
        notify();
    };
    const selectAll = () => {
        const set = selectedRef.current;
        for (let i = 0; i < itemCount; i++) {
            set.add(i);
        }
        notify();
    };
    const deselectAll = () => {
        selectedRef.current.clear();
        notify();
    };
    const isSelected = (index) => {
        return selectedRef.current.has(index);
    };
    useInput((event) => {
        if (itemCount === 0)
            return;
        // Space — toggle current item
        if (event.key === "space" && !event.ctrl && !event.meta) {
            toggle(cursorRef.current);
            return;
        }
        // Shift+Down — extend selection downward
        if (event.key === "down" && event.shift && !event.ctrl && !event.meta) {
            const prev = cursorRef.current;
            const next = Math.min(itemCount - 1, prev + 1);
            cursorRef.current = next;
            selectedRef.current.add(next);
            notify();
            return;
        }
        // Shift+Up — extend selection upward
        if (event.key === "up" && event.shift && !event.ctrl && !event.meta) {
            const prev = cursorRef.current;
            const next = Math.max(0, prev - 1);
            cursorRef.current = next;
            selectedRef.current.add(next);
            notify();
            return;
        }
        // Down — move cursor without selecting
        if (event.key === "down" && !event.shift && !event.ctrl && !event.meta) {
            cursorRef.current = Math.min(itemCount - 1, cursorRef.current + 1);
            forceUpdate();
            return;
        }
        // Up — move cursor without selecting
        if (event.key === "up" && !event.shift && !event.ctrl && !event.meta) {
            cursorRef.current = Math.max(0, cursorRef.current - 1);
            forceUpdate();
            return;
        }
        // A — select all (lowercase only, no modifiers)
        if (event.char === "a" && !event.ctrl && !event.meta && !event.shift) {
            selectAll();
            return;
        }
        // N — deselect all (lowercase only, no modifiers)
        if (event.char === "n" && !event.ctrl && !event.meta && !event.shift) {
            deselectAll();
            return;
        }
    }, { isActive });
    // Clamp cursor if itemCount shrinks
    if (cursorRef.current >= itemCount && itemCount > 0) {
        cursorRef.current = itemCount - 1;
    }
    return {
        selected: selectedRef.current,
        cursor: cursorRef.current,
        toggle,
        selectRange,
        selectAll,
        deselectAll,
        isSelected,
    };
}
//# sourceMappingURL=useMultiSelect.js.map