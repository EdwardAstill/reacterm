/**
 * Layout engine — flexbox-like constraint solver for terminal UI.
 *
 * Supports vertical/horizontal flex, fixed/percentage sizes, padding,
 * gap, alignItems, justifyContent, and overflow clipping.
 * Pure TypeScript, fast and predictable.
 */
export type FlexDirection = "column" | "row";
export type FlexWrap = "nowrap" | "wrap";
export type Align = "start" | "center" | "end" | "stretch" | "baseline";
export type AlignSelf = Align | "auto";
export type Justify = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
export type AlignContent = "flex-start" | "flex-end" | "center" | "stretch" | "space-between" | "space-around";
export type Overflow = "visible" | "hidden" | "scroll";
export type Display = "flex" | "grid" | "none";
export type GridAutoFlow = "row" | "column" | "dense";
export type Position = "relative" | "absolute";
export interface LayoutProps {
    width?: number | `${number}%` | "auto" | "min-content" | "max-content";
    height?: number | `${number}%` | "auto" | "min-content" | "max-content";
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    flex?: number;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | `${number}%`;
    flexDirection?: FlexDirection;
    flexWrap?: FlexWrap;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    margin?: number | "auto";
    marginX?: number | "auto";
    marginY?: number | "auto";
    marginTop?: number | "auto";
    marginBottom?: number | "auto";
    marginLeft?: number | "auto";
    marginRight?: number | "auto";
    gap?: number;
    columnGap?: number;
    rowGap?: number;
    alignItems?: Align;
    alignContent?: AlignContent;
    alignSelf?: AlignSelf;
    justifyContent?: Justify;
    overflow?: Overflow;
    overflowX?: Overflow;
    overflowY?: Overflow;
    scrollbarGutter?: number;
    display?: Display;
    position?: Position;
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    order?: number;
    aspectRatio?: number;
    direction?: "ltr" | "rtl";
    /** Grid layout properties */
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    gridColumn?: string;
    gridRow?: string;
    gridGap?: number;
    gridAutoFlow?: GridAutoFlow;
}
export interface LayoutResult {
    x: number;
    y: number;
    width: number;
    height: number;
    innerX: number;
    innerY: number;
    innerWidth: number;
    innerHeight: number;
    /** Total content height (may exceed innerHeight for scroll) */
    contentHeight: number;
    /** Total content width */
    contentWidth: number;
}
export interface LayoutNode {
    props: LayoutProps;
    children: LayoutNode[];
    /** Set by layout computation */
    layout: LayoutResult;
    /** For text nodes: measured height given a width */
    measureText?: (availableWidth: number) => {
        width: number;
        height: number;
    };
    /** Whether this node needs re-layout. Set by buildLayoutTree, cleared by computeLayout. */
    dirty?: boolean;
    /** Cached props reference from the last layout pass. */
    _prevProps?: LayoutProps;
    /** Cached available width from the last layout pass. */
    _prevWidth?: number;
    /** Cached available height from the last layout pass. */
    _prevHeight?: number;
    /** Cached child count from the last buildLayoutTree pass. */
    _prevChildCount?: number;
    _prevChildren?: LayoutNode[];
}
/**
 * Resolve flexbox constraints for the full tree, mutating each node's `.layout` in place.
 * Incremental: skips clean subtrees when props and constraints haven't changed.
 */
export declare function computeLayout(node: LayoutNode, x: number, y: number, availableWidth: number, availableHeight: number): void;
/**
 * Compute the natural height of a node tree given a width constraint.
 * Used for measuring content size before final layout.
 */
export declare function measureNaturalHeight(node: LayoutNode, availableWidth: number): number;
/**
 * Compute the natural width of a node tree given a height constraint.
 * Used for row-direction natural sizing.
 */
export declare function measureNaturalWidth(node: LayoutNode, availableHeight: number): number;
//# sourceMappingURL=engine.d.ts.map