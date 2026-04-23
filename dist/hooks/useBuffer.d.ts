/**
 * useBuffer — gives components limited direct access to the screen buffer.
 *
 * Useful for custom rendering effects that bypass the normal layout/paint
 * pipeline. Write cells at absolute screen coordinates, read existing
 * cell content, and request a repaint.
 *
 * Usage:
 * ```tsx
 * const { writeCell, readCell, requestRender } = useBuffer();
 * writeCell(10, 5, "X", "#ff0000");
 * requestRender();
 * ```
 */
export interface BufferAccess {
    /** Write a single character to the screen buffer at absolute coordinates. */
    writeCell(x: number, y: number, char: string, fg?: string, bg?: string): void;
    /** Read the current cell content at absolute coordinates. Returns null if out of bounds or no buffer. */
    readCell(x: number, y: number): {
        char: string;
        fg: number;
        bg: number;
    } | null;
    /** Trigger a repaint cycle (without React reconciliation). */
    requestRender(): void;
}
export declare function useBuffer(): BufferAccess;
//# sourceMappingURL=useBuffer.d.ts.map