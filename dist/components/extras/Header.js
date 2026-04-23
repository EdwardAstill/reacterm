import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { pickStyleProps } from "../../styles/applyStyles.js";
import { DEFAULTS } from "../../styles/defaults.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
const BORDER_CHARS = {
    single: "\u2500", // ─
    double: "\u2501", // ━
    round: "\u2500", // ─ (thin line)
};
// Border lines render at 200 chars and rely on parent box truncation.
const SEPARATOR = " \u2014 "; // —
export const Header = React.memo(function Header(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Header", rawProps);
    const personality = usePersonality();
    const { title, subtitle, color = personality.typography.headingColor, bold: boldProp, dim: dimProp, borderStyle = DEFAULTS.header.borderStyle, width, right, showBorder = true, } = props;
    const layoutProps = pickStyleProps(props);
    const borderWidth = typeof width === "number" ? width : 80;
    // Resolve effective border style: if showBorder is false, force "none"
    const effectiveBorderStyle = showBorder ? borderStyle : "none";
    const elements = [];
    if (effectiveBorderStyle !== "none") {
        const borderChar = BORDER_CHARS[effectiveBorderStyle] ?? BORDER_CHARS.double;
        const borderLine = borderChar.repeat(borderWidth);
        elements.push(React.createElement("tui-text", { key: "__border-top", color: colors.text.dim, wrap: "truncate" }, borderLine));
    }
    // Title line
    if (props.renderTitle) {
        elements.push(React.createElement("tui-box", { key: "__title", flexDirection: "row" }, props.renderTitle(title, subtitle)));
    }
    else {
        const titleParts = [];
        titleParts.push(React.createElement("tui-text", { key: "space", }, " "));
        titleParts.push(React.createElement("tui-text", { key: "title", bold: boldProp !== undefined ? boldProp : true, color, ...(dimProp !== undefined ? { dim: dimProp } : {}) }, title));
        if (subtitle !== undefined) {
            titleParts.push(React.createElement("tui-text", { key: "subtitle", color: colors.text.dim }, `${SEPARATOR}${subtitle}`));
        }
        // Right-aligned content
        if (right !== undefined) {
            titleParts.push(React.createElement("tui-box", { key: "spacer", flex: 1 }));
            titleParts.push(typeof right === "string"
                ? React.createElement("tui-text", { key: "right", color: colors.text.secondary }, right)
                : React.createElement("tui-box", { key: "right" }, right));
        }
        elements.push(React.createElement("tui-box", { key: "__title", flexDirection: "row" }, ...titleParts));
    } // end else (no renderTitle)
    if (effectiveBorderStyle !== "none") {
        const borderChar = BORDER_CHARS[effectiveBorderStyle] ?? BORDER_CHARS.double;
        const borderLine = borderChar.repeat(borderWidth);
        elements.push(React.createElement("tui-text", { key: "__border-bottom", color: colors.text.dim, wrap: "truncate" }, borderLine));
    }
    const outerBoxProps = {
        flexDirection: "column",
        ...layoutProps,
    };
    return React.createElement("tui-box", outerBoxProps, ...elements);
});
//# sourceMappingURL=Header.js.map