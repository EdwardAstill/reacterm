import { useEffect, useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import type { KeyEvent } from "../input/types.js";

export interface UseInputOptions {
  /** Only receive events when active (default: true). When false, the handler is fully unsubscribed
   * from the dispatcher — it does not occupy a slot in same-priority counting. */
  isActive?: boolean;
  /** Priority level. Higher = runs first and suppresses lower-priority handlers (focus trap). */
  priority?: number;
}

/**
 * Subscribe to keyboard events. When `isActive` is false the handler is unsubscribed
 * from the dispatcher entirely — inactive handlers do NOT contribute to the
 * "multiple handlers at same priority" diagnostic, which means a parent that mounts
 * several optionally-active overlays at the same priority no longer false-positives
 * just because most of them are turned off.
 *
 * Higher `priority` runs first and can shadow lower-priority handlers (useful for modal traps).
 * The `handler` reference is captured via a ref so re-passing a fresh closure each render does
 * NOT cause a re-subscription; only `isActive` and `priority` changes do.
 */
export function useInput(
  handler: (event: KeyEvent) => void,
  options: UseInputOptions = {},
): void {
  const { input } = useTui();
  const isActive = options.isActive ?? true;
  const priority = options.priority;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isActive) return;
    const wrapped = (event: KeyEvent) => {
      handlerRef.current(event);
    };
    const unsub = priority !== undefined
      ? input.onKeyPrioritized(wrapped, priority)
      : input.onKey(wrapped);
    return () => unsub();
  }, [isActive, priority, input]);
}
