import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
const DEFAULT_SHADOW_CHAR = "\u2591"; // ░
export const Shadow = React.memo(function Shadow(rawProps) {
    const themeColors = useColors();
    const props = usePluginProps("Shadow", rawProps);
    const { children, offset = 1, char = DEFAULT_SHADOW_CHAR, color = themeColors.surface.base, direction = "bottom-right", width = 20, contentWidth, } = props;
    // contentWidth overrides width for the bottom shadow
    const bottomWidth = contentWidth ?? width;
    const showRight = direction === "bottom-right" || direction === "right";
    const showBottom = direction === "bottom-right" || direction === "bottom";
    const shadowChar = char.repeat(offset);
    const contentRowChildren = [];
    contentRowChildren.push(React.createElement("tui-box", { key: "content" }, children));
    if (showRight) {
        contentRowChildren.push(React.createElement("tui-text", { key: "shadow-right", color, dim: true }, shadowChar));
    }
    const contentRow = React.createElement("tui-box", { key: "row", flexDirection: "row" }, ...contentRowChildren);
    const elements = [contentRow];
    // Bottom shadow row
    if (showBottom) {
        const bottomShadowChildren = [];
        // If showing right shadow too, we need an offset spacer at the start
        // to align the bottom shadow under the content (not under the right shadow)
        if (showRight) {
            bottomShadowChildren.push(React.createElement("tui-text", { key: "spacer" }, " ".repeat(offset)));
        }
        bottomShadowChildren.push(React.createElement("tui-text", { key: "shadow-bottom", color, dim: true }, char.repeat(bottomWidth)));
        elements.push(React.createElement("tui-box", { key: "bottom-row", flexDirection: "row" }, ...bottomShadowChildren));
    }
    return React.createElement("tui-box", { flexDirection: "column" }, ...elements);
});
//# sourceMappingURL=Shadow.js.map