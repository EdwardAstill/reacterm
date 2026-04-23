import React, { useRef, useCallback } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { Markdown } from "./Markdown.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
function extractHeadings(content) {
    const lines = content.split("\n");
    const entries = [];
    let inCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        // Track fenced code blocks to avoid treating # inside code as headings.
        if (/^```/.test(trimmed)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock)
            continue;
        const match = trimmed.match(/^(#{1,6})\s(.*)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2];
            entries.push({
                level,
                text,
                lineIndex: i,
                key: `toc-${i}-${level}`,
            });
        }
    }
    return entries;
}
export const MarkdownViewer = React.memo(function MarkdownViewer(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("MarkdownViewer", rawProps);
    const forceUpdate = useForceUpdate();
    const { content, maxWidth, tocWidth = 30, showToc = true, isFocused = true, ...layoutProps } = props;
    // ── Refs for imperative state ────────────────────────────────────
    const tocIndexRef = useRef(0);
    const activeHeadingRef = useRef(0);
    const scrollStateRef = useRef(null);
    const hostPropsRef = useRef(null);
    // ── Extract headings ─────────────────────────────────────────────
    const headings = React.useMemo(() => extractHeadings(content), [content]);
    // Clamp TOC index after headings change.
    if (headings.length > 0 && tocIndexRef.current >= headings.length) {
        tocIndexRef.current = headings.length - 1;
    }
    // ── Scroll callback — track active heading ──────────────────────
    const onScroll = useCallback((scrollTop) => {
        if (headings.length === 0)
            return;
        // Estimate which heading is currently at the top of the viewport.
        // Each heading's approximate row position is derived from line index
        // (rough heuristic: ~1 row per source line, accounting for spacing).
        let bestIdx = 0;
        for (let i = 0; i < headings.length; i++) {
            if (headings[i].lineIndex <= scrollTop + 2) {
                bestIdx = i;
            }
            else {
                break;
            }
        }
        if (bestIdx !== activeHeadingRef.current) {
            activeHeadingRef.current = bestIdx;
            forceUpdate();
        }
    }, [headings, forceUpdate]);
    // ── Keyboard navigation ─────────────────────────────────────────
    const handleInput = useCallback((event) => {
        if (!showToc || headings.length === 0)
            return;
        if (event.key === "up" && !event.shift) {
            if (tocIndexRef.current > 0) {
                tocIndexRef.current -= 1;
                forceUpdate();
            }
        }
        else if (event.key === "down" && !event.shift) {
            if (tocIndexRef.current < headings.length - 1) {
                tocIndexRef.current += 1;
                forceUpdate();
            }
        }
        else if (event.key === "return") {
            // Jump to heading — imperatively update the scroll position.
            const heading = headings[tocIndexRef.current];
            if (heading && scrollStateRef.current) {
                const target = heading.lineIndex;
                const state = scrollStateRef.current;
                state.clampedTop = Math.max(0, Math.min(state.maxScroll, target));
                if (hostPropsRef.current) {
                    hostPropsRef.current.scrollTop = state.clampedTop;
                }
            }
            activeHeadingRef.current = tocIndexRef.current;
            forceUpdate();
        }
    }, [headings, showToc, forceUpdate]);
    useInput(handleInput, { isActive: isFocused && showToc });
    // ── Build TOC sidebar ───────────────────────────────────────────
    let tocElement = null;
    if (showToc && headings.length > 0) {
        const tocItems = [];
        // Title
        tocItems.push(React.createElement("tui-text", {
            key: "toc-title",
            bold: true,
            color: personality.typography.headingColor,
        }, "TABLE OF CONTENTS"));
        tocItems.push(React.createElement("tui-text", { key: "toc-sep", color: colors.text.dim, dim: true, wrap: "truncate" }, "\u2500".repeat(tocWidth - 2)));
        for (let i = 0; i < headings.length; i++) {
            const h = headings[i];
            const isSelected = i === tocIndexRef.current;
            const isActive = i === activeHeadingRef.current;
            const indent = "  ".repeat(Math.max(0, h.level - 1));
            const marker = isActive ? "\u25B8 " : "  ";
            const label = indent + marker + h.text;
            // Truncate to fit sidebar width.
            const truncated = label.length > tocWidth - 1
                ? label.slice(0, tocWidth - 2) + "\u2026"
                : label;
            tocItems.push(React.createElement("tui-text", {
                key: h.key,
                color: isActive
                    ? personality.typography.headingColor
                    : isSelected
                        ? colors.text.primary
                        : colors.text.secondary,
                bold: isActive || isSelected,
                ...(isSelected
                    ? {
                        inverse: personality.interaction.focusIndicator === "highlight",
                    }
                    : {}),
                ...(isActive && !isSelected ? { underline: true } : {}),
            }, truncated));
        }
        tocElement = React.createElement("tui-box", {
            key: "toc-sidebar",
            flexDirection: "column",
            width: tocWidth,
            minWidth: tocWidth,
            maxWidth: tocWidth,
            paddingRight: 1,
            borderRight: true,
            borderLeft: false,
            borderTop: false,
            borderBottom: false,
            borderStyle: "single",
            borderColor: colors.divider,
        }, ...tocItems);
    }
    // ── Build Markdown content area in a ScrollView ─────────────────
    const markdownElement = React.createElement("tui-box", { key: "md-wrapper", flexDirection: "column", paddingLeft: showToc ? 1 : 0 }, React.createElement(Markdown, {
        content,
        ...(maxWidth !== undefined ? { maxWidth } : {}),
    }));
    const scrollViewElement = React.createElement("tui-scroll-view", {
        key: "md-scroll",
        flex: 1,
        overflow: "scroll",
        scrollTop: scrollStateRef.current?.clampedTop ?? 0,
        _scrollState: scrollStateRef.current,
        _hostPropsRef: hostPropsRef,
        stickToBottom: false,
    }, markdownElement);
    // ── Assemble layout ─────────────────────────────────────────────
    const outerProps = {
        flexDirection: "row",
    };
    Object.assign(outerProps, pickLayoutProps(layoutProps));
    const children = [];
    if (tocElement)
        children.push(tocElement);
    children.push(scrollViewElement);
    return React.createElement("tui-box", outerProps, ...children);
});
//# sourceMappingURL=MarkdownViewer.js.map