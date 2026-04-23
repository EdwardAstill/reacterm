import React from "react";
export interface ContentSwitcherProps {
    activeIndex: number;
    children: React.ReactNode;
    /** Transition effect when switching content. */
    transition?: "none" | "fade" | "slide";
}
export declare const ContentSwitcher: React.NamedExoticComponent<ContentSwitcherProps>;
//# sourceMappingURL=ContentSwitcher.d.ts.map