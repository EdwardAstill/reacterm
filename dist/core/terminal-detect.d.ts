export interface TerminalCapabilities {
    /** Terminal name (xterm, iterm2, alacritty, kitty, wezterm, etc.) */
    name: string;
    /** Supports true color (24-bit RGB) */
    trueColor: boolean;
    /** Supports 256 colors */
    color256: boolean;
    /** Supports Unicode/UTF-8 */
    unicode: boolean;
    /** Supports mouse reporting */
    mouse: boolean;
    /** Supports bracketed paste */
    bracketedPaste: boolean;
    /** Supports OSC 52 clipboard */
    clipboard: boolean;
    /** Supports OSC 8 hyperlinks */
    hyperlinks: boolean;
    /** Supports synchronized output */
    syncOutput: boolean;
    /** Supports Kitty keyboard protocol */
    kittyKeyboard: boolean;
    /** Supports sixel graphics */
    sixel: boolean;
    /** Is running inside tmux */
    tmux: boolean;
    /** Is running inside screen */
    screen: boolean;
    /** Terminal width in columns */
    columns: number;
    /** Terminal height in rows */
    rows: number;
}
/**
 * Detect terminal capabilities from environment variables.
 *
 * This is a pure read of `process.env` and `process.stdout` —
 * no escape sequences are written or read.
 */
export declare function detectTerminal(): TerminalCapabilities;
/**
 * Return a human-readable summary of terminal capabilities.
 *
 * @example
 * ```
 * Terminal: iTerm2 | True Color | 256 Colors | Unicode | Mouse | Clipboard | Hyperlinks | 120x40
 * ```
 */
export declare function terminalInfo(): string;
//# sourceMappingURL=terminal-detect.d.ts.map