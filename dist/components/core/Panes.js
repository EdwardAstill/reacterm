import React from "react";
import { BORDER_CHARS } from "../../core/types.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
// T-junction characters for each border style (not stored in BORDER_CHARS)
const JUNCTIONS = {
    single: { top: "┬", bottom: "┴", left: "├", right: "┤" },
    double: { top: "╦", bottom: "╩", left: "╠", right: "╣" },
    heavy: { top: "┳", bottom: "┻", left: "┣", right: "┫" },
    round: { top: "┬", bottom: "┴", left: "├", right: "┤" },
    ascii: { top: "+", bottom: "+", left: "+", right: "+" },
    storm: { top: "┳", bottom: "┻", left: "┣", right: "┫" },
};
const FILL = 500;
/**
 * A single pane inside a Panes layout. Border-side props are injected automatically
 * by the parent Panes component.
 */
export const Pane = React.memo(function Pane(props) {
    const { children, ...rest } = props;
    return React.createElement("tui-box", rest, children);
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
function PanesImpl(rawProps) {
    const props = usePluginProps("Panes", rawProps);
    const { children, direction = "row", borderStyle = "single", borderColor, borderTop = true, borderBottom = true, borderLeft = true, borderRight = true, ...containerProps } = props;
    const kids = React.Children.toArray(children).filter(React.isValidElement);
    if (borderStyle === "none" || kids.length === 0) {
        return React.createElement("tui-box", { flexDirection: direction, overflow: "hidden", ...containerProps }, ...kids.map((child, i) => React.cloneElement(child, { key: i })));
    }
    const bc = BORDER_CHARS[borderStyle];
    const jc = JUNCTIONS[borderStyle];
    const col = borderColor;
    // ── Helpers ──────────────────────────────────────────────────────────────
    const charText = (char, key) => React.createElement("tui-text", { key, color: col }, char);
    // height=1 row with left-char + ─ fill + right-char
    const horizRow = (leftChar, rightChar, key) => React.createElement("tui-box", { key, flexShrink: 0, height: 1, flexDirection: "row" }, charText(leftChar, "l"), React.createElement("tui-box", { key: "m", flex: 1, overflow: "hidden" }, React.createElement("tui-text", { color: col, wrap: "wrap" }, bc.horizontal.repeat(FILL))), charText(rightChar, "r"));
    // width=1 column with top-char + │ fill + bottom-char
    const vertCol = (topChar, bottomChar, key) => React.createElement("tui-box", { key, width: 1, flexShrink: 0, flexDirection: "column" }, React.createElement("tui-box", { key: "t", height: 1, flexShrink: 0 }, charText(topChar, "c")), React.createElement("tui-box", { key: "m", flex: 1, overflow: "hidden" }, React.createElement("tui-text", { color: col, wrap: "wrap" }, bc.vertical.repeat(FILL))), React.createElement("tui-box", { key: "b", height: 1, flexShrink: 0 }, charText(bottomChar, "c")));
    const paneMainSize = (child) => (typeof child.props["height"] === "number"
        ? child.props["height"]
        : typeof child.props["flexBasis"] === "number"
            ? child.props["flexBasis"]
            : child.props["flex"] ?? 1);
    const paneProps = (child, i) => {
        const height = child.props["height"];
        const flexBasis = child.props["flexBasis"];
        const flexGrow = child.props["flexGrow"];
        const flexShrink = child.props["flexShrink"];
        const flex = child.props["flex"];
        return {
            key: `p${i}`,
            borderStyle: child.props["borderStyle"] ?? borderStyle,
            borderColor: child.props["borderColor"] ?? borderColor,
            ...(height !== undefined
                ? { height, flexGrow: flexGrow ?? 0, flexShrink: flexShrink ?? 0 }
                : flexBasis !== undefined
                    ? { flexBasis, flexGrow: flexGrow ?? flex ?? 0, flexShrink: flexShrink ?? 1 }
                    : { flex: flex ?? 1 }),
        };
    };
    const compoundPaneProps = (child, i) => {
        const height = child.props["height"];
        const flexBasis = child.props["flexBasis"];
        const flexGrow = child.props["flexGrow"];
        const flexShrink = child.props["flexShrink"];
        const flex = child.props["flex"];
        return {
            key: `p${i}`,
            borderStyle: child.props["borderStyle"] ?? borderStyle,
            borderColor: child.props["borderColor"] ?? borderColor,
            ...(height !== undefined
                ? { height, flexGrow: flexGrow ?? 0, flexShrink: flexShrink ?? 0 }
                : flexBasis !== undefined
                    ? { flexBasis, flexGrow: flexGrow ?? flex ?? 0, flexShrink: flexShrink ?? 1 }
                    : { flexGrow: flexGrow ?? flex ?? 1, flexShrink: flexShrink ?? 1, flexBasis: 0 }),
        };
    };
    const childFlex = (child) => child.props["flex"] ?? 1;
    const fixedVertSegment = (key, height) => React.createElement("tui-box", { key, height, flexShrink: 0, overflow: "hidden" }, React.createElement("tui-text", { color: col, wrap: "wrap" }, bc.vertical.repeat(FILL)));
    const compoundVertCol = (topChar, separatorChar, bottomChar, nestedKids, key) => {
        const useExactHeights = nestedKids.every(child => child.props["height"] !== undefined || child.props["flexBasis"] !== undefined);
        const parts = [
            React.createElement("tui-box", { key: "t", height: 1, flexShrink: 0 }, charText(topChar, "c")),
        ];
        nestedKids.forEach((child, i) => {
            if (useExactHeights) {
                parts.push(fixedVertSegment(`m${i}`, paneMainSize(child)));
            }
            else {
                parts.push(React.createElement("tui-box", { key: `m${i}`, flexGrow: childFlex(child), flexShrink: 1, flexBasis: 0, overflow: "hidden" }, React.createElement("tui-text", { color: col, wrap: "wrap" }, bc.vertical.repeat(FILL))));
            }
            if (i < nestedKids.length - 1) {
                parts.push(React.createElement("tui-box", { key: `s${i}`, height: 1, flexShrink: 0 }, charText(separatorChar ?? bc.vertical, "c")));
            }
        });
        parts.push(React.createElement("tui-box", { key: "b", height: 1, flexShrink: 0 }, charText(bottomChar, "c")));
        return React.createElement("tui-box", { key, width: 1, height: "100%", flexShrink: 0, flexDirection: "column" }, ...parts);
    };
    const stripPanesProps = (child) => {
        const { children: _children, direction: _direction, borderStyle: _borderStyle, borderColor: _borderColor, borderTop: _borderTop, borderBottom: _borderBottom, borderLeft: _borderLeft, borderRight: _borderRight, ...layoutProps } = child.props;
        return layoutProps;
    };
    const wrapperLayoutProps = (child) => {
        const keys = [
            "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
            "flex", "flexGrow", "flexShrink", "flexBasis", "alignSelf",
        ];
        const out = {};
        for (const key of keys) {
            if (key in child.props)
                out[key] = child.props[key];
        }
        if (!("flex" in out) && !("flexGrow" in out) && !("flexBasis" in out)) {
            out.flex = 1;
        }
        return out;
    };
    const renderNestedColumnContent = (nestedChild, nestedKids, key) => {
        const elements = [
            horizRow(bc.horizontal, bc.horizontal, "__top"),
        ];
        nestedKids.forEach((child, i) => {
            elements.push(React.cloneElement(child, {
                ...compoundPaneProps(child, i),
                borderLeft: false,
                borderRight: false,
                borderTop: false,
                borderBottom: false,
            }));
            if (i < nestedKids.length - 1) {
                elements.push(horizRow(bc.horizontal, bc.horizontal, `__sep${i}`));
            }
        });
        elements.push(horizRow(bc.horizontal, bc.horizontal, "__bot"));
        return React.createElement("tui-box", {
            key,
            height: "100%",
            flexDirection: "column",
            overflow: "hidden",
            ...stripPanesProps(nestedChild),
        }, ...elements);
    };
    const renderSinglePaneContent = (child, key) => React.createElement("tui-box", {
        key,
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        ...wrapperLayoutProps(child),
    }, horizRow(bc.horizontal, bc.horizontal, "__top"), React.cloneElement(child, {
        borderLeft: false,
        borderRight: false,
        borderTop: false,
        borderBottom: false,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    }), horizRow(bc.horizontal, bc.horizontal, "__bot"));
    if (direction === "row" && kids.length === 2) {
        const nestedIndex = kids.findIndex(child => child.type === Panes && (child.props["direction"] ?? "row") === "column");
        if (nestedIndex !== -1) {
            const nestedChild = kids[nestedIndex];
            const otherChild = kids[1 - nestedIndex];
            const nestedKids = React.Children.toArray(nestedChild.props["children"]).filter(React.isValidElement);
            if (nestedKids.length > 1) {
                const nestedOnLeft = nestedIndex === 0;
                const elements = [
                    compoundVertCol(bc.topLeft, nestedOnLeft ? jc.left : undefined, bc.bottomLeft, nestedKids, "__left"),
                ];
                if (nestedOnLeft) {
                    elements.push(renderNestedColumnContent(nestedChild, nestedKids, "p0"));
                    elements.push(compoundVertCol(jc.top, jc.right, jc.bottom, nestedKids, "__sep0"));
                    elements.push(renderSinglePaneContent(otherChild, "p1"));
                }
                else {
                    elements.push(renderSinglePaneContent(otherChild, "p0"));
                    elements.push(compoundVertCol(jc.top, jc.left, jc.bottom, nestedKids, "__sep0"));
                    elements.push(renderNestedColumnContent(nestedChild, nestedKids, "p1"));
                }
                elements.push(compoundVertCol(bc.topRight, nestedOnLeft ? undefined : jc.right, bc.bottomRight, nestedKids, "__right"));
                return React.createElement("tui-box", { flexDirection: "row", overflow: "hidden", ...containerProps }, ...elements);
            }
        }
    }
    // ── Column layout ─────────────────────────────────────────────────────────
    // Each pane draws only left+right borders (│). Cap rows and separators draw
    // the horizontal lines with proper ┌┐ / ├┤ / └┘ junction characters.
    if (direction === "column") {
        const elements = [];
        if (borderTop) {
            elements.push(horizRow(borderLeft ? bc.topLeft : bc.horizontal, borderRight ? bc.topRight : bc.horizontal, "__top"));
        }
        kids.forEach((child, i) => {
            elements.push(React.cloneElement(child, {
                ...paneProps(child, i),
                borderLeft: true,
                borderRight: true,
                borderTop: false,
                borderBottom: false,
            }));
            if (i < kids.length - 1) {
                elements.push(horizRow(borderLeft ? jc.left : bc.horizontal, borderRight ? jc.right : bc.horizontal, `__sep${i}`));
            }
        });
        if (borderBottom) {
            elements.push(horizRow(borderLeft ? bc.bottomLeft : bc.horizontal, borderRight ? bc.bottomRight : bc.horizontal, "__bot"));
        }
        return React.createElement("tui-box", { flexDirection: "column", overflow: "hidden", ...containerProps }, ...elements);
    }
    // ── Row layout ────────────────────────────────────────────────────────────
    // Each pane draws only top+bottom borders (─). Cap columns and separators draw
    // the vertical lines with proper ┌└ / ┬┴ / ┐┘ junction characters.
    const elements = [];
    if (borderLeft) {
        elements.push(vertCol(borderTop ? bc.topLeft : bc.vertical, borderBottom ? bc.bottomLeft : bc.vertical, "__left"));
    }
    kids.forEach((child, i) => {
        elements.push(React.cloneElement(child, {
            ...paneProps(child, i),
            borderLeft: false,
            borderRight: false,
            borderTop: true,
            borderBottom: true,
        }));
        if (i < kids.length - 1) {
            elements.push(vertCol(borderTop ? jc.top : bc.vertical, borderBottom ? jc.bottom : bc.vertical, `__sep${i}`));
        }
    });
    if (borderRight) {
        elements.push(vertCol(borderTop ? bc.topRight : bc.vertical, borderBottom ? bc.bottomRight : bc.vertical, "__right"));
    }
    return React.createElement("tui-box", { flexDirection: "row", overflow: "hidden", ...containerProps }, ...elements);
}
PanesImpl.__reactermPanes = true;
export const Panes = React.memo(PanesImpl);
Panes.__reactermPanes = true;
//# sourceMappingURL=Panes.js.map