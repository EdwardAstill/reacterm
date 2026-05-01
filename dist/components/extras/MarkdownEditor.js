import React, { useRef, useCallback } from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useInput } from "../../hooks/useInput.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { Editor } from "./Editor.js";
import { Markdown } from "./Markdown.js";
import { ScrollView } from "../core/ScrollView.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
export const MarkdownEditor = React.memo(function MarkdownEditor(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("MarkdownEditor", rawProps);
    const { value, onChange, previewDelayMs = 120, rows = 16, isFocused = true, previewWidth, editorTitle = "Editor", previewTitle = "Preview", ...layoutProps } = props;
    const focusRef = useRef("editor");
    const forceUpdate = useForceUpdate();
    const debouncedValue = useDebouncedValue(value, previewDelayMs);
    const handleInput = useCallback((event) => {
        if (event.key === "tab" && !event.shift) {
            focusRef.current = focusRef.current === "editor" ? "preview" : "editor";
            forceUpdate();
        }
    }, [forceUpdate]);
    useInput(handleInput, { isActive: isFocused });
    const editorPane = React.createElement("tui-box", { flexDirection: "column", flex: previewWidth ? undefined : 1, marginRight: 1 }, React.createElement(Editor, {
        title: editorTitle,
        language: "markdown",
        rows,
        value,
        onChange,
        isFocused: isFocused && focusRef.current === "editor",
    }));
    const previewTitleColor = isFocused && focusRef.current === "preview"
        ? personality.typography.headingColor
        : colors.text.secondary;
    const previewPane = React.createElement("tui-box", {
        flexDirection: "column",
        flex: previewWidth ? undefined : 1,
        ...(previewWidth !== undefined ? { width: previewWidth } : {}),
        borderStyle: personality.borders.panel,
        borderColor: colors.divider,
        paddingX: 1,
    }, React.createElement("tui-text", { color: previewTitleColor, bold: true }, previewTitle), React.createElement(ScrollView, { flex: 1, height: rows, overflow: "scroll" }, React.createElement(Markdown, { content: debouncedValue })));
    const outerProps = {
        flexDirection: "row",
        ...pickLayoutProps(layoutProps),
    };
    return React.createElement("tui-box", outerProps, editorPane, previewPane);
});
//# sourceMappingURL=MarkdownEditor.js.map