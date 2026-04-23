import { detectTerminal } from "./terminal-detect.js";
export function bestImageProtocol(caps) {
    if (caps.kittyKeyboard || caps.name === "kitty")
        return "kitty";
    if (caps.name === "iterm2")
        return "iterm2";
    if (caps.sixel)
        return "sixel";
    return "block";
}
export function bestKeyboardProtocol(caps) {
    return caps.kittyKeyboard ? "kitty" : "legacy";
}
export function bestColorDepth(caps) {
    if (caps.trueColor)
        return "truecolor";
    if (caps.color256)
        return "256";
    return "16";
}
export function createAdaptiveConfig(overrides) {
    const caps = overrides?.capabilities ?? detectTerminal();
    const defaults = {
        capabilities: caps,
        clipboard: caps.clipboard ? "osc52" : "none",
        imageProtocol: bestImageProtocol(caps),
        keyboardProtocol: bestKeyboardProtocol(caps),
        syncOutput: caps.syncOutput,
        hyperlinks: caps.hyperlinks,
        colorDepth: bestColorDepth(caps),
        unicode: caps.unicode,
        mouse: caps.mouse,
    };
    return { ...defaults, ...overrides, capabilities: caps };
}
/** Push kitty keyboard mode 1; returned function pops it. Null if not a TTY. */
export function enableKittyKeyboard(stdout) {
    if (!stdout.isTTY)
        return null;
    stdout.write("\x1b[>1u");
    return () => {
        stdout.write("\x1b[<u");
    };
}
/** Begin sync output frame; returned function ends it. Null if not a TTY. */
export function enableSyncOutput(stdout) {
    if (!stdout.isTTY)
        return null;
    stdout.write("\x1b[?2026h");
    return () => {
        stdout.write("\x1b[?2026l");
    };
}
/** Return unicode char if supported, otherwise ascii fallback. */
export function adaptiveChar(unicode, ascii, caps) {
    return caps.unicode ? unicode : ascii;
}
// Border character sets keyed by style
const UNICODE_BORDERS = {
    round: "╭╮╰╯│─",
    heavy: "┏┓┗┛┃━",
    storm: "╔╗╚╝║═",
};
const ASCII_BORDER = "++++-|";
/**
 * Returns 6-char border set: topLeft topRight bottomLeft bottomRight vertical horizontal.
 * Falls back to ASCII +-| on non-unicode terminals.
 */
export function adaptiveBorder(style, caps) {
    if (!caps.unicode)
        return ASCII_BORDER;
    return UNICODE_BORDERS[style] ?? UNICODE_BORDERS["round"];
}
//# sourceMappingURL=adaptive.js.map