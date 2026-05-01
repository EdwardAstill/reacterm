import { runScenarioFromCli } from "../engine/runScenario.js";
import { captureFinal } from "../engine/capture.js";
import type { Step } from "../schema/types.js";
import type { CaptureFmt } from "../engine/capture.js";

export interface DriveOpts {
  entry: string;
  inline?: Step[];
  scriptPath?: string;
  capture: CaptureFmt;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
  size?: { cols: number; rows: number };
  timeoutMs?: number;
}

export async function runDrive(opts: DriveOpts): Promise<number> {
  const steps = opts.inline ?? [];
  const result = await runScenarioFromCli({
    entry: opts.entry,
    scenario: { version: 1, name: "drive", steps },
    ...(opts.size !== undefined ? { size: opts.size } : {}),
  });
  if (result.status === "fail") {
    opts.stderr.write(`error: ${result.failure}\n`);
    return 1;
  }
  if (!result.renderer) {
    opts.stderr.write("error: engine returned no renderer handle (internal bug)\n");
    return 1;
  }
  const out = await captureFinal(result.renderer, { as: opts.capture });
  opts.stdout.write(out);
  return 0;
}
