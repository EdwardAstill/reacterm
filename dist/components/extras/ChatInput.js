import React from "react";
import { ScrollView } from "../core/ScrollView.js";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useChatInputBehavior } from "../../hooks/headless/useChatInputBehavior.js";
import { useTui } from "../../context/TuiContext.js";
export const ChatInput = React.memo(function ChatInput(rawProps) {
    const colors = useColors();
    const props = usePluginProps("ChatInput", rawProps);
    const personality = usePersonality();
    const { screen } = useTui();
    const { value, onChange, onSubmit, placeholder, maxRows = 4, maxLength, focus: focusPropRaw, isFocused, color, placeholderColor, history = [], multiline = false, disabled = false, promptChar: _promptChar = personality.interaction.promptChar, cursorStyle: _cursorStyle = personality.interaction.cursorStyle, "aria-label": ariaLabel, ...layoutProps } = props;
    const focusProp = isFocused ?? focusPropRaw ?? true;
    const estimatedWidth = typeof layoutProps.width === "number" ? layoutProps.width
        : typeof layoutProps.flex === "number" ? Math.max(20, screen.width - 20)
            : 80;
    const behavior = useChatInputBehavior({
        value,
        onChange,
        onSubmit,
        isFocused: focusProp,
        history,
        maxRows,
        maxLength,
        multiline,
        disabled,
        onSelectionChange: props.onSelectionChange,
        width: estimatedWidth,
    });
    const { displayRows, visibleHeight, needsScroll, renderStart, renderEnd, showPlaceholder, cursorRow, cursorCol, hasSelection: hasSelectionNow, selectionStart: selMin, selectionEnd: selMax, rowStartOffset, } = behavior;
    // ── Rendering ────────────────────────────────────────────────────
    const rowElements = [];
    if (showPlaceholder) {
        rowElements.push(React.createElement("tui-text", {
            key: "placeholder",
            color: placeholderColor ?? colors.text.disabled,
            dim: true,
        }, placeholder ?? ""));
    }
    else {
        for (let i = renderStart; i < renderEnd; i++) {
            const rowText = displayRows[i];
            const rowOff = rowStartOffset(i);
            if (focusProp && !disabled) {
                const rowChars = Array.from(rowText);
                const segments = [];
                let segBuf = "";
                let segInverse = false;
                let segIdx = 0;
                const flushSeg = () => {
                    if (segBuf.length > 0) {
                        segments.push(React.createElement("tui-text", { key: `s${segIdx}`, color, ...(segInverse ? { inverse: true } : {}) }, segBuf));
                        segIdx++;
                        segBuf = "";
                    }
                };
                for (let c = 0; c < rowChars.length; c++) {
                    const flatPos = rowOff + c;
                    const isCursor = i === cursorRow && c === cursorCol;
                    const isSelected = hasSelectionNow && flatPos >= selMin && flatPos < selMax;
                    const shouldInverse = isCursor || isSelected;
                    if (shouldInverse !== segInverse) {
                        flushSeg();
                        segInverse = shouldInverse;
                    }
                    segBuf += rowChars[c];
                }
                // Cursor at end of row
                if (i === cursorRow && cursorCol >= rowChars.length) {
                    flushSeg();
                    segments.push(React.createElement("tui-text", { key: `cursor-end`, color, inverse: true }, " "));
                }
                else {
                    flushSeg();
                }
                rowElements.push(React.createElement("tui-box", {
                    key: `row-${i}`,
                    flexDirection: "row",
                    height: 1,
                }, ...segments));
            }
            else {
                rowElements.push(React.createElement("tui-text", {
                    key: `row-${i}`,
                    color,
                    ...(disabled ? { dim: true } : {}),
                }, rowText));
            }
        }
    }
    if (needsScroll) {
        return React.createElement(ScrollView, {
            height: maxRows,
            scrollSpeed: 1,
            stickToBottom: false,
            ...(layoutProps.flex !== undefined ? { flex: layoutProps.flex } : {}),
            ...(layoutProps.width !== undefined ? { width: layoutProps.width } : {}),
        }, React.createElement("tui-box", { flexDirection: "column" }, ...rowElements));
    }
    return React.createElement("tui-box", {
        flexDirection: "column",
        height: visibleHeight,
        role: "textbox",
        "aria-label": ariaLabel,
        ...layoutProps,
    }, ...rowElements);
});
//# sourceMappingURL=ChatInput.js.map