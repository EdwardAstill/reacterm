import React from "react";
export type ListItem = React.ReactNode | {
    content: React.ReactNode;
    children?: ListItem[];
};
export type NumberingStyle = "decimal" | "alpha" | "Alpha" | "roman" | "Roman";
export interface OrderedListProps {
    items: ListItem[];
    start?: number;
    color?: string | number;
    numberColor?: string | number;
    /** Numbering style: "decimal" (default), "alpha", "Alpha", "roman", "Roman". */
    style?: NumberingStyle;
    /** When true, numbers count down instead of up. */
    reversed?: boolean;
    /** Custom renderer for each list item. */
    renderItem?: (item: string | React.ReactNode, index: number, numbering: string) => React.ReactNode;
}
export declare const OrderedList: React.NamedExoticComponent<OrderedListProps>;
//# sourceMappingURL=OrderedList.d.ts.map