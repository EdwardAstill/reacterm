/**
 * InputManager — unified stdin owner.
 *
 * The SINGLE point of contact for process.stdin. Parses raw data into
 * mouse events and key events. Mouse sequences are consumed BEFORE
 * keyboard parsing, preventing garbage text in the input.
 *
 * This prevents mouse escape sequences from reaching the keyboard parser:
 */

import { parseMouseEvent, isIncompleteMouseSequence, looksLikeMalformedSgrMouse } from "./mouse.js";
import { parseKeys } from "./keyboard.js";
import type { KeyEvent, MouseEvent, KeyHandler, MouseHandler, PasteEvent, PasteHandler } from "./types.js";

const MAX_BUFFER_SIZE = 4096;
const PASTE_START = "\x1b[200~";
const PASTE_END = "\x1b[201~";
const FOCUS_IN = "\x1b[I";
const FOCUS_OUT = "\x1b[O";

// Prefix-less SGR mouse body, e.g. "<32;5;10M", ";80;19m", "20;21m".
// Bun/Node on Windows ConPTY sometimes delivers the body without the
// `\x1b[<` (or `\x1b[`) escape prefix; without this guard the digits and
// semicolons leak to the keyboard parser as typed characters.
// Anchored at start of slice; requires ≥2 numbers separated by `;`
// terminated by m/M so legitimate single-token typing (e.g. "5m") is
// untouched. Allows an optional leading `<` or `;` (the partial prefix
// from a stripped escape sequence) and an optional third number group.
const LOOSE_SGR_BODY = /^[<;]?\d+;\d+(?:;\d+)?[mM]/;
const IS_WINDOWS = process.platform === "win32";

export interface PrioritizedKeyHandler {
  handler: KeyHandler;
  priority: number;
}

export class InputManager {
  private keyListeners: Set<KeyHandler> = new Set();
  private prioritizedKeyListeners: Set<PrioritizedKeyHandler> = new Set();
  private mouseListeners: Set<MouseHandler> = new Set();
  private pasteListeners: Set<PasteHandler> = new Set();
  private warnedMultipleHandlers = false;

  private mouseBuffer = "";
  private pasteBuffer: string | null = null; // non-null = inside paste
  private escBuffer = "";
  private escTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMouseEventAt = 0; // ms timestamp of most recent emitted mouse event
  private readonly dataHandler: (data: Buffer | string) => void;
  private stdin: NodeJS.ReadStream;
  private attached = false;

  constructor(stdin: NodeJS.ReadStream = process.stdin) {
    this.stdin = stdin;
    this.dataHandler = (data: Buffer | string) => {
      // STORM_TRACE_STDIN: append every raw chunk to a file as hex. Set to a
      // path to capture (e.g. STORM_TRACE_STDIN=C:\Users\you\stdin-trace.log).
      // Used to diagnose Windows ConPTY mouse byte issues — disabled by default.
      const tracePath = process.env.STORM_TRACE_STDIN;
      if (tracePath) {
        try {
          const fs = require("fs") as typeof import("fs");
          const buf = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
          fs.appendFileSync(tracePath, `${new Date().toISOString()} ${buf.toString("hex")}\n`);
        } catch { /* swallow — diagnostic only */ }
      }
      this.handleData(
        typeof data === "string" ? data : data.toString("utf-8"),
      );
    };
  }

  /** Start listening to stdin. */
  start(): void {
    if (this.attached) return;
    this.attached = true;
    this.stdin.on("data", this.dataHandler);
  }

  /** Stop listening to stdin. */
  stop(): void {
    if (!this.attached) return;
    this.attached = false;
    this.stdin.removeListener("data", this.dataHandler);
    this.stdin.pause?.();
    this.mouseBuffer = "";
    this.pasteBuffer = null;
    if (this.escTimer) {
      clearTimeout(this.escTimer);
      this.escTimer = null;
    }
    this.escBuffer = "";
  }

