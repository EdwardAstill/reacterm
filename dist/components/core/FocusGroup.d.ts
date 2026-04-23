import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface FocusGroupProps extends StormContainerStyleProps {
    children?: React.ReactNode;
    /** Unique ID for this focus group. Auto-generated if not provided. */
    id?: string;
    /**
     * When true, Tab cycling is trapped within this group.
     * Focus cannot escape to elements outside the group via Tab/Shift+Tab.
     * Calls `focusManager.trapFocus(groupId)` on mount and
     * `focusManager.releaseFocus()` on unmount.
     */
    trap?: boolean;
    /** Navigation direction: "vertical" uses Up/Down, "horizontal" uses Left/Right. */
    direction?: "vertical" | "horizontal";
    /** Called when the focused index changes (arrow nav mode). */
    onFocusChange?: (index: number) => void;
    /** Whether the group is interactive (default true). */
    isActive?: boolean;
}
export declare const FocusGroup: React.NamedExoticComponent<FocusGroupProps>;
//# sourceMappingURL=FocusGroup.d.ts.map