import React from "react";
export interface AnimatePresenceProps {
    children: React.ReactNode;
    /** Animation type for exiting children (default: "fade"). */
    exitType?: "fade" | "slide-up" | "collapse";
    /** Duration of the exit animation in milliseconds. */
    exitDuration?: number;
}
export declare const AnimatePresence: React.NamedExoticComponent<AnimatePresenceProps>;
//# sourceMappingURL=AnimatePresence.d.ts.map