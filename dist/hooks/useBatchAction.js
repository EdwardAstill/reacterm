import { useRef } from "react";
import { useForceUpdate } from "./useForceUpdate.js";
export function useBatchAction(options) {
    const { itemCount, isActive = true } = options;
    const forceUpdate = useForceUpdate();
    const selectedRef = useRef(new Set());
    const toggle = (index) => {
        if (!isActive)
            return;
        if (index < 0 || index >= itemCount)
            return;
        const next = new Set(selectedRef.current);
        if (next.has(index)) {
            next.delete(index);
        }
        else {
            next.add(index);
        }
        selectedRef.current = next;
        forceUpdate();
    };
    const selectAll = () => {
        if (!isActive)
            return;
        const next = new Set();
        for (let i = 0; i < itemCount; i++) {
            next.add(i);
        }
        selectedRef.current = next;
        forceUpdate();
    };
    const deselectAll = () => {
        if (selectedRef.current.size === 0)
            return;
        selectedRef.current = new Set();
        forceUpdate();
    };
    const execute = (action) => {
        if (!isActive)
            return;
        const indices = Array.from(selectedRef.current).sort((a, b) => a - b);
        if (indices.length === 0)
            return;
        selectedRef.current = new Set();
        forceUpdate();
        action(indices);
    };
    return {
        selected: selectedRef.current,
        isSelecting: selectedRef.current.size > 0,
        toggle,
        selectAll,
        deselectAll,
        execute,
        count: selectedRef.current.size,
    };
}
//# sourceMappingURL=useBatchAction.js.map