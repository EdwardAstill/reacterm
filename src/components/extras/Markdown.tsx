import React from "react";
import { useColors } from "../../hooks/useColors.js";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { padCell } from "../../utils/format.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import {
  parseBlocks,
  parseInline,
  type Block,
  type InlineToken,
  type ListNode,
} from "../../utils/markdown/parse.js";

export interface MarkdownProps extends StormLayoutStyleProps {
  content: string;
  maxWidth?: number;
}

interface InlineRenderContext {
  colors: ReturnType<typeof useColors>;
  personality: ReturnType<typeof usePersonality>;
}

function renderInlineTokens(tokens: InlineToken[], ctx: InlineRenderContext, keyPrefix: string): React.ReactNode[] {
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (token.type) {
      case "text":
        return token.value;

      case "bold":
        return React.createElement(
          "tui-text",
          { key, bold: true },
          ...renderInlineTokens(token.children, ctx, key),
        );

      case "italic":
        return React.createElement(
          "tui-text",
          { key, italic: true },
          ...renderInlineTokens(token.children, ctx, key),
        );

      case "bolditalic":
        return React.createElement(
          "tui-text",
          { key, bold: true, italic: true },
          ...renderInlineTokens(token.children, ctx, key),
        );

      case "strikethrough":
        return React.createElement(
          "tui-text",
          { key, strikethrough: true, dim: true },
          ...renderInlineTokens(token.children, ctx, key),
        );

      case "code":
        return React.createElement(
          "tui-text",
          { key, color: ctx.colors.syntax.string, dim: true },
          "`" + token.value + "`",
        );

      case "link":
        return React.createElement(
          "tui-text",
          {
            key,
            color: ctx.personality.typography.linkColor,
            underline: ctx.personality.typography.linkUnderline,
            _linkUrl: token.url,
          },
          token.text,
        );

      case "image":
        return React.createElement(
          "tui-text",
          { key, color: ctx.colors.info, dim: true },
          `[Image: ${token.alt || token.url}]`,
        );

      default:
        return null;
    }
  });
}

function renderInlineText(text: string, ctx: InlineRenderContext, keyPrefix: string): React.ReactNode {
  const tokens = parseInline(text);
  if (tokens.length === 1 && tokens[0]!.type === "text") {
    return tokens[0]!.value;
  }
  return React.createElement(
    "tui-text",
    { key: keyPrefix },
    ...renderInlineTokens(tokens, ctx, keyPrefix),
  );
}

const BULLET_MARKERS = ["\u2022", "\u25E6", "\u25AA"]; // bullet, circle, square

function renderListItems(
  items: ListNode[],
  ctx: InlineRenderContext,
  depth: number,
  ordered: boolean,
  keyPrefix: string,
): React.ReactElement[] {
  if (depth > 10) return [];
  const elements: React.ReactElement[] = [];
  const indent = "  ".repeat(depth);

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx]!;
    const key = `${keyPrefix}-${idx}`;

    let prefix: string;
    if (item.checked !== undefined) {
      prefix = `${indent}${item.checked ? "\u2611" : "\u2610"} `;
    } else if (ordered) {
      prefix = `${indent}${item.start + idx}. `;
    } else {
      prefix = `${indent}${BULLET_MARKERS[depth % BULLET_MARKERS.length]} `;
    }

    elements.push(
      React.createElement(
        "tui-box",
        { key, flexDirection: "row" },
        React.createElement(
          "tui-text",
          { color: ctx.colors.text.secondary },
          prefix,
        ),
        React.createElement(
          "tui-text",
          { color: ctx.colors.text.primary },
          ...renderInlineTokens(parseInline(item.text), ctx, key),
        ),
      ),
    );

    if (item.children.length > 0) {
      const childOrdered = item.children[0]?.ordered ?? false;
      elements.push(
        ...renderListItems(item.children, ctx, depth + 1, childOrdered, `${key}-c`),
      );
    }
  }

  return elements;
}

function renderTable(
  block: Extract<Block, { type: "table" }>,
  ctx: InlineRenderContext,
  key: string,
): React.ReactElement {
  const { headers, alignments, rows } = block;
  const colCount = headers.length;

  const colWidths: number[] = headers.map((h) => h.length);
  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      const cell = row[c] ?? "";
      if (cell.length > colWidths[c]!) colWidths[c] = cell.length;
    }
  }

  const lines: React.ReactElement[] = [];

  // Top border
  const topBorder = "\u250C" + colWidths.map((w) => "\u2500".repeat(w + 2)).join("\u252C") + "\u2510";
  lines.push(
    React.createElement("tui-text", { key: `${key}-tb`, color: ctx.colors.text.dim, dim: true }, topBorder),
  );

  // Header row
  const headerCells = headers.map((h, c) => padCell(h, colWidths[c]!, alignments[c] ?? "left"));
  const headerLine = "\u2502" + headerCells.map((c) => ` ${c} `).join("\u2502") + "\u2502";
  lines.push(
    React.createElement("tui-text", { key: `${key}-h`, color: ctx.colors.text.primary, bold: true }, headerLine),
  );

  // Separator
  const sepLine = "\u251C" + colWidths.map((w) => "\u2500".repeat(w + 2)).join("\u253C") + "\u2524";
  lines.push(
    React.createElement("tui-text", { key: `${key}-sep`, color: ctx.colors.text.dim, dim: true }, sepLine),
  );

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const cells = headers.map((_, c) => padCell(row[c] ?? "", colWidths[c]!, alignments[c] ?? "left"));
    const rowLine = "\u2502" + cells.map((c) => ` ${c} `).join("\u2502") + "\u2502";
    lines.push(
      React.createElement("tui-text", { key: `${key}-r${r}`, color: ctx.colors.text.primary }, rowLine),
    );
  }

  // Bottom border
  const bottomBorder = "\u2514" + colWidths.map((w) => "\u2500".repeat(w + 2)).join("\u2534") + "\u2518";
  lines.push(
    React.createElement("tui-text", { key: `${key}-bb`, color: ctx.colors.text.dim, dim: true }, bottomBorder),
  );

  return React.createElement(
    "tui-box",
    { key, flexDirection: "column", marginY: 1 },
    ...lines,
  );
}

