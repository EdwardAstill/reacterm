import React from "react";
import type { StormContainerStyleProps } from "../../styles/styleProps.js";
export interface ScrollViewProps extends StormContainerStyleProps {
    children?: React.ReactNode;
    scrollSpeed?: number;
    /** When true and user is at bottom, new content keeps them at bottom.
     *  @default false */
    stickToBottom?: boolean;
    /** Ref that receives the ScrollState — call scrollState.scrollToBottom() to force jump. */
    scrollStateRef?: React.MutableRefObject<ScrollState | null>;
    onScroll?: (scrollTop: number) => void;
    scrollbarThumbColor?: string | number;
    scrollbarTrackColor?: string | number;
    scrollbarChar?: string;
    scrollbarTrackChar?: string;
    /** Gutter columns between bordered content and the vertical scrollbar.
     *  Default: 1. Set to 0 for legacy compact behavior. */
    scrollbarGutter?: number;
    sticky?: boolean;
    stickyChildren?: boolean;
    /** Maximum number of children to render at once. When exceeded, automatic
     *  windowing kicks in so only children near the scroll position are laid out.
     *  Set to Infinity to disable windowing.
     *  @default 500 */
    maxRenderChildren?: number;
    /** Estimated height (rows) of each child element — used by windowing and
     *  snap-to-item to calculate which children are in view. Default: 1. */
    itemHeight?: number;
    /** When true, enable horizontal scrolling via Left/Right arrow keys and
     *  Shift+mouse-scroll. A horizontal scrollbar is rendered at the bottom
     *  when content overflows horizontally.
     *  @default false */
    horizontalScroll?: boolean;
    /** When true, scroll always lands on item boundaries (never mid-item).
     *  Requires itemHeight for calculation. Default: false. */
    snapToItem?: boolean;
}
export interface ScrollState {
    clampedTop: number;
    maxScroll: number;
    /** Horizontal scroll offset (clamped). Only tracked when horizontalScroll is enabled. */
    clampedLeft: number;
    /** Maximum horizontal scroll value. */
    maxHScroll: number;
    /** Call to force scroll to bottom on next render. */
    scrollToBottom: () => void;
    /** Scroll both axes so that the element with the given ID is visible.
     *  The element must be a direct or nested child with a matching _elementId prop. */
    scrollToElement: (id: string) => void;
}
export declare const ScrollView: React.NamedExoticComponent<ScrollViewProps>;
//# sourceMappingURL=ScrollView.d.ts.map