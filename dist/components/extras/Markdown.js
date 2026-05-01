import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { parseBlocks } from "../../utils/markdown/parse.js";
import { renderBlock, } from "../../utils/markdown/render-blocks.js";
export const Markdown = React.memo(function Markdown(rawProps) {
    const colors = useColors();
    const personality = usePersonality();
    const props = usePluginProps("Markdown", rawProps);
    const { content, maxWidth, ...layoutProps } = props;
    const ctx = { colors, personality };
    const blocks = React.useMemo(() => parseBlocks(content), [content]);
    const children = blocks.map((block, idx) => renderBlock(block, ctx, `md-${idx}`));
    const outerProps = {
        flexDirection: "column",
        ...(maxWidth !== undefined ? { maxWidth } : {}),
        ...pickLayoutProps(layoutProps),
    };
    return React.createElement("tui-box", outerProps, ...children);
});
//# sourceMappingURL=Markdown.js.map