import type { RunResult } from "../engine/runScenario.js";

type Named = RunResult & { name: string };

export function jsonReporter(results: Named[]): string {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.length - passed;
  return JSON.stringify(
    {
      schemaVersion: 1,
      scenarios: results.map((r) => ({
        name: r.name,
        status: r.status,
        failure: r.failure,
        durationMs: r.durationMs,
      })),
      summary: { passed, failed, total: results.length },
    },
    null,
    2,
  );
}
