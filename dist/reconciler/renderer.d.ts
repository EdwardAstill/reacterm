import { ScreenBuffer } from "../core/buffer.js";
import type { RenderContext } from "../core/render-context.js";
import { type TuiElement, type TuiRoot, type BackgroundProp } from "./types.js";
/** Bump the runs version on a RenderContext so all styled-run caches are stale. */
export declare function invalidateStyledRunsCache(ctx: RenderContext): void;
export interface PaintResult {
    buffer: ScreenBuffer;
    /** Cursor position for focused TextInput (-1 if none) */
    cursorX: number;
    cursorY: number;
}
export interface MeasuredLayout {
    width: number;
    height: number;
    x: number;
    y: number;
}
/**
 * Paint a background pattern into an existing buffer.
 * Public wrapper used by render() to apply full-app backgrounds
 * before the component tree is painted.
 */
export declare function paintBackgroundToBuffer(buffer: ScreenBuffer, width: number, height: number, background: BackgroundProp): void;
/**
 * Full paint: rebuild layout + paint buffer.
 * Called on React commits (structural changes).
 */
export declare function paint(root: TuiRoot, width: number, height: number, ctx: RenderContext): PaintResult;
/**
 * Fast repaint: skip layout, just paint buffer from cached layout.
 * Reuses buffer to avoid allocation overhead on scroll frames.
 */
export declare function repaint(root: TuiRoot, width: number, height: number, ctx: RenderContext): PaintResult;
/**
 * Rebuild the layout node tree to mirror the element tree.
 * Must be called before computeLayout when the tree structure changes.
 *
 * Marks nodes as dirty when their props or children change,
 * enabling incremental layout caching in computeLayout.
 */
export declare function buildLayoutTree(element: TuiElement): void;
export interface BorderSideFlags {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
}
export interface BorderDimFlags {
    all: boolean;
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
}
//# sourceMappingURL=renderer.d.ts.map