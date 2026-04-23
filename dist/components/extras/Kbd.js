import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const Kbd = React.memo(function Kbd(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Kbd", rawProps);
    const { children: label, color = colors.text.secondary, bold: boldProp, dim: dimProp } = props;
    const bracketDim = dimProp !== undefined ? dimProp : true;
    const labelBold = boldProp !== undefined ? boldProp : true;
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color, dim: bracketDim }, "["), React.createElement("tui-text", { color, bold: labelBold, ...(dimProp !== undefined ? { dim: dimProp } : {}) }, label), React.createElement("tui-text", { color, dim: bracketDim }, "]"));
});
//# sourceMappingURL=Kbd.js.map