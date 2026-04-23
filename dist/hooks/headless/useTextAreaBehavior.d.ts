/** A 2D cursor position within the text area. */
export interface TextAreaPos {
    row: number;
    col: number;
}
/** Selection range expressed as two 2D positions. */
export interface TextAreaSelectionRange {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}
export interface UseTextAreaBehaviorOptions {
    /** Current text value (controlled). */
    value: string;
    /** Called on every text change with the full new value. */
    onChange: (value: string) => void;
    /** Called when the submit key is pressed. */
    onSubmit?: ((value: string) => void) | undefined;
    /** Key combo that triggers onSubmit. @default "ctrl+enter" */
    submitKey?: ("ctrl+enter" | "meta+enter" | "ctrl+s") | undefined;
    /** Whether the component is focused. @default true */
    isFocused?: boolean | undefined;
    /** Read-only mode — cursor moves but text cannot be edited. */
    readOnly?: boolean | undefined;
    /** When true, input is non-interactive (no cursor, no key handling). */
    disabled?: boolean | undefined;
    /** Number of spaces inserted for Tab key. @default 2 */
    tabSize?: number | undefined;
    /** Maximum visible lines before scrolling. When undefined, grows unbounded. */
    maxLines?: number | undefined;
    /** Maximum character count. */
    maxLength?: number | undefined;
    /** Called when text selection changes. */
    onSelectionChange?: ((startRow: number, startCol: number, endRow: number, endCol: number) => void) | undefined;
}
export interface UseTextAreaBehaviorResult {
    /** The text split into lines. */
    lines: string[];
    /** Current cursor row. */
    cursorRow: number;
    /** Current cursor column. */
    cursorCol: number;
    /** Whether a selection is active. */
    hasSelection: boolean;
    /** Normalized selection range, or null if no selection. */
    selectionRange: TextAreaSelectionRange | null;
    /** Current scroll offset (first visible line index). */
    scrollOffset: number;
    /** Whether the input is currently focused. */
    isFocused: boolean;
    /** Unique focus ID for this textarea instance. */
    focusId: string;
}
export declare function useTextAreaBehavior(options: UseTextAreaBehaviorOptions): UseTextAreaBehaviorResult;
//# sourceMappingURL=useTextAreaBehavior.d.ts.map