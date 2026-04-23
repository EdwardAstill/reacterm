import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Box } from "../../components/core/Box.js";
import { Text } from "../../components/core/Text.js";
import { fmtNum as formatNumber } from "../../utils/format.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
const POWERLINE_SEPARATOR = "\u25B6"; // ▶
export const StatusLine = React.memo(function StatusLine(rawProps) {
    const colors = useColors();
    const props = usePluginProps("StatusLine", rawProps);
    const { left, right, brand, model, tokens, turns, extra, backgroundColor = colors.surface.raised, segments, powerlineSeparator } = props;
    const separator = powerlineSeparator ?? POWERLINE_SEPARATOR;
    if (segments !== undefined && segments.length > 0) {
        const segElements = [];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const nextBg = i < segments.length - 1 ? segments[i + 1].bg : undefined;
            if (props.renderSegment) {
                segElements.push(_jsx(Box, { children: props.renderSegment(seg, i) }, `seg-${i}`));
            }
            else {
                segElements.push(_jsx(Text, { bold: true, wrap: "truncate", ...(seg.color ? { color: seg.color } : {}), ...(seg.bg ? { backgroundColor: seg.bg } : {}), children: ` ${seg.text} ` }, `seg-${i}`));
            }
            if (i < segments.length - 1) {
                segElements.push(_jsx(Text, { ...(seg.bg ? { color: seg.bg } : {}), ...(nextBg ? { backgroundColor: nextBg } : {}), children: separator }, `sep-${i}`));
            }
        }
        return (_jsx(Box, { flexDirection: "row", height: 1, flexShrink: 0, overflow: "hidden", children: segElements }));
    }
    if (left !== undefined || right !== undefined) {
        return (_jsxs(Box, { flexDirection: "row", height: 1, flexShrink: 0, overflow: "hidden", paddingX: 1, backgroundColor: backgroundColor, children: [left, _jsx(Box, { flex: 1 }), right] }));
    }
    const rightParts = [];
    if (tokens !== undefined) {
        rightParts.push(_jsxs(Text, { dim: true, children: ["tokens:", formatNumber(tokens)] }, "tok"));
    }
    if (turns !== undefined) {
        rightParts.push(_jsxs(Text, { dim: true, children: ["  turns:", turns] }, "turns"));
    }
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            const display = typeof v === "number" ? formatNumber(v) : v;
            rightParts.push(_jsxs(Text, { dim: true, children: ["  ", k, ":", display] }, k));
        }
    }
    return (_jsxs(Box, { flexDirection: "row", height: 1, flexShrink: 0, overflow: "hidden", paddingX: 1, backgroundColor: backgroundColor, children: [brand !== undefined && _jsxs(Text, { bold: true, color: colors.brand.primary, children: ["\u26A1 ", brand] }), model !== undefined && _jsxs(Text, { dim: true, children: [" ", model] }), _jsx(Box, { flex: 1 }), rightParts] }));
});
//# sourceMappingURL=StatusLine.js.map