import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
import type { BorderStyle } from "../../core/types.js";
import { BORDER_CHARS } from "../../core/types.js";
import type { BoxProps } from "./Box.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";

// T-junction characters for each border style (not stored in BORDER_CHARS)
const JUNCTIONS: Record<Exclude<BorderStyle, "none">, {
  top: string; bottom: string; left: string; right: string;
}> = {
  single: { top: "┬", bottom: "┴", left: "├", right: "┤" },
  double: { top: "╦", bottom: "╩", left: "╠", right: "╣" },
  heavy:  { top: "┳", bottom: "┻", left: "┣", right: "┫" },
  round:  { top: "┬", bottom: "┴", left: "├", right: "┤" },
  ascii:  { top: "+", bottom: "+", left: "+", right: "+" },
  storm:  { top: "┳", bottom: "┻", left: "┣", right: "┫" },
};

const FILL = 500;

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
}

/**
 * A single pane inside a Panes layout. Border-side props are injected automatically
 * by the parent Panes component.
 */
export const Pane = React.memo(function Pane(props: PaneProps): React.ReactElement {
  const { children, ...rest } = props;
  return React.createElement("tui-box", rest as any, children);
});

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
export const Panes = React.memo(function Panes(rawProps: PanesProps): React.ReactElement {
  const props = usePluginProps("Panes", rawProps);
  const {
    children,
    direction = "row",
    borderStyle = "single",
    borderColor,
    ...containerProps
  } = props;

  const kids = React.Children.toArray(children).filter(
    React.isValidElement,
  ) as React.ReactElement<Record<string, unknown>>[];

  if (borderStyle === "none" || kids.length === 0) {
    return React.createElement(
      "tui-box",
      { flexDirection: direction, overflow: "hidden" as const, ...containerProps },
      ...kids.map((child: React.ReactElement<Record<string, unknown>>, i: number) =>
        React.cloneElement(child, { key: i }),
      ),
    );
  }

  const bc = BORDER_CHARS[borderStyle as Exclude<BorderStyle, "none">];
  const jc = JUNCTIONS[borderStyle as Exclude<BorderStyle, "none">];
  const col = borderColor;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const charText = (char: string, key: React.Key) =>
    React.createElement("tui-text", { key, color: col }, char);

  // height=1 row with left-char + ─ fill + right-char
  const horizRow = (leftChar: string, rightChar: string, key: React.Key) =>
    React.createElement(
      "tui-box",
      { key, flexShrink: 0, height: 1, flexDirection: "row" as const },
      charText(leftChar, "l"),
      React.createElement(
        "tui-box",
        { key: "m", flex: 1, overflow: "hidden" as const },
        React.createElement("tui-text", { color: col, wrap: "wrap" as const }, bc.horizontal.repeat(FILL)),
      ),
      charText(rightChar, "r"),
    );

  // width=1 column with top-char + │ fill + bottom-char
  const vertCol = (topChar: string, bottomChar: string, key: React.Key) =>
    React.createElement(
      "tui-box",
      { key, width: 1, flexShrink: 0, flexDirection: "column" as const },
      React.createElement("tui-box", { key: "t", height: 1, flexShrink: 0 },
        charText(topChar, "c"),
      ),
      React.createElement(
        "tui-box",
        { key: "m", flex: 1, overflow: "hidden" as const },
        React.createElement("tui-text", { color: col, wrap: "wrap" as const }, bc.vertical.repeat(FILL)),
      ),
      React.createElement("tui-box", { key: "b", height: 1, flexShrink: 0 },
        charText(bottomChar, "c"),
      ),
    );

  const paneProps = (child: React.ReactElement<Record<string, unknown>>, i: number) => ({
    key: `p${i}`,
    borderStyle: child.props["borderStyle"] ?? borderStyle,
    borderColor: child.props["borderColor"] ?? borderColor,
    flex: child.props["flex"] ?? 1,
  });

  // ── Column layout ─────────────────────────────────────────────────────────
  // Each pane draws only left+right borders (│). Cap rows and separators draw
  // the horizontal lines with proper ┌┐ / ├┤ / └┘ junction characters.
  if (direction === "column") {
    const elements: React.ReactNode[] = [
      horizRow(bc.topLeft, bc.topRight, "__top"),
    ];
    kids.forEach((child, i) => {
      elements.push(
        React.cloneElement(child, {
          ...paneProps(child, i),
          borderLeft: true,
          borderRight: true,
          borderTop: false,
          borderBottom: false,
        }),
      );
      if (i < kids.length - 1) {
        elements.push(horizRow(jc.left, jc.right, `__sep${i}`));
      }
    });
    elements.push(horizRow(bc.bottomLeft, bc.bottomRight, "__bot"));

    return React.createElement(
      "tui-box",
      { flexDirection: "column" as const, overflow: "hidden" as const, ...containerProps },
      ...elements,
    );
  }

  // ── Row layout ────────────────────────────────────────────────────────────
  // Each pane draws only top+bottom borders (─). Cap columns and separators draw
  // the vertical lines with proper ┌└ / ┬┴ / ┐┘ junction characters.
  const elements: React.ReactNode[] = [
    vertCol(bc.topLeft, bc.bottomLeft, "__left"),
  ];
  kids.forEach((child, i) => {
    elements.push(
      React.cloneElement(child, {
        ...paneProps(child, i),
        borderLeft: false,
        borderRight: false,
        borderTop: true,
        borderBottom: true,
      }),
    );
    if (i < kids.length - 1) {
      elements.push(vertCol(jc.top, jc.bottom, `__sep${i}`));
    }
  });
  elements.push(vertCol(bc.topRight, bc.bottomRight, "__right"));

  return React.createElement(
    "tui-box",
    { flexDirection: "row" as const, overflow: "hidden" as const, ...containerProps },
    ...elements,
  );
});
