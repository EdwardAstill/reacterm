import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parseScenario } from "../schema/parse.js";
import { runScenarioFromCli, type RunResult } from "../engine/runScenario.js";
import { prettyReporter } from "../reporters/pretty.js";
import { jsonReporter } from "../reporters/json.js";
import { ndjsonReporter } from "../reporters/ndjson.js";
import { tapReporter } from "../reporters/tap.js";
import type { Expectation } from "../schema/types.js";

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
  for (const p of opts.paths) {
    const source = await readFile(p, "utf8");
    const scenario = await parseScenario(source, p);
    if (!scenario.entry) { opts.stderr.write(`error: ${p} has no entry\n`); return 2; }
    const entry = resolve(dirname(p), scenario.entry);
    const result = await runScenarioFromCli({ entry, scenario });
    const failures = checkExpectations(scenario.expect ?? [], result.finalText);
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
  return named.some((r) => r.status === "fail") ? 1 : 0;
}

function checkExpectations(exps: Expectation[], finalText: string): string[] {
  const failures: string[] = [];
  for (const e of exps) {
    if (e.kind === "contains" && !finalText.includes(e.text)) failures.push(`expected text "${e.text}"`);
    // Other expectation kinds (line, expectSnapshot, exitCode, noWarnings, frameCount) are
    // handled by Task 26's snapshot extension which replaces this checkExpectations.
  }
  return failures;
}
