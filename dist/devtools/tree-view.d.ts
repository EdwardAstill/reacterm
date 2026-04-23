/**
 * Tree view — serializes the TuiElement tree into a readable string.
 *
 * Useful for debugging component hierarchies and layout values.
 */
import type { TuiRoot } from "../reconciler/types.js";
/**
 * Serialize the element tree rooted at `root` into a human-readable string.
 *
 * Output format:
 * ```
 * tui-box (column, 80x24)
 *   tui-text "Hello" (fg=#82AAFF, bold)
 *   tui-box (row, 80x3)
 *     tui-text "World"
 *     tui-text "!" (dim)
 * ```
 *
 * @param root - The TuiRoot container to serialize.
 * @param maxDepth - Maximum tree depth to display (default: Infinity).
 */
export declare function serializeTree(root: TuiRoot, maxDepth?: number): string;
//# sourceMappingURL=tree-view.d.ts.map