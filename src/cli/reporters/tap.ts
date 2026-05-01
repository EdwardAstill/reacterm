import type { RunResult } from "../engine/runScenario.js";

type Named = RunResult & { name: string };

export function tapReporter(results: Named[]): string {
  const lines: string[] = ["TAP version 13", `1..${results.length}`];
  results.forEach((r, i) => {
    const n = i + 1;
    if (r.status === "pass") lines.push(`ok ${n} - ${r.name}`);
    else lines.push(`not ok ${n} - ${r.name}\n  ---\n  failure: "${r.failure}"\n  ...`);
  });
  return lines.join("\n") + "\n";
}
