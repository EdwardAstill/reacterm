/**
 * Locks the OSC 52 byte shape emitted by useClipboard. If a refactor changes
 * the introducer, terminator, or base64 encoding, this test fails — that
 * ought to be a deliberate decision.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { TuiProvider, type TuiContextValue } from "../context/TuiContext.js";
import { createRoot } from "../reconciler/types.js";
import { TuiReconciler, syncContainerUpdate } from "../reconciler/render-to-string.js";
import { RenderContext } from "../core/render-context.js";
import { useClipboard } from "../hooks/useClipboard.js";

function mountWithClipboardSpy(useEffectBody: (clip: ReturnType<typeof useClipboard>) => void): {
  writes: string[];
} {
  const writes: string[] = [];

  const screen = {
    width: 40,
    height: 10,
    stdout: process.stdout,
    stdin: process.stdin,
    write: (s: string) => { writes.push(s); },
    start: () => {},
    stop: () => {},
    flush: () => {},
    getBuffer: () => undefined,
    createBuffer: () => undefined,
    invalidate: () => {},
    setDebugRainbow: () => {},
    setCursor: () => {},
    setCursorVisible: () => {},
    onResizeEvent: () => () => {},
    isActive: false,
  } as unknown as TuiContextValue["screen"];

  const renderCtx = new RenderContext();
  const ctx: TuiContextValue = {
    screen,
    input: {} as unknown as TuiContextValue["input"],
    focus: renderCtx.focus,
    renderContext: renderCtx,
    exit: () => {},
    requestRender: () => {},
    flushSync: (fn) => { fn(); },
    clear: () => {},
    commitText: () => {},
  };

  function Probe(): null {
    const clip = useClipboard();
    React.useEffect(() => {
      useEffectBody(clip);
    }, []);
    return null;
  }

  const root = createRoot(() => {});
  const container = TuiReconciler.createContainer(
    root, 0, null, false, null, "", () => {}, null,
  );
  syncContainerUpdate(
    React.createElement(TuiProvider, { value: ctx }, React.createElement(Probe)),
    container,
  );

  return { writes };
}

describe("useClipboard", () => {
  it("copy() emits OSC 52 with base64-encoded payload", () => {
    const { writes } = mountWithClipboardSpy((clip) => {
      clip.copy("hello world");
    });
    const expected = `\x1b]52;c;${Buffer.from("hello world").toString("base64")}\x07`;
    expect(writes).toContain(expected);
  });

  it("read() emits the OSC 52 query form", () => {
    const { writes } = mountWithClipboardSpy((clip) => {
      clip.read();
    });
    expect(writes).toContain("\x1b]52;c;?\x07");
  });
});
