import { type DiffResult } from "./diff.js";
import { ScreenBuffer } from "./buffer.js";
import type { LinkRange, RenderContext } from "./render-context.js";
export interface ScreenOptions {
    stdout?: NodeJS.WriteStream;
    stdin?: NodeJS.ReadStream;
    /** Use alternate screen buffer (default: true) */
    alternateScreen?: boolean;
    /** Enable mouse reporting (default: true). Disable for text selection/copy. */
    mouse?: boolean;
    /** Enable raw mode on stdin (default: true) */
    rawMode?: boolean;
}
/** Owns stdout, alt screen, raw mode, cursor, signal traps. Restores terminal on crash/exit. */
export declare class Screen {
    readonly stdout: NodeJS.WriteStream;
    readonly stdin: NodeJS.ReadStream;
    private readonly useAltScreen;
    private readonly useMouse;
    private readonly useRawMode;
    private wasRaw;
    private diff;
    private buffer;
    private _width;
    private _height;
    private active;
    private cleanedUp;
    private _signalsBound;
    private onBeforeCleanup;
    private _cursorX;
    private _cursorY;
    private _cursorVisible;
    private _liveHeight;
    /** Optional transform applied to ANSI output before writing to stdout. */
    private _outputTransform;
    private resizeListeners;
    private readonly onResize;
    private readonly onExit;
    private readonly onSignal;
    private readonly onUncaughtException;
    private readonly onUnhandledRejection;
    constructor(options?: ScreenOptions);
    /**
     * Register a callback that runs user-level cleanups (useCleanup, useAsyncCleanup,
     * plugin teardown) before the terminal is restored. Called by the render loop.
     */
    setBeforeCleanup(fn: () => void): void;
    /** Run the before-cleanup callback exactly once (idempotent). */
    private runBeforeCleanup;
    get width(): number;
    get height(): number;
    /** Start the screen — enter alt screen, enable mouse, raw mode.
     *  When stdout is not a TTY (piped, redirected), all terminal control
     *  sequences are skipped. The app still runs — components render, state
     *  updates — but no cursor/mouse/alt-screen escape codes are emitted. */
    start(): void;
    /** Stop the screen — restore terminal state. */
    stop(): void;
    private cleanup;
    /** Change the terminal's default background via OSC 11.
     *  This makes \x1b[2J, \x1b[0m, \x1b[49m all use this color.
     *  Pass null to reset to the terminal's original default.
     *  No-op when stdout is not a TTY. */
    setTerminalBg(hexColor: string | null): void;
    /** Get the current frame buffer. Paint into this, then call flush(). */
    getBuffer(): ScreenBuffer;
    /** Allocate a fresh buffer with current dimensions. */
    createBuffer(): ScreenBuffer;
    /**
     * Diff the given buffer against the previous frame and write changes.
     * This is the core render path — called once per React commit.
     * Returns the diff result with change statistics.
     */
    flush(nextBuffer?: ScreenBuffer, links?: LinkRange[], ctx?: RenderContext): DiffResult;
    /** Force full redraw on next flush. */
    invalidate(): void;
    /** Enable or disable debug rainbow mode on the diff renderer. */
    setDebugRainbow(enabled: boolean): void;
    /** Set an output transform applied to ANSI output before writing to stdout. */
    setOutputTransform(transform: ((output: string) => string) | null): void;
    /** Set cursor position (for TextInput). */
    setCursor(x: number, y: number): void;
    setCursorVisible(visible: boolean): void;
    /** Register a resize listener. */
    onResizeEvent(fn: (w: number, h: number) => void): () => void;
    /** Raw write to stdout — use sparingly. */
    write(data: string): void;
    /** Track how many lines the live section currently occupies. */
    get liveHeight(): number;
    setLiveHeight(h: number): void;
    /**
     * Write committed content above the live render area.
     * In non-alternate-screen mode:
     *   1. Erase the live section (cursor up + clear)
     *   2. Write the committed text (becomes permanent scrollback)
     *   3. The caller is responsible for repainting the live section after.
     */
    commitAbove(text: string): void;
    get isActive(): boolean;
}
//# sourceMappingURL=screen.d.ts.map