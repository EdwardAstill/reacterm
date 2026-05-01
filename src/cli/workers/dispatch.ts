import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RunOptions, RunResult } from "../engine/runScenario.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER = resolve(HERE, "scenarioWorker.ts");
const ROOT = resolve(HERE, "../../..");
const TSX = resolve(ROOT, "node_modules/.bin/tsx");

export async function dispatchScenarios(scenarios: RunOptions[], opts: { jobs: number }): Promise<RunResult[]> {
  const results: RunResult[] = new Array(scenarios.length);
  const inFlight = new Set<Promise<void>>();
  let nextIdx = 0;

  const runOne = (idx: number, job: RunOptions): Promise<void> =>
    new Promise<void>((resolveP) => {
      const child = spawn(TSX, [WORKER], { stdio: ["pipe", "pipe", "inherit"] });
      let out = "";
      child.stdout.on("data", (c) => { out += c.toString(); });
      child.on("close", () => {
        try {
          results[idx] = JSON.parse(out);
        } catch {
          results[idx] = { status: "fail", failure: "worker crashed", finalText: "", durationMs: 0 };
        }
        resolveP();
      });
      child.stdin.write(JSON.stringify(job));
      child.stdin.end();
    });

  while (nextIdx < scenarios.length || inFlight.size > 0) {
    while (inFlight.size < opts.jobs && nextIdx < scenarios.length) {
      const idx = nextIdx++;
      const p: Promise<void> = runOne(idx, scenarios[idx]!).then(() => { inFlight.delete(p); });
      inFlight.add(p);
    }
    if (inFlight.size > 0) await Promise.race(inFlight);
  }
  return results;
}
