import React from "react";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const Paragraph = React.memo(function Paragraph(rawProps) {
    const props = usePluginProps("Paragraph", rawProps);
    const { children, color, bold, dim, marginBottom = 1 } = props;
    const textProps = {};
    if (color !== undefined)
        textProps.color = color;
    if (bold !== undefined)
        textProps.bold = bold;
    if (dim !== undefined)
        textProps.dim = dim;
    return React.createElement("tui-box", { marginBottom }, React.createElement("tui-text", textProps, children));
});
//# sourceMappingURL=Paragraph.js.map