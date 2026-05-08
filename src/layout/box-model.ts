import type { LayoutProps } from "./types.js";

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MarginAuto {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export function resolvePadding(p: LayoutProps): Padding {
  const base = p.padding ?? 0;
  const px = p.paddingX ?? base;
  const py = p.paddingY ?? base;
  return {
    top: p.paddingTop ?? py,
    bottom: p.paddingBottom ?? py,
    left: p.paddingLeft ?? px,
    right: p.paddingRight ?? px,
  };
}

function resolveMarginValue(
  specific: number | "auto" | undefined,
  fallback: number | "auto",
): { value: number; isAuto: boolean } {
  const v = specific ?? fallback;
  if (v === "auto") return { value: 0, isAuto: true };
  return { value: v, isAuto: false };
}

export function resolveMargin(p: LayoutProps): Margin {
  const base = p.margin ?? 0;
  const mx = p.marginX ?? base;
  const my = p.marginY ?? base;
  return {
    top: resolveMarginValue(p.marginTop, my).value,
    bottom: resolveMarginValue(p.marginBottom, my).value,
    left: resolveMarginValue(p.marginLeft, mx).value,
    right: resolveMarginValue(p.marginRight, mx).value,
  };
}

export function resolveMarginAuto(p: LayoutProps): MarginAuto {
  const base = p.margin ?? 0;
  const mx = p.marginX ?? base;
  const my = p.marginY ?? base;
  return {
    top: resolveMarginValue(p.marginTop, my).isAuto,
    bottom: resolveMarginValue(p.marginBottom, my).isAuto,
    left: resolveMarginValue(p.marginLeft, mx).isAuto,
    right: resolveMarginValue(p.marginRight, mx).isAuto,
  };
}

export function resolveScrollbarGutter(value: unknown): number {
  if (value === undefined || value === null) return 1;
  const gutter = Number(value);
  if (!Number.isFinite(gutter)) return 1;
  return Math.max(0, Math.floor(gutter));
}
