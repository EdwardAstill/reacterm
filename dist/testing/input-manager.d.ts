import type { KeyEvent, MouseEvent, PasteEvent } from "../input/types.js";
/**
 * Create a mock InputManager that can receive simulated events.
 */
export declare class TestInputManager {
    private keyHandlers;
    private prioritizedKeyHandlers;
    private mouseHandlers;
    private pasteHandlers;
    /**
     * Count of prioritized handlers that ran for the most recent pressKey call
     * without anyone consuming. Mirrors the production manager's warning logic
     * so tests can assert the "multiple isFocused" warning would or would not fire.
     */
    lastUnconsumedCountAtMax: number;
    onKey(handler: (e: KeyEvent) => void): () => void;
    /** Register a key handler with priority (mirrors InputManager). */
    onKeyPrioritized(handler: (e: KeyEvent) => void, priority: number): () => void;
    onMouse(handler: (e: MouseEvent) => void): () => void;
    onPaste(handler: (e: PasteEvent) => void): () => void;
    /** Simulate a key press */
    pressKey(key: string, options?: {
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
        char?: string;
    }): void;
    /** Simulate typing a string character by character */
    type(text: string): void;
    /** Simulate Enter key */
    pressEnter(): void;
    /** Simulate scroll */
    scroll(direction: "up" | "down", x?: number, y?: number): void;
    /** Simulate mouse click/press */
    click(x?: number, y?: number, button?: MouseEvent["button"]): void;
    /** Simulate paste event */
    paste(text: string): void;
    /** Release all handler references to prevent memory leaks. */
    dispose(): void;
    get isAttached(): boolean;
    start(): void;
    stop(): void;
}
export { TestInputManager as MockInputManager };
//# sourceMappingURL=input-manager.d.ts.map