function renderBlock(block: Block, ctx: InlineRenderContext, key: string): React.ReactElement {
  switch (block.type) {
    case "heading": {
      // H1: BOLD UPPERCASE + brand color + underline bar
      // H2: Bold + primary
      // H3: Bold + secondary
      // H4-H6: dim + secondary
      const headingConfigs: Record<number, { color: string; bold: boolean; dim: boolean; transform: (s: string) => string; decoration: boolean }> = {
        1: { color: ctx.personality.typography.headingColor, bold: true, dim: false, transform: (s) => s.toUpperCase(), decoration: true },
        2: { color: ctx.colors.text.primary, bold: true, dim: false, transform: (s) => s, decoration: false },
        3: { color: ctx.colors.text.secondary, bold: true, dim: false, transform: (s) => s, decoration: false },
        4: { color: ctx.colors.text.secondary, bold: false, dim: true, transform: (s) => s, decoration: false },
        5: { color: ctx.colors.text.dim, bold: false, dim: true, transform: (s) => s, decoration: false },
        6: { color: ctx.colors.text.dim, bold: false, dim: true, transform: (s) => s, decoration: false },
      };

      const cfg = headingConfigs[block.level]!;
      const elements: React.ReactElement[] = [];

      elements.push(
        React.createElement(
          "tui-text",
          { key: `${key}-t`, color: cfg.color, bold: cfg.bold, ...(cfg.dim ? { dim: true } : {}) },
          cfg.transform(block.text),
        ),
      );

      if (cfg.decoration) {
        elements.push(
          React.createElement(
            "tui-text",
            { key: `${key}-d`, color: ctx.colors.text.dim, dim: true, wrap: "truncate" },
            "\u2500".repeat(200),
          ),
        );
      }

      return React.createElement(
        "tui-box",
        { key, flexDirection: "column", marginBottom: block.level <= 2 ? 1 : 0 },
        ...elements,
      );
    }

    case "paragraph": {
      return React.createElement(
        "tui-box",
        { key, marginBottom: 1 },
        React.createElement(
          "tui-text",
          { color: ctx.colors.text.primary },
          ...renderInlineTokens(parseInline(block.text), ctx, key),
        ),
      );
    }

    case "codeblock": {
      const label = block.language
        ? React.createElement(
            "tui-text",
            { key: `${key}-lang`, color: ctx.colors.text.secondary, dim: true },
            ` ${block.language} `,
          )
        : null;

      return React.createElement(
        "tui-box",
        {
          key,
          flexDirection: "column",
          borderStyle: "round",
          borderColor: ctx.colors.text.dim,
          borderDimColor: true,
          padding: 1,
          marginY: 1,
        },
        ...(label ? [label] : []),
        React.createElement(
          "tui-text",
          { color: ctx.colors.text.secondary },
          block.content,
        ),
      );
    }

    case "blockquote": {
      const inner = block.lines.join("\n");
      const innerBlocks = parseBlocks(inner);

      return React.createElement(
        "tui-box",
        {
          key,
          borderLeft: true,
          borderRight: false,
          borderTop: false,
          borderBottom: false,
          borderStyle: "heavy",
          borderColor: ctx.colors.brand.primary,
          paddingLeft: 1,
          marginY: 1,
        },
        ...innerBlocks.map((b, idx) => renderBlock(b, ctx, `${key}-bq${idx}`)),
      );
    }

    case "hr": {
      return React.createElement(
        "tui-box",
        { key, height: 1, overflow: "hidden", flexShrink: 0, marginY: 1 },
        React.createElement(
          "tui-text",
          { color: ctx.colors.divider, dim: true, wrap: "truncate" },
          "\u2500".repeat(200),
        ),
      );
    }

    case "ulist": {
      return React.createElement(
        "tui-box",
        { key, flexDirection: "column", marginBottom: 1 },
        ...renderListItems(block.items, ctx, 0, false, key),
      );
    }

    case "olist": {
      return React.createElement(
        "tui-box",
        { key, flexDirection: "column", marginBottom: 1 },
        ...renderListItems(block.items, ctx, 0, true, key),
      );
    }

    case "table": {
      return renderTable(block, ctx, key);
    }

    default:
      return React.createElement("tui-text", { key }, "");
  }
}

export const Markdown = React.memo(function Markdown(rawProps: MarkdownProps): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("Markdown", rawProps);
  const { content, maxWidth, ...layoutProps } = props;

  const ctx: InlineRenderContext = { colors, personality };
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  const children = blocks.map((block, idx) => renderBlock(block, ctx, `md-${idx}`));

  const outerProps: Record<string, unknown> = {
    flexDirection: "column",
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...pickLayoutProps(layoutProps),
  };

  return React.createElement("tui-box", outerProps, ...children);
});
