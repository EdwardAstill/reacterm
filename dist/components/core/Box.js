import React from "react";
export const Box = React.memo(function Box(props) {
    const { children, ...rest } = props;
    return React.createElement("tui-box", rest, children);
});
//# sourceMappingURL=Box.js.map