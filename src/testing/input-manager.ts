import type { KeyEvent, MouseEvent, PasteEvent } from "../input/types.js";

/**
 * Create a mock InputManager that can receive simulated events.
 */
export class TestInputManager {
  private keyHandlers = new Set<(e: KeyEvent) => void>();
  private prioritizedKeyHandlers = new Set<{ handler: (e: KeyEvent) => void; priority: number }>();
  private mouseHandlers = new Set<(e: MouseEvent) => void>();
  private pasteHandlers = new Set<(e: PasteEvent) => void>();
  /**
   * Count of prioritized handlers that ran for the most recent pressKey call
   * without anyone consuming. Mirrors the production manager's warning logic
   * so tests can assert the "multiple isFocused" warning would or would not fire.
   */
  lastUnconsumedCountAtMax = 0;

  onKey(handler: (e: KeyEvent) => void): () => void {
    this.keyHandlers.add(handler);
    return () => { this.keyHandlers.delete(handler); };
  }

  /** Register a key handler with priority (mirrors InputManager). */
  onKeyPrioritized(handler: (e: KeyEvent) => void, priority: number): () => void {
    const entry = { handler, priority };
    this.prioritizedKeyHandlers.add(entry);
    return () => { this.prioritizedKeyHandlers.delete(entry); };
  }

  onMouse(handler: (e: MouseEvent) => void): () => void {
    this.mouseHandlers.add(handler);
    return () => { this.mouseHandlers.delete(handler); };
  }

  onPaste(handler: (e: PasteEvent) => void): () => void {
    this.pasteHandlers.add(handler);
    return () => { this.pasteHandlers.delete(handler); };
  }

  /** Simulate a key press */
  pressKey(key: string, options?: { ctrl?: boolean; shift?: boolean; meta?: boolean; char?: string }): void {
    const event: KeyEvent = {
      key,
      char: options?.char ?? (key.length === 1 ? key : ""),
      raw: key,
      ctrl: options?.ctrl ?? false,
      shift: options?.shift ?? false,
      meta: options?.meta ?? false,
    };
    this.lastUnconsumedCountAtMax = 0;
    if (this.prioritizedKeyHandlers.size > 0) {
      let maxPriority = -Infinity;
      for (const entry of this.prioritizedKeyHandlers) {
        if (entry.priority > maxPriority) maxPriority = entry.priority;
      }
      let countAtMax = 0;
      for (const entry of this.prioritizedKeyHandlers) {
        if (entry.priority !== maxPriority) continue;
        countAtMax++;
        entry.handler(event);
        if (event.consumed) break;
      }
      if (!event.consumed) this.lastUnconsumedCountAtMax = countAtMax;
      if (event.consumed) return;
    }
    for (const h of this.keyHandlers) {
      h(event);
      if (event.consumed) return;
    }
  }

  /** Simulate typing a string character by character */
  type(text: string): void {
    for (const char of text) {
      this.pressKey(char, { char });
    }
  }

  /** Simulate Enter key */
  pressEnter(): void {
    this.pressKey("return");
  }

  /** Simulate scroll */
  scroll(direction: "up" | "down", x = 0, y = 0): void {
    const event: MouseEvent = {
      button: direction === "up" ? "scroll-up" : "scroll-down",
      action: "press",
      x, y,
      shift: false,
      ctrl: false,
      meta: false,
      raw: "",
    };
    for (const h of this.mouseHandlers) h(event);
  }

  /** Simulate mouse click/press */
  click(x = 0, y = 0, button: MouseEvent["button"] = "left"): void {
    const event: MouseEvent = {
      button,
      action: "press",
      x,
      y,
      shift: false,
      ctrl: false,
      meta: false,
      raw: "",
    };
    for (const h of this.mouseHandlers) h(event);
  }

  /** Simulate paste event */
  paste(text: string): void {
    const event: PasteEvent = { text };
    for (const h of this.pasteHandlers) h(event);
  }

  /** Release all handler references to prevent memory leaks. */
  dispose(): void {
    this.keyHandlers.clear();
    this.prioritizedKeyHandlers.clear();
    this.mouseHandlers.clear();
    this.pasteHandlers.clear();
  }

  get isAttached(): boolean { return true; }
  start(): void {}
  stop(): void {}
}

export { TestInputManager as MockInputManager };
