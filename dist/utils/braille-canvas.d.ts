declare const BRAILLE_BASE = 10240;
export { BRAILLE_BASE };
export declare class BrailleCanvas {
    /** Cell dimensions (terminal characters). */
    readonly cols: number;
    readonly rows: number;
    /** Pixel dimensions (sub-dot resolution). */
    readonly pxWidth: number;
    readonly pxHeight: number;
    /** Cell grid storing accumulated braille bits. */
    private readonly grid;
    /** Per-cell color (last writer wins). */
    private readonly colors;
    constructor(cols: number, rows: number);
    /**
     * Set a single sub-pixel dot. Coordinates are in pixel space:
     *   px: 0 .. pxWidth-1   (left to right)
     *   py: 0 .. pxHeight-1  (top to bottom)
     */
    set(px: number, py: number, color?: string | number): void;
    /**
     * Draw a line between two pixel coordinates using Bresenham's algorithm.
     * Produces clean, connected lines with no gaps.
     */
    line(x0: number, y0: number, x1: number, y1: number, color?: string | number): void;
    /** Fill all pixels below a given y coordinate in a column (for area charts). */
    fillBelow(px: number, py: number, color?: string | number): void;
    /**
     * Get the braille character at cell (col, row).
     * Returns an empty braille character (U+2800) if the cell has no dots.
     */
    getChar(col: number, row: number): string;
    /** Get the color at cell (col, row). */
    getColor(col: number, row: number): string | number | null;
    /**
     * Render the canvas to an array of strings, one per cell row.
     * Each string is `this.cols` characters long.
     */
    render(): string[];
    /** Clear the canvas, resetting all dots and colors. */
    clear(): void;
}
//# sourceMappingURL=braille-canvas.d.ts.map