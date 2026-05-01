export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineToken[] }
  | { type: "italic"; children: InlineToken[] }
  | { type: "bolditalic"; children: InlineToken[] }
  | { type: "strikethrough"; children: InlineToken[] }
  | { type: "code"; value: string }
  | { type: "link"; text: string; url: string }
  | { type: "image"; alt: string; url: string };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "codeblock"; language: string; content: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "hr" }
  | { type: "ulist"; items: ListNode[] }
  | { type: "olist"; items: ListNode[]; start: number }
  | { type: "table"; headers: string[]; alignments: ("left" | "center" | "right")[]; rows: string[][] };

export interface ListNode {
  text: string;
  checked?: boolean | undefined;
  children: ListNode[];
  ordered: boolean;
  start: number;
}

export function parseInline(src: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  function pushText(t: string): void {
    if (t.length === 0) return;
    const last = tokens[tokens.length - 1];
    if (last && last.type === "text") {
      last.value += t;
    } else {
      tokens.push({ type: "text", value: t });
    }
  }

  while (i < src.length) {
    // Image: ![alt](url)
    if (src[i] === "!" && src[i + 1] === "[") {
      const closeBracket = src.indexOf("]", i + 2);
      if (closeBracket !== -1 && src[closeBracket + 1] === "(") {
        const closeParen = src.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          const alt = src.slice(i + 2, closeBracket);
          const url = src.slice(closeBracket + 2, closeParen);
          tokens.push({ type: "image", alt, url });
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Link: [text](url)
    if (src[i] === "[") {
      const closeBracket = src.indexOf("]", i + 1);
      if (closeBracket !== -1 && src[closeBracket + 1] === "(") {
        const closeParen = src.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          const text = src.slice(i + 1, closeBracket);
          const url = src.slice(closeBracket + 2, closeParen);
          tokens.push({ type: "link", text, url });
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Inline code: `code`
    if (src[i] === "`") {
      const end = src.indexOf("`", i + 1);
      if (end !== -1) {
        tokens.push({ type: "code", value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Bold+Italic: ***text*** or ___text___
    if ((src[i] === "*" || src[i] === "_") && src[i + 1] === src[i] && src[i + 2] === src[i]) {
      const marker = src[i]!;
      const closer = src.indexOf(marker + marker + marker, i + 3);
      if (closer !== -1) {
        tokens.push({ type: "bolditalic", children: parseInline(src.slice(i + 3, closer)) });
        i = closer + 3;
        continue;
      }
    }

    // Bold: **text** or __text__
    if ((src[i] === "*" || src[i] === "_") && src[i + 1] === src[i]) {
      const marker = src[i]!;
      const closer = src.indexOf(marker + marker, i + 2);
      if (closer !== -1 && closer > i + 2) {
        tokens.push({ type: "bold", children: parseInline(src.slice(i + 2, closer)) });
        i = closer + 2;
        continue;
      }
    }

    // Strikethrough: ~~text~~
    if (src[i] === "~" && src[i + 1] === "~") {
      const closer = src.indexOf("~~", i + 2);
      if (closer !== -1) {
        tokens.push({ type: "strikethrough", children: parseInline(src.slice(i + 2, closer)) });
        i = closer + 2;
        continue;
      }
    }

    // Italic: *text* or _text_
    if (src[i] === "*" || src[i] === "_") {
      const marker = src[i]!;
      const closer = src.indexOf(marker, i + 1);
      if (closer !== -1 && closer > i + 1) {
        tokens.push({ type: "italic", children: parseInline(src.slice(i + 1, closer)) });
        i = closer + 1;
        continue;
      }
    }

    // Escaped character
    if (src[i] === "\\" && i + 1 < src.length) {
      pushText(src[i + 1]!);
      i += 2;
      continue;
    }

    // Plain text
    pushText(src[i]!);
    i++;
  }

  return tokens;
}

export function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  function collectParagraph(): string {
    const parts: string[] = [];
    while (i < lines.length) {
      const line = lines[i]!;
      if (
        line.trim() === "" ||
        /^#{1,6}\s/.test(line) ||
        /^```/.test(line) ||
        /^>\s?/.test(line) ||
        /^---+$|^\*\*\*+$|^___+$/.test(line.trim()) ||
        /^\s*[-*+]\s/.test(line) ||
        /^\s*\d+\.\s/.test(line) ||
        /^\|.+\|/.test(line)
      ) {
        break;
      }
      parts.push(line);
      i++;
    }
    return parts.join(" ").trim();
  }

  function parseListItems(startIdx: number, baseIndent: number, ordered: boolean): { items: ListNode[]; endIdx: number } {
    const items: ListNode[] = [];
    let idx = startIdx;

    while (idx < lines.length) {
      const line = lines[idx]!;
      const trimmed = line.trimStart();
      const currentIndent = line.length - trimmed.length;

      if (trimmed === "") {
        idx++;
        continue;
      }

      const ulMatch = trimmed.match(/^[-*+]\s(.*)$/);
      const olMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
      const isListItem = ordered ? olMatch : ulMatch;

      if (!isListItem || currentIndent < baseIndent) {
        break;
      }

      if (currentIndent > baseIndent) {
        if (items.length > 0) {
          const nestedOrdered = !!olMatch;
          const nested = parseListItems(idx, currentIndent, nestedOrdered);
          items[items.length - 1]!.children = nested.items;
          idx = nested.endIdx;
        } else {
          idx++;
        }
        continue;
      }

      let itemText: string;
      let start = 1;
      if (ordered && olMatch) {
        start = parseInt(olMatch[1]!, 10);
        itemText = olMatch[2]!;
      } else if (ulMatch) {
        itemText = ulMatch[1]!;
      } else {
        idx++;
        continue;
      }

      let checked: boolean | undefined;
      const taskMatch = itemText.match(/^\[([ xX])\]\s(.*)$/);
      if (taskMatch) {
        checked = taskMatch[1] !== " ";
        itemText = taskMatch[2]!;
      }

      items.push({ text: itemText, checked, children: [], ordered, start });
      idx++;

      while (idx < lines.length) {
        const nextLine = lines[idx]!;
        const nextTrimmed = nextLine.trimStart();
        const nextIndent = nextLine.length - nextTrimmed.length;

        if (nextTrimmed === "") {
          idx++;
          continue;
        }

        if (nextIndent > baseIndent) {
          const nextUl = nextTrimmed.match(/^[-*+]\s/);
          const nextOl = nextTrimmed.match(/^\d+\.\s/);
          if (nextUl || nextOl) {
            const nestedOrdered = !!nextOl;
            const nested = parseListItems(idx, nextIndent, nestedOrdered);
            items[items.length - 1]!.children = nested.items;
            idx = nested.endIdx;
          } else {
            items[items.length - 1]!.text += " " + nextTrimmed;
            idx++;
          }
        } else {
          break;
        }
      }
    }

    return { items, endIdx: idx };
  }

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i]!.trim())) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      blocks.push({ type: "codeblock", language, content: codeLines.join("\n") });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, text: headingMatch[2]! });
      i++;
      continue;
    }

    if (/^---+$|^\*\*\*+$|^___+$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!.trim())) {
        quoteLines.push(lines[i]!.trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    if (/^\|.+\|/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1]!.trim())) {
      const headerLine = trimmed;
      const separatorLine = lines[i + 1]!.trim();
      const headers = headerLine.split("|").slice(1, -1).map((c) => c.trim());
      const alignments = separatorLine
        .split("|")
        .slice(1, -1)
        .map((c): "left" | "center" | "right" => {
          const s = c.trim();
          if (s.startsWith(":") && s.endsWith(":")) return "center";
          if (s.endsWith(":")) return "right";
          return "left";
        });
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && /^\|.+\|/.test(lines[i]!.trim())) {
        rows.push(
          lines[i]!
            .trim()
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim()),
        );
        i++;
      }
      blocks.push({ type: "table", headers, alignments, rows });
      continue;
    }

    if (/^\s*[-*+]\s/.test(line)) {
      const baseIndent = line.length - line.trimStart().length;
      const result = parseListItems(i, baseIndent, false);
      blocks.push({ type: "ulist", items: result.items });
      i = result.endIdx;
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const baseIndent = line.length - line.trimStart().length;
      const startMatch = line.trimStart().match(/^(\d+)\./);
      const startNum = startMatch ? parseInt(startMatch[1]!, 10) : 1;
      const result = parseListItems(i, baseIndent, true);
      blocks.push({ type: "olist", items: result.items, start: startNum });
      i = result.endIdx;
      continue;
    }

    const paraText = collectParagraph();
    if (paraText) {
      blocks.push({ type: "paragraph", text: paraText });
    }
  }

  return blocks;
}
