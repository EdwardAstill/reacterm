import React from "react";
export interface TransitionTimingConfig {
    /** Duration in milliseconds. */
    duration?: number;
    /** Easing function name. */
    easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}
export interface TransitionProps {
    /** Whether the child is visible. */
    show: boolean;
    /** Enter transition timing overrides. */
    enter?: TransitionTimingConfig;
    /** Exit transition timing overrides. */
    exit?: TransitionTimingConfig;
    /** Animation type.
     * - "fade": toggle dim attribute
     * - "slide-down": animate marginTop from negative to 0
     * - "slide-up": animate marginTop from positive to 0
     * - "slide-right": animate paddingLeft from 0 to content width
     * - "collapse": animate height from 0 to content height
     */
    type?: "fade" | "slide-down" | "slide-up" | "slide-right" | "collapse";
    children: React.ReactNode;
}
export declare const Transition: React.NamedExoticComponent<TransitionProps>;
//# sourceMappingURL=Transition.d.ts.map