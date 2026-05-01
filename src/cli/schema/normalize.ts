import { parseDuration } from "./duration.js";
import type { Scenario, Step, Expectation } from "./types.js";

export function normalizeScenario(raw: any, _filename: string): Scenario {
  const steps: Step[] = raw.steps.flatMap(normalizeStep);
  const expects: Expectation[] | undefined = raw.expect?.map(normalizeExpect);
  const out: Scenario = { version: 1, name: raw.name, steps };
  if (raw.entry !== undefined) out.entry = raw.entry;
  if (raw.size !== undefined) out.size = raw.size;
  if (raw.env !== undefined) out.env = raw.env;
  if (raw.timeout !== undefined) out.timeoutMs = parseDuration(raw.timeout);
  if (expects !== undefined) out.expect = expects;
  return out;
}

function normalizeStep(s: any): Step[] {
  if ("press" in s) {
    const keys: string[] = Array.isArray(s.press) ? s.press : [s.press];
    return keys.map((k) => ({ kind: "press" as const, keys: [k] }));
  }
  if ("type" in s) return [{ kind: "type", text: s.type }];
  if ("paste" in s) return [{ kind: "paste", text: s.paste }];
  if ("click" in s) {
    const click: Step = { kind: "click", x: s.click.x, y: s.click.y };
    if (s.click.button !== undefined) click.button = s.click.button;
    return [click];
  }
  if ("scroll" in s) {
    const scroll: Step = { kind: "scroll", direction: s.scroll.direction };
    if (s.scroll.target !== undefined) scroll.target = s.scroll.target;
    return [scroll];
  }
  if ("resize" in s) return [{ kind: "resize", cols: s.resize.cols, rows: s.resize.rows }];
  if ("waitFor" in s) {
    const text = typeof s.waitFor === "string" ? s.waitFor : s.waitFor.text;
    const timeoutStr = typeof s.waitFor === "string" ? s.timeout : s.waitFor.timeout;
    const wf: Step = { kind: "waitFor", text };
    if (timeoutStr !== undefined) wf.timeoutMs = parseDuration(timeoutStr);
    return [wf];
  }
  if ("sleep" in s) return [{ kind: "sleep", ms: parseDuration(s.sleep) }];
  if ("snapshot" in s) return [{ kind: "snapshot", as: s.snapshot.as, path: s.snapshot.path }];
  throw new Error(`unknown step type: ${JSON.stringify(s)}`);
}

function normalizeExpect(e: any): Expectation {
  if ("contains" in e) return { kind: "contains", text: e.contains };
  if ("line" in e) {
    const line: Expectation = { kind: "line", at: e.line.at };
    if (e.line.equals !== undefined) line.equals = e.line.equals;
    if (e.line.contains !== undefined) line.contains = e.line.contains;
    if (e.line.matches !== undefined) line.matches = e.line.matches;
    return line;
  }
  if ("expectSnapshot" in e) return { kind: "expectSnapshot", path: e.expectSnapshot };
  if ("exitCode" in e) return { kind: "exitCode", code: e.exitCode };
  if ("noWarnings" in e) return { kind: "noWarnings" };
  if ("frameCount" in e) {
    const fc: Expectation = { kind: "frameCount" };
    if (e.frameCount.min !== undefined) fc.min = e.frameCount.min;
    if (e.frameCount.max !== undefined) fc.max = e.frameCount.max;
    return fc;
  }
  throw new Error(`unknown expect type: ${JSON.stringify(e)}`);
}
