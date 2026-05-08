export interface ClipRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function intersectClip(a: ClipRect, b: ClipRect): ClipRect {
  return {
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
    x2: Math.min(a.x2, b.x2),
    y2: Math.min(a.y2, b.y2),
  };
}

export function isClipEmpty(c: ClipRect): boolean {
  return c.x1 >= c.x2 || c.y1 >= c.y2;
}