  // ── Subscription ────────────────────────────────────────────────

  onKey(handler: KeyHandler): () => void {
    this.keyListeners.add(handler);
    return () => { this.keyListeners.delete(handler); };
  }

  /**
   * Register a key handler with priority. Higher priority handlers run first.
   * If a prioritized handler exists, normal (non-prioritized) handlers are suppressed.
   */
  onKeyPrioritized(handler: KeyHandler, priority: number): () => void {
    const entry: PrioritizedKeyHandler = { handler, priority };
    this.prioritizedKeyListeners.add(entry);
    return () => { this.prioritizedKeyListeners.delete(entry); };
  }

  onMouse(handler: MouseHandler): () => void {
    this.mouseListeners.add(handler);
    return () => { this.mouseListeners.delete(handler); };
  }

  onPaste(handler: PasteHandler): () => void {
    this.pasteListeners.add(handler);
    return () => { this.pasteListeners.delete(handler); };
  }

  // ── Core data handler ───────────────────────────────────────────

  private handleData(raw: string): void {
    let data = raw;

    // Phase 1: Handle bracketed paste
    if (this.pasteBuffer !== null) {
      const endIdx = data.indexOf(PASTE_END);
      if (endIdx >= 0) {
        this.pasteBuffer += data.slice(0, endIdx);
        this.emitPaste({ text: this.pasteBuffer });
        this.pasteBuffer = null;
        data = data.slice(endIdx + PASTE_END.length);
        if (data.length === 0) return;
      } else {
        this.pasteBuffer += data;
        return;
      }
    }

    const pasteStart = data.indexOf(PASTE_START);
    if (pasteStart >= 0) {
      if (pasteStart > 0) {
        this.processInput(data.slice(0, pasteStart));
      }
      // Start paste buffering
      this.pasteBuffer = "";
      const afterStart = data.slice(pasteStart + PASTE_START.length);
      const endIdx = afterStart.indexOf(PASTE_END);
      if (endIdx >= 0) {
        this.pasteBuffer = null;
        this.emitPaste({ text: afterStart.slice(0, endIdx) });
        const rest = afterStart.slice(endIdx + PASTE_END.length);
        if (rest.length > 0) this.handleData(rest);
      } else {
        this.pasteBuffer = afterStart;
      }
      return;
    }

    this.processInput(data);
  }

  private processInput(data: string): void {
    // Phase 1: If the previous chunk ended with a bare ESC we were
    // holding, merge it back in now — so the mouse extractor sees the
    // full sequence (e.g. a `\x1b` from the previous chunk plus `[<...M`
    // from this one = a valid SGR mouse event).
    let incoming = data;
    if (this.escBuffer.length > 0 && incoming.length > 0) {
      if (this.escTimer) {
        clearTimeout(this.escTimer);
        this.escTimer = null;
      }
      incoming = this.escBuffer + incoming;
      this.escBuffer = "";
    }

    // Phase 2: Extract and consume mouse sequences.
    let remaining = this.extractMouse(incoming);

    // Phase 3: Filter focus events.
    remaining = remaining.replaceAll(FOCUS_IN, "").replaceAll(FOCUS_OUT, "");

    // Phase 4: If the keyboard remainder ends with a bare ESC, hold it —
    // it might be a bare Escape keypress OR the start of an escape
    // sequence split across stdin chunks. The keyboard parser's 50ms
    // timeout fires if no more data arrives, emitting it as `escape`.
    if (remaining.endsWith("\x1b")) {
      this.escBuffer = "\x1b";
      remaining = remaining.slice(0, -1);
      this.escTimer = setTimeout(() => {
        this.escTimer = null;
        const keys = parseKeys(this.escBuffer);
        this.escBuffer = "";
        for (const k of keys) this.emitKey(k);
      }, 50);
    }

    // Phase 5: Parse keyboard events from what's left
    if (remaining.length > 0) {
      const keyEvents = parseKeys(remaining);
      for (const evt of keyEvents) {
        this.emitKey(evt);
      }
    }
  }

