import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SelectInputItem {
    label: string;
    value: string;
}
export interface SelectInputProps extends StormLayoutStyleProps {
    items: SelectInputItem[];
    onSelect: (item: SelectInputItem) => void;
    onHighlight?: (item: SelectInputItem) => void;
    initialIndex?: number;
    isFocused?: boolean;
    /** Max visible items. Scrolls when items exceed this. */
    maxVisible?: number;
    "aria-label"?: string;
    /** Custom renderer for each item. */
    renderItem?: (item: SelectInputItem, state: {
        isHighlighted: boolean;
        index: number;
    }) => React.ReactNode;
}
export declare const SelectInput: React.NamedExoticComponent<SelectInputProps>;
//# sourceMappingURL=SelectInput.d.ts.map