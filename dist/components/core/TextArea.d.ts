import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
/** A colored span returned by user-provided syntax highlighters. */
export interface HighlightSpan {
    text: string;
    color?: string | number;
    bold?: boolean;
    dim?: boolean;
    inverse?: boolean;
}
export interface TextAreaProps extends StormLayoutStyleProps {
    /** Current text value (controlled). */
    value: string;
    /** Called on every text change with the full new value. */
    onChange: (value: string) => void;
    /** Called when the submit key is pressed (default: ctrl+enter). */
    onSubmit?: (value: string) => void;
    /** Key combo that triggers onSubmit. @default "ctrl+enter" */
    submitKey?: "ctrl+enter" | "meta+enter" | "ctrl+s";
    /** Placeholder shown when value is empty. */
    placeholder?: string;
    /** Whether the component is focused. @default true */
    isFocused?: boolean;
    /** Read-only mode — cursor moves but text cannot be edited. */
    readOnly?: boolean;
    /** When true, input is non-interactive (no cursor, no key handling). */
    disabled?: boolean;
    /** Show line numbers in a left gutter. @default false */
    lineNumbers?: boolean;
    /** Enable soft word wrapping at the editor width. @default false */
    wordWrap?: boolean;
    /** Number of spaces inserted for Tab key. @default 2 */
    tabSize?: number;
    /** Maximum visible lines before scrolling. When undefined, grows unbounded. */
    maxLines?: number;
    /** Maximum character count. */
    maxLength?: number;
    /** Text color. */
    color?: string | number;
    /** Placeholder text color. */
    placeholderColor?: string | number;
    /** Line number gutter color. */
    lineNumberColor?: string | number;
    /** Called when text selection changes. */
    onSelectionChange?: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
    /** Optional syntax highlighter — receives a line of text and its 0-based index,
     *  returns an array of colored spans whose text concatenated equals the input line. */
    highlight?: (line: string, lineIndex: number) => HighlightSpan[];
    /** Flex sizing. */
    flex?: number;
    "aria-label"?: string;
}
export declare const TextArea: React.NamedExoticComponent<TextAreaProps>;
//# sourceMappingURL=TextArea.d.ts.map