import { useRef } from "react";
import { useCleanup } from "./useCleanup.js";
export function useTimeout(callback, delayMs) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    // Start ONCE eagerly
    const registeredRef = useRef(false);
    const timerRef = useRef(null);
    if (!registeredRef.current) {
        registeredRef.current = true;
        timerRef.current = setTimeout(() => {
            callbackRef.current();
        }, delayMs);
    }
    useCleanup(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }
    });
}
//# sourceMappingURL=useTimeout.js.map