import { useRef, useState } from "react";
import { useCleanup } from "./useCleanup.js";
import { useTui } from "../context/TuiContext.js";
export function useDebouncedValue(value, delayMs) {
    const [debounced, setDebounced] = useState(value);
    const timerRef = useRef(null);
    const lastSeenRef = useRef(value);
    const { requestRender } = useTui();
    if (lastSeenRef.current !== value) {
        lastSeenRef.current = value;
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setDebounced(value);
            requestRender();
        }, delayMs);
    }
    useCleanup(() => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
    });
    return debounced;
}
//# sourceMappingURL=useDebouncedValue.js.map