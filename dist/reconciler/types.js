export const TUI_BOX = "tui-box";
export const TUI_TEXT = "tui-text";
export const TUI_SCROLL_VIEW = "tui-scroll-view";
export const TUI_TEXT_INPUT = "tui-text-input";
export const TUI_OVERLAY = "tui-overlay";
export function isTuiElement(node) {
    return node.type !== "TEXT_NODE";
}
export function isTuiTextNode(node) {
    return node.type === "TEXT_NODE";
}
export function createRoot(onCommit) {
    return { children: [], onCommit };
}
export function createElement(type, props) {
    return {
        type,
        props: { ...props }, // Copy — React freezes its props objects
        children: [],
        parent: null,
        _runsDirty: false,
        _cachedRuns: undefined,
        _cachedRunsVersion: undefined,
        layoutNode: {
            props: extractLayoutProps(type, props),
            children: [],
            layout: {
                x: 0, y: 0, width: 0, height: 0,
                innerX: 0, innerY: 0, innerWidth: 0, innerHeight: 0,
                contentHeight: 0, contentWidth: 0,
            },
        },
    };
}
export function createTextNode(initialText) {
    let _text = initialText;
    const node = {
        type: "TEXT_NODE",
        get text() { return _text; },
        set text(newText) {
            if (_text === newText)
                return; // no-op if unchanged
            _text = newText;
            // Mark all tui-text ancestors' styled runs as dirty so the renderer
            // re-reads this text on the next paint. Nested tui-text elements
            // (e.g., OperationTree's icon inside a row) need the outermost
            // tui-text to be marked dirty since that's where paintText checks.
            let ancestor = node.parent;
            while (ancestor) {
                ancestor._runsDirty = true;
                if (ancestor.type !== TUI_TEXT)
                    break;
                ancestor = ancestor.parent;
            }
        },
        parent: null,
    };
    return node;
}
export function extractLayoutProps(type, props) {
    // Border adds 1 cell of implicit padding on each side
    const hasBorder = props["borderStyle"] !== undefined && props["borderStyle"] !== "none";
    // Individual border sides default to true when borderStyle is set
    const showTop = hasBorder && props["borderTop"] !== false;
    const showBottom = hasBorder && props["borderBottom"] !== false;
    const showLeft = hasBorder && props["borderLeft"] !== false;
    const showRight = hasBorder && props["borderRight"] !== false;
    const basePad = props["padding"] ?? 0;
    const basePX = props["paddingX"] ?? basePad;
    const basePY = props["paddingY"] ?? basePad;
    const pTop = (props["paddingTop"] ?? basePY) + (showTop ? 1 : 0);
    const pBottom = (props["paddingBottom"] ?? basePY) + (showBottom ? 1 : 0);
    const pLeft = (props["paddingLeft"] ?? basePX) + (showLeft ? 1 : 0);
    const pRight = (props["paddingRight"] ?? basePX) + (showRight ? 1 : 0);
    const baseMargin = props["margin"] ?? 0;
    const baseMX = props["marginX"] ?? baseMargin;
    const baseMY = props["marginY"] ?? baseMargin;
    const mTop = props["marginTop"] ?? baseMY;
    const mBottom = props["marginBottom"] ?? baseMY;
    const mLeft = props["marginLeft"] ?? baseMX;
    const mRight = props["marginRight"] ?? baseMX;
    const hasMargin = mTop > 0 || mBottom > 0 || mLeft > 0 || mRight > 0;
    const result = { paddingTop: pTop, paddingBottom: pBottom, paddingLeft: pLeft, paddingRight: pRight };
    const set = (key, val) => { if (val !== undefined)
        result[key] = val; };
    set("width", props["width"]);
    set("height", props["height"]);
    set("minWidth", props["minWidth"]);
    set("minHeight", props["minHeight"]);
    set("maxWidth", props["maxWidth"]);
    set("maxHeight", props["maxHeight"]);
    set("flex", props["flex"]);
    set("flexGrow", props["flexGrow"]);
    set("flexShrink", props["flexShrink"]);
    set("flexBasis", props["flexBasis"]);
    set("flexDirection", props["flexDirection"]);
    set("flexWrap", props["flexWrap"]);
    if (hasMargin) {
        result.marginTop = mTop;
        result.marginBottom = mBottom;
        result.marginLeft = mLeft;
        result.marginRight = mRight;
    }
    set("gap", props["gap"]);
    set("columnGap", props["columnGap"]);
    set("rowGap", props["rowGap"]);
    set("alignItems", props["alignItems"]);
    set("alignSelf", props["alignSelf"]);
    set("justifyContent", props["justifyContent"]);
    if (type === TUI_SCROLL_VIEW)
        result.overflow = "scroll";
    else
        set("overflow", props["overflow"]);
    set("overflowX", props["overflowX"]);
    set("overflowY", props["overflowY"]);
    set("display", props["display"]);
    set("position", props["position"]);
    set("top", props["top"]);
    set("left", props["left"]);
    set("right", props["right"]);
    set("bottom", props["bottom"]);
    return result;
}
//# sourceMappingURL=types.js.map