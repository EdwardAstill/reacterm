import { useRef, useCallback } from "react";
import { useCleanup } from "../useCleanup.js";
import { useForceUpdate } from "../useForceUpdate.js";
let toastIdCounter = 0;
export function useToastBehavior(options = {}) {
    const { maxVisible = 3, defaultDurationMs = 0, } = options;
    const forceUpdate = useForceUpdate();
    const toastsRef = useRef([]);
    const timersRef = useRef(new Map());
    const removeToast = useCallback((id) => {
        toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
        const timer = timersRef.current.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        forceUpdate();
    }, [forceUpdate]);
    const addToast = useCallback((message, opts) => {
        const id = opts?.id ?? `toast-${++toastIdCounter}`;
        const durationMs = opts?.durationMs ?? defaultDurationMs;
        const type = opts?.type;
        const item = {
            id,
            message,
            ...(type !== undefined ? { type } : {}),
            ...(durationMs > 0 ? { durationMs } : {}),
        };
        toastsRef.current = [...toastsRef.current, item];
        if (durationMs > 0) {
            const timer = setTimeout(() => {
                timersRef.current.delete(id);
                toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
                forceUpdate();
            }, durationMs);
            timersRef.current.set(id, timer);
        }
        forceUpdate();
        return id;
    }, [defaultDurationMs, forceUpdate]);
    const clearAll = useCallback(() => {
        for (const timer of timersRef.current.values()) {
            clearTimeout(timer);
        }
        timersRef.current.clear();
        toastsRef.current = [];
        forceUpdate();
    }, [forceUpdate]);
    // Clean up timers on unmount
    useCleanup(() => {
        for (const timer of timersRef.current.values()) {
            clearTimeout(timer);
        }
        timersRef.current.clear();
    });
    const toasts = toastsRef.current;
    const visibleToasts = toasts.slice(-maxVisible);
    return {
        toasts,
        visibleToasts,
        addToast,
        removeToast,
        clearAll,
    };
}
//# sourceMappingURL=useToastBehavior.js.map