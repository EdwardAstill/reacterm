import { ScreenBuffer } from "./buffer.js";
import type { LinkRange, RenderContext } from "./render-context.js";
export interface DiffResult {
    /** ANSI output string to write to stdout. */
    output: string;
    /** Number of lines that changed in this frame. */
    changedLines: number;
    /** Total number of lines in the buffer. */
    totalLines: number;
}
/** Check if WASM acceleration is active */
export declare function isWasmAccelerated(): boolean;
export declare class DiffRenderer {
    private prevLines;
    private prevBuffer;
    private bufferA;
    private bufferB;
    private cursorVisible;
    private debugRainbow;
    private rainbowIndex;
    private wasmBuffer;
    constructor(_width: number, _height: number);
    /** Enable or disable debug rainbow mode — changed lines get a cycling background color. */
    setDebugRainbow(enabled: boolean): void;
    /** Swap double buffers instead of cloning — avoids allocation every frame.
     *  Handles dimension mismatches (e.g. terminal resize) by reallocating. */
    private swapPrevBuffer;
    /**
     * Diff next buffer against the previous frame and emit minimal ANSI.
     * Pass 1: identify changed rows (cheap cell comparison).
     * Pass 2: render changed rows -- WASM for sparse updates, TS for full repaints.
     * Cell-level diffing kicks in when <50% of rows changed; emits only changed runs.
     * Output is wrapped in synchronized update (DCS) for flicker-free atomic write.
     */
    render(next: ScreenBuffer, links?: LinkRange[], ctx?: RenderContext): DiffResult;
    /**
     * Render only the changed cells of a row, comparing against prevBuffer.
     *
     * Algorithm:
     *  1. Walk cells left-to-right, comparing next vs prev buffer
     *  2. Collect consecutive changed cells into "runs"
     *  3. For each run: emit cursor-position + SGR + characters
     *  4. Unchanged cells produce zero output (no cursor movement needed)
     *
     * This avoids rewriting an entire 200-column row when only a cursor blinks.
     * Returns the ANSI fragments to write (caller handles SYNC wrapping).
     *
     * Link handling: if any link spans the row, we fall back to renderLine
     * since OSC 8 open/close must bracket entire link ranges correctly.
     */
    private renderChangedCells;
    /**
     * Check if a row fills the full terminal width (last column has non-default content).
     * When true, emitting \x1b[K after the line would trigger terminal auto-wrap on the
     * last column, corrupting cursor position.
     */
    private lineFullWidth;
    /** Render one row to a styled string with minimal ANSI. */
    private renderLine;
    /**
     * Detect if this frame is a pure scroll operation.
     * Returns the scroll command string if so, null otherwise.
     * A pure scroll: only one ScrollView's scrollTop changed,
     * the ScrollView fills full width, and content didn't change.
     */
    tryScrollRegion(ctx: RenderContext, next: ScreenBuffer, _links?: LinkRange[]): string | null;
    /** Format a single cell with full SGR styling. */
    private formatCell;
    invalidate(): void;
    resize(_w: number, _h: number): void;
    setCursorVisible(v: boolean): void;
}
//# sourceMappingURL=diff.d.ts.map