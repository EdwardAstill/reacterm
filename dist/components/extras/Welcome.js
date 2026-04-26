import React, { useRef, useCallback } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useColors } from "../../hooks/useColors.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useTui } from "../../context/TuiContext.js";
import { Gradient } from "../effects/Gradient.js";
import { pickStyleProps } from "../../styles/applyStyles.js";
import { INPUT_PRIORITY } from "../../input/priorities.js";
import { padEndCells } from "../../core/unicode.js";
export const Welcome = React.memo(function Welcome(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Welcome", rawProps);
    const { screen } = useTui();
    const forceUpdate = useForceUpdate();
    const { title, version, description, logo, titleGradient, logoGradient, actions, shortcuts, actionsTitle = "Recent", shortcutsTitle = "Keyboard Shortcuts", shortcutColumns = 2, prompt = "Press any key to continue", onDismiss, background, visible = true, children, } = props;
    const layoutProps = pickStyleProps(props);
    // ── State via refs ─────────────────────────────────────────
    const selectedIndexRef = useRef(0);
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;
    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    // ── Input handling ─────────────────────────────────────────
    const handleInput = useCallback((event) => {
        const currentActions = actionsRef.current;
        const hasActions = currentActions && currentActions.length > 0;
        // Navigation within actions list
        if (hasActions) {
            if (event.key === "up" || (event.key === "k" && !event.ctrl)) {
                event.consumed = true;
                selectedIndexRef.current = Math.max(0, selectedIndexRef.current - 1);
                forceUpdate();
                return;
            }
            if (event.key === "down" || (event.key === "j" && !event.ctrl)) {
                event.consumed = true;
                selectedIndexRef.current = Math.min(currentActions.length - 1, selectedIndexRef.current + 1);
                forceUpdate();
                return;
            }
            if (event.key === "return") {
                event.consumed = true;
                const selected = currentActions[selectedIndexRef.current];
                onDismissRef.current?.(selected);
                return;
            }
        }
        // Any other key dismisses
        event.consumed = true;
        onDismissRef.current?.();
    }, [forceUpdate]);
    useInput(handleInput, { isActive: visible, priority: INPUT_PRIORITY.INLINE_OVERLAY });
    if (!visible)
        return null;
    // ── Build children ─────────────────────────────────────────
    const sections = [];
    // Logo / ASCII art
    if (logo) {
        if (logoGradient && logoGradient.length >= 2) {
            sections.push(React.createElement("tui-box", { key: "logo", justifyContent: "center", flexDirection: "row" }, React.createElement(Gradient, { colors: logoGradient, direction: "vertical", children: logo })));
        }
        else {
            sections.push(React.createElement("tui-box", { key: "logo", justifyContent: "center", flexDirection: "column" }, ...logo.split("\n").map((line, i) => React.createElement("tui-text", { key: `logo-${i}`, color: colors.brand.primary, bold: true }, line))));
        }
        // Spacer after logo
        sections.push(React.createElement("tui-box", { key: "logo-spacer", height: 1 }));
    }
    // Title
    if (titleGradient && titleGradient.length >= 2) {
        sections.push(React.createElement("tui-box", { key: "title", justifyContent: "center", flexDirection: "row" }, React.createElement(Gradient, { colors: titleGradient, children: title })));
    }
    else {
        sections.push(React.createElement("tui-text", { key: "title", bold: true, color: colors.brand.primary }, title));
    }
    // Version badge
    if (version) {
        sections.push(React.createElement("tui-text", { key: "version", color: colors.text.dim, dim: true }, version));
    }
    // Description
    if (description) {
        sections.push(React.createElement("tui-text", { key: "desc", color: colors.text.secondary, marginTop: 1 }, description));
    }
    // Divider
    const dividerWidth = Math.min(60, Math.max(20, screen.width - 20));
    sections.push(React.createElement("tui-text", { key: "divider", color: colors.divider, marginTop: 1 }, "\u2500".repeat(dividerWidth)));
    // Recent actions section
    if (actions && actions.length > 0) {
        sections.push(React.createElement("tui-text", { key: "actions-title", bold: true, color: colors.text.secondary, marginTop: 1 }, actionsTitle));
        const selectedIdx = selectedIndexRef.current;
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const isSelected = i === selectedIdx;
            const indicator = isSelected ? "\u25B6 " : "  ";
            const labelColor = isSelected ? colors.brand.light : colors.text.primary;
            const bgColor = isSelected ? colors.surface.highlight : undefined;
            const actionParts = [];
            // Selection indicator
            actionParts.push(React.createElement("tui-text", { key: `ind-${i}`, color: isSelected ? colors.brand.primary : colors.text.dim }, indicator));
            // Icon
            if (action.icon) {
                actionParts.push(React.createElement("tui-text", { key: `icon-${i}`, color: labelColor }, `${padEndCells(action.icon, 2)} `));
            }
            // Label
            actionParts.push(React.createElement("tui-text", { key: `label-${i}`, color: labelColor, bold: isSelected }, action.label));
            // Description
            if (action.description) {
                actionParts.push(React.createElement("tui-text", { key: `adesc-${i}`, color: colors.text.dim, dim: true }, `  ${action.description}`));
            }
            sections.push(React.createElement("tui-box", {
                key: `action-${i}`,
                flexDirection: "row",
                ...(bgColor ? { backgroundColor: bgColor } : {}),
            }, ...actionParts));
        }
    }
    // Keyboard shortcuts section
    if (shortcuts && shortcuts.length > 0) {
        sections.push(React.createElement("tui-text", { key: "shortcuts-title", bold: true, color: colors.text.secondary, marginTop: 1 }, shortcutsTitle));
        const perColumn = Math.ceil(shortcuts.length / shortcutColumns);
        for (let row = 0; row < perColumn; row++) {
            const rowParts = [];
            for (let col = 0; col < shortcutColumns; col++) {
                const idx = col * perColumn + row;
                if (idx >= shortcuts.length)
                    continue;
                const shortcut = shortcuts[idx];
                if (col > 0) {
                    rowParts.push(React.createElement("tui-text", { key: `ssep-${idx}`, color: colors.text.dim }, "   "));
                }
                rowParts.push(React.createElement("tui-text", { key: `skey-${idx}`, color: colors.brand.primary, bold: true }, shortcut.key));
                rowParts.push(React.createElement("tui-text", { key: `slbl-${idx}`, color: colors.text.secondary }, ` ${shortcut.label}`));
            }
            sections.push(React.createElement("tui-box", { key: `srow-${row}`, flexDirection: "row" }, ...rowParts));
        }
    }
    // Custom children
    if (children) {
        sections.push(React.createElement("tui-box", { key: "custom", flexDirection: "column", marginTop: 1 }, children));
    }
    // Bottom divider
    sections.push(React.createElement("tui-text", { key: "divider-bottom", color: colors.divider, marginTop: 1 }, "\u2500".repeat(dividerWidth)));
    // Dismiss prompt (pulsing style via dim)
    sections.push(React.createElement("tui-text", { key: "prompt", color: colors.text.dim, marginTop: 1 }, prompt));
    // ── Root layout: full-screen centered column ───────────────
    return React.createElement("tui-box", {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        ...(background ? { background } : {}),
        ...layoutProps,
    }, ...sections);
});
//# sourceMappingURL=Welcome.js.map