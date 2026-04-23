/**
 * Mouse event parsing — SGR (1006) and X11 (1002) protocols.
 */
import type { MouseEvent } from "./types.js";
/**
 * Try to parse a mouse event from the beginning of a buffer.
 * Returns the parsed event and how many bytes were consumed,
 * or null if the buffer doesn't start with a mouse sequence.
 */
export declare function parseMouseEvent(buffer: string): {
    event: MouseEvent;
    consumed: number;
} | null;
/**
 * Check if the buffer starts with an incomplete mouse sequence.
 * Used to hold the buffer and wait for more data.
 *
 * A bare `\x1b` alone is NOT considered incomplete here — it's ambiguous
 * (could be a bare Escape keypress, an Alt+char, an arrow key, or the
 * start of a mouse sequence). Buffering it in the mouse extractor would
 * hold it forever with no timeout, starving the keyboard path. The
 * keyboard parser has its own 50ms ESC-hold timer that handles bare ESC
 * and split escape sequences correctly.
 *
 * `\x1b[` (CSI prefix) is kept as "maybe mouse" because any mouse
 * sequence starts with it, and the keyboard parser's hold timer covers
 * the same window if it turns out to be a non-mouse CSI.
 */
export declare function isIncompleteMouseSequence(buffer: string): boolean;
/**
 * Return true when the buffer starts with what looks like an SGR mouse
 * sequence (prefix `\x1b[<`) but cannot possibly be a valid one anymore —
 * i.e., the prefix is followed by `SGR_MOUSE_MAX_LENGTH` bytes without
 * the required terminator. Callers use this to silently drop the bad
 * bytes instead of leaking them to the keyboard parser (where the digits
 * and semicolons would surface on screen).
 */
export declare function looksLikeMalformedSgrMouse(buffer: string): boolean;
//# sourceMappingURL=mouse.d.ts.map