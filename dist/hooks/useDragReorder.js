import { useRef, useCallback } from "react";
import { useInput } from "./useInput.js";
import { useForceUpdate } from "./useForceUpdate.js";
export function useDragReorder(options) {
    const { items, isActive = true, onReorder } = options;
    const forceUpdate = useForceUpdate();
    const isDraggingRef = useRef(false);
    const dragIndexRef = useRef(null);
    const workingItemsRef = useRef([]);
    const originalItemsRef = useRef([]);
    // Keep items ref current
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const onReorderRef = useRef(onReorder);
    onReorderRef.current = onReorder;
    const startDrag = useCallback((index) => {
        if (index < 0 || index >= itemsRef.current.length)
            return;
        isDraggingRef.current = true;
        dragIndexRef.current = index;
        workingItemsRef.current = [...itemsRef.current];
        originalItemsRef.current = [...itemsRef.current];
        forceUpdate();
    }, [forceUpdate]);
    const drop = useCallback(() => {
        if (!isDraggingRef.current)
            return;
        const reordered = [...workingItemsRef.current];
        isDraggingRef.current = false;
        dragIndexRef.current = null;
        workingItemsRef.current = [];
        originalItemsRef.current = [];
        forceUpdate();
        onReorderRef.current(reordered);
    }, [forceUpdate]);
    const cancel = useCallback(() => {
        if (!isDraggingRef.current)
            return;
        // Revert to original order
        onReorderRef.current([...originalItemsRef.current]);
        isDraggingRef.current = false;
        dragIndexRef.current = null;
        workingItemsRef.current = [];
        originalItemsRef.current = [];
        forceUpdate();
    }, [forceUpdate]);
    useInput((event) => {
        if (!isActive || !isDraggingRef.current || dragIndexRef.current === null)
            return;
        const idx = dragIndexRef.current;
        const arr = workingItemsRef.current;
        if (event.key === "up" && idx > 0) {
            const above = arr[idx - 1];
            const current = arr[idx];
            arr[idx - 1] = current;
            arr[idx] = above;
            dragIndexRef.current = idx - 1;
            onReorderRef.current([...arr]);
            forceUpdate();
        }
        else if (event.key === "down" && idx < arr.length - 1) {
            const current = arr[idx];
            const below = arr[idx + 1];
            arr[idx] = below;
            arr[idx + 1] = current;
            dragIndexRef.current = idx + 1;
            onReorderRef.current([...arr]);
            forceUpdate();
        }
        else if (event.key === "return" || event.key === "space") {
            drop();
        }
        else if (event.key === "escape") {
            cancel();
        }
    }, { isActive });
    return {
        isDragging: isDraggingRef.current,
        dragIndex: dragIndexRef.current,
        startDrag,
        drop,
        cancel,
    };
}
//# sourceMappingURL=useDragReorder.js.map