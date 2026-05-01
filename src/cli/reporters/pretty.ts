import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & { name: string };

export function prettyReporter(results: Named[], _opts: { color: boolean }): string {
  const lines: string[] = [];
  let passed = 0, failed = 0;
  for (const r of results) {
    if (r.status === "pass") { passed++; lines.push(`  ✓ ${r.name} (${r.durationMs}ms)`); }
    else { failed++; lines.push(`  ✗ ${r.name}: ${r.failure}`); }
  }
  lines.push("");
  lines.push(`${passed} passed, ${failed} failed`);
  return lines.join("\n");
}
