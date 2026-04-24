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

// ── Module-scope builders ──────────────────────────────────────────────────
// Hoisted out of PanesImpl's render body so they aren't redefined per render.

type BorderCharSet = (typeof BORDER_CHARS)[Exclude<BorderStyle, "none">];
type JunctionSet = (typeof JUNCTIONS)[Exclude<BorderStyle, "none">];

interface PaneCtx {
  bc: BorderCharSet;
  jc: JunctionSet;
  col: string | number | undefined;
}

const charText = (ctx: PaneCtx, char: string, key: React.Key) =>
  React.createElement("tui-text", { key, color: ctx.col }, char);

const horizRow = (ctx: PaneCtx, leftChar: string, rightChar: string, key: React.Key) =>
  React.createElement(
    "tui-box",
    { key, flexShrink: 0, height: 1, flexDirection: "row" as const },
    charText(ctx, leftChar, "l"),
    React.createElement(
      "tui-box",
      { key: "m", flex: 1, overflow: "hidden" as const },
      React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.horizontal.repeat(FILL)),
    ),
    charText(ctx, rightChar, "r"),
  );

const vertCol = (ctx: PaneCtx, topChar: string, bottomChar: string, key: React.Key) =>
  React.createElement(
    "tui-box",
    { key, width: 1, flexShrink: 0, flexDirection: "column" as const },
    React.createElement("tui-box", { key: "t", height: 1, flexShrink: 0 },
      charText(ctx, topChar, "c"),
    ),
    React.createElement(
      "tui-box",
      { key: "m", flex: 1, overflow: "hidden" as const },
      React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.vertical.repeat(FILL)),
    ),
    React.createElement("tui-box", { key: "b", height: 1, flexShrink: 0 },
      charText(ctx, bottomChar, "c"),
    ),
  );

const fixedVertSegment = (ctx: PaneCtx, key: React.Key, height: number) =>
  React.createElement(
    "tui-box",
    { key, height, flexShrink: 0, overflow: "hidden" as const },
    React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.vertical.repeat(FILL)),
  );

const paneMainSize = (child: React.ReactElement<Record<string, unknown>>): number =>
  (typeof child.props["height"] === "number"
    ? child.props["height"]
    : typeof child.props["flexBasis"] === "number"
    ? child.props["flexBasis"]
    : (child.props["flex"] as number | undefined) ?? 1);

/** Same as paneMainSize but keyed off `width` instead of `height` — used when
 *  the main axis of the nested Panes is horizontal (row direction). */
const paneMainWidth = (child: React.ReactElement<Record<string, unknown>>): number =>
  (typeof child.props["width"] === "number"
    ? child.props["width"]
    : typeof child.props["flexBasis"] === "number"
    ? child.props["flexBasis"]
    : (child.props["flex"] as number | undefined) ?? 1);

const childFlex = (child: React.ReactElement<Record<string, unknown>>): number =>
  (child.props["flex"] as number | undefined) ?? 1;

/** Fixed-width horizontal fill segment (one column-wide in height=1). */
const fixedHorizSegment = (ctx: PaneCtx, key: React.Key, width: number) =>
  React.createElement(
    "tui-box",
    { key, width, flexShrink: 0, overflow: "hidden" as const, height: 1 },
    React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.horizontal.repeat(FILL)),
  );

