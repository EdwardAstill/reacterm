import { iterGraphemes } from "../../core/unicode.js";

/** Strip ANSI escape sequences from text to prevent injection into cell buffer. */
export function stripAnsi(text: string): string {
  if (text.indexOf("\x1b") < 0) return text;
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1b\][^\x07]*\x07/g, "");
}

export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [];
  const lines: string[] = [];

  for (const rawLine of text.split("\n")) {
    if (rawLine.length === 0) {
      lines.push("");
      continue;
    }

    const graphemes: { offset: number; len: number; width: number; text: string }[] = [];
    let pos = 0;
    for (const g of iterGraphemes(rawLine)) {
      graphemes.push({ offset: pos, len: g.text.length, width: g.width, text: g.text });
      pos += g.text.length;
    }

    let lineStartIdx = 0;
    let lineWidth = 0;
    let lastSpaceIdx = -1;

    for (let gi = 0; gi < graphemes.length; gi++) {
      const g = graphemes[gi]!;
      if (g.text === " ") lastSpaceIdx = gi;
      lineWidth += g.width;

      if (lineWidth > width) {
        const breakIdx = lastSpaceIdx > lineStartIdx ? lastSpaceIdx : gi;
        const startOffset = graphemes[lineStartIdx]!.offset;
        const endOffset = graphemes[breakIdx]!.offset;
        lines.push(rawLine.slice(startOffset, endOffset));
        const skipSpace = lastSpaceIdx > lineStartIdx ? 1 : 0;
        lineStartIdx = breakIdx + skipSpace;
        lineWidth = 0;
        for (let j = lineStartIdx; j <= gi; j++) {
          lineWidth += graphemes[j]!.width;
        }
        lastSpaceIdx = -1;
      }
    }
    if (lineStartIdx < graphemes.length) {
      const startOffset = graphemes[lineStartIdx]!.offset;
      lines.push(rawLine.slice(startOffset));
    }
  }

  return lines;
}
