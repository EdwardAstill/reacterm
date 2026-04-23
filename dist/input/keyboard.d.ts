/**
 * Keyboard escape sequence parser.
 *
 * Parses raw stdin bytes into structured KeyEvent objects.
 * Handles CSI, SS3, and single-byte sequences.
 */
import type { KeyEvent } from "./types.js";
/**
 * Parse key events from a raw stdin data chunk.
 * Returns an array of parsed key events.
 * Mouse sequences should be stripped BEFORE calling this.
 */
export declare function parseKeys(data: string): KeyEvent[];
//# sourceMappingURL=keyboard.d.ts.map