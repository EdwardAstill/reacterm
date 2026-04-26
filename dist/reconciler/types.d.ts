import type { LayoutProps, LayoutNode } from "../layout/engine.js";
import type { BorderStyle } from "../core/types.js";
export declare const TUI_BOX = "tui-box";
export declare const TUI_TEXT = "tui-text";
export declare const TUI_SCROLL_VIEW = "tui-scroll-view";
export declare const TUI_TEXT_INPUT = "tui-text-input";
export declare const TUI_OVERLAY = "tui-overlay";
export type TuiElementType = typeof TUI_BOX | typeof TUI_TEXT | typeof TUI_SCROLL_VIEW | typeof TUI_TEXT_INPUT | typeof TUI_OVERLAY;
export interface TuiBoxProps extends LayoutProps {
    borderStyle?: BorderStyle;
    borderColor?: string | number;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderDimColor?: boolean;
    borderTopDimColor?: boolean;
    borderBottomDimColor?: boolean;
    borderLeftDimColor?: boolean;
    borderRightDimColor?: boolean;
    backgroundColor?: string | number;
    /** Background pattern — painted into the buffer before children. */
    background?: BackgroundProp;
    opaque?: boolean;
    sticky?: boolean;
    stickyChildren?: boolean;
    zIndex?: number;
}
export interface TuiTextProps {
    color?: string | number;
    bgColor?: string | number;
    bold?: boolean;
    dim?: boolean;
    /** Alias for `dim` — applies dim attribute when true. */
    dimColor?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: "wrap" | "truncate" | "truncate-end" | "truncate-middle";
}
export interface TuiScrollViewProps extends LayoutProps {
    scrollTop?: number;
    scrollLeft?: number;
    horizontalScroll?: boolean;
    onScroll?: (scrollTop: number, maxScroll: number) => void;
    borderStyle?: BorderStyle;
    borderColor?: string | number;
    backgroundColor?: string | number;
    /** Gutter columns between bordered content and the vertical scrollbar.
     *  Default: 1. Set to 0 for legacy compact behavior. */
    scrollbarGutter?: number;
    opaque?: boolean;
    sticky?: boolean;
    stickyChildren?: boolean;
}
export interface TuiTextInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    cursorOffset?: number;
    focus?: boolean;
    color?: string | number;
    placeholderColor?: string | number;
}
export interface TuiOverlayProps extends Omit<LayoutProps, "position"> {
    visible?: boolean;
    position?: "center" | "bottom" | "top";
    borderStyle?: BorderStyle;
    borderColor?: string | number;
    zIndex?: number;
}
export type TuiProps = TuiBoxProps | TuiTextProps | TuiScrollViewProps | TuiTextInputProps | TuiOverlayProps;
export type BackgroundPreset = "dots" | "grid" | "crosshatch";
export interface BackgroundPattern {
    /** Preset or custom pattern */
    type: BackgroundPreset | "watermark" | "gradient" | "custom";
    /** Spacing between pattern characters. Default: 4 for dots, 6 for grid */
    spacing?: number;
    /** Custom character to use */
    char?: string;
    /** Pattern color. Uses theme dim color by default */
    color?: string;
    /** Render dimmed. Default: true */
    dim?: boolean;
    /** Text for watermark type */
    text?: string;
    /** Watermark mode: tile diagonally or center once. Default: "tile" */
    mode?: "tile" | "center";
    /** Gradient colors [from, to]. Applies to pattern chars OR fills cells for type "gradient" */
    gradient?: [string, string];
    /** Gradient direction. Default: "horizontal" */
    direction?: "horizontal" | "vertical" | "diagonal";
    /** Animate the background pattern. Default: false */
    animate?: boolean;
    /** Animation speed in ms. Default: 200 */
    animateSpeed?: number;
    /** Opacity 0-1. At < 1, blends background color with existing buffer content. Default: 1 */
    opacity?: number;
}
export type BackgroundProp = BackgroundPreset | BackgroundPattern;
export interface TuiElement {
    type: TuiElementType;
    props: Record<string, unknown>;
    children: Array<TuiElement | TuiTextNode>;
    parent: TuiElement | null;
    /** Layout result — computed during layout phase */
    layoutNode: LayoutNode;
    /** Cached styled runs for paint — invalidated on commitUpdate */
    _cachedRuns?: Array<{
        text: string;
        fg: number;
        bg: number;
        attrs: number;
        ulColor: number;
    }> | undefined;
    /** Version counter for cached runs invalidation */
    _cachedRunsVersion?: number | undefined;
    /** Per-element dirty flag — set when text-related props change */
    _runsDirty?: boolean | undefined;
}
export interface TuiTextNode {
    type: "TEXT_NODE";
    text: string;
    parent: TuiElement | null;
}
/** Ref target for imperative mutation. Set properties directly, then call requestRender(). */
export interface HostTextNode extends Pick<TuiTextNode, "text"> {
    scrollTop?: number;
    scrollLeft?: number;
    cursorOffset?: number;
    value?: string;
    _elementPositions?: unknown;
    _viewportHeight?: unknown;
    _viewportWidth?: unknown;
}
export declare function isTuiElement(node: TuiElement | TuiTextNode): node is TuiElement;
export declare function isTuiTextNode(node: TuiElement | TuiTextNode): node is TuiTextNode;
export interface TuiRoot {
    children: Array<TuiElement | TuiTextNode>;
    /** Callback triggered after React commits — triggers layout + paint + diff */
    onCommit: () => void;
}
export declare function createRoot(onCommit: () => void): TuiRoot;
export declare function createElement(type: TuiElementType, props: Record<string, unknown>): TuiElement;
export declare function createTextNode(initialText: string): TuiTextNode;
export declare function extractLayoutProps(type: TuiElementType, props: Record<string, unknown>): LayoutProps;
//# sourceMappingURL=types.d.ts.map