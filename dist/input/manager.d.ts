/**
 * InputManager — unified stdin owner.
 *
 * The SINGLE point of contact for process.stdin. Parses raw data into
 * mouse events and key events. Mouse sequences are consumed BEFORE
 * keyboard parsing, preventing garbage text in the input.
 *
 * This prevents mouse escape sequences from reaching the keyboard parser:
 */
import type { KeyHandler, MouseHandler, PasteHandler } from "./types.js";
export interface PrioritizedKeyHandler {
    handler: KeyHandler;
    priority: number;
}
export declare class InputManager {
    private keyListeners;
    private prioritizedKeyListeners;
    private mouseListeners;
    private pasteListeners;
    private warnedMultipleHandlers;
    private mouseBuffer;
    private pasteBuffer;
    private escBuffer;
    private escTimer;
    private readonly dataHandler;
    private stdin;
    private attached;
    constructor(stdin?: NodeJS.ReadStream);
    /** Start listening to stdin. */
    start(): void;
    /** Stop listening to stdin. */
    stop(): void;
    onKey(handler: KeyHandler): () => void;
    /**
     * Register a key handler with priority. Higher priority handlers run first.
     * If a prioritized handler exists, normal (non-prioritized) handlers are suppressed.
     */
    onKeyPrioritized(handler: KeyHandler, priority: number): () => void;
    onMouse(handler: MouseHandler): () => void;
    onPaste(handler: PasteHandler): () => void;
    private handleData;
    private processInput;
    /**
     * Extract and dispatch mouse events from the data.
     * Returns the remaining data with mouse sequences stripped.
     */
    private extractMouse;
    private emitKey;
    private emitMouse;
    private emitPaste;
    get isAttached(): boolean;
}
//# sourceMappingURL=manager.d.ts.map