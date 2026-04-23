import { type Cell } from "./types.js";
/** Sentinel string for wide-char placeholder (used by diff for skip detection). */
export declare const WIDE_CHAR_PLACEHOLDER = "\0";
/** Flat packed Uint32 cell buffer. Zero per-cell GC pressure -- all typed arrays. */
export declare class ScreenBuffer {
    width: number;
    height: number;
    private codes;
    private fgs;
    private bgs;
    private attrArr;
    private ulColors;
    /** Tracks which rows were written to during the current paint cycle. */
    private _paintedRows;
    /** Rows painted in the previous cycle — used for selective clearing. */
    private _prevPaintedRows;
    /** Damage rect — bounding box of all writes this frame. */
    private _damageX1;
    private _damageY1;
    private _damageX2;
    private _damageY2;
    private _hasDamage;
    /** Per-row damage columns — narrowest range of changed cells per row.
     *  renderChangedCells scans only this range instead of all columns. */
    private _rowDmgX1;
    private _rowDmgX2;
    constructor(width: number, height: number);
    getCell(x: number, y: number): Readonly<Cell>;
    /** Read char as string — only call in render output path, not hot loops. */
    getChar(x: number, y: number): string;
    /** Read raw codepoint — fast path for internal comparisons. */
    getCode(x: number, y: number): number;
    getFg(x: number, y: number): number;
    getBg(x: number, y: number): number;
    getAttrs(x: number, y: number): number;
    getUlColor(x: number, y: number): number;
    setCell(x: number, y: number, cell: Readonly<Cell>): void;
    /**
     * Write a single cell with flat scalar arguments — no object allocation.
     */
    private expandDamage;
    setCellDirect(x: number, y: number, char: string, fg: number, bg: number, attrs: number, ulColor: number): void;
    /**
     * Write a string at (x, y) with the given style.
     * Returns the number of columns consumed.
     */
    writeString(x: number, y: number, text: string, fg?: number, bg?: number, attrs?: number, clipRight?: number, ulColor?: number): number;
    /** Fill a rectangular region with a character and style. */
    fill(rx: number, ry: number, rw: number, rh: number, char?: string, fg?: number, bg?: number, attrs?: number, ulColor?: number): void;
    /**
     * Copy a region from another buffer into this buffer.
     */
    blit(src: ScreenBuffer, srcX: number, srcY: number, srcW: number, srcH: number, dstX: number, dstY: number): void;
    clear(): void;
    /**
     * Selective clear: only reset rows painted in the previous cycle.
     */
    clearPaintedRows(): void;
    /**
     * Reset paint tracking without clearing cell content.
     * Used for incremental painting.
     */
    resetPaintTracking(): void;
    wasRowPainted(y: number): boolean;
    getDamageRect(): {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    } | null;
    isRowDamaged(y: number): boolean;
    /**
     * Get raw typed array refs + base index for a row. Bounds-check once,
     * then caller reads arrays directly — eliminates 5 method calls +
     * 5 bounds checks per cell in the cell-diff tight loop.
     */
    getRowRaw(y: number): {
        codes: Uint32Array;
        fgs: Int32Array;
        bgs: Int32Array;
        attrs: Uint8Array;
        ulColors: Int32Array;
        base: number;
    } | null;
    /** Get the per-row damage column range. Returns [x1, x2) or null if no damage. */
    getRowDamage(y: number): [number, number] | null;
    /**
     * Compare a single row between this buffer and another.
     * Uses WASM SIMD when available (Rust autovectorized comparison).
     * Falls back to pure TypeScript tight integer loop.
     */
    rowEquals(other: ScreenBuffer, y: number): boolean;
    /** Resize the buffer, preserving content where possible. */
    resize(newWidth: number, newHeight: number): void;
    /** Copy all cell data from another buffer (no allocation). */
    copyFrom(src: ScreenBuffer): void;
    /**
     * Copy only painted rows from src. Uses TypedArray.set for native memcpy.
     */
    copyRowsFrom(src: ScreenBuffer): void;
    clone(): ScreenBuffer;
    /** Check if two buffers have identical content. */
    equals(other: ScreenBuffer): boolean;
}
//# sourceMappingURL=buffer.d.ts.map