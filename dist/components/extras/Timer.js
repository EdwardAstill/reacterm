import React from "react";
import { useAnimation } from "../../hooks/useAnimation.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    if (hours > 0) {
        return `${hours}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
}
export const Timer = React.memo(function Timer(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Timer", rawProps);
    const { startTime, duration, value, interval = 1000, color = colors.text.primary, running = true, prefix, } = props;
    // Tick the animation to force re-renders at the given interval
    useAnimation({ interval, active: running && value === undefined });
    let displayText;
    if (value !== undefined) {
        // Manual value override
        displayText = value;
    }
    else if (startTime !== undefined && duration !== undefined) {
        // Countdown mode
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        displayText = `${formatMs(remaining)} remaining`;
    }
    else if (startTime !== undefined) {
        // Elapsed mode
        const elapsed = Date.now() - startTime;
        displayText = formatMs(elapsed);
    }
    else {
        // No startTime, no value — show zeroes
        displayText = "00:00";
    }
    const children = [];
    if (prefix !== undefined) {
        children.push(React.createElement("tui-text", { key: "prefix", color }, prefix));
    }
    children.push(React.createElement("tui-text", { key: "time", color }, displayText));
    return React.createElement("tui-box", { flexDirection: "row" }, ...children);
});
//# sourceMappingURL=Timer.js.map