import React from "react";
import { useInput } from "../../hooks/useInput.js";
import { useColors } from "../../hooks/useColors.js";
import { fmtDuration } from "../../utils/format.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const CommandBlock = React.memo(function CommandBlock(rawProps) {
    const colors = useColors();
    const props = usePluginProps("CommandBlock", rawProps);
    const { command, output, exitCode, duration, collapsed, isFocused, ansiOutput, toggleIndicators, exitCodeSymbols } = props;
    // Wire up keyboard toggle: Enter or Space when focused; "c" for copy
    useInput((e) => {
        if (e.key === "return" || e.key === " ") {
            props.onToggle?.();
        }
        else if (e.key === "c" && props.onCopy) {
            const outputText = typeof output === "string" ? output : command;
            props.onCopy(outputText);
        }
    }, { isActive: isFocused === true });
    const isCollapsed = collapsed ?? false;
    const toggle = isCollapsed
        ? (toggleIndicators?.collapsed ?? "\u25B8")
        : (toggleIndicators?.expanded ?? "\u25BE");
    const headerParts = [];
    headerParts.push(React.createElement("tui-text", { key: "toggle", dim: true }, `${toggle} `));
    headerParts.push(React.createElement("tui-text", { key: "cmd", bold: true }, command));
    // Exit code badge
    if (exitCode !== undefined) {
        const isSuccess = exitCode === 0;
        const successSym = exitCodeSymbols?.success ?? "\u2713";
        const failureSym = exitCodeSymbols?.failure ?? "\u2717";
        const badge = isSuccess ? ` ${successSym}` : ` ${failureSym} ${exitCode}`;
        const badgeColor = isSuccess ? colors.success : colors.error;
        headerParts.push(React.createElement("tui-text", { key: "exit", color: badgeColor, bold: true }, badge));
    }
    // Duration
    if (duration !== undefined) {
        headerParts.push(React.createElement("tui-text", { key: "dur", dim: true }, ` ${fmtDuration(duration)}`));
    }
    // Hints when focused
    if (isFocused) {
        const hints = [];
        if (props.onToggle)
            hints.push("[Enter] toggle");
        if (props.onCopy)
            hints.push("[c] copy");
        if (hints.length > 0) {
            headerParts.push(React.createElement("tui-text", { key: "hint", dim: true, color: colors.text.secondary }, `  ${hints.join("  ")}`));
        }
    }
    const headerRow = props.renderHeader
        ? React.createElement("tui-box", { key: "header", flexDirection: "row" }, props.renderHeader(command, exitCode))
        : React.createElement("tui-box", { key: "header", flexDirection: "row" }, ...headerParts);
    const blockChildren = [headerRow];
    // Output (only when not collapsed)
    if (!isCollapsed && output !== undefined) {
        const renderedOutput = ansiOutput
            ? React.createElement("tui-text", { key: "ansi-out", ansi: true }, output)
            : output;
        blockChildren.push(React.createElement("tui-box", { key: "output", paddingLeft: 2, paddingTop: 0 }, renderedOutput));
    }
    // Outer bordered box
    return React.createElement("tui-box", {
        flexDirection: "column",
        borderStyle: "single",
        borderColor: colors.divider,
        paddingX: 1,
    }, ...blockChildren);
});
//# sourceMappingURL=CommandBlock.js.map