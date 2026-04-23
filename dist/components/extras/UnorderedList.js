import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
const MAX_DEPTH = 20;
const LEVEL_MARKERS = ["\u2022", "\u25E6", "\u25AA"]; // bullet, circle, square
/** Status indicator mappings. */
const STATUS_ICONS = {
    success: "\u2713", // ✓
    error: "\u2717", // ✗
    pending: "\u25CB", // ○
    running: "\u25D4", // ◔ (spinner-like)
};
function getStatusColors(colors) {
    return {
        success: colors.success,
        error: colors.error,
        pending: colors.text.dim,
        running: colors.brand.primary,
    };
}
function renderUnorderedItems(items, marker, color, markerColor, level, globalIcon, statusColors, renderItemFn) {
    if (level >= MAX_DEPTH)
        return [];
    const rows = [];
    const indent = "  ".repeat(level);
    const defaultMarker = marker !== undefined
        ? marker
        : LEVEL_MARKERS[level % LEVEL_MARKERS.length] ?? LEVEL_MARKERS[0];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let content;
        let children;
        let itemIcon;
        let itemStatus;
        if (item !== null && typeof item === "object" && !React.isValidElement(item) && "content" in item) {
            const nested = item;
            content = nested.content;
            children = nested.children;
            itemIcon = nested.icon;
            itemStatus = nested.status;
        }
        else {
            content = item;
        }
        let displayMarker;
        let displayMarkerColor = markerColor;
        let displayMarkerDim = false;
        if (itemStatus) {
            // Status takes priority for the marker
            displayMarker = STATUS_ICONS[itemStatus];
            displayMarkerColor = statusColors[itemStatus];
            if (itemStatus === "pending")
                displayMarkerDim = true;
        }
        else if (itemIcon !== undefined) {
            displayMarker = itemIcon;
        }
        else if (globalIcon !== undefined) {
            displayMarker = globalIcon;
        }
        else {
            displayMarker = defaultMarker;
        }
        const markerProps = { color: displayMarkerColor };
        if (displayMarkerDim)
            markerProps["dim"] = true;
        const markerStr = `${indent}${displayMarker} `;
        if (renderItemFn) {
            rows.push(React.createElement("tui-box", { key: `item-${level}-${i}`, flexDirection: "row" }, renderItemFn(content, i, markerStr)));
        }
        else {
            rows.push(React.createElement("tui-box", { key: `item-${level}-${i}`, flexDirection: "row" }, React.createElement("tui-text", markerProps, markerStr), typeof content === "string"
                ? React.createElement("tui-text", { color }, content)
                : content));
        }
        if (children && children.length > 0) {
            const childRows = renderUnorderedItems(children, marker, color, markerColor, level + 1, globalIcon, statusColors, renderItemFn);
            rows.push(...childRows);
        }
    }
    return rows;
}
export const UnorderedList = React.memo(function UnorderedList(rawProps) {
    const colors = useColors();
    const props = usePluginProps("UnorderedList", rawProps);
    const { items, marker, color: colorProp, markerColor: markerColorProp, icon, } = props;
    const color = colorProp ?? colors.text.primary;
    const markerColor = markerColorProp ?? colors.text.secondary;
    const statusColors = getStatusColors(colors);
    if (items.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "(No items)");
    }
    const rows = renderUnorderedItems(items, marker, color, markerColor, 0, icon, statusColors, props.renderItem);
    return React.createElement("tui-box", { flexDirection: "column" }, ...rows);
});
//# sourceMappingURL=UnorderedList.js.map