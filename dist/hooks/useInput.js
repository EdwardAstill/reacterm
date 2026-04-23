import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
/**
 * Subscribe to keyboard events. Handler is skipped when `isActive` is false.
 * Higher `priority` runs first and can shadow lower-priority handlers (useful for modal traps).
 */
export function useInput(handler, options = {}) {
    const { input } = useTui();
    const isActive = options.isActive ?? true;
    const priority = options.priority;
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    const activeRef = useRef(isActive);
    activeRef.current = isActive;
    const registeredRef = useRef(false);
    const unsubRef = useRef(null);
    const prevPriorityRef = useRef(priority);
    // Re-register if priority changes between undefined and a number
    if (registeredRef.current && prevPriorityRef.current !== priority) {
        unsubRef.current?.();
        registeredRef.current = false;
    }
    prevPriorityRef.current = priority;
    if (!registeredRef.current) {
        registeredRef.current = true;
        const wrappedHandler = (event) => {
            if (!activeRef.current)
                return;
            handlerRef.current(event);
        };
        if (priority !== undefined) {
            unsubRef.current = input.onKeyPrioritized(wrappedHandler, priority);
        }
        else {
            unsubRef.current = input.onKey(wrappedHandler);
        }
    }
    useCleanup(() => {
        unsubRef.current?.();
    });
}
//# sourceMappingURL=useInput.js.map