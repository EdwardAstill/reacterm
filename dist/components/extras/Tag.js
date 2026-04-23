import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { useInput } from "../../hooks/useInput.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const Tag = React.memo(function Tag(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Tag", rawProps);
    const { label, color = colors.brand.primary, bold: boldProp, dim, variant = "filled", onRemove, isFocused = false, } = props;
    useInput((event) => {
        if (onRemove && (event.key === "x" || event.key === "backspace")) {
            onRemove();
        }
    }, { isActive: isFocused && onRemove !== undefined });
    const displayText = variant === "outlined" ? `[${label}]` : ` ${label} `;
    const children = props.renderLabel
        ? [React.createElement(React.Fragment, { key: "label" }, props.renderLabel(label, variant))]
        : [
            variant === "filled"
                ? React.createElement("tui-text", { key: "label", color: colors.surface.base, backgroundColor: color, ...(boldProp !== undefined ? { bold: boldProp } : {}), ...(dim !== undefined ? { dim } : {}) }, displayText)
                : React.createElement("tui-text", { key: "label", color, ...(boldProp !== undefined ? { bold: boldProp } : {}), ...(dim !== undefined ? { dim } : {}) }, displayText),
        ];
    if (onRemove) {
        children.push(React.createElement("tui-text", { key: "remove", color: colors.text.dim }, " \u00D7"));
    }
    return React.createElement("tui-box", { flexDirection: "row" }, ...children);
});
//# sourceMappingURL=Tag.js.map