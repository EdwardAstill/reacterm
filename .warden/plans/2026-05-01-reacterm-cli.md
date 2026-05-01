# Reacterm CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task when tasks are independent. For same-session manual execution, follow this plan directly. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI binary (`reacterm`) with four verbs (`demo`, `run`, `drive`, `test`) that wraps the existing `src/testing/` harness and exposes scenario-based automation/checks via shell. `run --capture <path>` records the interactive session into a `.scenario.yaml` file consumable by `drive` and `test`. Cut from earlier scope: separate `record` verb (folded into `run --capture`), `explore` (use `exploreForTest` library export from a test file).

**Machine plan:** 2026-05-01-reacterm-cli.yaml

**Architecture:** Single binary, single engine. The engine layer wraps `src/testing/` exports and adds three new pieces (dynamic module loader via `tsx`, async `waitFor` polling, scenario-shape normalization). Each CLI verb is a thin module that constructs a Scenario object and hands it to the engine. `--jobs` parallelism uses child-process-per-scenario isolation. `demo` is a first-class verb with no args that hardcodes the path to `examples/reacterm-demo.tsx`.

**Tech Stack:** TypeScript, Vitest, Node ≥20, React 18/19, `tsx` (already present), `commander` (new — order-preserving repeated flags), `zod` (new — scenario validation), `js-yaml` (new — YAML parser, lazy-loaded).

**Recommended Skills:** test-driven-development, typescript, docs-writing, verification-before-completion

**Recommended MCPs:** none

**Status:** approved
**Refinement passes:** 1

---

## Spec reference

Approved spec: `.warden/specs/2026-05-01-reacterm-cli-design.md`. Re-read before starting any task.

---

## File structure

```
bin/reacterm.mjs                              # MODIFY: thin dispatcher (was demo launcher)

src/cli/
  index.ts                                    # CREATE: main entry, parse argv, dispatch verb, install signals
  context.ts                                  # CREATE: shared CLI context (cwd, stdout, stderr, isatty, env)
  errors.ts                                   # CREATE: typed CLI errors with hint formatting

  schema/
    types.ts                                  # CREATE: Scenario / Step / Expect TypeScript types
    duration.ts                               # CREATE: parse "100ms" / "2s" / "1m" → ms number
    parse.ts                                  # CREATE: YAML/JSON → validated Scenario via zod (async)
    normalize.ts                              # CREATE: expand press arrays, scroll YAML→harness shape

  engine/
    moduleLoader.ts                           # CREATE: dynamic load <entry> via tsx → ReactElement
    pollWaitFor.ts                            # CREATE: async poll-until-text-or-timeout layer
    capture.ts                                # CREATE: capture frame as text/svg/json/ndjson
    runScenario.ts                            # CREATE: orchestrate schema → driver → capture → result
    snapshot.ts                               # CREATE: write/compare snapshots, capability fingerprint

  reporters/
    pretty.ts                                 # CREATE: colored summary
    json.ts                                   # CREATE: single JSON object per run
    ndjson.ts                                 # CREATE: streaming events
    tap.ts                                    # CREATE: TAP format

  recorder/                                   # used by `run --capture`
    eventSink.ts                              # CREATE: tap key/click events from running app
    debounce.ts                               # CREATE: coalesce keystrokes into type steps
    redact.ts                                 # CREATE: regex scrub of typed input
    serializer.ts                             # CREATE: events → scenario YAML (with $schema header)

  signals/
    handler.ts                                # CREATE: SIGINT/SIGTERM/SIGHUP install + escalation

  workers/
    scenarioWorker.ts                         # CREATE: child-process worker for --jobs isolation
    dispatch.ts                               # CREATE: parent-side dispatch + concurrency pool

  verbs/
    run.ts                                    # CREATE: interactive launch with optional --capture
    drive.ts                                  # CREATE: scripted execution + capture
    test.ts                                   # CREATE: scenario discovery + assertions + reporters
    demo.ts                                   # CREATE: launch examples/reacterm-demo.tsx (no args)

src/cli/__tests__/
  schema/{duration,parse,normalize,types}.test.ts
  engine/{moduleLoader,pollWaitFor,capture,runScenario,snapshot}.test.ts
  reporters/{pretty,json,ndjson,tap}.test.ts
  recorder/{debounce,redact,serializer}.test.ts
  signals/handler.test.ts
  verbs/demo.test.ts
  integration/
    drive.integration.test.ts
    test.integration.test.ts
    run-capture.integration.test.ts
    signals.integration.test.ts
    jobs-isolation.integration.test.ts
    inline-flag-order.integration.test.ts
    snapshot-drift.integration.test.ts
    bin-help.integration.test.ts
  fixtures/hello-app.tsx
  fixtures/scenarios/{pass,fail}.scenario.yaml

docs/cli.md                                   # CREATE: user-facing reference
docs/cli-output.md                            # CREATE: versioned schema contracts
docs/scenarios.md                             # CREATE: schema reference + recipes

package.json                                  # MODIFY: add commander/zod/js-yaml deps
```

---

## Phase plan

- **Phase 1 — Foundations** (Tasks 1–6): deps, schema (normalize before parse — DAG), duration, types, errors/context.
- **Phase 2 — Engine** (Tasks 7–12): module loader, polling, capture, runScenario, signal handler, worker.
- **Phase 3 — Verbs + reporters** (Tasks 13–21): four reporters, drive, test, recorder primitives, run with --capture, demo.
- **Phase 4 — Polish + docs** (Tasks 22–25): CLI dispatcher, bin replacement, signal integration, docs.
- **Phase 5 — Snapshot semantics + acceptance** (Tasks 26–27): expectSnapshot + capability fingerprint, then spec acceptance review.

---

## Tasks

### Task 1: Add CLI dependencies

**Files:**
- Modify: `package.json` (add `commander`, `zod`, `js-yaml`, `@types/js-yaml`)

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

Create `src/cli/__tests__/deps.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("CLI dependencies", () => {
  it("commander is importable", async () => {
    const mod = await import("commander");
    expect(typeof mod.Command).toBe("function");
  });
  it("zod is importable", async () => {
    const mod = await import("zod");
    expect(typeof mod.z.object).toBe("function");
  });
  it("js-yaml is importable", async () => {
    const mod = await import("js-yaml");
    const load = (mod as any).load ?? (mod as any).default?.load;
    expect(typeof load).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/deps.test.ts`
Expected: FAIL — module-not-found.

- [ ] **Step 3: Install deps**

Run: `bun add commander@^12 zod@^3 js-yaml@^4 && bun add -d @types/js-yaml@^4`

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run vitest run src/cli/__tests__/deps.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lockb src/cli/__tests__/deps.test.ts
git commit -m "feat(cli): add commander/zod/js-yaml deps for CLI build"
```

---

### Task 2: Duration string parser

**Files:**
- Create: `src/cli/schema/duration.ts`
- Test: `src/cli/__tests__/schema/duration.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseDuration } from "../../schema/duration.js";

