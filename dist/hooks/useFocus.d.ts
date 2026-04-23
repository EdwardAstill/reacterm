import type { FocusRingStyle } from "../core/focus.js";
export interface UseFocusOptions {
    /** Unique ID for this focusable (auto-generated if not provided) */
    id?: string;
    /** Start focused (default: false) */
    autoFocus?: boolean;
    /** Numeric tab order — lower values receive focus first. Default: registration order. */
    tabIndex?: number;
    /** Focus group this entry belongs to. Used with FocusGroup trap. */
    group?: string;
    /** When true, this entry is skipped by Tab cycling. */
    disabled?: boolean;
    /**
     * When true (the default), the hook registers a key listener for
     * Tab / Shift+Tab that calls focusManager.handleTabKey(shift).
     * Set to false if you handle Tab yourself or want to suppress cycling.
     */
    autoTab?: boolean;
}
export interface UseFocusResult {
    isFocused: boolean;
    focus: () => void;
    /** Focus ring style for this element, or null if not focused / ring disabled. */
    focusRingStyle: FocusRingStyle | null;
}
/**
 * Register this component as focusable and get focus state.
 * Side effect: registers with FocusManager on first render (not in useEffect).
 * Unregistration happens via useCleanup, not useEffect cleanup.
 */
export declare function useFocus(options?: UseFocusOptions): UseFocusResult;
//# sourceMappingURL=useFocus.d.ts.map