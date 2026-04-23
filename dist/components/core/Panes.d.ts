import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import type { BorderStyle } from "../../core/types.js";
import type { BoxProps } from "./Box.js";
/** Props for an individual pane. Border-side props are managed by Panes. */
export type PaneProps = Omit<BoxProps, "borderLeft" | "borderRight" | "borderTop" | "borderBottom">;
export interface PanesProps extends StormLayoutStyleProps {
    children?: React.ReactNode;
    /** Layout axis. Default: "row". */
    direction?: "row" | "column";
    /** Border style applied to every pane (can be overridden per-pane). Default: "single". */
    borderStyle?: BorderStyle;
    /** Border color applied to every pane (can be overridden per-pane). */
    borderColor?: string | number;
    /** Border side controls used by parent Panes when nesting split layouts. */
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
}
/**
 * A single pane inside a Panes layout. Border-side props are injected automatically
 * by the parent Panes component.
 */
export declare const Pane: React.NamedExoticComponent<PaneProps>;
/**
 * Lays out children side-by-side (row) or stacked (column) with proper T-junction
 * characters (┬ ┴ ├ ┤) at every pane boundary, producing a single connected border
 * with no double lines or disconnected corners.
 *
 * Row layout:
 *   ┌──────┬──────────────────┬──────┐
 *   │Left  │Middle            │Right │
 *   └──────┴──────────────────┴──────┘
 *
 * Column layout:
 *   ┌──────────────────────┐
 *   │Top                   │
 *   ├──────────────────────┤
 *   │Bottom                │
 *   └──────────────────────┘
 *
 * @example
 * <Panes direction="row" borderStyle="single">
 *   <Pane flex={1}>left</Pane>
 *   <Pane flex={2}>right</Pane>
 * </Panes>
 */
declare function PanesImpl(rawProps: PanesProps): React.ReactElement;
export declare const Panes: React.MemoExoticComponent<typeof PanesImpl>;
export {};
//# sourceMappingURL=Panes.d.ts.map