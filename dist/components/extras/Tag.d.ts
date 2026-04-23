import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export interface TagProps extends StormTextStyleProps {
    label: string;
    variant?: "filled" | "outlined";
    onRemove?: () => void;
    isFocused?: boolean;
    /** Custom render for the tag label. */
    renderLabel?: (label: string, variant: string) => React.ReactNode;
}
export declare const Tag: React.NamedExoticComponent<TagProps>;
//# sourceMappingURL=Tag.d.ts.map