const compoundVertCol = (
  ctx: PaneCtx,
  topChar: string,
  separatorChar: string | undefined,
  bottomChar: string,
  nestedKids: React.ReactElement<Record<string, unknown>>[],
  key: React.Key,
): React.ReactElement => {
  const useExactHeights = nestedKids.every(child =>
    child.props["height"] !== undefined || child.props["flexBasis"] !== undefined,
  );

  const parts: React.ReactNode[] = [
    React.createElement("tui-box", { key: "t", height: 1, flexShrink: 0 }, charText(ctx, topChar, "c")),
  ];
  nestedKids.forEach((child, i) => {
    if (useExactHeights) {
      parts.push(fixedVertSegment(ctx, `m${i}`, paneMainSize(child)));
    } else {
      parts.push(
        React.createElement(
          "tui-box",
          { key: `m${i}`, flexGrow: childFlex(child), flexShrink: 1, flexBasis: 0, overflow: "hidden" as const },
          React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.vertical.repeat(FILL)),
        ),
      );
    }
    if (i < nestedKids.length - 1) {
      parts.push(
        React.createElement("tui-box", { key: `s${i}`, height: 1, flexShrink: 0 },
          charText(ctx, separatorChar ?? ctx.bc.vertical, "c"),
        ),
      );
    }
  });
  parts.push(React.createElement("tui-box", { key: "b", height: 1, flexShrink: 0 }, charText(ctx, bottomChar, "c")));

  return React.createElement(
    "tui-box",
    { key, width: 1, height: "100%", flexShrink: 0, flexDirection: "column" as const },
    ...parts,
  );
};

/**
 * Height=1 horizontal row with left/right caps and a separator character at
 * each nested pane boundary — the symmetric counterpart of `compoundVertCol`.
 * Used when a column-direction Panes contains a row-direction nested Panes:
 * the cap/sep rows need ┬/┴ junctions wherever the nested row's vertical
 * separators meet the outer column's horizontal caps.
 */
const compoundHorizRow = (
  ctx: PaneCtx,
  leftChar: string,
  separatorChar: string | undefined,
  rightChar: string,
  nestedKids: React.ReactElement<Record<string, unknown>>[],
  key: React.Key,
): React.ReactElement => {
  const useExactWidths = nestedKids.every(child =>
    child.props["width"] !== undefined || child.props["flexBasis"] !== undefined,
  );

  const parts: React.ReactNode[] = [
    charText(ctx, leftChar, "l"),
  ];
  nestedKids.forEach((child, i) => {
    if (useExactWidths) {
      parts.push(fixedHorizSegment(ctx, `m${i}`, paneMainWidth(child)));
    } else {
      parts.push(
        React.createElement(
          "tui-box",
          { key: `m${i}`, flexGrow: childFlex(child), flexShrink: 1, flexBasis: 0, overflow: "hidden" as const, height: 1 },
          React.createElement("tui-text", { color: ctx.col, wrap: "wrap" as const }, ctx.bc.horizontal.repeat(FILL)),
        ),
      );
    }
    if (i < nestedKids.length - 1) {
      parts.push(
        React.createElement("tui-box", { key: `s${i}`, width: 1, flexShrink: 0 },
          charText(ctx, separatorChar ?? ctx.bc.horizontal, "c"),
        ),
      );
    }
  });
  parts.push(charText(ctx, rightChar, "r"));

  return React.createElement(
    "tui-box",
    { key, height: 1, flexShrink: 0, flexDirection: "row" as const },
    ...parts,
  );
};

const stripPanesProps = (child: React.ReactElement<Record<string, unknown>>) => {
  const {
    children: _children,
    direction: _direction,
    borderStyle: _borderStyle,
    borderColor: _borderColor,
    borderTop: _borderTop,
    borderBottom: _borderBottom,
    borderLeft: _borderLeft,
    borderRight: _borderRight,
    ...layoutProps
  } = child.props;
  return layoutProps;
};

const WRAPPER_LAYOUT_KEYS = [
  "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "flex", "flexGrow", "flexShrink", "flexBasis", "alignSelf",
] as const;

