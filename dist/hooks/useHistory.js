import { useRef, useCallback } from "react";
import { useForceUpdate } from "./useForceUpdate.js";
export function useHistory(options) {
    const { initial, maxLength = 50 } = options;
    const forceUpdate = useForceUpdate();
    const entriesRef = useRef([initial]);
    const indexRef = useRef(0);
    const push = useCallback((entry) => {
        // Truncate forward entries
        entriesRef.current = entriesRef.current.slice(0, indexRef.current + 1);
        entriesRef.current.push(entry);
        // Enforce max length from the front
        if (entriesRef.current.length > maxLength) {
            const excess = entriesRef.current.length - maxLength;
            entriesRef.current = entriesRef.current.slice(excess);
        }
        indexRef.current = entriesRef.current.length - 1;
        forceUpdate();
    }, [maxLength, forceUpdate]);
    const back = useCallback(() => {
        if (indexRef.current <= 0)
            return null;
        indexRef.current--;
        forceUpdate();
        return entriesRef.current[indexRef.current];
    }, [forceUpdate]);
    const forward = useCallback(() => {
        if (indexRef.current >= entriesRef.current.length - 1)
            return null;
        indexRef.current++;
        forceUpdate();
        return entriesRef.current[indexRef.current];
    }, [forceUpdate]);
    const clear = useCallback(() => {
        const current = entriesRef.current[indexRef.current];
        entriesRef.current = [current];
        indexRef.current = 0;
        forceUpdate();
    }, [forceUpdate]);
    return {
        current: entriesRef.current[indexRef.current],
        push,
        back,
        forward,
        canGoBack: indexRef.current > 0,
        canGoForward: indexRef.current < entriesRef.current.length - 1,
        clear,
        entries: entriesRef.current,
        index: indexRef.current,
    };
}
//# sourceMappingURL=useHistory.js.map