import React, { useRef } from "react";
// A memoized wrapper that only re-renders if item or index changes.
const MemoItem = React.memo(function MemoItem(props) {
    return React.createElement(React.Fragment, null, props.renderFn(props.item, props.index));
});
function StaticInner(props) {
    const { items, children: renderFn } = props;
    // Keep a stable reference to the render function to avoid unnecessary re-renders
    const renderFnRef = useRef(renderFn);
    renderFnRef.current = renderFn;
    const stableRenderFn = useRef((item, index) => renderFnRef.current(item, index));
    return React.createElement("tui-box", { flexDirection: "column" }, 
    // Index keys are safe here: Static items are append-only (memoized,
    // never reordered or removed), so index === stable identity.
    ...items.map((item, index) => React.createElement(MemoItem, {
        key: index,
        item: item,
        index,
        renderFn: stableRenderFn.current,
    })));
}
export const Static = React.memo(StaticInner);
//# sourceMappingURL=Static.js.map