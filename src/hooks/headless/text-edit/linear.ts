export interface LinearSelection {
  start: number;
  end: number;
}

export function orderedLinearSelection(a: number, b: number): LinearSelection {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export function deleteLinearSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): { value: string; cursor: number } {
  const { start, end } = orderedLinearSelection(selectionStart, selectionEnd);
  return { value: value.slice(0, start) + value.slice(end), cursor: start };
}

export function wordLeftBySpace(cursor: number, value: string): number {
  let next = cursor;
  while (next > 0 && value[next - 1] === " ") next--;
  while (next > 0 && value[next - 1] !== " ") next--;
  return next;
}

export function wordRightBySpace(cursor: number, value: string): number {
  let next = cursor;
  while (next < value.length && value[next] !== " ") next++;
  while (next < value.length && value[next] === " ") next++;
  return next;
}
