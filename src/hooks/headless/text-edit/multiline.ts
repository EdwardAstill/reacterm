export interface TextEditPos {
  row: number;
  col: number;
}

export function splitLines(text: string): string[] {
  const lines = text.split("\n");
  return lines.length === 0 ? [""] : lines;
}

export function joinLines(lines: string[]): string {
  return lines.join("\n");
}

export function clampPos(pos: TextEditPos, lines: string[]): TextEditPos {
  const row = Math.max(0, Math.min(pos.row, lines.length - 1));
  const col = Math.max(0, Math.min(pos.col, lines[row]!.length));
  return { row, col };
}

export function comparePos(a: TextEditPos, b: TextEditPos): number {
  if (a.row !== b.row) return a.row - b.row;
  return a.col - b.col;
}

export function orderedSelection(
  a: TextEditPos,
  b: TextEditPos,
): { start: TextEditPos; end: TextEditPos } {
  return comparePos(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

export function wordLeftInLine(line: string, col: number): number {
  let next = col;
  while (next > 0 && /\s/.test(line[next - 1]!)) next--;
  while (next > 0 && !/\s/.test(line[next - 1]!)) next--;
  return next;
}

export function wordRightInLine(line: string, col: number): number {
  let next = col;
  while (next < line.length && !/\s/.test(line[next]!)) next++;
  while (next < line.length && /\s/.test(line[next]!)) next++;
  return next;
}
