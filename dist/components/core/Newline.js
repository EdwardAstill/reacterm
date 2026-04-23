import React from "react";
export const Newline = React.memo(function Newline(props) {
    const count = props.count ?? 1;
    const lines = [];
    for (let i = 0; i < count; i++) {
        lines.push(React.createElement("tui-text", { key: i }, "\n"));
    }
    return React.createElement("tui-box", { flexDirection: "column" }, ...lines);
});
//# sourceMappingURL=Newline.js.map