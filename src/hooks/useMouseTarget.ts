import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
import type { MouseEvent } from "../input/types.js";

let nextMouseTargetId = 0;

export interface UseMouseTargetOptions {
  id?: string;
  disabled?: boolean;
  onMouse?: (event: MouseEvent, localX: number, localY: number) => void;
}

export interface UseMouseTargetResult {
  focusId: string;
}

export function useMouseTarget(options: UseMouseTargetOptions = {}): UseMouseTargetResult {
  const { focus } = useTui();
  const idRef = useRef(options.id ?? `mouse-target-${nextMouseTargetId++}`);
  const onMouseRef = useRef(options.onMouse);
  onMouseRef.current = options.onMouse;
  const disabledRef = useRef(options.disabled ?? false);
  disabledRef.current = options.disabled ?? false;

  const registeredRef = useRef(false);
  if (!registeredRef.current) {
    registeredRef.current = true;
    focus.register({
      id: idRef.current,
      type: "input",
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      clickFocus: false,
      onMouse: (event, localX, localY) => {
        if (disabledRef.current) return;
        onMouseRef.current?.(event, localX, localY);
      },
    });
  }

  useCleanup(() => {
    focus.unregister(idRef.current);
  });

  return { focusId: idRef.current };
}
