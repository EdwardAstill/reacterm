import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const BIN = resolve(__dirname, "../../../../bin/reacterm.mjs");
const FIXTURE = resolve(__dirname, "../fixtures/hello-app.tsx");

const run = (args: string[], signal: NodeJS.Signals, afterMs = 500) => new Promise<{ code: number | null; stderr: string }>((res) => {
  const child = spawn("node", [BIN, ...args]);
  let stderr = "";
  child.stderr.on("data", (c) => { stderr += c.toString(); });
  setTimeout(() => child.kill(signal), afterMs);
  child.on("exit", (code) => res({ code, stderr }));
});

const runDouble = (args: string[], firstAfterMs = 500, gapMs = 100) => new Promise<{ code: number | null; elapsedMs: number }>((res) => {
  const child = spawn("node", [BIN, ...args]);
  const start = Date.now();
  setTimeout(() => child.kill("SIGINT"), firstAfterMs);
  setTimeout(() => child.kill("SIGINT"), firstAfterMs + gapMs);
  child.on("exit", (code) => res({ code, elapsedMs: Date.now() - start }));
});

describe("signal handling", () => {
  it("SIGINT exits 130 cleanly", async () => {
    const { code, stderr } = await run(["drive", FIXTURE, "--keep-alive"], "SIGINT");
    expect(code).toBe(130);
    expect(stderr).not.toMatch(/Error:/);
  }, 10_000);

  it("double-SIGINT within 2s exits 130 within 500ms (escalation)", async () => {
    const { code, elapsedMs } = await runDouble(["drive", FIXTURE, "--keep-alive"], 500, 100);
    expect(code).toBe(130);
    expect(elapsedMs).toBeLessThan(1100);
  }, 10_000);

  it("SIGHUP exits 129", async () => {
    const { code } = await run(["drive", FIXTURE, "--keep-alive"], "SIGHUP");
    expect(code).toBe(129);
  }, 10_000);
});
