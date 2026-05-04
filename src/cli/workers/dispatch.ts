import { spawnModuleAsMain, resolveSiblingModule } from "../runtime/launch.js";
import type { RunOptions, RunResult } from "../engine/runScenario.js";

const WORKER = resolveSiblingModule(import.meta.url, "./scenarioWorker");

export async function dispatchScenarios(scenarios: RunOptions[], opts: { jobs: number }): Promise<RunResult[]> {
  const results: RunResult[] = new Array(scenarios.length);
  const inFlight = new Set<Promise<void>>();
  let nextIdx = 0;

  const runOne = (idx: number, job: RunOptions): Promise<void> =>
    new Promise<void>((resolveP) => {
      const child = spawnModuleAsMain(WORKER, [], { stdio: ["pipe", "pipe", "inherit"] });
      let out = "";
      const stdout = child.stdout;
      const stdin = child.stdin;
      if (!stdout || !stdin) {
        results[idx] = { status: "fail", failure: "worker stdio unavailable", finalText: "", durationMs: 0 };
        resolveP();
        return;
      }
      stdout.on("data", (c) => { out += c.toString(); });
      child.on("close", () => {
        try {
          results[idx] = JSON.parse(out);
        } catch {
          results[idx] = { status: "fail", failure: "worker crashed", finalText: "", durationMs: 0 };
        }
        resolveP();
      });
      stdin.write(JSON.stringify(job));
      stdin.end();
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
