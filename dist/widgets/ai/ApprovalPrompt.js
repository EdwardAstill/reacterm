import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef } from "react";
import { Box } from "../../components/core/Box.js";
import { Text } from "../../components/core/Text.js";
import { Divider } from "../../components/core/Divider.js";
import { useInput } from "../../hooks/useInput.js";
import { useTerminal } from "../../hooks/useTerminal.js";
import { useTui } from "../../context/TuiContext.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
function getDefaultOptions(colors) {
    return [
        { key: "y", label: "approve", color: colors.approval.approve },
        { key: "n", label: "deny", color: colors.approval.deny },
        { key: "a", label: "always approve", color: colors.approval.always },
    ];
}
function formatParams(params) {
    return Object.entries(params)
        .map(([k, v]) => {
        const s = typeof v === "string" ? v : JSON.stringify(v);
        return `${k}: ${s.length > 60 ? s.slice(0, 57) + "..." : s}`;
    })
        .join("\n");
}
function riskBorderColor(risk, colors) {
    if (!risk)
        return colors.divider;
    const lower = risk.toLowerCase();
    if (lower === "high")
        return colors.error;
    if (lower === "medium")
        return colors.warning;
    return colors.divider; // low or undefined
}
export const ApprovalPrompt = React.memo(function ApprovalPrompt(rawProps) {
    const colors = useColors();
    const props = usePluginProps("ApprovalPrompt", rawProps);
    const { tool, risk, params, options = getDefaultOptions(colors), onSelect, timeout, timeoutMessage, } = props;
    const formatTimeout = timeoutMessage ?? ((s) => `Auto-deny in ${s}s`);
    const { width: termWidth } = useTerminal();
    const { requestRender } = useTui();
    // ── Timeout countdown (imperative) ──────────────────────────────────
    const countdownRef = useRef(timeout !== undefined ? Math.ceil(timeout / 1000) : 0);
    const timeoutTimerRef = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    if (timeout !== undefined && !timeoutTimerRef.current && countdownRef.current > 0) {
        timeoutTimerRef.current = setInterval(() => {
            countdownRef.current--;
            requestRender();
            if (countdownRef.current <= 0) {
                if (timeoutTimerRef.current) {
                    clearInterval(timeoutTimerRef.current);
                    timeoutTimerRef.current = null;
                }
                onSelectRef.current("n"); // auto-deny
            }
        }, 1000);
    }
    useCleanup(() => {
        if (timeoutTimerRef.current) {
            clearInterval(timeoutTimerRef.current);
            timeoutTimerRef.current = null;
        }
    });
    // Memoize optionKeys in a ref, only recomputing when options change by value
    const optionKeysRef = useRef({ keys: [], set: new Set() });
    const currentKeys = options.map((o) => o.key);
    if (currentKeys.length !== optionKeysRef.current.keys.length ||
        currentKeys.some((k, i) => k !== optionKeysRef.current.keys[i])) {
        optionKeysRef.current = { keys: currentKeys, set: new Set(currentKeys) };
    }
    useInput(useCallback((e) => {
        if (optionKeysRef.current.set.has(e.key)) {
            // Stop countdown if user makes a selection
            if (timeoutTimerRef.current) {
                clearInterval(timeoutTimerRef.current);
                timeoutTimerRef.current = null;
            }
            onSelect(e.key);
        }
    }, [onSelect]), { isActive: props.visible !== false });
    const dividerWidth = Math.max(20, props.width ?? termWidth - 4);
    const borderColor = riskBorderColor(risk, colors);
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Divider, { style: "solid", width: dividerWidth, color: borderColor }), _jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { bold: true, color: colors.approval.header, children: tool }), risk !== undefined && (_jsxs(Text, { color: riskBorderColor(risk, colors), bold: true, children: [" (", risk, ")"] }))] }), params !== undefined && Object.keys(params).length > 0 && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { color: colors.text.dim, children: formatParams(params) }) })), _jsx(Box, { flexDirection: "row", paddingTop: 1, children: options.map((opt, i) => (props.renderOption
                            ? _jsx(Box, { children: props.renderOption(opt, i) }, opt.key)
                            : _jsxs(Text, { children: [i > 0 && _jsx(Text, { color: colors.text.disabled, children: "  │  " }), _jsx(Text, { color: opt.color, bold: true, children: opt.key }), _jsxs(Text, { color: colors.text.secondary, children: [" ", opt.label] })] }, opt.key))) }), timeout !== undefined && countdownRef.current > 0 && (_jsx(Box, { paddingTop: 1, children: _jsx(Text, { dim: true, color: colors.warning, children: formatTimeout(countdownRef.current) }) }))] }), _jsx(Divider, { style: "solid", width: dividerWidth, color: borderColor })] }));
});
//# sourceMappingURL=ApprovalPrompt.js.map