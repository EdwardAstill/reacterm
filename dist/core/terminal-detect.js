const KNOWN_TERMINALS = new Map([
    [
        "iTerm.app",
        {
            name: "iterm2",
            trueColor: true,
            mouse: true,
            bracketedPaste: true,
            clipboard: true,
            hyperlinks: true,
            syncOutput: true,
            kittyKeyboard: false,
            sixel: false,
        },
    ],
    [
        "kitty",
        {
            name: "kitty",
            trueColor: true,
            mouse: true,
            bracketedPaste: true,
            clipboard: true,
            hyperlinks: true,
            syncOutput: false,
            kittyKeyboard: true,
            sixel: false,
        },
    ],
    [
        "Alacritty",
        {
            name: "alacritty",
            trueColor: true,
            mouse: true,
            bracketedPaste: true,
            clipboard: true,
            hyperlinks: true,
            syncOutput: false,
            kittyKeyboard: false,
            sixel: false,
        },
    ],
    [
        "WezTerm",
        {
            name: "wezterm",
            trueColor: true,
            mouse: true,
            bracketedPaste: true,
            clipboard: true,
            hyperlinks: true,
            syncOutput: false,
            kittyKeyboard: false,
            sixel: true,
        },
    ],
    [
        "vscode",
        {
            name: "vscode",
            trueColor: true,
            mouse: true,
            bracketedPaste: true,
            clipboard: false,
            hyperlinks: true,
            syncOutput: false,
            kittyKeyboard: false,
            sixel: false,
        },
    ],
    [
        "Apple_Terminal",
        {
            name: "apple-terminal",
            trueColor: false,
            mouse: true,
            bracketedPaste: true,
            clipboard: false,
            hyperlinks: false,
            syncOutput: false,
            kittyKeyboard: false,
            sixel: false,
        },
    ],
]);
function envOrEmpty(key) {
    return process.env[key] ?? "";
}
function inferNameFromTerm(term) {
    if (term.startsWith("xterm"))
        return "xterm";
    if (term.startsWith("screen"))
        return "screen";
    if (term.startsWith("tmux"))
        return "tmux";
    if (term.startsWith("rxvt"))
        return "rxvt";
    if (term.startsWith("linux"))
        return "linux-console";
    return term || "unknown";
}
/**
 * Detect terminal capabilities from environment variables.
 *
 * This is a pure read of `process.env` and `process.stdout` —
 * no escape sequences are written or read.
 */
export function detectTerminal() {
    const term = envOrEmpty("TERM");
    const termProgram = envOrEmpty("TERM_PROGRAM");
    const colorterm = envOrEmpty("COLORTERM");
    const tmuxEnv = envOrEmpty("TMUX");
    const styEnv = envOrEmpty("STY");
    const lang = envOrEmpty("LANG");
    // Multiplexer detection
    const tmux = tmuxEnv.length > 0;
    const screen = styEnv.length > 0 || term.startsWith("screen");
    // Try known terminal programs first
    const known = KNOWN_TERMINALS.get(termProgram);
    // Color detection
    const trueColor = known?.trueColor === true ||
        colorterm === "truecolor" ||
        colorterm === "24bit";
    const color256 = trueColor || term.includes("256color");
    // Unicode detection — check LANG / LC_CTYPE for UTF-8
    const lcCtype = envOrEmpty("LC_CTYPE");
    const lcAll = envOrEmpty("LC_ALL");
    const unicode = lang.toUpperCase().includes("UTF-8") ||
        lang.toUpperCase().includes("UTF8") ||
        lcCtype.toUpperCase().includes("UTF-8") ||
        lcCtype.toUpperCase().includes("UTF8") ||
        lcAll.toUpperCase().includes("UTF-8") ||
        lcAll.toUpperCase().includes("UTF8");
    // Name
    const name = known?.name ?? inferNameFromTerm(term);
    // Feature capabilities
    const mouse = known?.mouse ?? term.startsWith("xterm");
    const bracketedPaste = known?.bracketedPaste ?? term.startsWith("xterm");
    const clipboard = known?.clipboard ?? false;
    const hyperlinks = known?.hyperlinks ?? false;
    const syncOutput = known?.syncOutput ?? false;
    const kittyKeyboard = known?.kittyKeyboard ?? false;
    const sixel = known?.sixel ?? false;
    // Dimensions
    const columns = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    return {
        name,
        trueColor,
        color256,
        unicode,
        mouse,
        bracketedPaste,
        clipboard,
        hyperlinks,
        syncOutput,
        kittyKeyboard,
        sixel,
        tmux,
        screen,
        columns,
        rows,
    };
}
/**
 * Return a human-readable summary of terminal capabilities.
 *
 * @example
 * ```
 * Terminal: iTerm2 | True Color | 256 Colors | Unicode | Mouse | Clipboard | Hyperlinks | 120x40
 * ```
 */
export function terminalInfo() {
    const caps = detectTerminal();
    const parts = [
        caps.name.charAt(0).toUpperCase() + caps.name.slice(1),
    ];
    if (caps.trueColor)
        parts.push("True Color");
    if (caps.color256)
        parts.push("256 Colors");
    if (caps.unicode)
        parts.push("Unicode");
    if (caps.mouse)
        parts.push("Mouse");
    if (caps.bracketedPaste)
        parts.push("Bracketed Paste");
    if (caps.clipboard)
        parts.push("Clipboard");
    if (caps.hyperlinks)
        parts.push("Hyperlinks");
    if (caps.syncOutput)
        parts.push("Sync Output");
    if (caps.kittyKeyboard)
        parts.push("Kitty Keyboard");
    if (caps.sixel)
        parts.push("Sixel");
    if (caps.tmux)
        parts.push("tmux");
    if (caps.screen)
        parts.push("screen");
    parts.push(`${caps.columns}x${caps.rows}`);
    return `Terminal: ${parts.join(" | ")}`;
}
//# sourceMappingURL=terminal-detect.js.map