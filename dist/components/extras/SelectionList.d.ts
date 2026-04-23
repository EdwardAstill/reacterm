import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SelectionListItem {
    label: string;
    value: string;
}
export interface SelectionListProps extends StormLayoutStyleProps {
    items: Array<{
        label: string;
        value: string;
    }>;
    selectedValues: string[];
    onChange?: (values: string[]) => void;
    checkColor?: string | number;
    highlightColor?: string | number;
    isFocused?: boolean;
    "aria-label"?: string;
    /** Custom renderer for each item. */
    renderItem?: (item: SelectionListItem, state: {
        isHighlighted: boolean;
        isSelected: boolean;
    }) => React.ReactNode;
}
export declare const SelectionList: React.NamedExoticComponent<SelectionListProps>;
//# sourceMappingURL=SelectionList.d.ts.map