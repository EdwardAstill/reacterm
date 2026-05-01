import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { coalesceKeystrokes } from "../recorder/debounce.js";
import { applyRedact } from "../recorder/redact.js";
import { eventsToScenarioYaml } from "../recorder/serializer.js";
import { EventSink, type RecordedEvent } from "../recorder/eventSink.js";
import type { Step } from "../schema/types.js";

export interface RunOpts {
  entry: string;
  capture?: string;
  includeSnapshots?: boolean;
  redact?: RegExp;
  debounceMs?: number;
  size?: { cols: number; rows: number };
  /** Test-only: bypass TTY interaction by providing pre-seeded events. */
  _testEvents?: RecordedEvent[];
}

export async function runRun(opts: RunOpts): Promise<number> {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const tsx = resolve(rootDir, "node_modules/.bin/tsx");

  if (!opts.capture && !opts._testEvents) {
    return await new Promise<number>((res) => {
      const child = spawn(tsx, [opts.entry], { stdio: "inherit" });
      child.on("exit", (code) => res(code ?? 1));
    });
  }

  const sink = new EventSink();
  if (opts._testEvents) {
    for (const e of opts._testEvents) sink.events.push(e);
  } else {
    process.stderr.write(`[reacterm] recording session → ${opts.capture}\n`);
    process.stdin.setRawMode?.(true);
    process.stdin.on("data", (buf) => sink.push(buf.toString("utf8")));
    await new Promise<number>((res) => {
      const child = spawn(tsx, [opts.entry], { stdio: ["pipe", "inherit", "inherit"] });
      process.stdin.pipe(child.stdin!);
      child.on("exit", (code) => res(code ?? 1));
    });
  }

  const coalesced = coalesceKeystrokes(sink.events, opts.debounceMs ?? 50);
  const steps: Step[] = coalesced.map((s) => {
    if (s.kind === "type") {
      return { kind: "type", text: opts.redact ? applyRedact(s.text, opts.redact) : s.text };
    }
    return s;
  });

  const yaml = await eventsToScenarioYaml({
    name: "recorded",
    entry: opts.entry,
    size: opts.size ?? { cols: 80, rows: 24 },
    steps,
  });
  await writeFile(opts.capture!, yaml, "utf8");
  if (!opts._testEvents) {
    process.stderr.write(`[reacterm] wrote ${steps.length} steps to ${opts.capture}\n`);
  }
  return 0;
}
