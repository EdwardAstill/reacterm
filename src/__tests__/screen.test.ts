import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { Screen } from "../core/screen.js";
import { ALT_SCREEN_ENTER, CLEAR_LINE } from "../core/ansi.js";

const PROCESS_EVENTS = [
  "exit",
  "SIGINT",
  "SIGTERM",
  "SIGHUP",
  "uncaughtException",
  "unhandledRejection",
] as const;

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

  it("does not install process handlers for fake terminal streams", () => {
    const baseline = Object.fromEntries(
      PROCESS_EVENTS.map((event) => [event, process.listenerCount(event)]),
    ) as Record<(typeof PROCESS_EVENTS)[number], number>;
    const screens = Array.from({ length: 12 }, () =>
      new Screen({
        stdout: makeFakeStdout(),
        stdin: { isTTY: false } as NodeJS.ReadStream,
        mouse: false,
        rawMode: false,
      }),
    );

    for (const screen of screens) screen.start();
    const whileStarted = Object.fromEntries(
      PROCESS_EVENTS.map((event) => [event, process.listenerCount(event)]),
    ) as Record<(typeof PROCESS_EVENTS)[number], number>;

    for (const screen of screens) screen.stop();

    for (const event of PROCESS_EVENTS) {
      expect(whileStarted[event]).toBe(baseline[event]);
      expect(process.listenerCount(event)).toBe(baseline[event]);
    }
  });
});
