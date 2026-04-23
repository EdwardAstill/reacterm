import React from "react";
export interface DefinitionListItem {
    term: string;
    definition: React.ReactNode;
}
export interface DefinitionListProps {
    items: DefinitionListItem[];
    termColor?: string | number;
    layout?: "stacked" | "inline";
    /** Separator between items: "line" for a dim horizontal line, or undefined for none. */
    separator?: "line";
    /** Custom render for each term. */
    renderTerm?: (term: string) => React.ReactNode;
}
export declare const DefinitionList: React.NamedExoticComponent<DefinitionListProps>;
//# sourceMappingURL=DefinitionList.d.ts.map