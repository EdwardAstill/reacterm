import React from "react";
export type PlaceholderShape = "rectangle" | "text" | "circle" | "card";
export interface PlaceholderProps {
    width?: number;
    height?: number;
    label?: string;
    color?: string | number;
    /** When true, animates the dot pattern with a shimmer effect. */
    loading?: boolean;
    /** Shape of the placeholder skeleton. Default "rectangle". */
    shape?: PlaceholderShape;
}
export declare const Placeholder: React.NamedExoticComponent<PlaceholderProps>;
//# sourceMappingURL=Placeholder.d.ts.map