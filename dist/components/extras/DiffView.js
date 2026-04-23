import React, { useRef, useCallback, createContext, useContext } from "react";
import { Box } from "../core/Box.js";
import { Text } from "../core/Text.js";
import { useTui } from "../../context/TuiContext.js";
import { useInput } from "../../hooks/useInput.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { useColors } from "../../hooks/useColors.js";
export const DiffViewContext = createContext(null);
export function useDiffViewContext() {
    const ctx = useContext(DiffViewContext);
    if (!ctx)
        throw new Error("DiffView sub-components must be used inside DiffView.Root");
    return ctx;
}
function DiffViewRoot({ scrollIndex = 0, onScrollChange, expandedHunks = new Set(), onToggleHunk, isFocused = false, children, }) {
    const { requestRender } = useTui();
    const onScrollRef = useRef(onScrollChange);
    onScrollRef.current = onScrollChange;
    const onToggleRef = useRef(onToggleHunk);
    onToggleRef.current = onToggleHunk;
    const ctx = {
        scrollIndex,
        setScrollIndex: (i) => { onScrollRef.current?.(i); requestRender(); },
        expandedHunks,
        toggleHunk: (i) => { onToggleRef.current?.(i); requestRender(); },
        isFocused,
    };
    return React.createElement(DiffViewContext.Provider, { value: ctx }, React.createElement(Box, { flexDirection: "column", overflow: "hidden" }, children));
}
function DiffViewCompoundLine({ line, index = 0, children }) {
    const { scrollIndex, isFocused } = useDiffViewContext();
    const diffColors = getDiffColors(useColors());
    const isHighlighted = isFocused && index === scrollIndex;
    if (children) {
        return React.createElement(Box, { height: 1, flexDirection: "row", overflow: "hidden" }, children);
    }
    const lineColor = line.type === "added"
        ? diffColors.addedText
        : line.type === "removed"
            ? diffColors.removedText
            : line.type === "header"
                ? diffColors.hunkText
                : diffColors.contextText;
    const marker = line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  ";
    const bg = line.type === "added"
        ? (isHighlighted ? diffColors.addedHighlightBg : diffColors.addedBg)
        : line.type === "removed"
            ? (isHighlighted ? diffColors.removedHighlightBg : diffColors.removedBg)
            : isHighlighted
                ? diffColors.focusBg
                : undefined;
    return React.createElement(Box, { height: 1, flexDirection: "row", overflow: "hidden", ...(bg ? { backgroundColor: bg } : {}) }, React.createElement(Text, { color: lineColor, bold: line.type !== "context" }, marker), React.createElement(Text, { color: lineColor, wrap: "truncate" }, line.content));
}
function DiffViewCompoundHunk({ header, children }) {
    const diffColors = getDiffColors(useColors());
    return React.createElement(Box, { flexDirection: "column" }, React.createElement(Box, { height: 1, flexDirection: "row" }, React.createElement(Text, { color: diffColors.hunkText, dim: true, wrap: "truncate" }, header)), children);
}
function parseDiff(raw) {
    const result = [];
    const lines = raw.split("\n");
    let oldLine = 0;
    let newLine = 0;
    for (const line of lines) {
        if (line.startsWith("@@")) {
            // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
            const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (match) {
                oldLine = parseInt(match[1], 10);
                newLine = parseInt(match[2], 10);
            }
            result.push({ type: "header", content: line });
        }
        else if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("diff ") || line.startsWith("index ")) {
            // File header lines — treat as headers
            result.push({ type: "header", content: line });
        }
        else if (line.startsWith("+")) {
            result.push({
                type: "added",
                content: line.slice(1),
                newLineNumber: newLine,
            });
            newLine++;
        }
        else if (line.startsWith("-")) {
            result.push({
                type: "removed",
                content: line.slice(1),
                oldLineNumber: oldLine,
            });
            oldLine++;
        }
        else if (line.startsWith(" ") || line === "") {
            result.push({
                type: "context",
                content: line.startsWith(" ") ? line.slice(1) : line,
                oldLineNumber: oldLine,
                newLineNumber: newLine,
            });
            oldLine++;
            newLine++;
        }
    }
    return result;
}
function computeWordDiff(oldText, newText) {
    const oldWords = oldText.split(/(\s+)/);
    const newWords = newText.split(/(\s+)/);
    // Simple LCS-based diff on words
    const m = oldWords.length;
    const n = newWords.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            }
            else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    // Backtrack to find common words
    const commonOld = new Set();
    const commonNew = new Set();
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (oldWords[i - 1] === newWords[j - 1]) {
            commonOld.add(i - 1);
            commonNew.add(j - 1);
            i--;
            j--;
        }
        else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        }
        else {
            j--;
        }
    }
    const oldSegments = oldWords.map((w, idx) => ({
        text: w,
        changed: !commonOld.has(idx),
    }));
    const newSegments = newWords.map((w, idx) => ({
        text: w,
        changed: !commonNew.has(idx),
    }));
    return { oldSegments, newSegments };
}
function buildDisplayEntries(diffLines, contextLines, wordDiff) {
    // If no context limit, show everything
    if (contextLines === undefined) {
        const entries = [];
        // Pre-compute word-level diffs for adjacent removed/added line pairs
        for (let i = 0; i < diffLines.length; i++) {
            const line = diffLines[i];
            if (wordDiff && line.type === "removed") {
                // Look ahead for adjacent added line
                const next = diffLines[i + 1];
                if (next && next.type === "added") {
                    const wd = computeWordDiff(line.content, next.content);
                    entries.push({ kind: "line", line, index: i, wordSegments: wd.oldSegments });
                    entries.push({ kind: "line", line: next, index: i + 1, wordSegments: wd.newSegments });
                    i++; // skip the added line
                    continue;
                }
            }
            entries.push({ kind: "line", line, index: i });
        }
        return entries;
    }
    const isChange = diffLines.map((l) => l.type === "added" || l.type === "removed" || l.type === "header");
    const visible = new Set();
    for (let i = 0; i < diffLines.length; i++) {
        if (isChange[i]) {
            for (let d = -contextLines; d <= contextLines; d++) {
                const idx = i + d;
                if (idx >= 0 && idx < diffLines.length) {
                    visible.add(idx);
                }
            }
        }
    }
    // Headers are always visible
    for (let i = 0; i < diffLines.length; i++) {
        if (diffLines[i].type === "header")
            visible.add(i);
    }
    const entries = [];
    let collapsedCount = 0;
    for (let i = 0; i < diffLines.length; i++) {
        if (!visible.has(i)) {
            collapsedCount++;
            continue;
        }
        if (collapsedCount > 0) {
            entries.push({ kind: "collapsed", count: collapsedCount });
            collapsedCount = 0;
        }
        const line = diffLines[i];
        // Word diff pairing
        if (wordDiff && line.type === "removed" && visible.has(i + 1)) {
            const next = diffLines[i + 1];
            if (next && next.type === "added") {
                const wd = computeWordDiff(line.content, next.content);
                entries.push({ kind: "line", line, index: i, wordSegments: wd.oldSegments });
                entries.push({ kind: "line", line: next, index: i + 1, wordSegments: wd.newSegments });
                i++;
                continue;
            }
        }
        entries.push({ kind: "line", line, index: i });
    }
    if (collapsedCount > 0) {
        entries.push({ kind: "collapsed", count: collapsedCount });
    }
    return entries;
}
function getDiffColors(colors) {
    return {
        addedBg: colors.diff.addedBg,
        addedText: colors.diff.added,
        addedHighlightBg: colors.diff.addedBg, // highlight uses same bg; line marker is brighter
        removedBg: colors.diff.removedBg,
        removedText: colors.diff.removed,
        removedHighlightBg: colors.diff.removedBg,
        contextText: colors.text.dim,
        hunkText: colors.info,
        fileText: colors.brand.primary,
        gutterText: colors.text.disabled,
        collapsedText: colors.text.disabled,
        focusBg: colors.surface.raised,
    };
}
/** Return true if `raw` is a hunk header like `@@ -1,3 +1,4 @@ …` */
function isHunkHeader(content) {
    return content.startsWith("@@");
}
/** Return true if `raw` is a file-level header line. */
function isFileHeader(content) {
    return (content.startsWith("diff ") ||
        content.startsWith("index ") ||
        content.startsWith("---") ||
        content.startsWith("+++"));
}
/** Extract a display-friendly filename from a `--- a/foo` or `+++ b/bar` line. */
function extractFilename(raw) {
    const m = raw.match(/^(?:---|\+\+\+)\s+(?:[ab]\/)?(.+)/);
    return m ? m[1] : null;
}
const DiffViewBase = React.memo(function DiffView(rawProps) {
    const props = usePluginProps("DiffView", rawProps);
    const colors = useColors();
    const DIFF_COLORS = getDiffColors(colors);
    const { diff, lines: preLines, showLineNumbers = true, contextLines, addedColor, removedColor, isFocused = false, filePath, wordDiff = false, ...containerProps } = props;
    // Resolve effective colors: props override theme-derived defaults
    const effectiveAddedText = addedColor ?? DIFF_COLORS.addedText;
    const effectiveRemovedText = removedColor ?? DIFF_COLORS.removedText;
    const effectiveFileHeaderColor = colors.brand.primary;
    const { requestRender } = useTui();
    const scrollRef = useRef(0);
    const diffLines = preLines ?? (diff ? parseDiff(diff) : []);
    // Empty diff — render nothing
    if (diffLines.length === 0 && !filePath) {
        return React.createElement(Box, { flexDirection: "column", ...containerProps });
    }
    const entries = buildDisplayEntries(diffLines, contextLines, wordDiff);
    const hunkIndices = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.kind === "line" && entry.line.type === "header") {
            hunkIndices.push(i);
        }
    }
    let maxLineNum = 1;
    for (const line of diffLines) {
        if (line.oldLineNumber !== undefined && line.oldLineNumber > maxLineNum)
            maxLineNum = line.oldLineNumber;
        if (line.newLineNumber !== undefined && line.newLineNumber > maxLineNum)
            maxLineNum = line.newLineNumber;
    }
    const gutterWidth = Math.max(String(maxLineNum).length, 3);
    // Keyboard navigation
    useInput(useCallback((event) => {
        if (!isFocused)
            return;
        if (event.key === "up") {
            scrollRef.current = Math.max(0, scrollRef.current - 1);
            requestRender();
        }
        else if (event.key === "down") {
            scrollRef.current = Math.min(entries.length - 1, scrollRef.current + 1);
            requestRender();
        }
        else if (event.char === "n" && !event.shift) {
            const current = scrollRef.current;
            const next = hunkIndices.find((h) => h > current);
            if (next !== undefined) {
                scrollRef.current = next;
                requestRender();
            }
        }
        else if (event.char === "N" || (event.char === "n" && event.shift)) {
            const current = scrollRef.current;
            let prev;
            for (const h of hunkIndices) {
                if (h >= current)
                    break;
                prev = h;
            }
            if (prev !== undefined) {
                scrollRef.current = prev;
                requestRender();
            }
        }
    }, [isFocused, entries.length, hunkIndices, requestRender]), { isActive: isFocused });
    // ── Render helpers ────────────────────────────────────────────────
    /** Render the gutter (old line num + new line num) for a given diff line. */
    function renderGutter(line, lineType) {
        if (!showLineNumbers) {
            return React.createElement(Text, { key: "g" }, "");
        }
        let oldStr;
        let newStr;
        if (lineType === "header") {
            oldStr = " ".repeat(gutterWidth);
            newStr = " ".repeat(gutterWidth);
        }
        else if (lineType === "added") {
            oldStr = " ".repeat(gutterWidth);
            newStr = line.newLineNumber !== undefined
                ? String(line.newLineNumber).padStart(gutterWidth)
                : " ".repeat(gutterWidth);
        }
        else if (lineType === "removed") {
            oldStr = line.oldLineNumber !== undefined
                ? String(line.oldLineNumber).padStart(gutterWidth)
                : " ".repeat(gutterWidth);
            newStr = " ".repeat(gutterWidth);
        }
        else {
            // context
            oldStr = line.oldLineNumber !== undefined
                ? String(line.oldLineNumber).padStart(gutterWidth)
                : " ".repeat(gutterWidth);
            newStr = line.newLineNumber !== undefined
                ? String(line.newLineNumber).padStart(gutterWidth)
                : " ".repeat(gutterWidth);
        }
        return React.createElement(Text, { key: "g", color: DIFF_COLORS.gutterText }, `${oldStr} ${newStr} `);
    }
    /** Render the +/- /space marker. */
    function renderMarker(lineType) {
        if (lineType === "added") {
            return React.createElement(Text, { key: "m", color: effectiveAddedText, bold: true }, "+ ");
        }
        if (lineType === "removed") {
            return React.createElement(Text, { key: "m", color: effectiveRemovedText, bold: true }, "- ");
        }
        // context & header — blank marker
        return React.createElement(Text, { key: "m", color: DIFF_COLORS.contextText }, "  ");
    }
    /** Render word-diff content: unchanged words are dim, changed words are bold+colored. */
    function renderWordDiffContent(segments, lineType) {
        const changedColor = lineType === "added" ? effectiveAddedText : effectiveRemovedText;
        return segments.map((seg, s) => {
            if (seg.changed) {
                // Changed words: bold + colored (green for added, red for removed)
                return React.createElement(Text, { key: `w-${s}`, color: changedColor, bold: true }, seg.text);
            }
            // Unchanged words: dim gray — no color, no background
            return React.createElement(Text, { key: `w-${s}`, color: DIFF_COLORS.contextText }, seg.text);
        });
    }
    // ── Per-type render functions ──────────────────────────────────────
    /** Render a file header line (diff --git, +++, index). Skips --- lines. */
    function renderHeaderLine(line, i) {
        // Skip --- line entirely — +++ line will show the filename
        if (line.content.startsWith("---"))
            return null;
        const fname = line.content.startsWith("+++") ? extractFilename(line.content) : null;
        const parts = [renderGutter(line, "header")];
        if (fname) {
            parts.push(React.createElement(Text, { key: "content", color: DIFF_COLORS.fileText, bold: true, wrap: "truncate" }, `\u2500\u2500 ${fname}`));
        }
        else {
            // "diff --git" and "index" lines — render very dim
            parts.push(React.createElement(Text, { key: "content", color: DIFF_COLORS.gutterText, dim: true, wrap: "truncate" }, line.content));
        }
        return React.createElement(Box, { key: `l-${i}`, height: 1, flexDirection: "row", overflow: "hidden" }, ...parts);
    }
    /** Render a hunk header line (@@ ... @@). */
    function renderHunkLine(line, i) {
        return React.createElement(Box, { key: `l-${i}`, height: 1, flexDirection: "row", overflow: "hidden" }, renderGutter(line, "header"), React.createElement(Text, { key: "content", color: DIFF_COLORS.hunkText, dim: true, wrap: "truncate" }, line.content));
    }
    /** Render an added line with optional word-diff segments. */
    function renderAddedLine(line, i, isHighlighted, wordSegments) {
        const bg = isHighlighted ? DIFF_COLORS.addedHighlightBg : DIFF_COLORS.addedBg;
        const contentParts = wordSegments
            ? renderWordDiffContent(wordSegments, "added")
            : [React.createElement(Text, { key: "content", color: effectiveAddedText, wrap: "truncate" }, line.content)];
        return React.createElement(Box, { key: `l-${i}`, height: 1, flexDirection: "row", overflow: "hidden", backgroundColor: bg }, renderGutter(line, "added"), renderMarker("added"), ...contentParts);
    }
    /** Render a removed line with optional word-diff segments. */
    function renderRemovedLine(line, i, isHighlighted, wordSegments) {
        const bg = isHighlighted ? DIFF_COLORS.removedHighlightBg : DIFF_COLORS.removedBg;
        const contentParts = wordSegments
            ? renderWordDiffContent(wordSegments, "removed")
            : [React.createElement(Text, { key: "content", color: effectiveRemovedText, wrap: "truncate" }, line.content)];
        return React.createElement(Box, { key: `l-${i}`, height: 1, flexDirection: "row", overflow: "hidden", backgroundColor: bg }, renderGutter(line, "removed"), renderMarker("removed"), ...contentParts);
    }
    /** Render an unchanged context line. */
    function renderContextLine(line, i, isHighlighted) {
        return React.createElement(Box, {
            key: `l-${i}`,
            height: 1,
            flexDirection: "row",
            overflow: "hidden",
            ...(isHighlighted ? { backgroundColor: DIFF_COLORS.focusBg } : {}),
        }, renderGutter(line, "context"), renderMarker("context"), React.createElement(Text, { key: "content", color: DIFF_COLORS.contextText, wrap: "truncate" }, line.content));
    }
    /** Render a collapsed (hidden unchanged lines) section. */
    function renderCollapsedSection(entry, i) {
        const gutterPad = showLineNumbers ? " ".repeat(gutterWidth * 2 + 2) : "";
        return React.createElement(Box, { key: `c-${i}`, height: 1, flexDirection: "row" }, React.createElement(Text, { color: DIFF_COLORS.collapsedText, dim: true, wrap: "truncate" }, `${gutterPad}  \u2219\u2219\u2219 ${entry.count} unchanged line${entry.count === 1 ? "" : "s"} \u2219\u2219\u2219`));
    }
    // ── Build rendered elements ───────────────────────────────────────
    const elements = [];
    // File path header (from prop)
    if (filePath) {
        elements.push(React.createElement(Box, { key: "filepath", height: 1, flexDirection: "row", paddingLeft: 1 }, React.createElement(Text, { color: effectiveFileHeaderColor, bold: true, wrap: "truncate" }, `\u2500\u2500 ${filePath}`)));
    }
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.kind === "collapsed") {
            elements.push(renderCollapsedSection(entry, i));
            continue;
        }
        const { line } = entry;
        const isHighlighted = isFocused && i === scrollRef.current;
        // Custom render delegate
        if (props.renderLine) {
            elements.push(React.createElement(Box, { key: `l-${i}`, height: 1, flexDirection: "row", overflow: "hidden" }, props.renderLine(line, { isHighlighted })));
            continue;
        }
        if (line.type === "header" && isFileHeader(line.content)) {
            const el = renderHeaderLine(line, i);
            if (el)
                elements.push(el);
        }
        else if (line.type === "header" && isHunkHeader(line.content)) {
            elements.push(renderHunkLine(line, i));
        }
        else if (line.type === "added") {
            elements.push(renderAddedLine(line, i, isHighlighted, entry.wordSegments));
        }
        else if (line.type === "removed") {
            elements.push(renderRemovedLine(line, i, isHighlighted, entry.wordSegments));
        }
        else {
            elements.push(renderContextLine(line, i, isHighlighted));
        }
    }
    // ── Outer container ───────────────────────────────────────────────
    const outerProps = {
        flexDirection: "column",
        overflow: "hidden",
        ...containerProps,
    };
    return React.createElement(Box, outerProps, ...elements);
});
export const DiffView = Object.assign(DiffViewBase, {
    Root: DiffViewRoot,
    Line: DiffViewCompoundLine,
    Hunk: DiffViewCompoundHunk,
});
//# sourceMappingURL=DiffView.js.map