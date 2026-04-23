import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { useStyles } from "../../core/style-provider.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import { Divider } from "../core/Divider.js";
import { TextArea } from "../core/TextArea.js";
import { createSyntaxHighlightLines } from "../../widgets/dev/SyntaxHighlight.js";
export const Editor = React.memo(function Editor(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Editor", rawProps);
    const { title = "Editor", language, rows = 12, showHeader = true, showFooter = true, footer, value, onChange, onSubmit, submitKey = "ctrl+enter", placeholder, isFocused = true, readOnly = false, disabled = false, lineNumbers = true, wordWrap = false, tabSize = 2, maxLength, color, placeholderColor, lineNumberColor, onSelectionChange, highlight, className, id, "aria-label": ariaLabel, } = props;
    const ssStates = new Set();
    if (isFocused)
        ssStates.add("focused");
    if (readOnly)
        ssStates.add("readonly");
    if (disabled)
        ssStates.add("disabled");
    const ssStyles = useStyles("Editor", className, id, ssStates);
    const userStyles = pickStyleProps(props);
    const boxProps = mergeBoxStyles(mergeBoxStyles({
        flexDirection: "column",
        borderStyle: personality.borders.panel,
        borderColor: colors.divider,
        backgroundColor: colors.surface.overlay,
        opaque: true,
    }, ssStyles), userStyles);
    const syntaxLines = React.useMemo(() => {
        if (!language || highlight)
            return null;
        return createSyntaxHighlightLines(value, language, colors);
    }, [colors, highlight, language, value]);
    const resolvedHighlight = React.useMemo(() => {
        if (highlight)
            return highlight;
        if (!syntaxLines)
            return undefined;
        return (_line, lineIndex) => syntaxLines[lineIndex] ?? [];
    }, [highlight, syntaxLines]);
    const lineCount = value.length === 0 ? 1 : value.split("\n").length;
    const footerNode = footer !== undefined
        ? footer
        : [
            language,
            `${lineCount} line${lineCount === 1 ? "" : "s"}`,
            `${value.length} char${value.length === 1 ? "" : "s"}`,
            wordWrap ? "wrap on" : "wrap off",
            readOnly ? "read only" : "editable",
        ].filter(Boolean).join(" • ");
    const headerMeta = [
        language ? language.toUpperCase() : undefined,
        readOnly ? "READ ONLY" : undefined,
        disabled ? "DISABLED" : undefined,
    ].filter(Boolean).join(" • ");
    const children = [];
    if (showHeader) {
        const headerChildren = [
            React.createElement("tui-text", { key: "title", bold: true, color: colors.text.primary }, title),
        ];
        if (headerMeta.length > 0) {
            headerChildren.push(React.createElement("tui-box", { key: "spacer", flex: 1 }));
            headerChildren.push(React.createElement("tui-text", { key: "meta", color: colors.text.secondary, dim: true }, headerMeta));
        }
        children.push(React.createElement("tui-box", { key: "header", flexDirection: "row", paddingLeft: 1, paddingRight: 1, paddingTop: 0, paddingBottom: 0 }, ...headerChildren));
        children.push(React.createElement(Divider, { key: "header-divider" }));
    }
    children.push(React.createElement("tui-box", {
        key: "body",
        flexDirection: "column",
        height: rows,
        paddingLeft: 1,
        paddingRight: 1,
    }, React.createElement(TextArea, {
        value,
        onChange,
        ...(onSubmit ? { onSubmit } : {}),
        submitKey,
        ...(placeholder !== undefined ? { placeholder } : {}),
        isFocused,
        readOnly,
        disabled,
        lineNumbers,
        wordWrap,
        tabSize,
        maxLines: rows,
        ...(maxLength !== undefined ? { maxLength } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(placeholderColor !== undefined ? { placeholderColor } : {}),
        ...(lineNumberColor !== undefined ? { lineNumberColor } : {}),
        ...(onSelectionChange ? { onSelectionChange } : {}),
        ...(resolvedHighlight ? { highlight: resolvedHighlight } : {}),
        flex: 1,
        "aria-label": ariaLabel ?? title,
    })));
    if (showFooter) {
        children.push(React.createElement(Divider, { key: "footer-divider" }));
        children.push(React.createElement("tui-box", { key: "footer", flexDirection: "row", paddingLeft: 1, paddingRight: 1 }, typeof footerNode === "string"
            ? React.createElement("tui-text", { color: colors.text.dim, dim: true }, footerNode || " ")
            : React.createElement(React.Fragment, null, footerNode)));
    }
    return React.createElement("tui-box", boxProps, ...children);
});
//# sourceMappingURL=Editor.js.map