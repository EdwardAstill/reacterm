import React, { useRef } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { createAnimation, tickAnimation, easings, } from "../../utils/animate.js";
function resolveEasing(name) {
    switch (name) {
        case "linear": return easings.linear;
        case "easeIn": return easings.easeIn;
        case "easeInOut": return easings.easeInOut;
        case "easeOut":
        default:
            return easings.easeOut;
    }
}
// These are in terminal rows/columns (integers work best for TUI).
const SLIDE_DISTANCE = 3;
export const Transition = React.memo(function Transition(rawProps) {
    const props = usePluginProps("Transition", rawProps);
    const personality = usePersonality();
    const { show, enter, exit, type = "fade", children, } = props;
    const defaultDuration = personality.animation.durationNormal;
    const { requestRender } = useTui();
    const requestRenderRef = useRef(requestRender);
    requestRenderRef.current = requestRender;
    const stateRef = useRef(show ? "visible" : "hidden");
    const animRef = useRef(null);
    const unsubRef = useRef(null);
    const prevShowRef = useRef(show);
    const valueRef = useRef(show ? 1 : 0);
    const { renderContext } = useTui();
    const scheduler = renderContext.animationScheduler;
    // ── Internal helpers ──────────────────────────────────────────
    const stopAnimation = () => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        animRef.current = null;
    };
    const startAnimation = (from, to, duration, easingFn, onDone) => {
        stopAnimation();
        if (duration <= 0 || personality.animation.reducedMotion) {
            valueRef.current = to;
            onDone();
            requestRenderRef.current();
            return;
        }
        animRef.current = createAnimation(from, to, duration, easingFn);
        valueRef.current = from;
        unsubRef.current = scheduler.add((_frameTime) => {
            const anim = animRef.current;
            if (!anim)
                return;
            const val = tickAnimation(anim);
            valueRef.current = val;
            if (anim.done) {
                stopAnimation();
                onDone();
            }
        });
    };
    // ── Detect show transitions ───────────────────────────────────
    if (show && !prevShowRef.current) {
        // Enter
        const duration = enter?.duration ?? defaultDuration;
        const easingFn = resolveEasing(enter?.easing ?? personality.animation.easing);
        stateRef.current = "entering";
        startAnimation(0, 1, duration, easingFn, () => {
            stateRef.current = "visible";
        });
    }
    else if (!show && prevShowRef.current) {
        // Exit
        const duration = exit?.duration ?? defaultDuration;
        const easingFn = resolveEasing(exit?.easing ?? personality.animation.easing);
        stateRef.current = "exiting";
        startAnimation(1, 0, duration, easingFn, () => {
            stateRef.current = "hidden";
            requestRenderRef.current();
        });
    }
    prevShowRef.current = show;
    // ── Cleanup ───────────────────────────────────────────────────
    useCleanup(() => {
        stopAnimation();
    });
    // ── Render nothing when fully hidden ──────────────────────────
    const state = stateRef.current;
    if (state === "hidden") {
        return null;
    }
    const t = valueRef.current; // 0..1 progress
    // Lookup: transition type -> wrapper props from progress t
    const TRANSITION_PROPS = {
        "fade": (t) => ({
            ...(t < 0.5 ? { dim: true } : {}),
        }),
        "slide-down": (t) => {
            const marginTop = Math.round(-SLIDE_DISTANCE * (1 - t));
            return {
                ...(marginTop !== 0 ? { marginTop } : {}),
                ...(t < 0.3 ? { dim: true } : {}),
            };
        },
        "slide-up": (t) => {
            const marginTop = Math.round(SLIDE_DISTANCE * (1 - t));
            return {
                ...(marginTop !== 0 ? { marginTop } : {}),
                ...(t < 0.3 ? { dim: true } : {}),
            };
        },
        "slide-right": (t) => {
            const paddingLeft = Math.round(SLIDE_DISTANCE * (1 - t));
            return {
                ...(paddingLeft !== 0 ? { paddingLeft } : {}),
                ...(t < 0.3 ? { dim: true } : {}),
            };
        },
        "collapse": (t) => {
            if (t >= 1)
                return {};
            const visibleRows = Math.max(0, Math.round(SLIDE_DISTANCE * t));
            return {
                height: visibleRows,
                overflow: "hidden",
                ...(t < 0.3 ? { dim: true } : {}),
            };
        },
    };
    const resolveProps = TRANSITION_PROPS[type] ?? TRANSITION_PROPS["fade"];
    return React.createElement("tui-box", resolveProps(t), children);
});
//# sourceMappingURL=Transition.js.map