import React from "react";
import { useStyles } from "../../core/style-provider.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useTextInputBehavior } from "../../hooks/headless/useTextInputBehavior.js";
export const TextInput = React.memo(function TextInput(rawProps) {
    const props = usePluginProps("TextInput", rawProps);
    const { value, onChange, onSubmit, placeholder, focus: focusPropRaw, isFocused, autoFocus, color: colorProp, placeholderColor, history = [], maxLength, disabled = false, onSelectionChange, className, id, "aria-label": ariaLabel, ...layoutProps } = props;
    const focusProp = isFocused ?? focusPropRaw ?? autoFocus ?? true;
    const ssStates = new Set();
    if (focusProp)
        ssStates.add("focused");
    if (disabled)
        ssStates.add("disabled");
    const ssStyles = useStyles("TextInput", className, id, ssStates);
    // Explicit color prop wins over stylesheet
    const color = colorProp ?? ssStyles.color;
    const behavior = useTextInputBehavior({
        value,
        onChange,
        onSubmit,
        isFocused: focusProp,
        history,
        maxLength,
        disabled,
        onSelectionChange,
    });
    return React.createElement("tui-text-input", {
        role: "textbox",
        value,
        cursorOffset: behavior.cursorPosition,
        focus: behavior.isFocused,
        placeholder,
        color,
        placeholderColor,
        _hostPropsRef: behavior.hostPropsRef,
        _focusId: behavior.focusId,
        "aria-label": ariaLabel,
        ...(behavior.hasSelection ? { selectionStart: behavior.selectionStart, selectionEnd: behavior.selectionEnd, inverse: true } : {}),
        ...layoutProps,
        height: layoutProps.height ?? 1,
    });
});
//# sourceMappingURL=TextInput.js.map