import React from "react";
import { padCell } from "../format.js";
import { parseBlocks, parseInline, } from "./parse.js";
export function renderInlineTokens(tokens, ctx, keyPrefix) {
    return tokens.map((token, idx) => {
        const key = `${keyPrefix}-${idx}`;
        switch (token.type) {
            case "text":
                return token.value;
            case "bold":
                return React.createElement("tui-text", { key, bold: true }, ...renderInlineTokens(token.children, ctx, key));
            case "italic":
                return React.createElement("tui-text", { key, italic: true }, ...renderInlineTokens(token.children, ctx, key));
            case "bolditalic":
                return React.createElement("tui-text", { key, bold: true, italic: true }, ...renderInlineTokens(token.children, ctx, key));
            case "strikethrough":
                return React.createElement("tui-text", { key, strikethrough: true, dim: true }, ...renderInlineTokens(token.children, ctx, key));
            case "code":
                return React.createElement("tui-text", { key, color: ctx.colors.syntax.string, dim: true }, "`" + token.value + "`");
            case "link":
                return React.createElement("tui-text", {
                    key,
                    color: ctx.personality.typography.linkColor,
                    underline: ctx.personality.typography.linkUnderline,
                    _linkUrl: token.url,
                }, token.text);
            case "image":
                return React.createElement("tui-text", { key, color: ctx.colors.info, dim: true }, `[Image: ${token.alt || token.url}]`);
            default:
                return null;
        }
    });
}
export function renderInlineText(text, ctx, keyPrefix) {
    const tokens = parseInline(text);
    if (tokens.length === 1 && tokens[0].type === "text") {
        return tokens[0].value;
    }
    return React.createElement("tui-text", { key: keyPrefix }, ...renderInlineTokens(tokens, ctx, keyPrefix));
}
const BULLET_MARKERS = ["•", "◦", "▪"];
export function renderListItems(items, ctx, depth, ordered, keyPrefix) {
    if (depth > 10)
        return [];
    const elements = [];
    const indent = "  ".repeat(depth);
    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const key = `${keyPrefix}-${idx}`;
        let prefix;
        if (item.checked !== undefined) {
            prefix = `${indent}${item.checked ? "☑" : "☐"} `;
        }
        else if (ordered) {
            prefix = `${indent}${item.start + idx}. `;
        }
        else {
            prefix = `${indent}${BULLET_MARKERS[depth % BULLET_MARKERS.length]} `;
        }
        elements.push(React.createElement("tui-box", { key, flexDirection: "row" }, React.createElement("tui-text", { color: ctx.colors.text.secondary }, prefix), React.createElement("tui-text", { color: ctx.colors.text.primary }, ...renderInlineTokens(parseInline(item.text), ctx, key))));
        if (item.children.length > 0) {
            const childOrdered = item.children[0]?.ordered ?? false;
            elements.push(...renderListItems(item.children, ctx, depth + 1, childOrdered, `${key}-c`));
        }
    }
    return elements;
}
export function renderTable(block, ctx, key) {
    const { headers, alignments, rows } = block;
    const colCount = headers.length;
    const colWidths = headers.map((h) => h.length);
    for (const row of rows) {
        for (let c = 0; c < colCount; c++) {
            const cell = row[c] ?? "";
            if (cell.length > colWidths[c])
                colWidths[c] = cell.length;
        }
    }
    const lines = [];
    const topBorder = "┌" + colWidths.map((w) => "─".repeat(w + 2)).join("┬") + "┐";
    lines.push(React.createElement("tui-text", { key: `${key}-tb`, color: ctx.colors.text.dim, dim: true }, topBorder));
    const headerCells = headers.map((h, c) => padCell(h, colWidths[c], alignments[c] ?? "left"));
    const headerLine = "│" + headerCells.map((c) => ` ${c} `).join("│") + "│";
    lines.push(React.createElement("tui-text", { key: `${key}-h`, color: ctx.colors.text.primary, bold: true }, headerLine));
    const sepLine = "├" + colWidths.map((w) => "─".repeat(w + 2)).join("┼") + "┤";
    lines.push(React.createElement("tui-text", { key: `${key}-sep`, color: ctx.colors.text.dim, dim: true }, sepLine));
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = headers.map((_, c) => padCell(row[c] ?? "", colWidths[c], alignments[c] ?? "left"));
        const rowLine = "│" + cells.map((c) => ` ${c} `).join("│") + "│";
        lines.push(React.createElement("tui-text", { key: `${key}-r${r}`, color: ctx.colors.text.primary }, rowLine));
    }
    const bottomBorder = "└" + colWidths.map((w) => "─".repeat(w + 2)).join("┴") + "┘";
    lines.push(React.createElement("tui-text", { key: `${key}-bb`, color: ctx.colors.text.dim, dim: true }, bottomBorder));
    return React.createElement("tui-box", { key, flexDirection: "column", marginY: 1 }, ...lines);
}
export function renderBlock(block, ctx, key) {
    switch (block.type) {
        case "heading": {
            const headingConfigs = {
                1: { color: ctx.personality.typography.headingColor, bold: true, dim: false, transform: (s) => s.toUpperCase(), decoration: true },
                2: { color: ctx.colors.text.primary, bold: true, dim: false, transform: (s) => s, decoration: false },
                3: { color: ctx.colors.text.secondary, bold: true, dim: false, transform: (s) => s, decoration: false },
                4: { color: ctx.colors.text.secondary, bold: false, dim: true, transform: (s) => s, decoration: false },
                5: { color: ctx.colors.text.dim, bold: false, dim: true, transform: (s) => s, decoration: false },
                6: { color: ctx.colors.text.dim, bold: false, dim: true, transform: (s) => s, decoration: false },
            };
            const cfg = headingConfigs[block.level];
            const elements = [];
            elements.push(React.createElement("tui-text", { key: `${key}-t`, color: cfg.color, bold: cfg.bold, ...(cfg.dim ? { dim: true } : {}) }, cfg.transform(block.text)));
            if (cfg.decoration) {
                elements.push(React.createElement("tui-text", { key: `${key}-d`, color: ctx.colors.text.dim, dim: true, wrap: "truncate" }, "─".repeat(200)));
            }
            return React.createElement("tui-box", { key, flexDirection: "column", marginBottom: block.level <= 2 ? 1 : 0 }, ...elements);
        }
        case "paragraph": {
            return React.createElement("tui-box", { key, marginBottom: 1 }, React.createElement("tui-text", { color: ctx.colors.text.primary }, ...renderInlineTokens(parseInline(block.text), ctx, key)));
        }
        case "codeblock": {
            const label = block.language
                ? React.createElement("tui-text", { key: `${key}-lang`, color: ctx.colors.text.secondary, dim: true }, ` ${block.language} `)
                : null;
            return React.createElement("tui-box", {
                key,
                flexDirection: "column",
                borderStyle: "round",
                borderColor: ctx.colors.text.dim,
                borderDimColor: true,
                padding: 1,
                marginY: 1,
            }, ...(label ? [label] : []), React.createElement("tui-text", { color: ctx.colors.text.secondary }, block.content));
        }
        case "blockquote": {
            const inner = block.lines.join("\n");
            const innerBlocks = parseBlocks(inner);
            return React.createElement("tui-box", {
                key,
                borderLeft: true,
                borderRight: false,
                borderTop: false,
                borderBottom: false,
                borderStyle: "heavy",
                borderColor: ctx.colors.brand.primary,
                paddingLeft: 1,
                marginY: 1,
            }, ...innerBlocks.map((b, idx) => renderBlock(b, ctx, `${key}-bq${idx}`)));
        }
        case "hr": {
            return React.createElement("tui-box", { key, height: 1, overflow: "hidden", flexShrink: 0, marginY: 1 }, React.createElement("tui-text", { color: ctx.colors.divider, dim: true, wrap: "truncate" }, "─".repeat(200)));
        }
        case "ulist": {
            return React.createElement("tui-box", { key, flexDirection: "column", marginBottom: 1 }, ...renderListItems(block.items, ctx, 0, false, key));
        }
        case "olist": {
            return React.createElement("tui-box", { key, flexDirection: "column", marginBottom: 1 }, ...renderListItems(block.items, ctx, 0, true, key));
        }
        case "table": {
            return renderTable(block, ctx, key);
        }
        default:
            return React.createElement("tui-text", { key }, "");
    }
}
//# sourceMappingURL=render-blocks.js.map