import React from "react";
import { useStyles } from "../../core/style-provider.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
export const Badge = React.memo(function Badge(rawProps) {
    const colors = useColors();
    const VARIANT_COLORS = {
        default: colors.brand.primary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        outline: colors.text.secondary,
    };
    const props = usePluginProps("Badge", rawProps);
    const { label, color: colorProp, bold: boldProp, dim, variant = "default", mode = "label", count, max = 99, className, id, } = props;
    const ssStyles = useStyles("Badge", className, id);
    // Explicit props win over stylesheet, stylesheet wins over variant defaults
    const resolvedColor = colorProp ?? ssStyles.color ?? VARIANT_COLORS[variant] ?? colors.brand.primary;
    const resolvedBold = boldProp !== undefined ? boldProp : (ssStyles.bold !== undefined ? ssStyles.bold : (variant !== "default" || colorProp !== undefined));
    if (props.renderContent) {
        return React.createElement("tui-box", { flexDirection: "row" }, props.renderContent(label, variant, mode));
    }
    if (mode === "dot") {
        return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: resolvedColor, bold: resolvedBold, ...(dim !== undefined ? { dim } : {}) }, "\u25CF"));
    }
    if (mode === "count") {
        const displayCount = count !== undefined ? count : 0;
        const countText = displayCount > max ? `${max}+` : `${displayCount}`;
        return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: resolvedColor, bold: true, ...(dim !== undefined ? { dim } : {}) }, countText));
    }
    const isOutline = variant === "outline";
    const displayText = isOutline ? `[${label}]` : (variant !== "default" ? `\u25CF ${label}` : `(${label})`);
    const outlineDim = isOutline && dim === undefined ? true : undefined;
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", {
        color: resolvedColor,
        bold: resolvedBold,
        ...(dim !== undefined ? { dim } : {}),
        ...(outlineDim !== undefined ? { dim: outlineDim } : {}),
    }, displayText));
});
//# sourceMappingURL=Badge.js.map