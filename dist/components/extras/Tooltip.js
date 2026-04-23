import React, { useRef } from "react";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
const ARROW_CHARS = {
    top: "\u25BC", // ▼ points down toward target
    bottom: "\u25B2", // ▲ points up toward target
    left: "\u25B6", // ▶ points right toward target
    right: "\u25C0", // ◀ points left toward target
};
export const Tooltip = React.memo(function Tooltip(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Tooltip", rawProps);
    const personality = usePersonality();
    const { content, children, visible = false, position = "top", color = personality.colors.text.secondary, maxWidth, delay = 0, arrow = false, targetRow, targetCol, } = props;
    const { screen, requestRender } = useTui();
    const delayTimerRef = useRef(null);
    const delayVisibleRef = useRef(false);
    const prevVisibleRef = useRef(visible);
    if (visible && !prevVisibleRef.current) {
        // Became visible — start delay timer if needed
        if (delay > 0) {
            delayVisibleRef.current = false;
            if (delayTimerRef.current)
                clearTimeout(delayTimerRef.current);
            delayTimerRef.current = setTimeout(() => {
                delayVisibleRef.current = true;
                delayTimerRef.current = null;
                requestRender();
            }, delay);
        }
        else {
            delayVisibleRef.current = true;
        }
    }
    else if (!visible && prevVisibleRef.current) {
        // Became hidden — cancel any pending timer
        delayVisibleRef.current = false;
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
        }
    }
    prevVisibleRef.current = visible;
    useCleanup(() => {
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
        }
    });
    const effectivelyVisible = visible && (delay === 0 || delayVisibleRef.current);
    // Auto-positioning: flip if tooltip would overflow terminal edges
    let resolvedPosition = position;
    if (effectivelyVisible) {
        const rows = screen.height;
        const cols = screen.width;
        if (resolvedPosition === "top" && targetRow !== undefined && targetRow === 0) {
            resolvedPosition = "bottom";
        }
        else if (resolvedPosition === "bottom" && targetRow !== undefined && targetRow >= rows - 1) {
            resolvedPosition = "top";
        }
        else if (resolvedPosition === "right" && targetCol !== undefined && targetCol + content.length + 2 > cols) {
            resolvedPosition = "left";
        }
        else if (resolvedPosition === "left" && targetCol !== undefined && targetCol < content.length + 2) {
            resolvedPosition = "right";
        }
    }
    const tooltipText = maxWidth !== undefined && content.length > maxWidth
        ? content.slice(0, maxWidth - 1) + "\u2026"
        : content;
    const tooltipElement = props.renderContent
        ? React.createElement(React.Fragment, {}, props.renderContent(content))
        : React.createElement("tui-text", { color, dim: true, ...(maxWidth !== undefined ? { wrap: "truncate" } : {}) }, tooltipText);
    const arrowElement = arrow
        ? React.createElement("tui-text", { color, dim: true }, ARROW_CHARS[resolvedPosition] ?? "")
        : null;
    if (!effectivelyVisible) {
        return React.createElement("tui-box", {}, children);
    }
    if (resolvedPosition === "left") {
        return React.createElement("tui-box", { role: "tooltip", flexDirection: "row" }, tooltipElement, ...(arrowElement ? [arrowElement] : []), React.createElement("tui-text", {}, " "), children);
    }
    if (resolvedPosition === "right") {
        return React.createElement("tui-box", { role: "tooltip", flexDirection: "row" }, children, React.createElement("tui-text", {}, " "), ...(arrowElement ? [arrowElement] : []), tooltipElement);
    }
    if (resolvedPosition === "bottom") {
        return React.createElement("tui-box", { role: "tooltip", flexDirection: "column" }, children, ...(arrowElement ? [arrowElement] : []), tooltipElement);
    }
    // Default: top
    return React.createElement("tui-box", { role: "tooltip", flexDirection: "column" }, tooltipElement, ...(arrowElement ? [arrowElement] : []), children);
});
//# sourceMappingURL=Tooltip.js.map