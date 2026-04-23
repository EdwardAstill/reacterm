import { useTui } from "../context/TuiContext.js";
export function useFocusManager() {
    const fm = useTui().focus;
    return {
        enableFocus: () => fm.enableFocus(),
        disableFocus: () => fm.disableFocus(),
        focus: (id) => fm.focus(id),
        focusNext: () => fm.cycleNext(),
        focusPrevious: () => fm.cyclePrev(),
        focusById: (id) => fm.focus(id),
        getFocusedId: () => fm.focused,
        trapFocus: (groupId) => fm.trapFocus(groupId),
        releaseFocus: () => fm.releaseFocus(),
        isTrapped: () => fm.isTrapped,
        activeGroup: () => fm.activeGroup,
        onFocusChange: (fn) => fm.onFocusChange(fn),
        handleTabKey: (shift) => fm.handleTabKey(shift),
        getFocusRingStyle: (id) => fm.getFocusRingStyle(id),
        setFocusRingStyle: (mode) => fm.setFocusRingStyle(mode),
    };
}
//# sourceMappingURL=useFocusManager.js.map