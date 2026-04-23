import React from "react";
const ALIGN_TO_JUSTIFY = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
};
export const Text = React.memo(function Text(props) {
    const { children, align, ...rest } = props;
    const textEl = React.createElement("tui-text", rest, children);
    if (align && align !== "left") {
        return React.createElement("tui-box", { justifyContent: ALIGN_TO_JUSTIFY[align], width: "100%" }, textEl);
    }
    return textEl;
});
//# sourceMappingURL=Text.js.map