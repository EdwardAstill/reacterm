import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export interface AvatarProps extends StormTextStyleProps {
    name: string;
    size?: "small" | "large";
    /** Custom render for the initials display. */
    renderInitials?: (initials: string, size: string) => React.ReactNode;
}
export declare const Avatar: React.NamedExoticComponent<AvatarProps>;
//# sourceMappingURL=Avatar.d.ts.map