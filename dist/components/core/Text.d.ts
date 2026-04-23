import React from "react";
export interface TextProps {
    children?: React.ReactNode;
    color?: string | number;
    bgColor?: string | number;
    /** Alias for `bgColor` — applies background color. */
    backgroundColor?: string | number;
    bold?: boolean;
    dim?: boolean;
    /** Alias for `dim` — applies dim attribute when true. */
    dimColor?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: "wrap" | "truncate" | "truncate-start" | "truncate-end" | "truncate-middle";
    /** Text alignment — implemented via a wrapper box with justifyContent. */
    align?: "left" | "center" | "right";
    "aria-label"?: string;
    "aria-hidden"?: boolean;
}
export declare const Text: React.NamedExoticComponent<TextProps>;
//# sourceMappingURL=Text.d.ts.map