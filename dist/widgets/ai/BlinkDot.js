import React, { useRef } from "react";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
import { useImperativeAnimation } from "../../hooks/useImperativeAnimation.js";
const DOT = "\u25CF"; // ●
export const BlinkDot = React.memo(function BlinkDot(rawProps) {
    const colors = useColors();
    const STATE_COLORS = {
        pending: colors.tool.pending,
        running: colors.tool.running,
        streaming: colors.tool.pending,
        completed: colors.tool.completed,
        failed: colors.tool.failed,
        cancelled: colors.tool.cancelled,
    };
    const props = usePluginProps("BlinkDot", rawProps);
    const personality = usePersonality();
    const { state, interval = personality.animation.durationSlow, dotCharacter = DOT, offCharacter = " ", renderDot } = props;
    const visibleRef = useRef(true);
    // Keep latest state value in ref for the interval callback
    const stateRef = useRef(state);
    stateRef.current = state;
    // For terminal states (completed, failed, cancelled), stop the timer to avoid wasting CPU
    const isTerminal = state === "completed" || state === "failed" || state === "cancelled";
    const { textNodeRef: dotTextRef, requestRenderRef } = useImperativeAnimation({
        active: !isTerminal,
        intervalMs: interval,
        onTick: () => {
            if (stateRef.current === "running") {
                visibleRef.current = !visibleRef.current;
                if (dotTextRef.current) {
                    dotTextRef.current.text = visibleRef.current ? dotCharacter : offCharacter;
                }
            }
            else {
                // Non-blinking states: ensure dot is visible
                if (!visibleRef.current) {
                    visibleRef.current = true;
                    if (dotTextRef.current) {
                        dotTextRef.current.text = dotCharacter;
                    }
                }
            }
        },
    });
    // When entering terminal state, ensure dot is visible
    if (isTerminal && !visibleRef.current) {
        visibleRef.current = true;
        if (dotTextRef.current) {
            dotTextRef.current.text = dotCharacter;
            requestRenderRef.current();
        }
    }
    const color = STATE_COLORS[state];
    if (renderDot) {
        return React.createElement(React.Fragment, null, renderDot(dotCharacter, state));
    }
    return React.createElement("tui-text", { color, _textNodeRef: dotTextRef }, dotCharacter);
});
//# sourceMappingURL=BlinkDot.js.map