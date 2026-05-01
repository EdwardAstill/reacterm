import React, { useRef, useCallback } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { useMouseTarget } from "../../hooks/useMouseTarget.js";
import { useStyles } from "../../core/style-provider.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export const Button = React.memo(function Button(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Button", rawProps);
    const personality = usePersonality();
    const { label, onPress, color: colorProp, bold: boldProp, dim: dimProp, isFocused = true, disabled = false, loading = false, variant = "primary", size = "md", shortcut, borderStyle: _borderStyle = personality.borders.default, focusIndicator: _focusIndicator = personality.interaction.focusIndicator, className, id, } = props;
    // Resolve stylesheet styles — pseudo-classes map component state
    const ssStates = new Set();
    if (isFocused)
        ssStates.add("focused");
    if (disabled)
        ssStates.add("disabled");
    const ssStyles = useStyles("Button", className, id, ssStates);
    // Explicit color prop wins over stylesheet, then personality colors
    const color = colorProp ?? ssStyles.color ?? personality.colors.brand.primary;
    const { requestRender } = useTui();
    const onPressRef = useRef(onPress);
    onPressRef.current = onPress;
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;
    const loadingRef = useRef(loading);
    loadingRef.current = loading;
    const spinnerFrameRef = useRef(0);
    const spinnerTimerRef = useRef(null);
    // Start/stop spinner timer based on loading state.
    // Always clear first when loading becomes false (or was true and changed)
    // to ensure no stale timers remain.
    if (!loading && spinnerTimerRef.current !== null) {
        clearInterval(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
        spinnerFrameRef.current = 0;
    }
    else if (loading && spinnerTimerRef.current === null) {
        spinnerTimerRef.current = setInterval(() => {
            spinnerFrameRef.current = (spinnerFrameRef.current + 1) % SPINNER_FRAMES.length;
            requestRender();
        }, 80);
    }
    // Clean up timer on unmount
    useCleanup(() => {
        if (spinnerTimerRef.current !== null) {
            clearInterval(spinnerTimerRef.current);
            spinnerTimerRef.current = null;
        }
    });
    const handleInput = useCallback((event) => {
        if (disabledRef.current)
            return;
        if (loadingRef.current)
            return;
        const cb = onPressRef.current;
        if (!cb)
            return;
        if (event.key === "return" || event.char === " ") {
            cb();
        }
    }, []);
    const hasHandler = onPress !== undefined;
    useInput(handleInput, { isActive: hasHandler && isFocused && !disabled && !loading });
    const mouseTarget = useMouseTarget({
        disabled: disabled || loading || !hasHandler,
        onMouse: (event) => {
            if (event.button !== "left" || event.action !== "press")
                return;
            onPressRef.current?.();
        },
    });
    const VARIANT_STYLES = {
        primary: { focused: { color, bold: true, inverse: true }, unfocused: { dim: true } },
        secondary: { focused: { color, dim: true, bold: true }, unfocused: { dim: true } },
        outline: { focused: { color, bold: true }, unfocused: { dim: true } },
        ghost: { focused: { bold: true }, unfocused: {} },
        danger: { focused: { color: "red", bold: true, inverse: true }, unfocused: { color: "red", dim: true } },
    };
    let textProps;
    if (disabled || loading) {
        textProps = { color: colors.text.disabled, dim: true };
    }
    else {
        const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
        textProps = isFocused ? { ...styles.focused } : { ...styles.unfocused };
    }
    const displayLabel = loading
        ? `${SPINNER_FRAMES[spinnerFrameRef.current]} ${label}`
        : label;
    if (ssStyles.bold !== undefined)
        textProps["bold"] = ssStyles.bold;
    if (ssStyles.dim !== undefined)
        textProps["dim"] = ssStyles.dim;
    if (ssStyles.inverse !== undefined)
        textProps["inverse"] = ssStyles.inverse;
    if (boldProp !== undefined)
        textProps["bold"] = boldProp;
    if (dimProp !== undefined)
        textProps["dim"] = dimProp;
    // Size padding
    const pad = size === "sm" ? "" : size === "lg" ? "  " : " ";
    const shortcutSuffix = shortcut ? `  ${shortcut}` : "";
    let labelText;
    if (variant === "ghost") {
        labelText = `${pad}${displayLabel}${shortcutSuffix}${pad}`;
    }
    else {
        labelText = `[${pad}${displayLabel}${shortcutSuffix}${pad}]`;
    }
    const boxProps = {
        role: "button",
        flexDirection: "row",
        ...mouseTarget.targetProps,
        "aria-label": props["aria-label"],
        ...pickLayoutProps(props),
    };
    return React.createElement("tui-box", boxProps, props.renderLabel
        ? props.renderLabel(label, { isFocused, disabled, loading })
        : React.createElement("tui-text", textProps, labelText));
});
//# sourceMappingURL=Button.js.map