import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
import type { BackgroundProp } from "../../reconciler/types.js";
export interface BoxProps extends StormContainerStyleProps {
    children?: React.ReactNode;
    /** Background pattern — painted into the buffer before children. */
    background?: BackgroundProp;
    sticky?: boolean;
    stickyChildren?: boolean;
    userSelect?: boolean;
    "aria-label"?: string;
    "aria-hidden"?: boolean;
}
export declare const Box: React.NamedExoticComponent<BoxProps>;
//# sourceMappingURL=Box.d.ts.map