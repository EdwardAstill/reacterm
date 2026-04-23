import { useRef, useCallback, useState } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
let nextId = 0;
/**
 * Register this component as focusable and get focus state.
 * Side effect: registers with FocusManager on first render (not in useEffect).
 * Unregistration happens via useCleanup, not useEffect cleanup.
 */
export function useFocus(options = {}) {
    const { focus: fm, input } = useTui();
    const idRef = useRef(options.id ?? `focus-${nextId++}`);
    const id = idRef.current;
    const [, forceUpdate] = useState(0);
    const autoTab = options.autoTab !== false; // default true
    // Register with FocusManager eagerly — not in useEffect
    const registeredRef = useRef(false);
    const unsubRef = useRef(null);
    const unsubTabRef = useRef(null);
    if (!registeredRef.current) {
        registeredRef.current = true;
        fm.register({
            id,
            type: "input",
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            clickFocus: true,
            ...(options.tabIndex !== undefined ? { tabIndex: options.tabIndex } : {}),
            ...(options.group ? { groupId: options.group } : {}),
            ...(options.disabled ? { disabled: options.disabled } : {}),
        });
        if (options.autoFocus)
            fm.focus(id);
        unsubRef.current = fm.onChange(() => forceUpdate(n => n + 1));
        // Auto-register Tab handler when autoTab is enabled
        if (autoTab) {
            unsubTabRef.current = input.onKey((event) => {
                if (event.key === "tab") {
                    fm.handleTabKey(event.shift);
                }
            });
        }
    }
    useCleanup(() => {
        unsubRef.current?.();
        unsubTabRef.current?.();
    });
    const focus = useCallback(() => fm.focus(id), [fm, id]);
    return {
        isFocused: fm.isFocused(id),
        focus,
        focusRingStyle: fm.getFocusRingStyle(id),
    };
}
//# sourceMappingURL=useFocus.js.map