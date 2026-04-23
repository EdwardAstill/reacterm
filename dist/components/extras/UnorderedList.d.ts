import React from "react";
export type ItemStatus = "success" | "error" | "pending" | "running";
export type ListItem = React.ReactNode | {
    content: React.ReactNode;
    children?: ListItem[];
    /** Per-item icon (overrides global icon and default marker). */
    icon?: string;
    /** Status indicator: success=green check, error=red x, pending=dim circle, running=spinner. */
    status?: ItemStatus;
};
export interface UnorderedListProps {
    items: ListItem[];
    marker?: string;
    color?: string | number;
    markerColor?: string | number;
    /** Global icon for all items (overridden by per-item icon). */
    icon?: string;
    /** Custom renderer for each list item. */
    renderItem?: (item: string | React.ReactNode, index: number, marker: string) => React.ReactNode;
}
export declare const UnorderedList: React.NamedExoticComponent<UnorderedListProps>;
//# sourceMappingURL=UnorderedList.d.ts.map