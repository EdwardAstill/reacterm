import React, { useId } from "react";
import { getColorAt } from "../../utils/color.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
import { useMeasure } from "../../hooks/useMeasure.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
const DEFAULT_GRADIENT_WIDTH = 20;
export const GradientProgress = React.memo(function GradientProgress(rawProps) {
    const colors = useColors();
    const props = usePluginProps("GradientProgress", rawProps);
    const { value, width: widthProp, colors: colorsProp, fromColor, toColor, showPercentage = false, label, } = props;
    // Auto-measure width from layout when not explicitly provided
    const measureId = useId();
    const autoMeasure = widthProp === undefined;
    const measured = useMeasure(autoMeasure ? `gradientprogress-${measureId}` : "");
    const width = widthProp ?? measured?.width ?? DEFAULT_GRADIENT_WIDTH;
    // Resolve gradient stops: colors prop > fromColor/toColor > defaults
    const defaultViolet = colors.brand.primary;
    const defaultMint = colors.brand.glow;
    let gradientStops;
    if (colorsProp !== undefined && colorsProp.length >= 2) {
        gradientStops = colorsProp;
    }
    else if (fromColor !== undefined && toColor !== undefined) {
        gradientStops = [fromColor, toColor];
    }
    else if (fromColor !== undefined) {
        gradientStops = [fromColor, defaultMint];
    }
    else if (toColor !== undefined) {
        gradientStops = [defaultViolet, toColor];
    }
    else {
        gradientStops = [defaultViolet, defaultMint];
    }
    const clamped = Math.max(0, Math.min(100, value));
    // Number of fully filled characters (not counting the soft edge)
    const filledExact = (clamped / 100) * width;
    const filledFull = Math.floor(filledExact);
    const fractional = filledExact - filledFull;
    const children = [];
    if (props.renderLabel) {
        children.push(React.createElement(React.Fragment, { key: "label" }, props.renderLabel(value, label)));
    }
    else if (label !== undefined) {
        children.push(React.createElement("tui-text", { key: "label" }, label + " "));
    }
    for (let i = 0; i < filledFull && i < width; i++) {
        const t = filledFull <= 1 ? 0 : i / (filledFull - 1);
        const color = getColorAt(gradientStops, t);
        children.push(React.createElement("tui-text", { key: `f${i}`, color }, "\u2588"));
    }
    // Soft leading edge: ▓▒░ for the fractional part
    let edgeChars = 0;
    if (filledFull < width && fractional > 0) {
        const edgeColor = filledFull > 0
            ? getColorAt(gradientStops, 1)
            : gradientStops[0];
        if (fractional > 0.66) {
            children.push(React.createElement("tui-text", { key: "e0", color: edgeColor }, "\u2593"));
            edgeChars = 1;
        }
        else if (fractional > 0.33) {
            children.push(React.createElement("tui-text", { key: "e0", color: edgeColor }, "\u2592"));
            edgeChars = 1;
        }
        else {
            children.push(React.createElement("tui-text", { key: "e0", color: edgeColor }, "\u2591"));
            edgeChars = 1;
        }
    }
    // Empty portion (guard against negative from rounding)
    const emptyCount = Math.max(0, width - filledFull - edgeChars);
    if (emptyCount > 0) {
        children.push(React.createElement("tui-text", { key: "empty", color: colors.text.dim, dim: true }, "\u2591".repeat(Math.max(0, emptyCount))));
    }
    // Percentage label
    if (showPercentage) {
        children.push(React.createElement("tui-text", { key: "pct" }, ` ${Math.round(clamped)}%`));
    }
    const { width: _w, height: _h, ...layoutRest } = pickLayoutProps(props);
    const outerBoxProps = {
        role: "progressbar",
        flexDirection: "row",
        height: 1,
        overflow: "hidden",
        flexShrink: 0,
        ...layoutRest,
    };
    const inner = React.createElement("tui-box", outerBoxProps, ...children);
    if (autoMeasure) {
        return React.createElement("tui-box", { _measureId: `gradientprogress-${measureId}`, flex: 1 }, inner);
    }
    return inner;
});
//# sourceMappingURL=GradientProgress.js.map