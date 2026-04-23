export interface UseChatInputBehaviorOptions {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: ((value: string) => void) | undefined;
    /** Whether the input is focused. */
    isFocused?: boolean | undefined;
    history?: string[] | undefined;
    /** Max rows before scrolling (default 4) */
    maxRows?: number | undefined;
    /** Maximum characters allowed. Input is capped at this length. */
    maxLength?: number | undefined;
    /** When true, Enter inserts newline; Ctrl+Enter/Cmd+Enter sends. */
    multiline?: boolean | undefined;
    /** When true, input is non-interactive. */
    disabled?: boolean | undefined;
    /** Called when the text selection changes. */
    onSelectionChange?: ((start: number, end: number) => void) | undefined;
    /** Available width for text wrapping (used by key handler for row/col math). */
    width?: number | undefined;
}
export interface ChatInputRowSegment {
    key: string;
    text: string;
    inverse: boolean;
}
export interface ChatInputRowData {
    key: string;
    segments: ChatInputRowSegment[];
    /** True when the cursor is at end-of-row and a trailing inverse space should be shown. */
    showTrailingCursor: boolean;
}
export interface UseChatInputBehaviorResult {
    /** Current cursor position within the value string. */
    cursorPosition: number;
    /** Whether a selection range is currently active. */
    hasSelection: boolean;
    /** Start of selection range (min of anchor/cursor), or null. */
    selectionStart: number | null;
    /** End of selection range (max of anchor/cursor), or null. */
    selectionEnd: number | null;
    /** Whether the input is currently focused. */
    isFocused: boolean;
    /** Unique focus ID for this input instance. */
    focusId: string;
    /** Wrapped display rows for the current value. */
    displayRows: string[];
    /** The visible height (clamped to maxRows). */
    visibleHeight: number;
    /** Whether the content overflows maxRows and needs a ScrollView. */
    needsScroll: boolean;
    /** Current scroll-top row index. */
    scrollTop: number;
    /** Start row index for rendering (when not using ScrollView). */
    renderStart: number;
    /** End row index (exclusive) for rendering. */
    renderEnd: number;
    /** Whether the placeholder should be shown. */
    showPlaceholder: boolean;
    /** Current cursor row in wrapped rows. */
    cursorRow: number;
    /** Current cursor column in wrapped rows. */
    cursorCol: number;
    /** Compute the flat offset where a given wrapped row starts. */
    rowStartOffset: (rowIdx: number) => number;
    /** Update the available width (call when layout changes). */
    setWidth: (w: number) => void;
}
export declare function useChatInputBehavior(options: UseChatInputBehaviorOptions): UseChatInputBehaviorResult;
//# sourceMappingURL=useChatInputBehavior.d.ts.map