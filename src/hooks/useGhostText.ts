import { useRef } from "react";
import { useCleanup } from "./useCleanup.js";
import { useForceUpdate } from "./useForceUpdate.js";

export interface UseGhostTextOptions {
  value: string;
  cursor: number;
  suggest: ((value: string) => string | null) | string[];
  acceptKey?: string;
  debounceMs?: number;
}

export interface UseGhostTextResult {
  ghost: string;
  accept: () => string | null;
  dismiss: () => void;
}

export function useGhostText(options: UseGhostTextOptions): UseGhostTextResult {
  const { value, cursor, suggest, debounceMs = 150 } = options;
  const forceUpdate = useForceUpdate();

  const ghostRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorIndex = Math.max(0, Math.min(cursor, value.length));
  const prefix = value.slice(0, cursorIndex);
  const suffix = value.slice(cursorIndex);
  const prevPrefixRef = useRef(prefix);

  const resolveFromArray = (arr: string[], val: string): string => {
    if (val.length === 0) return "";
    for (const item of arr) {
      if (item.startsWith(val) && item.length > val.length) {
        return item.slice(val.length);
      }
    }
    return "";
  };

  const resolveFromFn = (fn: (value: string) => string | null, val: string): string => {
    const result = fn(val);
    if (result === null) return "";
    // If the result starts with the value, extract the completion part
    if (result.startsWith(val)) {
      return result.slice(val.length);
    }
    return result;
  };

  // When value changes, recompute ghost
  if (prefix !== prevPrefixRef.current) {
    prevPrefixRef.current = prefix;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (Array.isArray(suggest)) {
      // Synchronous resolution for arrays
      ghostRef.current = resolveFromArray(suggest, prefix);
    } else {
      // Debounced resolution for functions
      ghostRef.current = "";
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        ghostRef.current = resolveFromFn(suggest, prefix);
        forceUpdate();
      }, debounceMs);
    }
  }

  const accept = (): string | null => {
    if (ghostRef.current.length === 0) return null;
    const full = prefix + ghostRef.current + suffix;
    ghostRef.current = "";
    forceUpdate();
    return full;
  };

  const dismiss = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (ghostRef.current.length > 0) {
      ghostRef.current = "";
      forceUpdate();
    }
  };

  useCleanup(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  });

  return {
    ghost: ghostRef.current,
    accept,
    dismiss,
  };
}