  /**
   * Extract and dispatch mouse events from the data.
   * Returns the remaining data with mouse sequences stripped.
   */
  private extractMouse(data: string): string {
    // Early size check before concatenation to prevent DoS.
    // Preserve any trailing partial escape sequence — otherwise we drop
    // the first half of a split-across-chunks mouse event and its bytes
    // spill into the keyboard parser on the next iteration.
    if (this.mouseBuffer.length + data.length > MAX_BUFFER_SIZE) {
      const lastEsc = this.mouseBuffer.lastIndexOf("\x1b");
      this.mouseBuffer = lastEsc >= 0 ? this.mouseBuffer.slice(lastEsc) : "";
      if (this.mouseBuffer.length + data.length > MAX_BUFFER_SIZE) {
        this.mouseBuffer = "";
      }
    }

    this.mouseBuffer += data;

    let keyboard = "";
    let i = 0;

    while (i < this.mouseBuffer.length) {
      const slice = this.mouseBuffer.slice(i);

      // Try to parse a mouse event
      const result = parseMouseEvent(slice);
      if (result) {
        this.emitMouse(result.event);
        i += result.consumed;
        continue;
      }

      if (isIncompleteMouseSequence(slice)) {
        // Wait for more data — keep in buffer
        this.mouseBuffer = slice;
        return keyboard;
      }

      // Not a mouse sequence — but it may still be SGR-mouse-shaped
      // (malformed or unknown encoding). Drop those bytes silently
      // instead of leaking digits/semicolons into the keyboard parser,
      // which is what surfaces on screen as `;;;;MMMM...` gibberish
      // under rapid scroll.
      if (looksLikeMalformedSgrMouse(slice)) {
        const terminator = /[mM]/.exec(slice);
        if (terminator) {
          i += terminator.index + 1;
          continue;
        }
        // No terminator in sight — drop the `\x1b[<` prefix and any
        // SGR body bytes (digits and `;`) that follow. This prevents
        // the malformed payload from being re-interpreted as individual
        // keyboard characters.
        let j = 3;
        while (j < slice.length) {
          const c = slice.charCodeAt(j);
          if (!((c >= 0x30 && c <= 0x39) || c === 0x3b)) break;
          j++;
        }
        i += j;
        continue;
      }

      // Windows ConPTY workaround: Bun/Node on Windows occasionally
      // delivers SGR mouse events stripped of their `\x1b[<` (or `\x1b[`)
      // prefix, leaving naked body fragments like ";80;19m" or "20;21m"
      // or "<32;5;10M" to spill into the keyboard parser. The user sees
      // these as typed characters in edit fields after a click/drag.
      // Recognize and silently drop these prefix-less mouse bodies before
      // the keyboard pass-through. Requires at least 2 number groups
      // separated by `;` ending in m/M so legitimate input (e.g. a stray
      // "5m") is unaffected.
      if (IS_WINDOWS) {
        const looseMatch = LOOSE_SGR_BODY.exec(slice);
        if (looseMatch) {
          i += looseMatch[0].length;
          continue;
        }

        // Byte-by-byte mouse-body delivery defense: when stdin chunks
        // each contain a single byte (Windows ConPTY does this under
        // mouse drag), the LOOSE_SGR_BODY regex above never matches
        // because no single byte is a full body. If a mouse event was
        // emitted very recently, treat any digit / `;` / `m` / `M` /
        // `<` byte as a mouse fragment and drop it. Window is short
        // enough (60ms) that real typing is unaffected: a human cannot
        // click and then type a digit within 60ms.
        const sinceMouse = Date.now() - this.lastMouseEventAt;
        if (sinceMouse < 60) {
          const c = slice.charCodeAt(0);
          const isFragmentByte =
            (c >= 0x30 && c <= 0x39) || // 0-9
            c === 0x3b ||               // ;
            c === 0x3c ||               // <
            c === 0x6d ||               // m
            c === 0x4d;                 // M
          if (isFragmentByte) {
            i++;
            continue;
          }
        }
      }

      // Not a mouse sequence — pass through to keyboard
      // But be careful: only pass one character/sequence at a time
      if (slice.startsWith("\x1b") && slice.length > 1) {
        // This is an ESC sequence but not a mouse one
        let seqEnd = 1;
        if (slice[1] === "[") {
          // CSI sequence — find terminating byte. Cap the scan so a
          // long stretch of non-terminator bytes (possible under noisy
          // input) can't consume arbitrarily large keyboard chunks.
          seqEnd = 2;
          const maxScan = Math.min(slice.length, seqEnd + 64);
          while (seqEnd < maxScan) {
            const c = slice.charCodeAt(seqEnd);
            if (c >= 0x40 && c <= 0x7e) {
              seqEnd++;
              break;
            }
            seqEnd++;
          }
        } else if (slice[1] === "O") {
          seqEnd = 3; // SS3 + 1 byte
        } else {
          seqEnd = 2; // Alt+char
        }
        keyboard += slice.slice(0, seqEnd);
        i += seqEnd;
      } else {
        keyboard += slice[0]!;
        i++;
      }
    }

    this.mouseBuffer = "";
    return keyboard;
  }

