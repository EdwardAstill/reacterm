import type { FocusChangeCallback, FocusRingMode, FocusRingStyle } from "../core/focus.js";
export interface UseFocusManagerResult {
    enableFocus: () => void;
    disableFocus: () => void;
    focusNext: () => void;
    focusPrevious: () => void;
    focus: (id: string) => void;
    focusById: (id: string) => void;
    getFocusedId: () => string | null;
    trapFocus: (groupId: string) => void;
    releaseFocus: () => void;
    isTrapped: () => boolean;
    activeGroup: () => string | null;
    /**
     * Register a callback that fires on every focus change with (newId, previousId).
     * Returns an unsubscribe function.
     */
    onFocusChange: (fn: FocusChangeCallback) => () => void;
    handleTabKey: (shift: boolean) => void;
    getFocusRingStyle: (id: string) => FocusRingStyle | null;
    setFocusRingStyle: (mode: FocusRingMode) => void;
}
export declare function useFocusManager(): UseFocusManagerResult;
//# sourceMappingURL=useFocusManager.d.ts.map