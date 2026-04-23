export interface UseTextInputBehaviorOptions {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: ((value: string) => void) | undefined;
    /** Whether the input is focused. */
    isFocused?: boolean | undefined;
    history?: string[] | undefined;
    /** Maximum characters allowed. Input is capped at this length. */
    maxLength?: number | undefined;
    /** When true, input is non-interactive. */
    disabled?: boolean | undefined;
    /** Called when the text selection changes. */
    onSelectionChange?: ((start: number, end: number) => void) | undefined;
}
export interface UseTextInputBehaviorResult {
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
    /** Ref to pass to the host element for imperative props mutation. */
    hostPropsRef: React.MutableRefObject<any>;
    /** Unique focus ID for this input instance. */
    focusId: string;
}
export declare function useTextInputBehavior(options: UseTextInputBehaviorOptions): UseTextInputBehaviorResult;
//# sourceMappingURL=useTextInputBehavior.d.ts.map