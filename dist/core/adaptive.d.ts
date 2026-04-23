import { type TerminalCapabilities } from "./terminal-detect.js";
export interface AdaptiveConfig {
    /** Detected terminal capabilities */
    capabilities: TerminalCapabilities;
    /** Best available clipboard method */
    clipboard: "osc52" | "none";
    /** Best available image protocol */
    imageProtocol: "kitty" | "iterm2" | "sixel" | "block";
    /** Best available keyboard protocol */
    keyboardProtocol: "kitty" | "legacy";
    /** Whether to use synchronized output */
    syncOutput: boolean;
    /** Whether hyperlinks (OSC 8) are supported */
    hyperlinks: boolean;
    /** Color depth */
    colorDepth: "truecolor" | "256" | "16" | "basic";
    /** Whether unicode is supported */
    unicode: boolean;
    /** Whether mouse reporting is available */
    mouse: boolean;
}
export declare function bestImageProtocol(caps: TerminalCapabilities): AdaptiveConfig["imageProtocol"];
export declare function bestKeyboardProtocol(caps: TerminalCapabilities): AdaptiveConfig["keyboardProtocol"];
export declare function bestColorDepth(caps: TerminalCapabilities): AdaptiveConfig["colorDepth"];
export declare function createAdaptiveConfig(overrides?: Partial<AdaptiveConfig>): AdaptiveConfig;
/** Push kitty keyboard mode 1; returned function pops it. Null if not a TTY. */
export declare function enableKittyKeyboard(stdout: NodeJS.WriteStream): (() => void) | null;
/** Begin sync output frame; returned function ends it. Null if not a TTY. */
export declare function enableSyncOutput(stdout: NodeJS.WriteStream): (() => void) | null;
/** Return unicode char if supported, otherwise ascii fallback. */
export declare function adaptiveChar(unicode: string, ascii: string, caps: TerminalCapabilities): string;
/**
 * Returns 6-char border set: topLeft topRight bottomLeft bottomRight vertical horizontal.
 * Falls back to ASCII +-| on non-unicode terminals.
 */
export declare function adaptiveBorder(style: "round" | "heavy" | "storm", caps: TerminalCapabilities): string;
//# sourceMappingURL=adaptive.d.ts.map