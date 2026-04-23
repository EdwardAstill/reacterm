export type ImageProtocol = "kitty-placeholder" | "kitty" | "iterm2" | "sextant-3color" | "sextant" | "quarter-block" | "half-block" | "none";
export interface TerminalImageCaps {
    bestProtocol: ImageProtocol;
    supportsKittyGraphics: boolean;
    supportsKittyPlaceholders: boolean;
    supportsITerm2: boolean;
    supportsColoredUnderline: boolean;
    supportsSextant: boolean;
}
/**
 * Detect the terminal's image rendering capabilities.
 *
 * Reads environment variables to determine which protocols the current
 * terminal supports, then selects the best available one. The result is
 * cached so detection runs at most once per process.
 *
 * Detection is purely static (no escape sequences sent).
 */
export declare function detectImageCaps(): TerminalImageCaps;
/** Get the best available image protocol for the current terminal. */
export declare function bestImageProtocolDetailed(): ImageProtocol;
/**
 * Reset the cached detection result.
 *
 * Useful in tests that manipulate `process.env` between assertions.
 * Not intended for production use.
 *
 * @internal
 */
export declare function _resetImageCapsCache(): void;
//# sourceMappingURL=terminal-caps.d.ts.map