import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parseScenario } from "../schema/parse.js";
import { runScenarioFromCli, type RunResult } from "../engine/runScenario.js";
import { prettyReporter } from "../reporters/pretty.js";
import { jsonReporter } from "../reporters/json.js";
import { ndjsonReporter } from "../reporters/ndjson.js";
import { tapReporter } from "../reporters/tap.js";
import type { Expectation } from "../schema/types.js";
import { compareSnapshot, writeSnapshot } from "../engine/snapshot.js";

export interface TestOpts {
  paths: string[];
  reporter: "pretty" | "json" | "ndjson" | "tap";
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  jobs: number;
  ci?: boolean;
  updateSnapshots?: boolean;
}

type Named = Omit<RunResult, "renderer"> & { name: string };

export async function runTest(opts: TestOpts): Promise<number> {
  if (opts.ci && opts.updateSnapshots) {
    opts.stderr.write("error: --ci and -u are mutually exclusive\n");
    return 2;
  }
  const named: Named[] = [];
  let anyDrift = false, anyCapMismatch = false;
  for (const p of opts.paths) {
    const source = await readFile(p, "utf8");
    const scenario = await parseScenario(source, p);
    if (!scenario.entry) { opts.stderr.write(`error: ${p} has no entry\n`); return 2; }
    const entry = resolve(dirname(p), scenario.entry);
    const result = await runScenarioFromCli({ entry, scenario });
    const size = scenario.size ?? { cols: 80, rows: 24 };
    const { failures, drift, capMismatch } = checkExpectations(
      scenario.expect ?? [], result.finalText, p, size, !!opts.updateSnapshots,
    );
    if (drift) anyDrift = true;
    if (capMismatch) anyCapMismatch = true;
    const status: "pass" | "fail" = result.status === "pass" && failures.length === 0 ? "pass" : "fail";
    const failure = result.failure ?? (failures.length > 0 ? failures.join("; ") : undefined);
    const { renderer: _r, ...rest } = result;
    const entry_obj: Named = { ...rest, status, name: scenario.name };
    if (failure !== undefined) entry_obj.failure = failure;
    named.push(entry_obj);
  }
  // Reporters accept `RunResult & { name: string }` which includes optional renderer.
  // Our Named omits renderer entirely, which is structurally safe but needs a cast
  // because exactOptionalPropertyTypes distinguishes absent vs present-undefined.
  type ReporterInput = Parameters<typeof prettyReporter>[0];
  const reporterInput = named as unknown as ReporterInput;
  let out = "";
  switch (opts.reporter) {
    case "pretty": out = prettyReporter(reporterInput, { color: false }); break;
    case "json":   out = jsonReporter(reporterInput); break;
    case "ndjson": out = ndjsonReporter(reporterInput); break;
    case "tap":    out = tapReporter(reporterInput); break;
  }
  opts.stdout.write(out + "\n");
  if (opts.ci && anyCapMismatch) return 4;
  if (opts.ci && anyDrift) return 3;
  return named.some((r) => r.status === "fail") ? 1 : 0;
}

type CheckOutcome = { failures: string[]; drift: boolean; capMismatch: boolean };

function checkExpectations(
  exps: Expectation[],
  finalText: string,
  scenarioPath: string,
  size: { cols: number; rows: number },
  updateSnapshots: boolean,
): CheckOutcome {
  const failures: string[] = [];
  let drift = false, capMismatch = false;
  for (const e of exps) {
    if (e.kind === "contains") {
      if (!finalText.includes(e.text)) failures.push(`expected text "${e.text}"`);
    } else if (e.kind === "expectSnapshot") {
      const path = resolve(dirname(scenarioPath), e.path);
      if (updateSnapshots) {
        writeSnapshot(path, finalText, size);
        continue;
      }
      const r = compareSnapshot(path, finalText, size);
      if (r.status === "drift") { drift = true; failures.push(`snapshot drift: ${e.path}`); }
      else if (r.status === "capabilityMismatch") { capMismatch = true; failures.push(`capability mismatch: ${e.path}`); }
    }
  }
  return { failures, drift, capMismatch };
}