describe("parseDuration", () => {
  it("parses ms suffix", () => expect(parseDuration("100ms")).toBe(100));
  it("parses s suffix", () => expect(parseDuration("2s")).toBe(2000));
  it("parses m suffix", () => expect(parseDuration("1m")).toBe(60_000));
  it("rejects fractional", () => expect(() => parseDuration("1.5s")).toThrow(/integer/i));
  it("rejects bare numbers", () => expect(() => parseDuration("100")).toThrow(/unit/i));
  it("rejects unknown unit", () => expect(() => parseDuration("5h")).toThrow(/unit/i));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/schema/duration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/cli/schema/duration.ts
const RE = /^(\d+)(ms|s|m)$/;
const UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60_000 };

export function parseDuration(input: string): number {
  const m = RE.exec(input);
  if (!m) {
    if (/\./.test(input)) throw new Error(`duration must be an integer with a unit suffix: ${input}`);
    throw new Error(`duration must end with a unit (ms|s|m): ${input}`);
  }
  return Number(m[1]) * UNITS[m[2]];
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/schema/duration.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/schema/duration.ts src/cli/__tests__/schema/duration.test.ts
git commit -m "feat(cli): duration string parser (ms/s/m, integer-only)"
```

---

### Task 3: Scenario types (TypeScript)

**Files:**
- Create: `src/cli/schema/types.ts`
- Test: `src/cli/__tests__/schema/types.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { Scenario, Step, Expectation } from "../../schema/types.js";

describe("scenario types", () => {
  it("Scenario allows entry omission (CLI-supplied)", () => {
    const s: Scenario = { version: 1, name: "x", steps: [] };
    expectTypeOf(s.entry).toEqualTypeOf<string | undefined>();
  });
  it("Step is a discriminated union covering all spec verbs", () => {
    const steps: Step[] = [
      { kind: "press", keys: ["tab"] },
      { kind: "type", text: "x" },
      { kind: "paste", text: "x" },
      { kind: "click", x: 1, y: 1 },
      { kind: "scroll", direction: "up" },
      { kind: "resize", cols: 80, rows: 24 },
      { kind: "waitFor", text: "ok", timeoutMs: 2000 },
      { kind: "sleep", ms: 100 },
      { kind: "snapshot", as: "svg", path: "x.svg" },
    ];
    expectTypeOf(steps).toEqualTypeOf<Step[]>();
  });
  it("Expectation covers spec contract types", () => {
    const e: Expectation[] = [
      { kind: "contains", text: "x" },
      { kind: "line", at: 0, equals: "x" },
      { kind: "expectSnapshot", path: "x.svg" },
      { kind: "exitCode", code: 0 },
      { kind: "noWarnings" },
      { kind: "frameCount", min: 1 },
    ];
    expectTypeOf(e).toEqualTypeOf<Expectation[]>();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/schema/types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/cli/schema/types.ts
export type ScrollDirection = "up" | "down";
export type ClickTarget = { x: number; y: number };

export type Step =
  | { kind: "press"; keys: string[] }
  | { kind: "type"; text: string }
  | { kind: "paste"; text: string }
  | { kind: "click"; x: number; y: number; button?: "left" | "right" | "middle" }
  | { kind: "scroll"; direction: ScrollDirection; target?: ClickTarget }
  | { kind: "resize"; cols: number; rows: number }
  | { kind: "waitFor"; text: string; timeoutMs?: number }
  | { kind: "sleep"; ms: number }
  | { kind: "snapshot"; as: "svg" | "text" | "json"; path: string };

export type Expectation =
  | { kind: "contains"; text: string }
  | { kind: "line"; at: number; equals?: string; contains?: string; matches?: string }
  | { kind: "expectSnapshot"; path: string }
  | { kind: "exitCode"; code: number }
  | { kind: "noWarnings" }
  | { kind: "frameCount"; min?: number; max?: number };

export interface Scenario {
  version: 1;
  name: string;
  entry?: string;
  size?: { cols: number; rows: number };
  env?: Record<string, string>;
  timeoutMs?: number;
  steps: Step[];
  expect?: Expectation[];
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/schema/types.test.ts && bun run build`
Expected: tests pass + tsc compiles.

- [ ] **Step 5: Commit**

```bash
git add src/cli/schema/types.ts src/cli/__tests__/schema/types.test.ts
git commit -m "feat(cli): Scenario/Step/Expectation discriminated unions"
```

---

### Task 4: Schema normalize (raw → engine shape)

**Files:**
- Create: `src/cli/schema/normalize.ts`
- Test: `src/cli/__tests__/schema/normalize.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizeScenario } from "../../schema/normalize.js";

describe("normalizeScenario", () => {
  it("expands press array into N press steps", () => {
    const s = normalizeScenario(
      { version: 1, name: "x", steps: [{ press: ["tab", "tab", "enter"] }] } as any,
      "x.yaml",
    );
    expect(s.steps).toEqual([
      { kind: "press", keys: ["tab"] },
      { kind: "press", keys: ["tab"] },
      { kind: "press", keys: ["enter"] },
    ]);
  });

  it("converts waitFor string-form to object form with default timeout", () => {
    const s = normalizeScenario(
      { version: 1, name: "x", steps: [{ waitFor: "ok" }] } as any,
      "x.yaml",
    );
    expect(s.steps[0]).toEqual({ kind: "waitFor", text: "ok", timeoutMs: undefined });
  });

  it("parses timeout strings to ms", () => {
    const s = normalizeScenario(
      { version: 1, name: "x", timeout: "5s", steps: [{ sleep: "100ms" }] } as any,
      "x.yaml",
    );
    expect(s.timeoutMs).toBe(5000);
    expect(s.steps[0]).toEqual({ kind: "sleep", ms: 100 });
  });

  it("preserves scroll target", () => {
    const s = normalizeScenario(
      { version: 1, name: "x", steps: [{ scroll: { direction: "down", target: { x: 5, y: 5 } } }] } as any,
      "x.yaml",
    );
    expect(s.steps[0]).toEqual({ kind: "scroll", direction: "down", target: { x: 5, y: 5 } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/schema/normalize.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/schema/normalize.ts
import { parseDuration } from "./duration.js";
import type { Scenario, Step, Expectation } from "./types.js";

export function normalizeScenario(raw: any, _filename: string): Scenario {
  const steps: Step[] = raw.steps.flatMap(normalizeStep);
  const expects: Expectation[] | undefined = raw.expect?.map(normalizeExpect);
  return {
    version: 1,
    name: raw.name,
    entry: raw.entry,
    size: raw.size,
    env: raw.env,
    timeoutMs: raw.timeout ? parseDuration(raw.timeout) : undefined,
    steps,
    expect: expects,
  };
}

function normalizeStep(s: any): Step[] {
  if ("press" in s) {
    const keys = Array.isArray(s.press) ? s.press : [s.press];
    return keys.map((k: string) => ({ kind: "press" as const, keys: [k] }));
  }
  if ("type" in s) return [{ kind: "type", text: s.type }];
  if ("paste" in s) return [{ kind: "paste", text: s.paste }];
  if ("click" in s) return [{ kind: "click", x: s.click.x, y: s.click.y, button: s.click.button }];
  if ("scroll" in s) return [{ kind: "scroll", direction: s.scroll.direction, target: s.scroll.target }];
  if ("resize" in s) return [{ kind: "resize", cols: s.resize.cols, rows: s.resize.rows }];
  if ("waitFor" in s) {
    const text = typeof s.waitFor === "string" ? s.waitFor : s.waitFor.text;
    const timeoutStr = typeof s.waitFor === "string" ? s.timeout : s.waitFor.timeout;
    return [{ kind: "waitFor", text, timeoutMs: timeoutStr ? parseDuration(timeoutStr) : undefined }];
  }
  if ("sleep" in s) return [{ kind: "sleep", ms: parseDuration(s.sleep) }];
  if ("snapshot" in s) return [{ kind: "snapshot", as: s.snapshot.as, path: s.snapshot.path }];
  throw new Error(`unknown step type: ${JSON.stringify(s)}`);
}

function normalizeExpect(e: any): Expectation {
  if ("contains" in e) return { kind: "contains", text: e.contains };
  if ("line" in e) return { kind: "line", at: e.line.at, equals: e.line.equals, contains: e.line.contains, matches: e.line.matches };
  if ("expectSnapshot" in e) return { kind: "expectSnapshot", path: e.expectSnapshot };
  if ("exitCode" in e) return { kind: "exitCode", code: e.exitCode };
  if ("noWarnings" in e) return { kind: "noWarnings" };
  if ("frameCount" in e) return { kind: "frameCount", min: e.frameCount.min, max: e.frameCount.max };
  throw new Error(`unknown expect type: ${JSON.stringify(e)}`);
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/schema/normalize.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/schema/normalize.ts src/cli/__tests__/schema/normalize.test.ts
git commit -m "feat(cli): scenario normalization (press array expansion, scroll/waitFor shape)"
```

---

### Task 5: Schema parse (YAML/JSON → validated Scenario, async)

**Files:**
- Create: `src/cli/schema/parse.ts`
- Test: `src/cli/__tests__/schema/parse.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseScenario } from "../../schema/parse.js";

const GOOD_YAML = `
version: 1
name: smoke
entry: src/App.tsx
steps:
  - press: tab
  - type: "hello"
  - waitFor: "Saved"
    timeout: 2s
expect:
  - contains: "Bye"
`;

describe("parseScenario", () => {
  it("parses good YAML and returns a Scenario", async () => {
    const s = await parseScenario(GOOD_YAML, "smoke.yaml");
    expect(s.name).toBe("smoke");
    expect(s.steps).toHaveLength(3);
    expect(s.steps[2]).toMatchObject({ kind: "waitFor", text: "Saved", timeoutMs: 2000 });
  });

  it("parses good JSON identically", async () => {
    const json = JSON.stringify({ version: 1, name: "smoke", steps: [{ press: "tab" }] });
    const s = await parseScenario(json, "smoke.json");
    expect(s.steps[0]).toEqual({ kind: "press", keys: ["tab"] });
  });

  it("rejects unknown step type with offending key in message", async () => {
    await expect(parseScenario(`version: 1\nname: x\nsteps:\n  - leap: 5\n`, "x.yaml"))
      .rejects.toThrow(/leap/);
  });

  it("rejects missing version", async () => {
    await expect(parseScenario(`name: x\nsteps: []\n`, "x.yaml")).rejects.toThrow(/version/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/schema/parse.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/schema/parse.ts
import { z } from "zod";
import { normalizeScenario } from "./normalize.js";
import type { Scenario } from "./types.js";

const RawStep = z.union([
  z.object({ press: z.union([z.string(), z.array(z.string())]) }).passthrough(),
  z.object({ type: z.string() }).passthrough(),
  z.object({ paste: z.string() }).passthrough(),
  z.object({ click: z.object({ x: z.number(), y: z.number(), button: z.string().optional() }) }).passthrough(),
  z.object({ scroll: z.object({ direction: z.enum(["up", "down"]), target: z.object({ x: z.number(), y: z.number() }).optional() }) }).passthrough(),
  z.object({ resize: z.object({ cols: z.number(), rows: z.number() }) }).passthrough(),
  z.object({ waitFor: z.union([z.string(), z.object({ text: z.string(), timeout: z.string().optional() })]), timeout: z.string().optional() }).passthrough(),
  z.object({ sleep: z.string() }).passthrough(),
  z.object({ snapshot: z.object({ as: z.enum(["svg", "text", "json"]), path: z.string() }) }).passthrough(),
]);

const RawExpect = z.union([
  z.object({ contains: z.string() }),
  z.object({ line: z.object({ at: z.number(), equals: z.string().optional(), contains: z.string().optional(), matches: z.string().optional() }) }),
  z.object({ expectSnapshot: z.string() }),
  z.object({ exitCode: z.number() }),
  z.object({ noWarnings: z.boolean() }),
  z.object({ frameCount: z.object({ min: z.number().optional(), max: z.number().optional() }) }),
]);

const RawScenario = z.object({
  version: z.literal(1),
  name: z.string(),
  entry: z.string().optional(),
  size: z.object({ cols: z.number(), rows: z.number() }).optional(),
  env: z.record(z.string()).optional(),
  timeout: z.string().optional(),
  steps: z.array(RawStep),
  expect: z.array(RawExpect).optional(),
});

export async function parseScenario(source: string, filename: string): Promise<Scenario> {
  let raw: unknown;
  if (filename.endsWith(".json") || source.trim().startsWith("{")) {
    raw = JSON.parse(source);
  } else {
    // Lazy ESM import; tolerate both ESM-named and CJS-default shapes.
    const yamlMod = await import("js-yaml");
    const load = (yamlMod as any).load ?? (yamlMod as any).default?.load;
    raw = load(source);
  }
  const parsed = RawScenario.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`scenario ${filename}: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return normalizeScenario(parsed.data, filename);
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/schema/parse.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/schema/parse.ts src/cli/__tests__/schema/parse.test.ts
git commit -m "feat(cli): zod-validated YAML/JSON scenario parser (async)"
```

---

### Task 6: Errors + CLI context

**Files:**
- Create: `src/cli/errors.ts`, `src/cli/context.ts`
- Test: `src/cli/__tests__/errors.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { CliError, formatError } from "../errors.js";

describe("CliError", () => {
  it("formats with hint", () => {
    const e = new CliError("could not load entry `src/App.tsx`: no such file", { hint: "relative paths resolve from cwd" });
    expect(formatError(e)).toBe(
      "error: could not load entry `src/App.tsx`: no such file\nhint: relative paths resolve from cwd",
    );
  });
  it("formats without hint", () => {
    const e = new CliError("bad");
    expect(formatError(e)).toBe("error: bad");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/errors.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/errors.ts
export class CliError extends Error {
  hint?: string;
  exitCode: number;
  constructor(message: string, opts: { hint?: string; exitCode?: number } = {}) {
    super(message);
    this.hint = opts.hint;
    this.exitCode = opts.exitCode ?? 1;
  }
}

export function formatError(e: unknown): string {
  if (e instanceof CliError) {
    return e.hint ? `error: ${e.message}\nhint: ${e.hint}` : `error: ${e.message}`;
  }
  return `error: ${(e as Error).message ?? String(e)}`;
}
```

```ts
// src/cli/context.ts
import { isatty } from "node:tty";
export interface CliContext {
  cwd: string;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
  env: NodeJS.ProcessEnv;
  isStdoutTty: boolean;
  isStderrTty: boolean;
  noColor: boolean;
}

export function createContext(): CliContext {
  return {
    cwd: process.cwd(),
    stdout: process.stdout,
    stderr: process.stderr,
    env: process.env,
    isStdoutTty: isatty(process.stdout.fd),
    isStderrTty: isatty(process.stderr.fd),
    noColor: "NO_COLOR" in process.env,
  };
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/errors.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/errors.ts src/cli/context.ts src/cli/__tests__/errors.test.ts
git commit -m "feat(cli): typed CliError + shared CliContext"
```

---

### Task 7: Dynamic module loader

**Files:**
- Create: `src/cli/engine/moduleLoader.ts`
- Create: `src/cli/__tests__/fixtures/hello-app.tsx`
- Test: `src/cli/__tests__/engine/moduleLoader.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

Fixture:
```tsx
// src/cli/__tests__/fixtures/hello-app.tsx
import { Box, Text } from "../../../components/index.js";
export default function App() {
  return <Box><Text>Hello from fixture</Text></Box>;
}
```

Test:
```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadEntry } from "../../engine/moduleLoader.js";

describe("loadEntry", () => {
  it("loads a .tsx file's default export as a React element", async () => {
    const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
    const element = await loadEntry(fixture, {});
    expect(element).toBeTruthy();
    expect((element as any).type).toBeTypeOf("function");
  });

  it("throws CliError with hint when file missing", async () => {
    await expect(loadEntry("/nope.tsx", {})).rejects.toMatchObject({
      message: expect.stringMatching(/no such file/),
      hint: expect.stringMatching(/cwd/),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/engine/moduleLoader.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/engine/moduleLoader.ts
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { CliError } from "../errors.js";

export async function loadEntry(entryPath: string, env: Record<string, string>): Promise<unknown> {
  if (!existsSync(entryPath)) {
    throw new CliError(`could not load entry \`${entryPath}\`: no such file`, {
      hint: `relative paths resolve from cwd (${process.cwd()})`,
      exitCode: 2,
    });
  }
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  const url = pathToFileURL(entryPath).href + `?t=${Date.now()}`;
  const mod = await import(url);
  const Default = mod.default;
  if (!Default) throw new CliError(`entry \`${entryPath}\` has no default export`);
  return typeof Default === "function" ? createElement(Default) : Default;
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/engine/moduleLoader.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/engine/moduleLoader.ts src/cli/__tests__/engine/moduleLoader.test.ts src/cli/__tests__/fixtures/hello-app.tsx
git commit -m "feat(cli): dynamic entry-file loader (path → React element)"
```

---

### Task 8: Async waitFor polling

**Files:**
- Create: `src/cli/engine/pollWaitFor.ts`
- Test: `src/cli/__tests__/engine/pollWaitFor.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { pollWaitFor } from "../../engine/pollWaitFor.js";

describe("pollWaitFor", () => {
  it("resolves when predicate true on first tick", async () => {
    const { matched, elapsedMs } = await pollWaitFor(() => true, { timeoutMs: 1000, tickMs: 16 });
    expect(matched).toBe(true);
    expect(elapsedMs).toBeLessThan(50);
  });

  it("polls until predicate flips true", async () => {
    let n = 0;
    const { matched } = await pollWaitFor(() => ++n > 5, { timeoutMs: 1000, tickMs: 10 });
    expect(matched).toBe(true);
    expect(n).toBeGreaterThanOrEqual(6);
  });

  it("returns {matched:false} after timeout", async () => {
    const t0 = Date.now();
    const { matched, elapsedMs } = await pollWaitFor(() => false, { timeoutMs: 100, tickMs: 16 });
    expect(matched).toBe(false);
    expect(elapsedMs).toBeGreaterThanOrEqual(100);
    expect(Date.now() - t0).toBeLessThan(300);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/engine/pollWaitFor.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/engine/pollWaitFor.ts
export interface PollOptions { timeoutMs: number; tickMs: number; }
export interface PollResult { matched: boolean; elapsedMs: number; }

export async function pollWaitFor(predicate: () => boolean, opts: PollOptions): Promise<PollResult> {
  const start = Date.now();
  while (Date.now() - start < opts.timeoutMs) {
    if (predicate()) return { matched: true, elapsedMs: Date.now() - start };
    await new Promise((r) => setTimeout(r, opts.tickMs));
  }
  return { matched: false, elapsedMs: Date.now() - start };
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/engine/pollWaitFor.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/engine/pollWaitFor.ts src/cli/__tests__/engine/pollWaitFor.test.ts
git commit -m "feat(cli): async waitFor polling (16ms tick, configurable timeout)"
```

---

### Task 9: Capture (text/svg/json/ndjson)

**Files:**
- Create: `src/cli/engine/capture.ts`
- Test: `src/cli/__tests__/engine/capture.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import React from "react";
import { captureFinal } from "../../engine/capture.js";
import { renderForTest } from "../../../testing/index.js";
import { Box, Text } from "../../../components/index.js";

describe("capture", () => {
  it("text capture contains rendered text", async () => {
    const r = renderForTest(<Box><Text>hi</Text></Box>);
    expect(await captureFinal(r, { as: "text" })).toContain("hi");
  });
  it("svg capture starts with <svg", async () => {
    const r = renderForTest(<Box><Text>hi</Text></Box>);
    expect((await captureFinal(r, { as: "svg" })).startsWith("<svg")).toBe(true);
  });
  it("json capture is parseable", async () => {
    const r = renderForTest(<Box><Text>hi</Text></Box>);
    const parsed = JSON.parse(await captureFinal(r, { as: "json" }));
    expect(parsed.finalText).toContain("hi");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/engine/capture.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/engine/capture.ts
import type { TestRenderResult } from "../../testing/index.js";
import { renderToSvg } from "../../testing/svg-renderer.js";

export type CaptureFmt = "text" | "svg" | "json" | "ndjson";

export async function captureFinal(r: TestRenderResult, opts: { as: CaptureFmt }): Promise<string> {
  switch (opts.as) {
    case "text": return r.output;
    case "svg":  return renderToSvg(r);
    case "json": return JSON.stringify({ finalText: r.output, lines: r.lines, durationMs: 0 });
    case "ndjson": throw new Error("ndjson is for frame streams; use captureFrames");
  }
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/engine/capture.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/engine/capture.ts src/cli/__tests__/engine/capture.test.ts
git commit -m "feat(cli): capture final frame as text/svg/json"
```

---

### Task 10: runScenario engine

**Files:**
- Create: `src/cli/engine/runScenario.ts`
- Test: `src/cli/__tests__/engine/runScenario.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runScenarioFromCli } from "../../engine/runScenario.js";

describe("runScenarioFromCli", () => {
  it("runs press sequence and returns finalText", async () => {
    const r = await runScenarioFromCli({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      scenario: { version: 1, name: "smoke", steps: [{ kind: "press", keys: ["tab"] }] },
    });
    expect(r.status).toBe("pass");
    expect(r.finalText).toContain("Hello");
  });

  it("waitFor times out and reports failure", async () => {
    const r = await runScenarioFromCli({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      scenario: { version: 1, name: "x", steps: [{ kind: "waitFor", text: "never", timeoutMs: 100 }] },
    });
    expect(r.status).toBe("fail");
    expect(r.failure).toMatch(/waitFor/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/engine/runScenario.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/engine/runScenario.ts
import { renderForTest, type TestRenderResult } from "../../testing/index.js";
import { loadEntry } from "./moduleLoader.js";
import { pollWaitFor } from "./pollWaitFor.js";
import type { Scenario, Step } from "../schema/types.js";

export interface RunResult {
  status: "pass" | "fail";
  failure?: string;
  finalText: string;
  finalSvg?: string;
  durationMs: number;
  /** Renderer handle for in-process callers; stripped before serialization across processes. */
  renderer?: TestRenderResult;
}

export interface RunOptions {
  entry: string;
  scenario: Scenario;
  size?: { cols: number; rows: number };
}

export async function runScenarioFromCli(opts: RunOptions): Promise<RunResult> {
  const start = Date.now();
  const element = await loadEntry(opts.entry, opts.scenario.env ?? {}) as any;
  const cols = opts.size?.cols ?? opts.scenario.size?.cols ?? 80;
  const rows = opts.size?.rows ?? opts.scenario.size?.rows ?? 24;
  const r = renderForTest(element, { cols, rows });

  for (const step of opts.scenario.steps) {
    try {
      await applyStep(r, step);
    } catch (e: any) {
      return {
        status: "fail",
        failure: `step ${step.kind}: ${e.message}`,
        finalText: r.output,
        durationMs: Date.now() - start,
        renderer: r,
      };
    }
  }
  return { status: "pass", finalText: r.output, durationMs: Date.now() - start, renderer: r };
}

async function applyStep(r: any, step: Step): Promise<void> {
  switch (step.kind) {
    case "press":    for (const k of step.keys) r.press(k); break;
    case "type":     r.type(step.text); break;
    case "paste":    r.paste(step.text); break;
    case "click":    r.click({ x: step.x, y: step.y }); break;
    case "scroll":   r.scroll(step.direction, step.target); break;
    case "resize":   r.resize(step.cols, step.rows); break;
    case "sleep":    await new Promise((res) => setTimeout(res, step.ms)); break;
    case "snapshot": /* file-write deferred to Task 28 */ break;
    case "waitFor": {
      const result = await pollWaitFor(() => r.output.includes(step.text), {
        timeoutMs: step.timeoutMs ?? 5000,
        tickMs: 16,
      });
      if (!result.matched) throw new Error(`waitFor "${step.text}" did not match within ${step.timeoutMs ?? 5000}ms`);
      break;
    }
  }
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/engine/runScenario.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/engine/runScenario.ts src/cli/__tests__/engine/runScenario.test.ts
git commit -m "feat(cli): runScenarioFromCli engine (load + drive + capture handle)"
```

---

### Task 11: Signal handler

**Files:**
- Create: `src/cli/signals/handler.ts`
- Test: `src/cli/__tests__/signals/handler.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { installSignalHandlers } from "../../signals/handler.js";

describe("installSignalHandlers", () => {
  it("calls onTeardown once on first signal", () => {
    const onTeardown = vi.fn();
    const onExit = vi.fn();
    const h = installSignalHandlers({ onTeardown, onExit });
    h.simulate("SIGINT");
    expect(onTeardown).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(130);
    h.dispose();
  });

  it("escalates to SIGKILL on second SIGINT within 2s", () => {
    const onForceKill = vi.fn();
    const onExit = vi.fn();
    const h = installSignalHandlers({ onTeardown: () => {}, onExit, onForceKill });
    h.simulate("SIGINT");
    h.simulate("SIGINT");
    expect(onForceKill).toHaveBeenCalled();
    h.dispose();
  });

  it("SIGHUP exits 129", () => {
    const onExit = vi.fn();
    const h = installSignalHandlers({ onTeardown: () => {}, onExit });
    h.simulate("SIGHUP");
    expect(onExit).toHaveBeenCalledWith(129);
    h.dispose();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/signals/handler.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/signals/handler.ts
type Sig = "SIGINT" | "SIGTERM" | "SIGHUP";
const EXITS: Record<Sig, number> = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };

export interface SignalOpts {
  onTeardown: () => void;
  onExit: (code: number) => void;
  onForceKill?: () => void;
  escalateWindowMs?: number;
}

export function installSignalHandlers(opts: SignalOpts) {
  let firstAt: number | null = null;
  const win = opts.escalateWindowMs ?? 2000;
  const handle = (sig: Sig) => {
    const now = Date.now();
    if (firstAt && now - firstAt < win) {
      opts.onForceKill?.();
      opts.onExit(EXITS[sig]);
      return;
    }
    firstAt = now;
    opts.onTeardown();
    opts.onExit(EXITS[sig]);
  };
  const listeners: Array<[Sig, (...a: any[]) => void]> = [];
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as Sig[]) {
    const fn = () => handle(sig);
    process.on(sig, fn);
    listeners.push([sig, fn]);
  }
  return {
    simulate: (sig: Sig) => handle(sig),
    dispose: () => listeners.forEach(([s, f]) => process.off(s, f)),
  };
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/signals/handler.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/signals/handler.ts src/cli/__tests__/signals/handler.test.ts
git commit -m "feat(cli): SIGINT/SIGTERM/SIGHUP handler with double-tap escalation"
```

---

### Task 12: Scenario worker (child-process for --jobs)

**Files:**
- Create: `src/cli/workers/scenarioWorker.ts`, `src/cli/workers/dispatch.ts`
- Test: `src/cli/__tests__/integration/jobs-isolation.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { dispatchScenarios } from "../../workers/dispatch.js";

describe("dispatchScenarios (child-process isolation)", () => {
  it("runs N scenarios in child processes and returns N results", async () => {
    const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarios = Array.from({ length: 3 }, (_, i) => ({
      entry: fixture,
      scenario: { version: 1 as const, name: `s${i}`, steps: [{ kind: "press" as const, keys: ["tab"] }] },
    }));
    const results = await dispatchScenarios(scenarios, { jobs: 2 });
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "pass")).toBe(true);
  }, 30_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/jobs-isolation.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/workers/scenarioWorker.ts
import { runScenarioFromCli } from "../engine/runScenario.js";
process.stdin.once("data", async (buf) => {
  try {
    const opts = JSON.parse(buf.toString("utf8"));
    const result = await runScenarioFromCli(opts);
    // Strip the renderer handle (not serializable across processes).
    const { renderer, ...serializable } = result;
    process.stdout.write(JSON.stringify(serializable));
    process.exit(0);
  } catch (e: any) {
    process.stdout.write(JSON.stringify({ status: "fail", failure: e.message, finalText: "", durationMs: 0 }));
    process.exit(1);
  }
});
```

```ts
// src/cli/workers/dispatch.ts
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RunOptions, RunResult } from "../engine/runScenario.js";

const WORKER = resolve(fileURLToPath(import.meta.url), "../scenarioWorker.ts");

export async function dispatchScenarios(scenarios: RunOptions[], opts: { jobs: number }): Promise<RunResult[]> {
  const results: RunResult[] = new Array(scenarios.length);
  const inFlight = new Set<Promise<void>>();
  let nextIdx = 0;

  const runOne = (idx: number, job: RunOptions): Promise<void> => new Promise((resolveP) => {
    const child = spawn(process.execPath, ["--import", "tsx", WORKER], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (c) => out += c.toString());
    child.on("close", () => {
      try { results[idx] = JSON.parse(out); }
      catch { results[idx] = { status: "fail", failure: "worker crashed", finalText: "", durationMs: 0 }; }
      resolveP();
    });
    child.stdin.write(JSON.stringify(job));
    child.stdin.end();
  });

  while (nextIdx < scenarios.length || inFlight.size > 0) {
    while (inFlight.size < opts.jobs && nextIdx < scenarios.length) {
      const idx = nextIdx++;
      const p: Promise<void> = runOne(idx, scenarios[idx]).then(() => { inFlight.delete(p); });
      inFlight.add(p);
    }
    if (inFlight.size > 0) await Promise.race(inFlight);
  }
  return results;
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/integration/jobs-isolation.integration.test.ts`
Expected: 1 passing within 30s.

- [ ] **Step 5: Commit**

```bash
git add src/cli/workers/ src/cli/__tests__/integration/jobs-isolation.integration.test.ts
git commit -m "feat(cli): child-process scenario worker for --jobs isolation"
```

---

### Task 13: Reporter — pretty

**Files:**
- Create: `src/cli/reporters/pretty.ts`
- Test: `src/cli/__tests__/reporters/pretty.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { prettyReporter } from "../../reporters/pretty.js";

describe("prettyReporter", () => {
  it("summarises pass/fail counts", () => {
    const out = prettyReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
      { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
    ], { color: false });
    expect(out).toMatch(/1 passed.*1 failed/);
    expect(out).toContain("b: x");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/reporters/pretty.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/reporters/pretty.ts
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
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/reporters/pretty.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/reporters/pretty.ts src/cli/__tests__/reporters/pretty.test.ts
git commit -m "feat(cli): pretty reporter (pass/fail summary)"
```

---

### Task 14: Reporter — json

**Files:**
- Create: `src/cli/reporters/json.ts`
- Test: `src/cli/__tests__/reporters/json.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { jsonReporter } from "../../reporters/json.js";

describe("jsonReporter", () => {
  it("emits valid JSON with summary", () => {
    const out = jsonReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
      { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
    ]);
    const parsed = JSON.parse(out);
    expect(parsed.summary.passed).toBe(1);
    expect(parsed.summary.failed).toBe(1);
    expect(parsed.scenarios).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/reporters/json.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/reporters/json.ts
import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & { name: string };

export function jsonReporter(results: Named[]): string {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.length - passed;
  return JSON.stringify({
    schemaVersion: 1,
    scenarios: results.map((r) => ({ name: r.name, status: r.status, failure: r.failure, durationMs: r.durationMs })),
    summary: { passed, failed, total: results.length },
  }, null, 2);
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/reporters/json.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/reporters/json.ts src/cli/__tests__/reporters/json.test.ts
git commit -m "feat(cli): json reporter (versioned schema)"
```

---

### Task 15: Reporter — ndjson

**Files:**
- Create: `src/cli/reporters/ndjson.ts`
- Test: `src/cli/__tests__/reporters/ndjson.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { ndjsonReporter } from "../../reporters/ndjson.js";

describe("ndjsonReporter", () => {
  it("emits one JSON object per line", () => {
    const out = ndjsonReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
    ]);
    const lines = out.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const l of lines) JSON.parse(l);
    expect(JSON.parse(lines[0]).type).toBe("start");
    expect(JSON.parse(lines.at(-1)!).type).toBe("summary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/reporters/ndjson.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/reporters/ndjson.ts
import type { RunResult } from "../engine/runScenario.js";
type Named = RunResult & { name: string };

export function ndjsonReporter(results: Named[]): string {
  const lines: string[] = [];
  lines.push(JSON.stringify({ type: "start", schemaVersion: 1 }));
  for (const r of results) {
    lines.push(JSON.stringify({ type: r.status, name: r.name, durationMs: r.durationMs, failure: r.failure }));
  }
  const passed = results.filter((r) => r.status === "pass").length;
  lines.push(JSON.stringify({ type: "summary", passed, failed: results.length - passed, total: results.length }));
  return lines.join("\n") + "\n";
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/reporters/ndjson.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/reporters/ndjson.ts src/cli/__tests__/reporters/ndjson.test.ts
git commit -m "feat(cli): ndjson reporter"
```

---

### Task 16: Reporter — tap

**Files:**
- Create: `src/cli/reporters/tap.ts`
- Test: `src/cli/__tests__/reporters/tap.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { tapReporter } from "../../reporters/tap.js";

describe("tapReporter", () => {
  it("emits TAP 13 with ok/not ok lines", () => {
    const out = tapReporter([
      { status: "pass", finalText: "", durationMs: 10, name: "a" },
      { status: "fail", failure: "x", finalText: "", durationMs: 20, name: "b" },
    ]);
    expect(out).toMatch(/^TAP version 13/);
    expect(out).toMatch(/1\.\.2/);
    expect(out).toMatch(/ok 1 - a/);
    expect(out).toMatch(/not ok 2 - b/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/reporters/tap.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/reporters/tap.ts
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
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/reporters/tap.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/reporters/tap.ts src/cli/__tests__/reporters/tap.test.ts
git commit -m "feat(cli): TAP 13 reporter"
```

---

### Task 17: Verb — `drive`

**Files:**
- Create: `src/cli/verbs/drive.ts`
- Test: `src/cli/__tests__/integration/drive.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runDrive } from "../../verbs/drive.js";
import { Writable } from "node:stream";

const collect = () => { let s = ""; return Object.assign(new Writable({ write(c, _e, cb) { s += c.toString(); cb(); } }), { get text() { return s; } }); };

describe("drive verb", () => {
  it("runs an inline-flag script and writes capture to stdout", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runDrive({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      inline: [{ kind: "press", keys: ["tab"] }],
      capture: "text", stdout, stderr,
    });
    expect(code).toBe(0);
    expect((stdout as any).text).toContain("Hello");
  });

  it("returns exit 1 on waitFor timeout", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runDrive({
      entry: resolve(__dirname, "../fixtures/hello-app.tsx"),
      inline: [{ kind: "waitFor", text: "never", timeoutMs: 100 }],
      capture: "text", stdout, stderr,
    });
    expect(code).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/drive.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/verbs/drive.ts
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
    size: opts.size,
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
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/integration/drive.integration.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/verbs/drive.ts src/cli/__tests__/integration/drive.integration.test.ts
git commit -m "feat(cli): drive verb (single-pass capture from runScenario renderer)"
```

---

### Task 18: Verb — `test`

**Files:**
- Create: `src/cli/verbs/test.ts`
- Create: `src/cli/__tests__/fixtures/scenarios/pass.scenario.yaml`, `fail.scenario.yaml`
- Test: `src/cli/__tests__/integration/test.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

Fixtures:

```yaml
# src/cli/__tests__/fixtures/scenarios/pass.scenario.yaml
version: 1
name: pass-case
entry: ../hello-app.tsx
steps:
  - press: tab
expect:
  - contains: "Hello"
```

```yaml
# src/cli/__tests__/fixtures/scenarios/fail.scenario.yaml
version: 1
name: fail-case
entry: ../hello-app.tsx
steps:
  - press: tab
expect:
  - contains: "Goodbye"
```

```ts
// src/cli/__tests__/integration/test.integration.test.ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runTest } from "../../verbs/test.js";
import { Writable } from "node:stream";

const collect = () => { let s = ""; return Object.assign(new Writable({ write(c, _e, cb) { s += c.toString(); cb(); } }), { get text() { return s; } }); };

describe("test verb", () => {
  it("exits 0 when expectations pass", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [resolve(__dirname, "../fixtures/scenarios/pass.scenario.yaml")],
      reporter: "pretty", stdout, stderr, jobs: 1,
    });
    expect(code).toBe(0);
  });

  it("exits 1 when expectations fail", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [resolve(__dirname, "../fixtures/scenarios/fail.scenario.yaml")],
      reporter: "pretty", stdout, stderr, jobs: 1,
    });
    expect(code).toBe(1);
  });

  it("exits 2 when --ci and -u given together", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [], reporter: "pretty", stdout, stderr, jobs: 1, ci: true, updateSnapshots: true,
    });
    expect(code).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/test.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/verbs/test.ts
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

export async function runTest(opts: TestOpts): Promise<number> {
  if (opts.ci && opts.updateSnapshots) {
    opts.stderr.write("error: --ci and -u are mutually exclusive\n");
    return 2;
  }
  const named: Array<RunResult & { name: string }> = [];
  for (const p of opts.paths) {
    const source = await readFile(p, "utf8");
    const scenario = await parseScenario(source, p);
    if (!scenario.entry) { opts.stderr.write(`error: ${p} has no entry\n`); return 2; }
    const entry = resolve(dirname(p), scenario.entry);
    const result = await runScenarioFromCli({ entry, scenario });
    const failures = checkExpectations(scenario.expect ?? [], result.finalText);
    const status = result.status === "pass" && failures.length === 0 ? "pass" : "fail";
    const failure = result.failure ?? failures.join("; ") || undefined;
    named.push({ ...result, renderer: undefined, status, failure, name: scenario.name });
  }
  let out = "";
  switch (opts.reporter) {
    case "pretty": out = prettyReporter(named, { color: false }); break;
    case "json":   out = jsonReporter(named); break;
    case "ndjson": out = ndjsonReporter(named); break;
    case "tap":    out = tapReporter(named); break;
  }
  opts.stdout.write(out + "\n");
  return named.some((r) => r.status === "fail") ? 1 : 0;
}

function checkExpectations(exps: Expectation[], finalText: string): string[] {
  const failures: string[] = [];
  for (const e of exps) {
    if (e.kind === "contains" && !finalText.includes(e.text)) failures.push(`expected text "${e.text}"`);
    // Other expectation kinds (line, expectSnapshot, exitCode, noWarnings, frameCount) are
    // handled by Task 28's snapshot extension, which replaces this checkExpectations.
  }
  return failures;
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/integration/test.integration.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/verbs/test.ts src/cli/__tests__/integration/test.integration.test.ts src/cli/__tests__/fixtures/scenarios/
git commit -m "feat(cli): test verb (scenario discovery + contains expectation + reporters)"
```

---

### Task 19: Recorder primitives (debounce + redact + serializer + eventSink)

**Files:**
- Create: `src/cli/recorder/{debounce,redact,serializer,eventSink}.ts`
- Test: `src/cli/__tests__/recorder/{debounce,redact,serializer}.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing tests**

```ts
// debounce.test.ts
import { describe, it, expect } from "vitest";
import { coalesceKeystrokes } from "../../recorder/debounce.js";

describe("coalesceKeystrokes", () => {
  it("merges contiguous text-keys within window into a single type step", () => {
    const events = [
      { t: 0,  kind: "key" as const, key: "h" },
      { t: 20, kind: "key" as const, key: "i" },
      { t: 50, kind: "key" as const, key: "tab" },
    ];
    expect(coalesceKeystrokes(events, 50)).toEqual([
      { kind: "type", text: "hi" },
      { kind: "press", keys: ["tab"] },
    ]);
  });
});
```

```ts
// redact.test.ts
import { describe, it, expect } from "vitest";
import { applyRedact } from "../../recorder/redact.js";

describe("applyRedact", () => {
  it("scrubs matched substrings", () => {
    expect(applyRedact("password123 keepme", /password\d+/)).toBe("[REDACTED] keepme");
  });
  it("noop without pattern", () => {
    expect(applyRedact("hi", undefined)).toBe("hi");
  });
});
```

```ts
// serializer.test.ts
import { describe, it, expect } from "vitest";
import { eventsToScenarioYaml } from "../../recorder/serializer.js";

describe("eventsToScenarioYaml", () => {
  it("emits valid YAML with $schema header and steps in order", async () => {
    const yaml = await eventsToScenarioYaml({
      name: "test", entry: "src/App.tsx", size: { cols: 80, rows: 24 },
      steps: [{ kind: "press", keys: ["tab"] }, { kind: "type", text: "hi" }],
    });
    expect(yaml).toMatch(/yaml-language-server: \$schema=/);
    expect(yaml).toMatch(/version: 1/);
    expect(yaml).toMatch(/press: tab/);
    expect(yaml).toMatch(/type: hi/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run vitest run src/cli/__tests__/recorder/`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

```ts
// src/cli/recorder/debounce.ts
type Ev = { t: number; kind: "key"; key: string };
type Step = { kind: "press"; keys: string[] } | { kind: "type"; text: string };
const TEXT_KEY = /^.$/u;

export function coalesceKeystrokes(events: Ev[], windowMs: number): Step[] {
  const out: Step[] = [];
  let buf = "";
  let lastT = -Infinity;
  const flush = () => { if (buf) { out.push({ kind: "type", text: buf }); buf = ""; } };
  for (const e of events) {
    if (TEXT_KEY.test(e.key) && e.t - lastT <= windowMs) buf += e.key;
    else if (TEXT_KEY.test(e.key)) { flush(); buf = e.key; }
    else { flush(); out.push({ kind: "press", keys: [e.key] }); }
    lastT = e.t;
  }
  flush();
  return out;
}
```

```ts
// src/cli/recorder/redact.ts
export function applyRedact(text: string, pattern: RegExp | undefined): string {
  return pattern ? text.replace(pattern, "[REDACTED]") : text;
}
```

```ts
// src/cli/recorder/eventSink.ts
export type RecordedEvent = { t: number; kind: "key"; key: string };

export class EventSink {
  events: RecordedEvent[] = [];
  start = Date.now();
  push(key: string) {
    this.events.push({ t: Date.now() - this.start, kind: "key", key });
  }
}
```

```ts
// src/cli/recorder/serializer.ts
import type { Step } from "../schema/types.js";

export interface RecorderResult {
  name: string;
  entry: string;
  size: { cols: number; rows: number };
  steps: Step[];
}

const SCHEMA_HEADER = `# yaml-language-server: $schema=https://reacterm.dev/schema/scenario-v1.json\n`;

export async function eventsToScenarioYaml(r: RecorderResult): Promise<string> {
  const yamlMod = await import("js-yaml");
  const dump = (yamlMod as any).dump ?? (yamlMod as any).default?.dump;
  const yamlSteps = r.steps.map((s) => {
    if (s.kind === "press") return { press: s.keys.length === 1 ? s.keys[0] : s.keys };
    if (s.kind === "type") return { type: s.text };
    return { [s.kind]: s };
  });
  const body = dump({ version: 1, name: r.name, entry: r.entry, size: r.size, steps: yamlSteps });
  return SCHEMA_HEADER + body;
}
```

- [ ] **Step 4: Run tests**

Run: `bun run vitest run src/cli/__tests__/recorder/`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/recorder/ src/cli/__tests__/recorder/
git commit -m "feat(cli): recorder primitives (debounce/redact/eventSink/serializer)"
```

---

### Task 20: Verb — `run` with `--capture`

**Files:**
- Create: `src/cli/verbs/run.ts`
- Test: `src/cli/__tests__/integration/run-capture.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { runRun } from "../../verbs/run.js";
import { parseScenario } from "../../schema/parse.js";

describe("run --capture", () => {
  it("writes a valid scenario YAML with $schema header that parses round-trip", async () => {
    const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
    const out = join(tmpdir(), `cap-${Date.now()}.scenario.yaml`);
    // Programmatic capture path — pre-seed events to avoid TTY interaction in test.
    const code = await runRun({
      entry: fixture,
      capture: out,
      _testEvents: [
        { t: 0, kind: "key", key: "tab" },
        { t: 30, kind: "key", key: "h" },
        { t: 50, kind: "key", key: "i" },
        { t: 100, kind: "key", key: "enter" },
      ],
    });
    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);
    const yaml = readFileSync(out, "utf8");
    expect(yaml).toMatch(/yaml-language-server: \$schema=/);
    const scenario = await parseScenario(yaml, out);
    expect(scenario.steps.map((s) => s.kind)).toEqual(["press", "type", "press"]);
  }, 30_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/run-capture.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/verbs/run.ts
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { coalesceKeystrokes } from "../recorder/debounce.js";
import { applyRedact } from "../recorder/redact.js";
import { eventsToScenarioYaml } from "../recorder/serializer.js";
import { EventSink, type RecordedEvent } from "../recorder/eventSink.js";

export interface RunOpts {
  entry: string;
  capture?: string;             // path to scenario file
  includeSnapshots?: boolean;
  redact?: RegExp;
  debounceMs?: number;
  size?: { cols: number; rows: number };
  /** Test-only: bypass TTY interaction by providing pre-seeded events. */
  _testEvents?: RecordedEvent[];
}

export async function runRun(opts: RunOpts): Promise<number> {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const tsx = resolve(rootDir, "node_modules/.bin/tsx");

  if (!opts.capture && !opts._testEvents) {
    // No-capture path: just spawn tsx <entry> with inherited stdio.
    return await new Promise<number>((res) => {
      const child = spawn(tsx, [opts.entry], { stdio: "inherit" });
      child.on("exit", (code) => res(code ?? 1));
    });
  }

  // Capture path: collect keystrokes via EventSink, write scenario on exit.
  const sink = new EventSink();
  if (opts._testEvents) {
    for (const e of opts._testEvents) sink.events.push(e);
  } else {
    process.stderr.write(`[reacterm] recording session → ${opts.capture}\n`);
    process.stdin.setRawMode?.(true);
    process.stdin.on("data", (buf) => sink.push(buf.toString("utf8")));
    await new Promise<number>((res) => {
      const child = spawn(tsx, [opts.entry], { stdio: ["pipe", "inherit", "inherit"] });
      process.stdin.pipe(child.stdin);
      child.on("exit", (code) => res(code ?? 1));
    });
  }

  const steps = coalesceKeystrokes(sink.events, opts.debounceMs ?? 50);
  if (opts.redact) {
    for (const s of steps) if (s.kind === "type") s.text = applyRedact(s.text, opts.redact);
  }
  const yaml = await eventsToScenarioYaml({
    name: "recorded",
    entry: opts.entry,
    size: opts.size ?? { cols: 80, rows: 24 },
    steps,
  });
  await writeFile(opts.capture!, yaml, "utf8");
  if (!opts._testEvents) {
    process.stderr.write(`[reacterm] wrote ${steps.length} steps to ${opts.capture}\n`);
  }
  return 0;
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/integration/run-capture.integration.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/verbs/run.ts src/cli/__tests__/integration/run-capture.integration.test.ts
git commit -m "feat(cli): run verb with --capture (records session to scenario YAML)"
```

---

### Task 21: Verb — `demo`

**Files:**
- Create: `src/cli/verbs/demo.ts`
- Test: `src/cli/__tests__/verbs/demo.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { runDemo, DEMO_PATH } from "../../verbs/demo.js";

describe("demo verb", () => {
  it("DEMO_PATH points to examples/reacterm-demo.tsx and that file exists", () => {
    expect(DEMO_PATH).toMatch(/examples\/reacterm-demo\.tsx$/);
    expect(existsSync(DEMO_PATH)).toBe(true);
  });

  it("runDemo returns a numeric exit code", async () => {
    const code = await runDemo();
    expect(code).toBeTypeOf("number");
  }, 30_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/verbs/demo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/verbs/demo.ts
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const DEMO_PATH = resolve(ROOT, "examples/reacterm-demo.tsx");

export async function runDemo(): Promise<number> {
  const tsx = resolve(ROOT, "node_modules/.bin/tsx");
  const result = spawnSync(tsx, [DEMO_PATH], { stdio: "inherit" });
  return result.status ?? 1;
}
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/verbs/demo.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/verbs/demo.ts src/cli/__tests__/verbs/demo.test.ts
git commit -m "feat(cli): demo verb (no args, spawns tsx examples/reacterm-demo.tsx)"
```

---

### Task 22: CLI entry — argument parser + dispatcher

**Files:**
- Create: `src/cli/index.ts`
- Test: `src/cli/__tests__/integration/inline-flag-order.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const BIN = resolve(__dirname, "../../../../bin/reacterm.mjs");
const FIXTURE = resolve(__dirname, "../fixtures/hello-app.tsx");

describe("inline flag ordering", () => {
  it("processes --press, --type, --press in command-line order", () => {
    const a = spawnSync("node", [BIN, "drive", FIXTURE, "--press", "tab", "--type", "hi", "--press", "enter", "--capture", "json"], { encoding: "utf8" });
    const b = spawnSync("node", [BIN, "drive", FIXTURE, "--press", "enter", "--type", "hi", "--press", "tab", "--capture", "json"], { encoding: "utf8" });
    expect(a.status).toBe(0);
    expect(b.status).toBe(0);
    expect(a.stdout).not.toBe(b.stdout);
  }, 30_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/inline-flag-order.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/index.ts
import { Command } from "commander";
import { cpus } from "node:os";
import { runDrive } from "./verbs/drive.js";
import { runTest } from "./verbs/test.js";
import { runDemo } from "./verbs/demo.js";
import { runRun } from "./verbs/run.js";
import { formatError } from "./errors.js";
import { parseDuration } from "./schema/duration.js";
import type { Step } from "./schema/types.js";

const program = new Command()
  .name("reacterm")
  .description("react renderer for the terminal")
  .version("0.2.0");

program.command("demo")
  .description("Launch the bundled showcase")
  .action(async () => process.exit(await runDemo()));

program.command("run <entry>")
  .description("Launch a reacterm app interactively; --capture records the session")
  .option("--capture <path>", "record session to a scenario file (.scenario.yaml)")
  .option("--include-snapshots", "with --capture: emit snapshot step at each Enter")
  .option("--redact <regex>", "with --capture: scrub matched typed input")
  .option("--debounce <dur>", "with --capture: keystroke coalesce window", "50ms")
  .option("--size <wxh>", "force virtual size")
  .option("--no-alt-screen", "render inline instead of alt buffer")
  .action(async (entry, opts) => {
    const code = await runRun({
      entry,
      capture: opts.capture,
      includeSnapshots: opts.includeSnapshots,
      redact: opts.redact ? new RegExp(opts.redact) : undefined,
      debounceMs: parseDuration(opts.debounce),
    });
    process.exit(code);
  });

program.command("drive <entry> [script]")
  .description("Replay a scenario and capture output")
  .option("--capture <fmt>", "text|svg|json|ndjson", "text")
  .option("--out <path>", "output file (default stdout)")
  .option("--size <wxh>", "terminal size", "80x24")
  .option("--timeout <dur>", "timeout", "10s")
  .action(async (entry, _script, opts) => {
    const inline: Step[] = parseInlineSteps(process.argv);
    const code = await runDrive({
      entry, inline, capture: opts.capture, stdout: process.stdout, stderr: process.stderr,
    });
    process.exit(code);
  });

program.command("test [paths...]")
  .description("Run scenario files with assertions")
  .option("--reporter <name>", "pretty|json|ndjson|tap", "pretty")
  .option("--jobs <n>", "parallel", String(cpus().length))
  .option("-u, --update-snapshots", "update snapshots")
  .option("--ci", "fail on snapshot drift; reject -u")
  .action(async (paths, opts) => {
    const code = await runTest({
      paths, reporter: opts.reporter, jobs: Number(opts.jobs),
      ci: opts.ci, updateSnapshots: opts.updateSnapshots,
      stdout: process.stdout, stderr: process.stderr,
    });
    process.exit(code);
  });

function parseInlineSteps(argv: string[]): Step[] {
  const steps: Step[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--press") steps.push({ kind: "press", keys: argv[++i].split(",") });
    else if (a === "--type") steps.push({ kind: "type", text: argv[++i] });
    else if (a === "--paste") steps.push({ kind: "paste", text: argv[++i] });
    else if (a === "--wait-for") steps.push({ kind: "waitFor", text: argv[++i] });
    else if (a === "--sleep") steps.push({ kind: "sleep", ms: parseDuration(argv[++i]) });
  }
  return steps;
}

program.parseAsync(process.argv).catch((e) => {
  process.stderr.write(formatError(e) + "\n");
  process.exit(1);
});
```

- [ ] **Step 4: Run test**

Run: `bun run build && bun run vitest run src/cli/__tests__/integration/inline-flag-order.integration.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/cli/__tests__/integration/inline-flag-order.integration.test.ts
git commit -m "feat(cli): commander dispatcher with order-preserving inline flags"
```

---

### Task 23: Replace bin/reacterm.mjs with thin dispatcher

**Files:**
- Modify: `bin/reacterm.mjs`
- Test: `src/cli/__tests__/integration/bin-help.integration.test.ts`

**Invoke skill:** `@typescript`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const BIN = resolve(__dirname, "../../../../bin/reacterm.mjs");

describe("bin entry", () => {
  it("--help lists exactly the four v1 verbs", () => {
    const r = spawnSync("node", [BIN, "--help"], { encoding: "utf8" });
    for (const v of ["demo", "run", "drive", "test"]) {
      expect(r.stdout).toMatch(new RegExp(`\\b${v}\\b`));
    }
    for (const cut of ["record", "explore"]) {
      expect(r.stdout).not.toMatch(new RegExp(`\\b${cut}\\b`));
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/bin-help.integration.test.ts`
Expected: FAIL — old bin only knows `demo`.

- [ ] **Step 3: Replace bin entry**

```js
#!/usr/bin/env node
// bin/reacterm.mjs — thin dispatcher into compiled CLI
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = resolve(rootDir, "dist/cli/index.js");
const srcEntry = resolve(rootDir, "src/cli/index.ts");
const tsx = resolve(rootDir, "node_modules/.bin/tsx");

const args = process.argv.slice(2);
const target = existsSync(distEntry) ? ["node", [distEntry, ...args]] : [tsx, [srcEntry, ...args]];
const child = spawn(target[0], target[1], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
```

- [ ] **Step 4: Run test**

Run: `bun run build && bun run vitest run src/cli/__tests__/integration/bin-help.integration.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add bin/reacterm.mjs src/cli/__tests__/integration/bin-help.integration.test.ts
git commit -m "feat(cli): bin dispatcher delegates to dist/cli or tsx-loaded src/cli"
```

---

### Task 24: Signal handling integration test

**Files:**
- Modify: `src/cli/index.ts`, `src/cli/verbs/drive.ts` (wire signals + --keep-alive)
- Test: `src/cli/__tests__/integration/signals.integration.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const BIN = resolve(__dirname, "../../../../bin/reacterm.mjs");
const FIXTURE = resolve(__dirname, "../fixtures/hello-app.tsx");

const run = (args: string[], signal: NodeJS.Signals, afterMs = 500) => new Promise<{ code: number | null; stderr: string }>((res) => {
  const child = spawn("node", [BIN, ...args]);
  let stderr = "";
  child.stderr.on("data", (c) => stderr += c.toString());
  setTimeout(() => child.kill(signal), afterMs);
  child.on("exit", (code) => res({ code, stderr }));
});

const runDouble = (args: string[], firstAfterMs = 500, gapMs = 100) => new Promise<{ code: number | null; elapsedMs: number }>((res) => {
  const child = spawn("node", [BIN, ...args]);
  const start = Date.now();
  setTimeout(() => child.kill("SIGINT"), firstAfterMs);
  setTimeout(() => child.kill("SIGINT"), firstAfterMs + gapMs);
  child.on("exit", (code) => res({ code, elapsedMs: Date.now() - start }));
});

describe("signal handling", () => {
  it("SIGINT exits 130 cleanly", async () => {
    const { code, stderr } = await run(["drive", FIXTURE, "--keep-alive"], "SIGINT");
    expect(code).toBe(130);
    expect(stderr).not.toMatch(/Error:/);
  }, 10_000);

  it("double-SIGINT within 2s exits 130 within 500ms (escalation)", async () => {
    const { code, elapsedMs } = await runDouble(["drive", FIXTURE, "--keep-alive"], 500, 100);
    expect(code).toBe(130);
    expect(elapsedMs).toBeLessThan(1100);
  }, 10_000);

  it("SIGHUP exits 129", async () => {
    const { code } = await run(["drive", FIXTURE, "--keep-alive"], "SIGHUP");
    expect(code).toBe(129);
  }, 10_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/integration/signals.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Wire handler into entry + add --keep-alive**

In `src/cli/index.ts`, near the top:

```ts
import { installSignalHandlers } from "./signals/handler.js";
installSignalHandlers({
  onTeardown: () => { /* restore tty if needed */ },
  onExit: (code) => process.exit(code),
});
```

In `src/cli/verbs/drive.ts`, add `keepAlive?: boolean` to `DriveOpts`. After the capture write, if `opts.keepAlive`, return a Promise that never resolves (until a signal handler exits the process):

```ts
if (opts.keepAlive) await new Promise(() => {});
```

In `src/cli/index.ts` `drive` action handler, pass `--keep-alive` flag through.

- [ ] **Step 4: Run test**

Run: `bun run build && bun run vitest run src/cli/__tests__/integration/signals.integration.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/cli/verbs/drive.ts src/cli/__tests__/integration/signals.integration.test.ts
git commit -m "feat(cli): wire signals + --keep-alive on drive (3 integration tests)"
```

---

### Task 25: Documentation

**Files:**
- Create: `docs/cli.md`, `docs/cli-output.md`, `docs/scenarios.md`
- Test: `src/cli/__tests__/docs.test.ts`

**Invoke skill:** `@docs-writing`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("CLI docs", () => {
  it.each(["docs/cli.md", "docs/cli-output.md", "docs/scenarios.md"])(
    "%s exists and mentions reacterm",
    (p) => {
      const path = resolve(__dirname, "../../../", p);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, "utf8")).toMatch(/reacterm/i);
    },
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/docs.test.ts`
Expected: 3 failing.

- [ ] **Step 3: Write docs**

`docs/cli.md` — user-facing reference: every verb (including `demo`), flags, examples, exit codes table. Mirror §6 + §9 of the spec.
`docs/cli-output.md` — versioned schema contracts for `--capture json`, `--reporter json`, `--reporter ndjson`. State that `schemaVersion` bumps are breaking.
`docs/scenarios.md` — schema reference (steps, expectations, duration format), 4 worked recipes (smoke check, login flow, snapshot drift detection, multi-step assertion).

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/docs.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add docs/cli.md docs/cli-output.md docs/scenarios.md src/cli/__tests__/docs.test.ts
git commit -m "docs(cli): user reference, output schema, scenario recipes"
```

---

### Task 26: Snapshot expectation + capability fingerprint

**Files:**
- Create: `src/cli/engine/snapshot.ts`
- Modify: `src/cli/verbs/test.ts`
- Test: `src/cli/__tests__/engine/snapshot.test.ts`, `src/cli/__tests__/integration/snapshot-drift.integration.test.ts`

**Invoke skill:** `@test-driven-development`.

- [ ] **Step 1: Write the failing test**

```ts
// src/cli/__tests__/engine/snapshot.test.ts
import { describe, it, expect } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { writeSnapshot, compareSnapshot } from "../../engine/snapshot.js";

describe("snapshot helpers", () => {
  it("writeSnapshot stores text + fingerprint sidecar", () => {
    const path = join(tmpdir(), `snap-${Date.now()}.txt`);
    writeSnapshot(path, "hello", { cols: 80, rows: 24 });
    expect(readFileSync(path, "utf8")).toBe("hello");
    expect(existsSync(path + ".fp.json")).toBe(true);
  });
  it("compareSnapshot returns match", () => {
    const path = join(tmpdir(), `snap-eq-${Date.now()}.txt`);
    writeSnapshot(path, "x", { cols: 80, rows: 24 });
    expect(compareSnapshot(path, "x", { cols: 80, rows: 24 }).status).toBe("match");
  });
  it("compareSnapshot returns drift", () => {
    const path = join(tmpdir(), `snap-drift-${Date.now()}.txt`);
    writeSnapshot(path, "x", { cols: 80, rows: 24 });
    expect(compareSnapshot(path, "y", { cols: 80, rows: 24 }).status).toBe("drift");
  });
  it("compareSnapshot returns capabilityMismatch", () => {
    const path = join(tmpdir(), `snap-cap-${Date.now()}.txt`);
    writeSnapshot(path, "x", { cols: 80, rows: 24 });
    expect(compareSnapshot(path, "x", { cols: 100, rows: 30 }).status).toBe("capabilityMismatch");
  });
});
```

```ts
// src/cli/__tests__/integration/snapshot-drift.integration.test.ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runTest } from "../../verbs/test.js";
import { Writable } from "node:stream";

const collect = () => { let s = ""; return Object.assign(new Writable({ write(c, _e, cb) { s += c.toString(); cb(); } }), { get text() { return s; } }); };

describe("test verb snapshot semantics", () => {
  it("--ci exits 3 on drift", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "WRONG");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 80, rows: 24 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, ci: true });
    expect(code).toBe(3);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("--ci exits 4 on capability fingerprint mismatch", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "Hello from fixture");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 200, rows: 100 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsize: { cols: 80, rows: 24 }\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, ci: true });
    expect(code).toBe(4);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("-u rewrites snapshot files instead of failing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "WRONG");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 80, rows: 24 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, updateSnapshots: true });
    expect(code).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/cli/__tests__/engine/snapshot.test.ts src/cli/__tests__/integration/snapshot-drift.integration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/cli/engine/snapshot.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface CapabilityFingerprint { cols: number; rows: number; }

export function capabilityFingerprint(size: { cols: number; rows: number }): CapabilityFingerprint {
  return { cols: size.cols, rows: size.rows };
}

export function writeSnapshot(path: string, content: string, size: { cols: number; rows: number }): void {
  writeFileSync(path, content, "utf8");
  writeFileSync(path + ".fp.json", JSON.stringify(capabilityFingerprint(size)), "utf8");
}

export type CompareResult =
  | { status: "match" }
  | { status: "drift"; expected: string; actual: string }
  | { status: "capabilityMismatch"; storedFp: CapabilityFingerprint; currentFp: CapabilityFingerprint };

export function compareSnapshot(path: string, actual: string, currentSize: { cols: number; rows: number }): CompareResult {
  if (!existsSync(path)) return { status: "drift", expected: "", actual };
  const expected = readFileSync(path, "utf8");
  const fpPath = path + ".fp.json";
  const storedFp: CapabilityFingerprint = existsSync(fpPath)
    ? JSON.parse(readFileSync(fpPath, "utf8"))
    : { cols: currentSize.cols, rows: currentSize.rows };
  const currentFp = capabilityFingerprint(currentSize);
  if (storedFp.cols !== currentFp.cols || storedFp.rows !== currentFp.rows) {
    return { status: "capabilityMismatch", storedFp, currentFp };
  }
  if (expected === actual) return { status: "match" };
  return { status: "drift", expected, actual };
}
```

In `src/cli/verbs/test.ts`, replace `checkExpectations` to track drift / capability mismatch and update the exit-code logic:

```ts
import { compareSnapshot, writeSnapshot } from "../engine/snapshot.js";

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
      if (updateSnapshots) { writeSnapshot(path, finalText, size); continue; }
      const r = compareSnapshot(path, finalText, size);
      if (r.status === "drift") { drift = true; failures.push(`snapshot drift: ${e.path}`); }
      else if (r.status === "capabilityMismatch") { capMismatch = true; failures.push(`capability mismatch: ${e.path}`); }
    }
  }
  return { failures, drift, capMismatch };
}
```

In `runTest`'s main loop, track `anyDrift` / `anyCapMismatch` across scenarios; after the loop:

```ts
if (opts.ci && anyCapMismatch) return 4;
if (opts.ci && anyDrift) return 3;
return named.some((r) => r.status === "fail") ? 1 : 0;
```

- [ ] **Step 4: Run test**

Run: `bun run vitest run src/cli/__tests__/engine/snapshot.test.ts src/cli/__tests__/integration/snapshot-drift.integration.test.ts`
Expected: 4 + 3 = 7 passing.

- [ ] **Step 5: Commit**

```bash
git add src/cli/engine/snapshot.ts src/cli/verbs/test.ts src/cli/__tests__/engine/snapshot.test.ts src/cli/__tests__/integration/snapshot-drift.integration.test.ts
git commit -m "feat(cli): expectSnapshot + capability fingerprint (exit 3/4)"
```

---

### Task 27 (final): Spec Acceptance + Post-Implementation Review

**Files:**
- Modify: `.warden/specs/2026-05-01-reacterm-cli-design.md`

**Invoke skill:** `@verification-before-completion`.

- [ ] **Step 1: Re-read the spec's Acceptance Criteria block**

Open `.warden/specs/2026-05-01-reacterm-cli-design.md` §14. Hold the acceptance items in context.

- [ ] **Step 2: Run every acceptance item, fresh, in one batch**

| # | Acceptance item | Verification command |
|---|---|---|
| 1 | Hand-write `.scenario.yaml` and `reacterm test` it | `node bin/reacterm.mjs test src/cli/__tests__/fixtures/scenarios/pass.scenario.yaml` (exit 0) |
| 2 | `drive ... \| tee app.svg` produces valid SVG | `node bin/reacterm.mjs drive src/cli/__tests__/fixtures/hello-app.tsx --press q --capture svg \| head -c 5` must be `<svg` |
| 3 | Ctrl-C exits 130; double-Ctrl-C within 2s exits 130 within 500ms | Tests from Task 24 |
| 4 | SIGHUP exits 129 with artifacts intact | Test from Task 24 |
| 5 | `test -u` updates; `test --ci` rejects `-u` exit 2; exits 3/4 on drift/capability | Tests from Tasks 18 + 26 |
| 6 | `test --jobs 4` parallel without React state cross-contamination | Test from Task 12 |
| 7 | inline-flag order matters | Test from Task 22 |
| 8 | `reacterm demo` (no args) launches `examples/reacterm-demo.tsx` | Test from Task 21 + manual `node bin/reacterm.mjs demo` |
| 9 | `reacterm run --capture` writes valid scenario YAML with $schema header that round-trips through `parseScenario` and replays via `drive` | Test from Task 20 + manual capture+replay |
| 10 | Recorder respects `--debounce`, `--redact`, `--include-snapshots` | Tests from Task 19 |
| 11 | `reacterm --help` lists exactly demo / run / drive / test (no record / explore) | Test from Task 23 |

Mark each ✅ pass / ⚠ known-limit / ❌ fail.

- [ ] **Step 3: Resolve every ❌ fail**

For each failing item: **Fix it** (implement missing piece) or **Log it** (Known Limitation after 2-3 different approaches per `verification-before-completion`).

- [ ] **Step 4: Fill the Post-Implementation Review block in the spec**

- **Acceptance results** — paste output for each item.
- **Scope drift** — list every change beyond spec; justify or revert.
- **Refactor proposals** — noticed-but-not-executed improvements with trigger conditions.

- [ ] **Step 5: Surface limitations to user**

If `Known Limitations` is non-empty, summarise: which items did not pass, what blocks them, suggested next step.

- [ ] **Step 6: Commit**

```bash
git add .warden/specs/2026-05-01-reacterm-cli-design.md
git commit -m "docs(spec): post-implementation review for reacterm CLI"
```

Only after this task's six steps complete may the executing agent claim the plan is done.
