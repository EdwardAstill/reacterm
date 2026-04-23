import React from "react";
import { useColors } from "../../hooks/useColors.js";
export function heading(label, key) {
    const colors = useColors();
    return React.createElement("tui-text", {
        key, bold: true, color: colors.brand.primary,
    }, `  ${label}`);
}
export function blank(key) {
    return React.createElement("tui-text", { key }, "");
}
//# sourceMappingURL=helpers.js.map