const wrapperLayoutProps = (child: React.ReactElement<Record<string, unknown>>) => {
  const out: Record<string, unknown> = {};
  for (const key of WRAPPER_LAYOUT_KEYS) {
    if (key in child.props) out[key] = child.props[key];
  }
  if (!("flex" in out) && !("flexGrow" in out) && !("flexBasis" in out)) {
    out.flex = 1;
  }
  return out;
};

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
function PanesImpl(rawProps: PanesProps): React.ReactElement {
  const props = usePluginProps("Panes", rawProps);
  const {
    children,
    direction = "row",
    borderStyle = "single",
    borderColor,
    borderTop = true,
    borderBottom = true,
    borderLeft = true,
    borderRight = true,
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
  const ctx: PaneCtx = { bc, jc, col };

  // Build a child's layout props for simple vs compound (nested) layouts. The
  // only difference is the fallback: simple uses shorthand `flex`, compound
  // expands to flexGrow/flexShrink/flexBasis:0 so a parent flexbox can
  // distribute leftover space evenly across nested rows.
  const buildPaneProps = (
    child: React.ReactElement<Record<string, unknown>>,
    i: number,
    mode: "simple" | "compound",
  ) => {
    const height = child.props["height"] as number | undefined;
    const flexBasis = child.props["flexBasis"] as number | undefined;
    const flexGrow = child.props["flexGrow"] as number | undefined;
    const flexShrink = child.props["flexShrink"] as number | undefined;
    const flex = child.props["flex"] as number | undefined;
    const fallback = mode === "simple"
      ? { flex: flex ?? 1 }
      : { flexGrow: flexGrow ?? flex ?? 1, flexShrink: flexShrink ?? 1, flexBasis: 0 };
    return {
      key: `p${i}`,
      borderStyle: child.props["borderStyle"] ?? borderStyle,
      borderColor: child.props["borderColor"] ?? borderColor,
      ...(height !== undefined
        ? { height, flexGrow: flexGrow ?? 0, flexShrink: flexShrink ?? 0 }
        : flexBasis !== undefined
        ? { flexBasis, flexGrow: flexGrow ?? flex ?? 0, flexShrink: flexShrink ?? 1 }
        : fallback),
    };
  };
  const paneProps = (child: React.ReactElement<Record<string, unknown>>, i: number) =>
    buildPaneProps(child, i, "simple");
  const compoundPaneProps = (child: React.ReactElement<Record<string, unknown>>, i: number) =>
    buildPaneProps(child, i, "compound");

  const renderNestedColumnContent = (
    nestedChild: React.ReactElement<Record<string, unknown>>,
    nestedKids: React.ReactElement<Record<string, unknown>>[],
    key: React.Key,
  ) => {
    const elements: React.ReactNode[] = [
      horizRow(ctx, bc.horizontal, bc.horizontal, "__top"),
    ];

    nestedKids.forEach((child, i) => {
      elements.push(
        React.cloneElement(child, {
          ...compoundPaneProps(child, i),
          borderLeft: false,
          borderRight: false,
          borderTop: false,
          borderBottom: false,
        }),
      );
      if (i < nestedKids.length - 1) {
        elements.push(horizRow(ctx, bc.horizontal, bc.horizontal, `__sep${i}`));
      }
    });
    elements.push(horizRow(ctx, bc.horizontal, bc.horizontal, "__bot"));

    return React.createElement(
      "tui-box",
      {
        key,
        height: "100%",
        flexDirection: "column" as const,
        overflow: "hidden" as const,
        ...stripPanesProps(nestedChild),
      },
      ...elements,
    );
  };

  const renderSinglePaneContent = (
    child: React.ReactElement<Record<string, unknown>>,
    key: React.Key,
  ) => React.createElement(
    "tui-box",
    {
      key,
      height: "100%",
      flexDirection: "column" as const,
      overflow: "hidden" as const,
      ...wrapperLayoutProps(child),
    },
    horizRow(ctx, bc.horizontal, bc.horizontal, "__top"),
    React.cloneElement(child, {
      borderLeft: false,
      borderRight: false,
      borderTop: false,
      borderBottom: false,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
    }),
    horizRow(ctx, bc.horizontal, bc.horizontal, "__bot"),
  );

  // ── Symmetric helpers for column + nested-row compound layout ───────────
  // Nested row content: horizontal flex with vertical fills at left/right
  // and vertical separators between nested kids. No top/bottom caps — those
  // are provided by the outer column's compound sep rows.
  const renderNestedRowContent = (
    nestedChild: React.ReactElement<Record<string, unknown>>,
    nestedKids: React.ReactElement<Record<string, unknown>>[],
    key: React.Key,
  ) => {
    const elements: React.ReactNode[] = [
      vertCol(ctx, bc.vertical, bc.vertical, "__left"),
    ];
    nestedKids.forEach((child, i) => {
      elements.push(
        React.cloneElement(child, {
          ...compoundPaneProps(child, i),
          borderLeft: false,
          borderRight: false,
          borderTop: false,
          borderBottom: false,
        }),
      );
      if (i < nestedKids.length - 1) {
        elements.push(vertCol(ctx, bc.vertical, bc.vertical, `__sep${i}`));
      }
    });
    elements.push(vertCol(ctx, bc.vertical, bc.vertical, "__right"));

    return React.createElement(
      "tui-box",
      {
        key,
        width: "100%",
        flexDirection: "row" as const,
        overflow: "hidden" as const,
        ...stripPanesProps(nestedChild),
      },
      ...elements,
    );
  };

  // Single pane that lives between two compound-horiz seps in a column
  // layout. Wrapped in a row with left/right vertical fills.
  const renderSinglePaneRowContent = (
    child: React.ReactElement<Record<string, unknown>>,
    key: React.Key,
  ) => React.createElement(
    "tui-box",
    {
      key,
      width: "100%",
      flexDirection: "row" as const,
      overflow: "hidden" as const,
      ...wrapperLayoutProps(child),
    },
    vertCol(ctx, bc.vertical, bc.vertical, "__left"),
    React.cloneElement(child, {
      borderLeft: false,
      borderRight: false,
      borderTop: false,
      borderBottom: false,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
    }),
    vertCol(ctx, bc.vertical, bc.vertical, "__right"),
  );

  // ── Compound: column-direction with a nested row-direction Panes ────────
  // Symmetric to the row+nested-column case below. Caps and seps are
  // height-1 compound horizontal rows with ┬/┴ junctions at each nested
  // pane's vertical boundary.
  if (direction === "column" && kids.length === 2) {
    const nestedIndex = kids.findIndex(child =>
      child.type === Panes && (child.props["direction"] ?? "row") === "row",
    );
    if (nestedIndex !== -1) {
      const nestedChild = kids[nestedIndex]!;
      const otherChild = kids[1 - nestedIndex]!;
      const nestedKids = React.Children.toArray(nestedChild.props["children"] as React.ReactNode).filter(
        React.isValidElement,
      ) as React.ReactElement<Record<string, unknown>>[];
      if (nestedKids.length > 1) {
        const nestedOnTop = nestedIndex === 0;
        const elements: React.ReactNode[] = [
          compoundHorizRow(
            ctx,
            bc.topLeft,
            nestedOnTop ? jc.top : undefined,
            bc.topRight,
            nestedKids,
            "__top",
          ),
        ];

        if (nestedOnTop) {
          elements.push(renderNestedRowContent(nestedChild, nestedKids, "p0"));
          elements.push(compoundHorizRow(ctx, jc.left, jc.bottom, jc.right, nestedKids, "__sep0"));
          elements.push(renderSinglePaneRowContent(otherChild, "p1"));
        } else {
          elements.push(renderSinglePaneRowContent(otherChild, "p0"));
          elements.push(compoundHorizRow(ctx, jc.left, jc.top, jc.right, nestedKids, "__sep0"));
          elements.push(renderNestedRowContent(nestedChild, nestedKids, "p1"));
        }

        elements.push(compoundHorizRow(
          ctx,
          bc.bottomLeft,
          nestedOnTop ? undefined : jc.bottom,
          bc.bottomRight,
          nestedKids,
          "__bot",
        ));

        return React.createElement(
          "tui-box",
          { flexDirection: "column" as const, overflow: "hidden" as const, ...containerProps },
          ...elements,
        );
      }
    }
  }

  if (direction === "row" && kids.length === 2) {
    const nestedIndex = kids.findIndex(child =>
      child.type === Panes && (child.props["direction"] ?? "row") === "column",
    );
    if (nestedIndex !== -1) {
      const nestedChild = kids[nestedIndex]!;
      const otherChild = kids[1 - nestedIndex]!;
      const nestedKids = React.Children.toArray(nestedChild.props["children"] as React.ReactNode).filter(
        React.isValidElement,
      ) as React.ReactElement<Record<string, unknown>>[];
      if (nestedKids.length > 1) {
        const nestedOnLeft = nestedIndex === 0;
        const elements: React.ReactNode[] = [
          compoundVertCol(
            ctx,
            bc.topLeft,
            nestedOnLeft ? jc.left : undefined,
            bc.bottomLeft,
            nestedKids,
            "__left",
          ),
        ];

        if (nestedOnLeft) {
          elements.push(renderNestedColumnContent(nestedChild, nestedKids, "p0"));
          elements.push(compoundVertCol(ctx, jc.top, jc.right, jc.bottom, nestedKids, "__sep0"));
          elements.push(renderSinglePaneContent(otherChild, "p1"));
        } else {
          elements.push(renderSinglePaneContent(otherChild, "p0"));
          elements.push(compoundVertCol(ctx, jc.top, jc.left, jc.bottom, nestedKids, "__sep0"));
          elements.push(renderNestedColumnContent(nestedChild, nestedKids, "p1"));
        }

        elements.push(compoundVertCol(
          ctx,
          bc.topRight,
          nestedOnLeft ? undefined : jc.right,
          bc.bottomRight,
          nestedKids,
          "__right",
        ));

        return React.createElement(
          "tui-box",
          { flexDirection: "row" as const, overflow: "hidden" as const, ...containerProps },
          ...elements,
        );
      }
    }
  }

  // ── Column layout ─────────────────────────────────────────────────────────
  // Each pane draws only left+right borders (│). Cap rows and separators draw
  // the horizontal lines with proper ┌┐ / ├┤ / └┘ junction characters.
  if (direction === "column") {
    const elements: React.ReactNode[] = [];
    if (borderTop) {
      elements.push(horizRow(ctx,
        borderLeft ? bc.topLeft : bc.horizontal,
        borderRight ? bc.topRight : bc.horizontal,
        "__top",
      ));
    }
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
        elements.push(horizRow(ctx,
          borderLeft ? jc.left : bc.horizontal,
          borderRight ? jc.right : bc.horizontal,
          `__sep${i}`,
        ));
      }
    });
    if (borderBottom) {
      elements.push(horizRow(ctx,
        borderLeft ? bc.bottomLeft : bc.horizontal,
        borderRight ? bc.bottomRight : bc.horizontal,
        "__bot",
      ));
    }

    return React.createElement(
      "tui-box",
      { flexDirection: "column" as const, overflow: "hidden" as const, ...containerProps },
      ...elements,
    );
  }

  // ── Row layout ────────────────────────────────────────────────────────────
  // Each pane draws only top+bottom borders (─). Cap columns and separators draw
  // the vertical lines with proper ┌└ / ┬┴ / ┐┘ junction characters.
  const elements: React.ReactNode[] = [];
  if (borderLeft) {
    elements.push(vertCol(ctx,
      borderTop ? bc.topLeft : bc.vertical,
      borderBottom ? bc.bottomLeft : bc.vertical,
      "__left",
    ));
  }
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
      elements.push(vertCol(ctx,
        borderTop ? jc.top : bc.vertical,
        borderBottom ? jc.bottom : bc.vertical,
        `__sep${i}`,
      ));
    }
  });
  if (borderRight) {
    elements.push(vertCol(ctx,
      borderTop ? bc.topRight : bc.vertical,
      borderBottom ? bc.bottomRight : bc.vertical,
      "__right",
    ));
  }

  return React.createElement(
    "tui-box",
    { flexDirection: "row" as const, overflow: "hidden" as const, ...containerProps },
    ...elements,
  );
}

(PanesImpl as any).__reactermPanes = true;

export const Panes = React.memo(PanesImpl);
(Panes as any).__reactermPanes = true;
