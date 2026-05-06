import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";

/**
 * Result of `useClipboard()`. **Sensitive API** — both `copy` and `read` emit
 * raw OSC 52 sequences to the host terminal, requesting the terminal to write
 * to or read from the user's system clipboard.
 *
 * **Treat this as a user-initiated action.** Call `copy` from event handlers
 * (button click, keyboard shortcut, menu select) — not from auto-firing
 * effects, polling, or background tasks. The terminal owns the final decision:
 * many terminals disable OSC 52 by default (e.g. xterm `disallowedWindowOps`,
 * tmux `set -g set-clipboard on`), and some surface a confirmation dialog.
 *
 * Reading is even less reliable than writing — `read()` issues a query but the
 * response is delivered as terminal input that Reacterm does not yet parse;
 * `content` will remain `null` until the user calls `copy()` themselves.
 */
export interface UseClipboardResult {
  /**
   * Copy text to the system clipboard via OSC 52.
   *
   * **Sensitive — only call from a user-triggered event handler.** The text
   * is base64-encoded and emitted directly to the terminal; the terminal
   * decides whether to honor the request.
   */
  copy: (text: string) => void;
  /**
   * Request clipboard contents via OSC 52 query. Most terminals do not
   * implement the response side of OSC 52; this is best-effort.
   */
  read: () => void;
  /**
   * The last value passed to `copy`, or `null` if `copy` has not been called.
   * Reacterm does not parse OSC 52 responses, so `content` does not currently
   * reflect what the system clipboard actually holds.
   */
  content: string | null;
}

export function useClipboard(): UseClipboardResult {
  const { screen } = useTui();
  const contentRef = useRef<string | null>(null);

  const copyRef = useRef((text: string) => {
    const encoded = Buffer.from(text).toString("base64");
    screen.write(`\x1b]52;c;${encoded}\x07`);
    contentRef.current = text;
  });

  const readRef = useRef(() => {
    // Request clipboard contents via OSC 52 with '?' query
    screen.write(`\x1b]52;c;?\x07`);
  });

  return {
    copy: copyRef.current,
    read: readRef.current,
    content: contentRef.current,
  };
}
