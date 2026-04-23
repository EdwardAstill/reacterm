import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface PaginatorProps extends StormLayoutStyleProps {
    total: number;
    current: number;
    style?: "dots" | "numbers" | "fraction";
    onPageChange?: (page: number) => void;
    isFocused?: boolean;
    /** Custom render for each page indicator. */
    renderPage?: (page: number, state: {
        isActive: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const Paginator: React.NamedExoticComponent<PaginatorProps>;
//# sourceMappingURL=Paginator.d.ts.map