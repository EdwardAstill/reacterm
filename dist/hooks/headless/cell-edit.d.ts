import type { KeyEvent } from "../../input/types.js";
export interface CellEditState {
    row: number;
    col: number;
    value: string;
    cursor: number;
}
/**
 * Process a key event while in inline cell editing mode.
 *
 * Mutates `editState` in place and calls `onCommit` when the user presses Enter,
 * `onCancel` when Escape is pressed, and `onUpdate` after any change that
 * requires a re-render (cursor movement, character insertion, etc.).
 *
 * Returns `true` if the event was handled by the editor.
 */
export declare function handleCellEdit(event: KeyEvent, editState: CellEditState, onCommit: (row: number, col: number, value: string) => void, onCancel: () => void, onUpdate: () => void): boolean;
//# sourceMappingURL=cell-edit.d.ts.map