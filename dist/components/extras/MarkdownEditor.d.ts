import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface MarkdownEditorProps extends StormLayoutStyleProps {
    /** Markdown source text. Controlled. */
    value: string;
    /** Called on every keystroke. */
    onChange: (next: string) => void;
    /** Debounce in ms before re-parsing the preview. @default 120 */
    previewDelayMs?: number;
    /** Visible editor rows. @default 16 */
    rows?: number;
    /** Whether keyboard input is routed to this composite. @default true */
    isFocused?: boolean;
    /** Width of the preview pane in cells. Falls back to flex split. */
    previewWidth?: number;
    /** Editor pane title. @default "Editor" */
    editorTitle?: string;
    /** Preview pane title. @default "Preview" */
    previewTitle?: string;
}
export declare const MarkdownEditor: React.NamedExoticComponent<MarkdownEditorProps>;
//# sourceMappingURL=MarkdownEditor.d.ts.map