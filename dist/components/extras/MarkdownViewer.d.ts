import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface MarkdownViewerProps extends StormLayoutStyleProps {
    /** The raw Markdown string to render. */
    content: string;
    /** Maximum width hint for the Markdown content area. */
    maxWidth?: number;
    /** Width of the TOC sidebar in characters. @default 30 */
    tocWidth?: number;
    /** Whether to show the TOC sidebar. @default true */
    showToc?: boolean;
    /** Whether the component is focused for keyboard input. @default true */
    isFocused?: boolean;
}
export declare const MarkdownViewer: React.NamedExoticComponent<MarkdownViewerProps>;
//# sourceMappingURL=MarkdownViewer.d.ts.map