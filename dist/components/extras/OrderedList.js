import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
const MAX_DEPTH = 20;
/** Convert a 1-based number to lowercase alpha (a, b, c, ..., z, aa, ab, ...). */
function toAlpha(n) {
    let result = "";
    let num = n;
    while (num > 0) {
        num--;
        result = String.fromCharCode(97 + (num % 26)) + result;
        num = Math.floor(num / 26);
    }
    return result;
}
/** Convert a 1-based number to uppercase alpha (A, B, C, ...). */
function toAlphaUpper(n) {
    return toAlpha(n).toUpperCase();
}
/** Convert a number to lowercase roman numerals. */
function toRoman(n) {
    if (n <= 0 || n > 3999)
        return String(n);
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"];
    let result = "";
    let remaining = n;
    for (let i = 0; i < vals.length; i++) {
        while (remaining >= vals[i]) {
            result += syms[i];
            remaining -= vals[i];
        }
    }
    return result;
}
/** Convert a number to uppercase roman numerals. */
function toRomanUpper(n) {
    return toRoman(n).toUpperCase();
}
/** Format a number according to the given style. */
function formatNumber(n, numberStyle) {
    switch (numberStyle) {
        case "alpha":
            return toAlpha(n);
        case "Alpha":
            return toAlphaUpper(n);
        case "roman":
            return toRoman(n);
        case "Roman":
            return toRomanUpper(n);
        case "decimal":
        default:
            return String(n);
    }
}
function renderOrderedItems(items, start, color, numberColor, level, numberStyle, reversed, renderItemFn) {
    if (level >= MAX_DEPTH)
        return [];
    const rows = [];
    const indent = "  ".repeat(level);
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const num = reversed
            ? start + items.length - 1 - i
            : start + i;
        let content;
        let children;
        if (item !== null && typeof item === "object" && !React.isValidElement(item) && "content" in item) {
            const nested = item;
            content = nested.content;
            children = nested.children;
        }
        else {
            content = item;
        }
        const formattedNum = formatNumber(num, numberStyle);
        const numbering = `${indent}${formattedNum}. `;
        if (renderItemFn) {
            rows.push(React.createElement("tui-box", { key: `item-${level}-${i}`, flexDirection: "row" }, renderItemFn(content, num - 1, numbering)));
        }
        else {
            rows.push(React.createElement("tui-box", { key: `item-${level}-${i}`, flexDirection: "row" }, React.createElement("tui-text", { color: numberColor }, numbering), typeof content === "string"
                ? React.createElement("tui-text", { color }, content)
                : content));
        }
        if (children && children.length > 0) {
            const childRows = renderOrderedItems(children, 1, color, numberColor, level + 1, numberStyle, reversed, renderItemFn);
            rows.push(...childRows);
        }
    }
    return rows;
}
export const OrderedList = React.memo(function OrderedList(rawProps) {
    const colors = useColors();
    const props = usePluginProps("OrderedList", rawProps);
    const { items, start = 1, color = colors.text.primary, numberColor = colors.text.secondary, style: numberStyle = "decimal", reversed = false, } = props;
    if (items.length === 0) {
        return React.createElement("tui-text", { color: colors.text.dim, dim: true }, "(No items)");
    }
    const rows = renderOrderedItems(items, start, color, numberColor, 0, numberStyle, reversed, props.renderItem);
    return React.createElement("tui-box", { flexDirection: "column" }, ...rows);
});
//# sourceMappingURL=OrderedList.js.map