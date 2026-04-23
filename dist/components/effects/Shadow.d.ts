import React from "react";
export interface ShadowProps {
    children: React.ReactNode;
    /** Shadow offset — number of characters for shadow thickness (default 1) */
    offset?: number;
    /** Shadow character (default "░") */
    char?: string;
    /** Shadow color (default very dim) */
    color?: string | number;
    /** Direction */
    direction?: "bottom-right" | "bottom" | "right";
    /** Width of the bottom shadow row in characters (default 20) */
    width?: number;
    /**
     * Explicit content width for the bottom shadow.
     * When provided, overrides `width` for a more accurate shadow sizing
     * that matches the actual content width.
     */
    contentWidth?: number;
}
export declare const Shadow: React.NamedExoticComponent<ShadowProps>;
//# sourceMappingURL=Shadow.d.ts.map