  // ── Event emission ──────────────────────────────────────────────

  private emitKey(event: KeyEvent): void {
    // If prioritized handlers exist, fire the highest-priority ones first.
    // Handlers can set event.consumed = true to prevent propagation to normal listeners.
    // If no handler consumes the event, it falls through to normal listeners.
    if (this.prioritizedKeyListeners.size > 0) {
      let maxPriority = -Infinity;
      for (const entry of this.prioritizedKeyListeners) {
        if (entry.priority > maxPriority) maxPriority = entry.priority;
      }
      let countAtMax = 0;
      for (const entry of this.prioritizedKeyListeners) {
        if (entry.priority === maxPriority) {
          countAtMax++;
          entry.handler(event);
          if (event.consumed) break;
        }
      }
      // Dev warning: two or more handlers ran at the same priority. The loop
      // above breaks on `event.consumed`, so countAtMax only exceeds 1 when
      // NO handler claimed the event — true accidental double-focus. Disjoint-
      // domain coexistence (e.g. SearchInput + OptionList per improvements.md §4)
      // works automatically via the break because one handler always consumes.
      if (
        process.env.NODE_ENV !== "production"
        && !this.warnedMultipleHandlers
        && countAtMax > 1
      ) {
        this.warnedMultipleHandlers = true;
        process.stderr.write("[storm] Warning: Multiple components are receiving keyboard input simultaneously. This usually means multiple isFocused={true} props on sibling components OR two useInput hooks at the same priority. Use a focus state, raise/lower one priority, or set event.consumed=true. See docs/pitfalls.md#14 (priority) and #7 (focus).\n");
      }
      // If a prioritized handler consumed the event, suppress normal listeners.
      // Otherwise, let it propagate — the handler chose not to intercept this key.
      if (event.consumed) return;
    }
    // Note: multiple non-prioritized listeners is normal in Storm — hooks like
    // useCollapsibleContent, useInlinePrompt, useModeCycler, ScrollView keyboard
    // scroll, and TextInput all register independent listeners. No warning here.
    for (const handler of this.keyListeners) {
      handler(event);
      if (event.consumed) return;
    }
  }

  private emitMouse(event: MouseEvent): void {
    this.lastMouseEventAt = Date.now();
    for (const handler of this.mouseListeners) {
      handler(event);
    }
  }

  private emitPaste(event: PasteEvent): void {
    for (const handler of this.pasteListeners) {
      handler(event);
    }
  }

  get isAttached(): boolean {
    return this.attached;
  }
}
