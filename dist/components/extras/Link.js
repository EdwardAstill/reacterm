import React from "react";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
export const Link = React.memo(function Link(rawProps) {
    const props = usePluginProps("Link", rawProps);
    const personality = usePersonality();
    const { url, children, color, bold, dim } = props;
    return React.createElement("tui-text", {
        color: color ?? personality.typography.linkColor,
        underline: personality.typography.linkUnderline,
        ...(bold !== undefined ? { bold } : {}),
        ...(dim !== undefined ? { dim } : {}),
        _linkUrl: url,
    }, children);
});
//# sourceMappingURL=Link.js.map