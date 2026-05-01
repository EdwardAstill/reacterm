import type React from "react";
import { renderDriver, type TuiDriver } from "../../testing/index.js";
import { loadEntry } from "./moduleLoader.js";
import { pollWaitFor } from "./pollWaitFor.js";
import type { Scenario, Step } from "../schema/types.js";

export interface RunResult {
  status: "pass" | "fail";
  failure?: string;
  finalText: string;
  durationMs: number;
  /** Driver handle for in-process callers that want to capture artifacts.
   *  Stripped before serialization across process boundaries. */
  renderer?: TuiDriver;
}

export interface RunOptions {
  entry: string;
  scenario: Scenario;
  size?: { cols: number; rows: number };
}

export async function runScenarioFromCli(opts: RunOptions): Promise<RunResult> {
  const start = Date.now();
  const element = (await loadEntry(opts.entry, opts.scenario.env ?? {})) as React.ReactElement;
  const cols = opts.size?.cols ?? opts.scenario.size?.cols ?? 80;
  const rows = opts.size?.rows ?? opts.scenario.size?.rows ?? 24;
  const r = renderDriver(element, { width: cols, height: rows });

  for (const step of opts.scenario.steps) {
    try {
      await applyStep(r, step);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        status: "fail",
        failure: `step ${step.kind}: ${msg}`,
        finalText: r.output,
        durationMs: Date.now() - start,
        renderer: r,
      };
    }
  }
  return { status: "pass", finalText: r.output, durationMs: Date.now() - start, renderer: r };
}

async function applyStep(r: TuiDriver, step: Step): Promise<void> {
  switch (step.kind) {
    case "press":
      for (const k of step.keys) r.press(k);
      break;
    case "type":
      r.type(step.text);
      break;
    case "paste":
      r.paste(step.text);
      break;
    case "click":
      r.click({ x: step.x, y: step.y }, step.button ?? "left");
      break;
    case "scroll":
      r.scroll(step.direction, step.target ?? { x: 0, y: 0 });
      break;
    case "resize":
      r.resize(step.cols, step.rows);
      break;
    case "sleep":
      await new Promise<void>((res) => setTimeout(res, step.ms));
      break;
    case "snapshot":
      /* file-write deferred to Task 26 */
      break;
    case "waitFor": {
      const result = await pollWaitFor(() => r.output.includes(step.text), {
        timeoutMs: step.timeoutMs ?? 5000,
        tickMs: 16,
      });
      if (!result.matched) {
        throw new Error(`waitFor "${step.text}" did not match within ${step.timeoutMs ?? 5000}ms`);
      }
      break;
    }
  }
}
