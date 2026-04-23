export declare const ESC = "\u001B";
export declare const CSI = "\u001B[";
export type ColorDepth = "truecolor" | "256" | "16" | "basic";
/** Set the active color depth. Called from Screen.start() based on terminal detection. */
export declare function setColorDepth(depth: ColorDepth): void;
export declare function getColorDepth(): ColorDepth;
/**
 * Convert RGB to the nearest ANSI 256-color index.
 * Uses the standard 6x6x6 color cube (indices 16-231) and
 * the grayscale ramp (indices 232-255), picking whichever is closer.
 */
export declare function rgbTo256(r: number, g: number, b: number): number;
/**
 * Convert RGB to the nearest ANSI 16-color index (0-15).
 */
export declare function rgbTo16(r: number, g: number, b: number): number;
export declare function cursorTo(row: number, col: number): string;
export declare function cursorUp(n: number): string;
export declare function cursorDown(n: number): string;
export declare function cursorForward(n: number): string;
export declare function cursorBack(n: number): string;
export declare const CURSOR_HIDE = "\u001B[?25l";
export declare const SYNC_START = "\u001B[?2026h";
export declare const SYNC_END = "\u001B[?2026l";
export declare const CURSOR_SHOW = "\u001B[?25h";
export declare const CURSOR_SAVE = "\u001B7";
export declare const CURSOR_RESTORE = "\u001B8";
export declare const CLEAR_SCREEN = "\u001B[2J";
export declare const CLEAR_LINE = "\u001B[2K";
export declare const CLEAR_LINE_RIGHT = "\u001B[0K";
export declare const CLEAR_LINE_LEFT = "\u001B[1K";
export declare const CLEAR_DOWN = "\u001B[J";
export declare const ALT_SCREEN_ENTER = "\u001B[?1049h";
export declare const ALT_SCREEN_EXIT = "\u001B[?1049l";
/** Set scroll region (1-indexed, inclusive) */
export declare function setScrollRegion(top: number, bottom: number): string;
/** Reset scroll region to full terminal */
export declare const RESET_SCROLL_REGION = "\u001B[r";
export declare const SCROLL_UP = "\u001BD";
export declare const SCROLL_DOWN = "\u001BM";
/** Scroll up n lines within the current scroll region (CSI SU) */
export declare function scrollUpN(n: number): string;
/** Scroll down n lines within the current scroll region (CSI SD) */
export declare function scrollDownN(n: number): string;
/** Enable button event tracking (1002) + SGR extended mode (1006) */
export declare const MOUSE_ENABLE = "\u001B[?1002h\u001B[?1006h";
export declare const MOUSE_DISABLE = "\u001B[?1002l\u001B[?1006l";
/** Enable any-event tracking (1003) + SGR — reports motion too */
export declare const MOUSE_ENABLE_ALL = "\u001B[?1003h\u001B[?1006h";
export declare const MOUSE_DISABLE_ALL = "\u001B[?1003l\u001B[?1006l";
export declare const FOCUS_ENABLE = "\u001B[?1004h";
export declare const FOCUS_DISABLE = "\u001B[?1004l";
export declare const FOCUS_IN = "\u001B[I";
export declare const FOCUS_OUT = "\u001B[O";
export declare const BRACKETED_PASTE_ENABLE = "\u001B[?2004h";
export declare const BRACKETED_PASTE_DISABLE = "\u001B[?2004l";
export declare const PASTE_START = "\u001B[200~";
export declare const PASTE_END = "\u001B[201~";
export declare const RESET = "\u001B[0m";
export declare function fgColor(c: number): string;
export declare function bgColor(c: number): string;
export declare function sgrAttrs(attrs: number): string;
/**
 * Build a full SGR sequence for a cell's style.
 * Emits RESET first, then sets all attributes — ensures clean state.
 * If ulColor is provided and is a valid RGB color, emits CSI 58;2;R;G;Bm
 * for colored underline (supported by Kitty, WezTerm, Ghostty, foot, Alacritty).
 */
export declare function fullSgr(fg: number, bg: number, attrs: number, ulColor?: number): string;
/**
 * Build a differential SGR: only emit what changed from prev → next.
 * Returns empty string if nothing changed.
 */
export declare function diffSgr(prevFg: number, prevBg: number, prevAttrs: number, nextFg: number, nextBg: number, nextAttrs: number): string;
//# sourceMappingURL=ansi.d.ts.map