import { useId, useRef, useState } from "react";
import { ResizeObserver } from "../core/resize-observer.js";
import { useTui } from "../context/TuiContext.js";
import type { MeasuredLayout } from "../reconciler/renderer.js";
import { useCleanup } from "./useCleanup.js";

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  innerX: number;
  innerY: number;
  innerWidth: number;
  innerHeight: number;
  contentWidth: number;
  contentHeight: number;
}

export interface UseLayoutBoxOptions {
  id?: string;
  fallback?: Partial<LayoutRect>;
  onChange?: (layout: LayoutRect, previous: LayoutRect | null) => void;
}

export interface UseLayoutBoxResult {
  id: string;
  measured: boolean;
  layout: LayoutRect | null;
  rect: LayoutRect;
  layoutProps: {
    measureId: string;
  };
}

const ZERO_RECT: LayoutRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  innerX: 0,
  innerY: 0,
  innerWidth: 0,
  innerHeight: 0,
  contentWidth: 0,
  contentHeight: 0,
};

function normalizeLayout(layout: MeasuredLayout): LayoutRect {
  const innerX = layout.innerX ?? layout.x;
  const innerY = layout.innerY ?? layout.y;
  const innerWidth = layout.innerWidth ?? layout.width;
  const innerHeight = layout.innerHeight ?? layout.height;
  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    innerX,
    innerY,
    innerWidth,
    innerHeight,
    contentWidth: layout.contentWidth ?? innerWidth,
    contentHeight: layout.contentHeight ?? innerHeight,
  };
}

function rectFromFallback(fallback: Partial<LayoutRect> | undefined): LayoutRect {
  return { ...ZERO_RECT, ...fallback };
}

function sameLayout(a: LayoutRect | null, b: LayoutRect): boolean {
  return a !== null &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.innerX === b.innerX &&
    a.innerY === b.innerY &&
    a.innerWidth === b.innerWidth &&
    a.innerHeight === b.innerHeight &&
    a.contentWidth === b.contentWidth &&
    a.contentHeight === b.contentHeight;
}

/**
 * Attach a public `measureId` prop and read the element's last completed layout.
 *
 * Measurements are populated after paint, so the first render normally uses
 * `fallback`; the measured rect is available on the following render.
 */
export function useLayoutBox(options: UseLayoutBoxOptions = {}): UseLayoutBoxResult {
  const generatedId = useId();
  const id = options.id ?? `layout-box-${generatedId}`;
  const { renderContext } = useTui();
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  const layoutRef = useRef<LayoutRect | null>(null);
  const [observedLayout, setObservedLayout] = useState<LayoutRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const observedIdRef = useRef<string | null>(null);

  if (observedIdRef.current !== id) {
    observerRef.current?.disconnect();
    observedIdRef.current = id;
    observerRef.current = new ResizeObserver((entries) => {
      if (!entries.some((entry) => entry.target === id)) return;
      const measured = renderContext.measureMap.get(id);
      if (!measured) return;

      const next = normalizeLayout(measured);
      const previous = layoutRef.current;
      if (sameLayout(previous, next)) return;

      layoutRef.current = next;
      setObservedLayout(next);
      onChangeRef.current?.(next, previous);
    }, renderContext.resizeObservers);
    observerRef.current.observe(id);
  }

  useCleanup(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    observedIdRef.current = null;
  });

  const currentMeasured = renderContext.measureMap.get(id);
  const currentLayout = currentMeasured ? normalizeLayout(currentMeasured) : null;
  const layout = currentLayout ?? observedLayout;
  if (currentLayout && !sameLayout(layoutRef.current, currentLayout)) {
    layoutRef.current = currentLayout;
  }

  return {
    id,
    measured: layout !== null,
    layout,
    rect: layout ?? rectFromFallback(options.fallback),
    layoutProps: { measureId: id },
  };
}
