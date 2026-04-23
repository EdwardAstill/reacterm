import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
/**
 * Timer + requestRender() loop for animations that bypass React state.
 * Use this instead of useState + useEffect when you need 60fps text updates
 * (spinners, shimmer, streaming). Mutate the textNodeRef directly in onTick.
 */
export function useImperativeAnimation(options) {
    const { active = true, intervalMs, onTick } = options;
    const textNodeRef = useRef(null);
    const { requestRender } = useTui();
    // Keep latest callback & requestRender in refs to avoid stale closures
    const onTickRef = useRef(onTick);
    onTickRef.current = onTick;
    const requestRenderRef = useRef(requestRender);
    requestRenderRef.current = requestRender;
    const timerRef = useRef(null);
    const intervalRef = useRef(intervalMs);
    // Stop timer when not active
    if (!active && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    // Start or restart timer when active and interval changes
    if (active && (timerRef.current === null || intervalRef.current !== intervalMs)) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        intervalRef.current = intervalMs;
        timerRef.current = setInterval(() => {
            const result = onTickRef.current();
            requestRenderRef.current();
            // Self-terminating: if onTick returns false, stop the timer
            if (result === false) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
        }, intervalMs);
    }
    useCleanup(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    });
    return { textNodeRef, requestRenderRef };
}
//# sourceMappingURL=useImperativeAnimation.js.map