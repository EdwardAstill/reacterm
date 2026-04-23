import React from "react";
export const Overlay = React.memo(function Overlay(props) {
    const { children, visible = true, ...rest } = props;
    if (!visible)
        return null;
    return React.createElement("tui-overlay", rest, children);
});
//# sourceMappingURL=Overlay.js.map