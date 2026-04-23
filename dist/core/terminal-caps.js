let cachedCaps = null;
/**
 * Detect the terminal's image rendering capabilities.
 *
 * Reads environment variables to determine which protocols the current
 * terminal supports, then selects the best available one. The result is
 * cached so detection runs at most once per process.
 *
 * Detection is purely static (no escape sequences sent).
 */
export function detectImageCaps() {
    if (cachedCaps)
        return cachedCaps;
    const tp = process.env["TERM_PROGRAM"] ?? "";
    const t = process.env["TERM"] ?? "";
    const kittyPid = process.env["KITTY_PID"];
    const ghostty = process.env["GHOSTTY_RESOURCES_DIR"];
    const supportsKittyGraphics = !!(kittyPid || t === "xterm-kitty" || tp === "kitty" || ghostty);
    const supportsKittyPlaceholders = supportsKittyGraphics; // same terminals
    const supportsITerm2 = tp === "iTerm.app" || process.env["LC_TERMINAL"] === "iTerm2" || tp === "WezTerm";
    const supportsColoredUnderline = supportsKittyGraphics ||
        tp === "WezTerm" ||
        tp === "Alacritty" ||
        t === "foot" ||
        t === "foot-extra";
    const supportsSextant = true; // assume modern fonts support it; no reliable detection
    let bestProtocol;
    if (supportsKittyPlaceholders)
        bestProtocol = "kitty-placeholder";
    else if (supportsITerm2)
        bestProtocol = "iterm2";
    else if (supportsColoredUnderline && supportsSextant)
        bestProtocol = "sextant-3color";
    else if (supportsSextant)
        bestProtocol = "sextant";
    else
        bestProtocol = "quarter-block";
    cachedCaps = {
        bestProtocol,
        supportsKittyGraphics,
        supportsKittyPlaceholders,
        supportsITerm2,
        supportsColoredUnderline,
        supportsSextant,
    };
    return cachedCaps;
}
/** Get the best available image protocol for the current terminal. */
export function bestImageProtocolDetailed() {
    return detectImageCaps().bestProtocol;
}
/**
 * Reset the cached detection result.
 *
 * Useful in tests that manipulate `process.env` between assertions.
 * Not intended for production use.
 *
 * @internal
 */
export function _resetImageCapsCache() {
    cachedCaps = null;
}
//# sourceMappingURL=terminal-caps.js.map