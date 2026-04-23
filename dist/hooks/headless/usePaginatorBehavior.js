import { useRef, useCallback } from "react";
import { useInput } from "../useInput.js";
export function usePaginatorBehavior(options) {
    const { total, current: rawCurrent, onPageChange, isActive = false, } = options;
    // Clamp current page to valid range (0-based: 0 to total-1)
    const current = total > 0 ? Math.max(0, Math.min(rawCurrent, total - 1)) : 0;
    const onPageChangeRef = useRef(onPageChange);
    onPageChangeRef.current = onPageChange;
    const currentRef = useRef(current);
    currentRef.current = current;
    const totalRef = useRef(total);
    totalRef.current = total;
    const prev = useCallback(() => {
        const cb = onPageChangeRef.current;
        if (!cb)
            return;
        const cur = currentRef.current;
        if (cur > 0) {
            cb(cur - 1);
        }
    }, []);
    const next = useCallback(() => {
        const cb = onPageChangeRef.current;
        if (!cb)
            return;
        const cur = currentRef.current;
        const tot = totalRef.current;
        if (cur < tot - 1) {
            cb(cur + 1);
        }
    }, []);
    const goTo = useCallback((page) => {
        const cb = onPageChangeRef.current;
        if (!cb)
            return;
        const tot = totalRef.current;
        const clamped = Math.max(0, Math.min(page, tot - 1));
        cb(clamped);
    }, []);
    const handleInput = useCallback((event) => {
        const cb = onPageChangeRef.current;
        if (!cb)
            return;
        const cur = currentRef.current;
        const tot = totalRef.current;
        if (event.key === "left" && cur > 0) {
            cb(cur - 1);
        }
        else if (event.key === "right" && cur < tot - 1) {
            cb(cur + 1);
        }
    }, []);
    useInput(handleInput, { isActive });
    return {
        page: current,
        totalPages: total,
        prev,
        next,
        goTo,
        hasPrev: current > 0,
        hasNext: current < total - 1,
    };
}
//# sourceMappingURL=usePaginatorBehavior.js.map