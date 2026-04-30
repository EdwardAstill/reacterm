import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { Screen } from "../core/screen.js";
import { ALT_SCREEN_ENTER, CLEAR_LINE } from "../core/ansi.js";

function makeFakeStdout() {
  const ee = new EventEmitter();
  let output = "";
  const stdout = {
    isTTY: true,
    columns: 80,
    rows: 24,
    write: (chunk: string) => {
      output += chunk;
      return true;
    },
    on: (event: string, handler: (...args: unknown[]) => void) => ee.on(event, handler),
    removeListener: (event: string, handler: (...args: unknown[]) => void) =>
      ee.removeListener(event, handler),
    get output() {
      return output;
    },
  } as unknown as NodeJS.WriteStream & { output: string };
  return stdout;
}

describe("Screen lifecycle", () => {
  it("clears the shell's current line before entering the alternate screen", () => {
    const stdout = makeFakeStdout();
    const stdin = { isTTY: false } as NodeJS.ReadStream;
    const screen = new Screen({ stdout, stdin, mouse: false, rawMode: false });

    screen.start();
    screen.stop();

    const clearIdx = stdout.output.indexOf(CLEAR_LINE);
    const altIdx = stdout.output.indexOf(ALT_SCREEN_ENTER);
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(altIdx).toBeGreaterThanOrEqual(0);
    expect(clearIdx).toBeLessThan(altIdx);
  });
});
