import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef } from "react";
import { Box } from "../../components/core/Box.js";
import { Text } from "../../components/core/Text.js";
import { useInput } from "../../hooks/useInput.js";
import { Markdown as MarkdownText } from "../../components/extras/Markdown.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
export const MessageBubble = React.memo(function MessageBubble(rawProps) {
    const colors = useColors();
    const props = usePluginProps("MessageBubble", rawProps);
    const { role, children, meta, timestamp, markdown, actions, isFocused = true } = props;
    // Resolve symbol and color: explicit props override role defaults
    const ROLE_DEFAULTS = {
        user: { symbol: ">", symbolColor: colors.brand.primary },
        assistant: { symbol: "\u2726", symbolColor: colors.brand.primary }, // ✦
        system: { symbol: "\u25CF", symbolColor: colors.warning }, // ●
        tool: { symbol: "\u2699", symbolColor: colors.info }, // ⚙
    };
    const roleDefaults = role ? ROLE_DEFAULTS[role] : undefined;
    const symbol = props.symbol ?? roleDefaults?.symbol ?? ">";
    const symbolColor = props.symbolColor ?? roleDefaults?.symbolColor ?? colors.text.primary;
    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    const handleInput = useCallback((event) => {
        const currentActions = actionsRef.current;
        if (!currentActions || currentActions.length === 0)
            return;
        for (const action of currentActions) {
            if (event.char === action.key || event.key === action.key) {
                action.onAction();
                return;
            }
        }
    }, []);
    useInput(handleInput, { isActive: isFocused && !!actions && actions.length > 0 });
    const content = markdown && typeof children === "string"
        ? _jsx(MarkdownText, { content: children })
        : typeof children === "string"
            ? _jsx(Text, { color: colors.text.primary, children: children })
            : children;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsxs(Box, { flexDirection: "row", children: [props.renderSymbol
                        ? props.renderSymbol(symbol, symbolColor)
                        : _jsxs(Text, { bold: true, color: symbolColor, children: [symbol, " "] }), _jsx(Box, { flexDirection: "column", flex: 1, children: content }), timestamp !== undefined && (_jsx(Text, { dim: true, children: ` ${timestamp}` }))] }), meta !== undefined && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { dim: true, italic: true, children: meta }) })), actions !== undefined && actions.length > 0 && (_jsx(Box, { paddingLeft: 2, flexDirection: "row", children: actions.map((action, i) => (_jsxs(Text, { dim: true, children: [i > 0 ? "  " : "", "[", action.key, "] ", action.label] }, action.key))) }))] }));
});
//# sourceMappingURL=MessageBubble.js.map