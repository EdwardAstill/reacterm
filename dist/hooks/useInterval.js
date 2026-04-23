import { useRef } from "react";
import { useCleanup } from "./useCleanup.js";
export function useInterval(callback, delayMs, options = {}) {
    const active = options.active ?? true;
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const activeRef = useRef(active);
    activeRef.current = active;
    // Start ONCE eagerly
    const registeredRef = useRef(false);
    const timerRef = useRef(null);
    if (!registeredRef.current) {
        registeredRef.current = true;
        timerRef.current = setInterval(() => {
            if (!activeRef.current)
                return;
            callbackRef.current();
        }, delayMs);
    }
    useCleanup(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
        }
    });
}
//# sourceMappingURL=useInterval.js.map