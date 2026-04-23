import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
/**
 * useAnimation — reusable animation hook.
 *
 * Registers with the global AnimationScheduler instead of creating its own
 * setInterval. The scheduler ticks all animations on a single timer and
 * calls requestRender() once per tick, preventing timer thrashing.
 *
 * @example
 * const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
 * function MySpinner() {
 *   const { frame, textRef } = useAnimation({ interval: 80 });
 *   return <tui-text _textNodeRef={textRef}>{FRAMES[frame % FRAMES.length]}</tui-text>;
 * }
 */
export function useAnimation(options = {}) {
    const { active = true, initialFrame = 0 } = options;
    const { renderContext, requestRender } = useTui();
    const frameRef = useRef(initialFrame);
    const textRef = useRef(null);
    const unsubRef = useRef(null);
    const activeRef = useRef(active);
    activeRef.current = active;
    const scheduler = renderContext.animationScheduler;
    // Start/stop based on active state
    if (active && !unsubRef.current) {
        unsubRef.current = scheduler.add((_frameTime) => {
            if (!activeRef.current)
                return;
            frameRef.current++;
            // No need to call requestRender — scheduler does it
        });
    }
    else if (!active && unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
    }
    useCleanup(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
    });
    const tick = () => {
        frameRef.current++;
        requestRender();
    };
    return {
        frame: frameRef.current,
        textRef,
        tick,
    };
}
//# sourceMappingURL=useAnimation.js.map