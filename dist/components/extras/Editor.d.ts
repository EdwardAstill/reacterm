import React from "react";
import type { StormContainerStyleProps, StormLayoutStyleProps } from "../../styles/styleProps.js";
import { type HighlightSpan, type TextAreaProps } from "../core/TextArea.js";
type EditorTextAreaProps = Omit<TextAreaProps, keyof StormLayoutStyleProps | "highlight" | "flex">;
export interface EditorProps extends StormContainerStyleProps, EditorTextAreaProps {
    /** Title shown in the editor header. @default "Editor" */
    title?: string;
    /** Language identifier used for the header badge and built-in syntax highlighting. */
    language?: string;
    /** Number of visible editor rows. @default 12 */
    rows?: number;
    /** Whether to show the header row. @default true */
    showHeader?: boolean;
    /** Whether to show the footer/status row. @default true */
    showFooter?: boolean;
    /** Custom footer content. When omitted, a default status line is rendered. */
    footer?: React.ReactNode;
    /** Optional syntax highlighter override. Takes precedence over `language`. */
    highlight?: (line: string, lineIndex: number) => HighlightSpan[];
}
export declare const Editor: React.NamedExoticComponent<EditorProps>;
export {};
//# sourceMappingURL=Editor.d.ts.map