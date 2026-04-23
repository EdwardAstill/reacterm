import { useRef } from "react";
import { useCleanup } from "./useCleanup.js";
import { useForceUpdate } from "./useForceUpdate.js";
export function useGhostText(options) {
    const { value, cursor, suggest, acceptKey = "tab", debounceMs = 150 } = options;
    const forceUpdate = useForceUpdate();
    const ghostRef = useRef("");
    const timerRef = useRef(null);
    const prevValueRef = useRef(value);
    const resolveFromArray = (arr, val) => {
        if (val.length === 0)
            return "";
        for (const item of arr) {
            if (item.startsWith(val) && item.length > val.length) {
                return item.slice(val.length);
            }
        }
        return "";
    };
    const resolveFromFn = (fn, val) => {
        const result = fn(val);
        if (result === null)
            return "";
        // If the result starts with the value, extract the completion part
        if (result.startsWith(val)) {
            return result.slice(val.length);
        }
        return result;
    };
    // When value changes, recompute ghost
    if (value !== prevValueRef.current) {
        prevValueRef.current = value;
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (Array.isArray(suggest)) {
            // Synchronous resolution for arrays
            ghostRef.current = resolveFromArray(suggest, value);
        }
        else {
            // Debounced resolution for functions
            ghostRef.current = "";
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                ghostRef.current = resolveFromFn(suggest, value);
                forceUpdate();
            }, debounceMs);
        }
    }
    const accept = () => {
        if (ghostRef.current.length === 0)
            return null;
        const full = value + ghostRef.current;
        ghostRef.current = "";
        forceUpdate();
        return full;
    };
    const dismiss = () => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (ghostRef.current.length > 0) {
            ghostRef.current = "";
            forceUpdate();
        }
    };
    useCleanup(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    });
    return {
        ghost: ghostRef.current,
        accept,
        dismiss,
    };
}
//# sourceMappingURL=useGhostText.js.map