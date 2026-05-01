# Reacterm CLI — design spec

**Status:** approved
**Date:** 2026-05-01
**Owner:** Edward
**Hand-off skill:** `typescript` (commander, hand-rolled inline-flag parser)

## 1. Problem

Reacterm ships a powerful in-process testing harness (`./testing` export — driver, scenario, explorer, SVG snapshots, vitest matchers) but no CLI surface to drive it. The existing binary `bin/reacterm.mjs` is a demo launcher only.

Three distinct user needs are unmet:

1. **Automation / docs / CI** — drive a reacterm app headlessly from the shell, capture its output as text or SVG, with no test framework involved. Today this requires writing a TypeScript file that imports the harness.
2. **Scenario-based checks** — author a black-box flow ("press these keys, expect this text") that anyone can write without owning vitest knowledge. Today users must hand-write `*.test.ts` files.
3. **Discoverability** — a one-keystroke way to see what reacterm can do. Today's `bin/reacterm.mjs` already covers this for one demo; the new CLI must preserve it cleanly.

The CLI exposes the existing engine to all three audiences via three verbs.

### Verbs deliberately NOT in v1

- **`record`** — separate verb cut. Folded into `run --capture` instead. Same recorder primitives, no extra surface on the help screen.
- **`explore`** — random-walk fuzz wrapper cut. `exploreForTest` is already a library function and fuzzing is naturally embedded in test runs (a `__tests__/fuzz.test.ts`), not a one-off shell command. Keep as library-only export with documentation.

## 2. Goals / non-goals

**Goals**

- Single binary, four verbs (`demo`, `run`, `drive`, `test`) sharing one engine.
- Zero new dependencies for end users beyond what the harness already needs (plus three CLI-only deps: `commander`, `zod`, `js-yaml`).
- Stdout = artifact, stderr = conversation. Pipelines work cleanly.
- A scenario file flows: `run --capture` writes it → `drive` replays it → `test` asserts on it. Same file, three lifecycles.
- `reacterm demo` opens the bundled showcase with zero arguments.

**Non-goals**

- Replacing vitest. Component-level unit tests with fixtures, parametrization, and rich mocks stay in vitest. The CLI owns the scenario tier.
- A demo picker, demo list, or demo name selector. One bundled showcase covers the full feature surface.
- A separate `record` verb. Recording lives as `--capture` on `run`.
- CLI fuzz runner (`explore`). Use `exploreForTest` from `./testing` in a regular test file.
- Cross-app orchestration / project-graph features. One entry point per invocation.
- Plugin system. Out of scope for v1.
- Network-level recording (HTTP fixtures). Out of scope.

## 3. Subcommand tree

```
reacterm demo                                          # launch the bundled showcase (no args)
reacterm run     <entry> [--capture <path>]            # interactive launch; optional record-to-file
reacterm drive   <entry> [script]                      # scripted, capture artifacts, no assertions
reacterm test    [paths|globs]                         # scenarios + assertions, exit non-zero on failure
```

Four verbs sharing one engine. Each earns a CLI shelf-spot for a distinct reason:

- **`demo`** — discoverability. Zero-arg one-keystroke "show me what reacterm can do". Hardcoded to `examples/reacterm-demo.tsx`.
- **`run`** — interactive launch. Thin wrapper over `tsx <entry>` that exists primarily to host `--capture` (record session into a scenario file). Without `--capture`, behaves like `tsx <entry>` plus reacterm-specific terminal hygiene.
- **`drive`** — automation. Headless capture of artifact (text/SVG/JSON) is a CLI-shaped problem (pipelines, stdout, exit codes); cannot exist as a library call.
- **`test`** — CI gates. Glob over scenario files, run them, structured exit codes for pass / fail / drift / capability mismatch. The non-developer path to scenario-based regression checks (developers continue using vitest).

`record` as a separate verb was considered and cut; the recorder lives as `--capture` on `run` instead. Same engine, smaller surface, no extra verb on the help screen.

### Scenario file format

- Extension: **`.scenario.yaml`** (canonical). `.scenario.json` accepted with the same schema for zero-parser-dep and programmatic generation.
- Convention: live in `__scenarios__/` directory (mirrors `__tests__/`).
- IDE support: recorded files include a `# yaml-language-server: $schema=…` header pointing at the v1 schema we ship at `docs/schema/scenario-v1.json`, giving VS Code / JetBrains autocomplete + validation for free.

### Authoring funnel

```
reacterm run src/App.tsx --capture __scenarios__/login.scenario.yaml
# (use the app interactively, hit q)
# → login.scenario.yaml now exists with the steps you took (no expect block)

$EDITOR __scenarios__/login.scenario.yaml          # add expect: assertions by hand
reacterm test __scenarios__/login.scenario.yaml    # run as regression check
```

Same file, three lifecycles: capture (`run --capture`), replay (`drive`), assert (`test`).

## 4. Locked decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Four verbs: `demo`, `run`, `drive`, `test`. No separate `record` verb (folded into `run --capture`); no `explore` (use library export). `reacterm demo` takes no args and always opens `examples/reacterm-demo.tsx`. Scenario file extension is `.scenario.yaml` (canonical) or `.scenario.json` (same schema), conventionally under `__scenarios__/`. | Each verb earns its CLI shelf-spot for a distinct reason (discoverability / interactive + recording / automation / CI gates). Cut verbs were either redundant (`record` collapses cleanly into `run --capture`) or naturally live in test files (`explore`). |
| 2 | Own scenario runner. No vitest dependency at end-user level. | Whole point of the CLI is "no test framework needed". Vitest stays available for component tests via the existing `./testing` export — the two coexist. |
| 3 | YAML as primary scenario format. Accept JSON as well (same schema). | Recorder output and hand-authored files both benefit from comments and trailing-comma forgiveness. JSON parity keeps `--reporter json` round-trippable and lets users avoid a YAML parser dep if they prefer. |
| 4 | Snapshots colocated with scenario file. `login.scenario.yaml` → `login.svg` / `login.txt` next to it. | Single source of truth per scenario. `git mv` moves both together. |
| 5 | `drive` auto-quits when script ends. `--keep-alive` opts into hold-open behavior (needed for `--frames` continuous capture). | Auto-quit matches user expectation of "run script and exit". Keep-alive is the rare case. |

## 5. Scenario schema

Single contract consumed by `drive`, `test`, `record`, `explore`. YAML is canonical; JSON is accepted with the same structure.

```yaml
version: 1
name: save-and-quit
entry: src/App.tsx
size: { cols: 80, rows: 24 }
env:
  NODE_ENV: test
timeout: 5s

steps:
  - press: tab
  - press: [tab, tab, enter]                      # array = sequence (loader expands into N press steps)
  - type: "hello world"
  - paste: "multi\nline payload"
  - click: { x: 12, y: 4 }
  - scroll: { direction: down }                   # one wheel notch; matches existing TuiDriver.scroll
  - scroll: { direction: up, target: { x: 40, y: 10 } }
  - resize: { cols: 100, rows: 30 }
  - waitFor: "Saved"                              # poll frames until text appears
    timeout: 2s
  - sleep: 100ms
  - snapshot:
      as: svg                                     # svg | text | json
      path: save-mid.svg                          # relative to scenario file

expect:
  - contains: "Bye"
  - line: { at: 0, equals: " File " }
  - expectSnapshot: save-final.svg
  - exitCode: 0
  - noWarnings: true
```

### Step type reference

| Step | Shape | Notes |
|---|---|---|
| `press` | `string` or `string[]` | Key names: `tab`, `enter`, `up`, `ctrl+c`, etc. Array = sequence. |
| `type` | `string` | Sent as character keystrokes. |
| `paste` | `string` | Sent as bracketed-paste sequence. |
| `click` | `{ x, y, button? }` | `button` defaults to `left`. |
| `scroll` | `{ direction: "up" \| "down", target?: { x, y } }` | One wheel notch in the given direction. Magnitude not supported in v1 (driver limitation); use repeated steps. |
| `resize` | `{ cols, rows }` | Triggers reacterm's resize handling. |
| `waitFor` | `string` or `{ text, timeout? }` | Polls frames every 16ms until text appears or timeout fires. Unlike harness's synchronous `waitForText`, this is real async polling — engine layer must implement it on top of the driver. |
| `sleep` | duration string | Format: integer + unit suffix. Accepted units: `ms`, `s`, `m`. No fractional values. Examples: `100ms`, `2s`, `1m`. |
| `snapshot` | `{ as, path }` | `as`: `svg`, `text`, `json`. Path relative to scenario file. Paired with `expectSnapshot` below. |

### Expectation types

| Expect | Shape | Meaning |
|---|---|---|
| `contains` | `string` | Final frame contains text. |
| `line` | `{ at, equals?, contains?, matches? }` | Assert about a specific row. |
| `expectSnapshot` | path string | Compare current frame to stored snapshot. Fail = drift. (Mirrors `snapshot` step verb — `snapshot` writes, `expectSnapshot` reads.) |
| `exitCode` | number | Reacterm app's `process.exit` code. |
| `noWarnings` | bool | No driver warnings emitted. |
| `frameCount` | `{ min?, max? }` | Number of distinct frames rendered. |

## 6. Per-verb contract

### 6.1 `reacterm demo`

Launch the bundled showcase. No arguments. Always opens `examples/reacterm-demo.tsx` — one comprehensive interactive demo that exercises every reacterm feature across 21 sections.

```
USAGE: reacterm demo

(no flags, no arguments)
```

- **Stdout:** terminal output (the showcase itself).
- **Stderr:** warnings.
- **Exit codes:** forwards the showcase's exit code.

Rationale: discoverability is the whole job of `demo`. A user typing `reacterm demo` should immediately see what reacterm can do — not be prompted to pick from a list. The single bundled showcase already covers the full feature surface; ad-hoc examples live under `examples/` and can be run via `tsx examples/<file>.tsx`.

### 6.2 `reacterm run <entry> [--capture <path>]`

Interactive launch of a user's reacterm app. Optional `--capture` records the session as a replayable scenario file consumable by `drive` and `test`.

```
USAGE: reacterm run [OPTIONS] <entry>

  --capture <path>       Record this session into a scenario file (YAML).
                         Path determines format: .yaml/.json. Convention: __scenarios__/.
  --include-snapshots    With --capture: emit snapshot step at every Enter press.
  --redact <regex>       With --capture: scrub matched text from typed input (passwords).
  --debounce <duration>  With --capture: coalesce rapid keystrokes into type steps (default: 50ms).
  --size <WxH>           Force a virtual size; otherwise inherit terminal.
  --no-alt-screen        Don't switch to alternate buffer.
```

- **Stdout:** terminal output (the app rendering itself).
- **Stderr:** warnings; recorder banner when `--capture` is active.
- **Exit codes:** forwards app exit code.

### Capture flow

```
$ reacterm run src/App.tsx --capture __scenarios__/login.scenario.yaml
[reacterm] recording session → __scenarios__/login.scenario.yaml
(use the app interactively, hit q to quit)
[reacterm] wrote 12 steps to __scenarios__/login.scenario.yaml

$ $EDITOR __scenarios__/login.scenario.yaml
# add an `expect:` block: contains "Welcome", expectSnapshot login.svg, etc.

$ reacterm test __scenarios__/login.scenario.yaml
✓ login (340ms)
1 passed, 0 failed
```

The captured file has no `expect:` block — author adds those. `drive` will replay the file as-is; `test` ignores files without `expect:` blocks (no assertions to check) but still runs them as smoke checks.

### Recorder behavior

- Keystrokes within `--debounce` window coalesce into a single `type` step (`hi` not `h`, `i`).
- Non-text keys (`tab`, `enter`, `ctrl+c`) become individual `press` steps.
- `--include-snapshots` writes a `snapshot:` step at each Enter press, with paths colocated next to the scenario file.
- `--redact <regex>` runs against typed text before serialization; matches replaced with `[REDACTED]`.
- File header includes `# yaml-language-server: $schema=...` for IDE autocomplete.

### 6.3 `reacterm drive <entry> [script]`

Scripted execution that captures the resulting artifact. No assertions.

```
USAGE: reacterm drive [OPTIONS] <entry> [script.yaml]

Inline script (alternative to a file; all repeatable; processed in
command-line appearance order — see ordering contract below):
  --press <keys>         e.g. --press tab,tab,enter
  --type <text>          e.g. --type "hello"
  --paste <text>
  --wait-for <text>
  --resize <WxH>
  --sleep <duration>

Capture:
  --capture <fmt>        text | svg | json | ndjson    (default: text)
  --frames               Capture every frame, not just final (forces ndjson).
  --out <path>           Write to file instead of stdout. `--out -` = stdout (explicit).
  --size <WxH>           Initial size (default: 80x24).

Lifecycle:
  --timeout <duration>   Hard cap on total run (default: 10s).
  --keep-alive           Don't auto-quit when script ends.
```

- **Stdout:** the captured artifact (text dump / SVG / JSON / NDJSON of frame events).
- **Stderr:** progress traces (`> press tab`, `> wait-for "Saved" matched in 130ms`), warnings, errors.
- **Exit codes:** `0` success, `1` timeout or `wait-for` failure, `2` misuse, `130`/`143` signals.
- **`--quiet`** suppresses progress traces on stderr; errors still print. **`--verbose`** adds per-step trace to stderr (`-vv` adds frame diffs).
- **Inline-flag ordering contract:** when inline script flags are mixed (e.g. `--press tab --type "hi" --press enter`), the engine processes them in the order they appear on the command line. Argument parser MUST preserve appearance order for repeated flags; any parser that normalizes/groups by flag name is incompatible. Hard constraint on parser choice in §12.

### 6.4 `reacterm test [paths|globs]`

Discover and run scenario files; emit reporter output; exit non-zero on any failure.

```
USAGE: reacterm test [OPTIONS] [paths]

Default discovery: __scenarios__/**/*.scenario.{yaml,json}

Selection:
  -t, --grep <pattern>   Filter by scenario name (regex).
  --only-failed          Re-run scenarios that failed last invocation.

Snapshots:
  -u, --update-snapshots Rewrite snapshot files instead of failing.
  --ci                   Forbid -u, treat snapshot drift as exit code 3.

Output:
  --reporter <name>      pretty | tap | json | ndjson  (default: pretty)
  --quiet                Errors only.
  --verbose              Per-step trace on stderr.

Concurrency:
  --jobs <n>             Parallel scenarios (default: CPU count).
```

- **Stdout:** porcelain (`pretty`) is a colored summary. `json` is one report object. `ndjson` is one event per line: `{type:"start"|"step"|"pass"|"fail"|"summary", ...}`.
- **Stderr:** progress, warnings, panics.
- **Exit codes:**
  - `0` — all scenarios pass
  - `1` — any scenario failure (assertion mismatch, runtime error, timeout)
  - `2` — argument misuse, including `--ci` + `-u` together (mutually exclusive; rejected at argument-parse time)
  - `3` — snapshot drift detected under `--ci`, separated from `1` so CI can distinguish "intentional UI change needs `-u` locally" from "real regression"
  - `4` — capability fingerprint mismatch under `--ci`: terminal-capability hash recorded with the snapshot doesn't match the current environment. Treat as environment drift, not a regression
  - `130` / `143` — signals (see §8)

## 7. Output stream contract

Hard rule across every verb:

| Stream | Carries |
|---|---|
| stdout | the artifact (capture data, JSON report, NDJSON events, recorder YAML) |
| stderr | progress, traces, warnings, errors, prompts |

`isatty(stdout)` controls porcelain vs plumbing defaults: when piped, suppress progress bars and color in the data stream. Respect `NO_COLOR` per <https://no-color.org>. No `--color` flag in v1.

Output schemas (`--capture json`, `--reporter json`, `--reporter ndjson`) are versioned contracts documented in `docs/cli-output.md`. Breaking changes require a major version bump.

## 8. Signal handling

Every verb that runs a virtual terminal installs handlers for `SIGINT`, `SIGTERM`, and `SIGHUP`:

1. **First signal** (any of the three): tear down virtual terminal cleanly (restore cursor, exit alt screen if `run` / `demo`), flush pending writes, forward the signal to any child process (e.g. `node-pty` smoke runners or `--jobs` worker processes) exactly once, then remove the handler.
2. **Exit codes**: `130` for `SIGINT`, `143` for `SIGTERM`, `129` for `SIGHUP`.
3. **No stack trace** on Ctrl-C — single line `aborted` on stderr.
4. **Double-Ctrl-C escalation**: if a second `SIGINT` arrives within 2s of the first, send `SIGKILL` to all child processes immediately, skip clean teardown, exit `130` without further output. Protects users from hangs in misbehaving scenarios.
5. **SIGHUP semantics**: treated as SIGTERM (controlling terminal closed → finish current step, write any pending artifacts, exit `129`). Required because `drive`/`test` may be invoked over SSH.

Integration tests required:
- Start `drive --keep-alive`, wait for ready, send SIGINT, assert exit code `130` and clean stderr.
- Same harness, send two SIGINTs 100ms apart, assert exit code `130` within 500ms (proves escalation works).
- Same harness, send SIGHUP, assert exit code `129` and that pending artifacts on disk are intact.

## 9. Help text skeleton

```
reacterm — react renderer for the terminal

USAGE:
  reacterm [OPTIONS] <verb> [ARGS]

VERBS:
  demo       Launch the bundled showcase (no args)
  run        Launch a reacterm app interactively; --capture records the session
  drive      Replay a scenario and capture output (no assertions)
  test       Run scenario files with assertions; exit non-zero on failure

GLOBAL OPTIONS:
  -v, --verbose          Repeat for more (-vv, -vvv)
  -q, --quiet            Errors only
  --version              Print version and exit
  -h, --help             Show this help

ENVIRONMENT:
  NO_COLOR               Disable ANSI color (per https://no-color.org)
  REACTERM_DEFAULT_SIZE  Default virtual terminal size, e.g. "80x24"

EXAMPLES:
  reacterm demo
  reacterm run src/App.tsx --capture __scenarios__/login.scenario.yaml
  reacterm drive src/App.tsx --press q --capture svg --out app.svg
  reacterm test --ci --reporter ndjson
  reacterm test -u

See `reacterm <verb> --help` for verb-specific options.
```

Each verb gets its own `--help` with 2–4 examples covering common path plus one edge case.

## 10. Error message conventions

Lead with what failed in plain language; suggest a fix on the next line when actionable; stack traces only on `--debug` or panic-class failures.

```
error: could not load entry `src/App.tsx`: no such file
hint: relative paths resolve from cwd (/home/me/foo)
```

```
error: scenario `login.scenario.yaml`: step 4: waitFor "Saved" did not match within 2s
hint: last frame written to .reacterm/failures/login-2026-05-01T15-48.svg
```

```
error: unknown flag `--prss`
hint: did you mean `--press`?
```

## 11. Plumbing vs porcelain

- **Porcelain (default):** colored `pretty` reporter, tables, progress bars on stderr, examples in help text.
- **Plumbing:** `--reporter json|ndjson`, `--capture json|ndjson`. No color, no progress, schema is contract.

When `!isatty(stdout)`, auto-suppress progress bars even in porcelain mode.

## 12. Implementation hand-off

Once this spec is approved, the implementation plan covers the items below. The harness is the foundation but is **not used verbatim** — three concrete extensions are required.

1. **Engine layer** — build a `runScenario(entry, scenario, opts) -> Result` core that wraps the existing `src/testing/` exports. Three additions on top of today's harness:
   - **Dynamic module loader.** `runScenario`'s harness signature today takes `{ app: React.ReactElement }`. The CLI receives a file path. Engine layer must dynamically load `<entry>` (via `tsx` or equivalent), resolve its default export to a React element, inject env. Non-trivial: must handle TS/JSX, react cache invalidation between scenarios, and process isolation.
   - **Async `waitFor` polling.** Today's `TuiDriver.waitForText` is synchronous (single-frame check). The CLI's `waitFor` step requires real polling with a configurable timeout (default 16ms tick interval). Implement as thin layer over the driver — do not modify the driver itself.
   - **`scroll` step shape.** Schema in §5 matches the driver's `direction` + optional `target` API. No engine work required beyond passthrough; called out for clarity.
2. **Schema layer** — Zod-typed scenario parser (YAML + JSON), versioned, with friendly error messages pointing to offending line. Two normalizations:
   - Expand `press: [a, b, c]` arrays into N individual press steps.
   - Translate `scroll` YAML shape to harness `ScenarioStep` shape: YAML `{ scroll: { direction, target? } }` → harness `{ scroll: direction, target? }`.
3. **CLI layer** — argument parser, one module per verb, all delegating to engine. **Parser must preserve appearance order for repeated flags** (see §6.2 inline-flag ordering contract). Commander.js satisfies this; verify before adopting alternatives.
4. **Reporters** — pretty (default), tap, json, ndjson. Stream-aware (suppress progress on `!isatty(stdout)`).
5. **Recorder** — wraps `run` with an event sink that emits scenario YAML.
6. **Bin entry** — replace `bin/reacterm.mjs` with a thin dispatcher that delegates to the compiled CLI. The `demo` verb hardcodes the path to `examples/reacterm-demo.tsx`.
7. **Tests** — TDD per verb against the contracts in §6; signal-handling integration tests per §8 (three required).
8. **Docs** — `docs/cli.md`, `docs/cli-output.md`, `docs/scenarios.md`.

Hand-off skill: `typescript`.

## 13. Open risks

- **`--jobs` isolation model.** `runScenario` calls into React's reconciler, which carries module-global state. **Resolution:** `--jobs` spawns one Node child process per scenario (not worker_threads — React state isn't thread-aware). This also resolves dynamic module loading (each child owns its own module cache) and signal forwarding (parent supervises, propagates SIGINT once). Cost: ~50ms process spinup per scenario. Acceptable for v1.
- **YAML parser dependency.** Adds ~50 KB. Lazy-load only when a `.yaml` scenario is encountered.
- **Recorder fidelity.** Coalescing keystrokes into `type` steps is heuristic — `--debounce` knob exposed.
- **Snapshot churn.** SVG snapshots may drift on font-metric changes outside reacterm's control. Mitigation: snapshot format includes capability fingerprint; mismatched fingerprints produce exit code `4` so CI distinguishes real drift from environment drift.
- **Vitest coexistence.** Both can coexist in the same project — they share no state. Doc must be explicit: vitest for component-level unit tests with TS fixtures; `reacterm test` for black-box scenario flows.
- **Async `waitFor` semantics.** Tick at 16ms (~60fps), yield to event loop each tick, bail at per-step timeout. Add a stress test: 1000 `waitFor` steps, assert wall-clock + CPU stay within bounds.

## 14. Acceptance criteria

The spec is complete when:

- A user can write a single `.scenario.yaml` file by hand and run `reacterm test` to execute it with assertions.
- A pipeline `reacterm drive src/App.tsx --press q --capture svg | tee app.svg` produces a valid SVG on stdout and progress on stderr without interleaving.
- `Ctrl-C` during any verb exits `130` with no stack trace; double-`Ctrl-C` within 2s exits `130` within 500ms even if a scenario is hung.
- `SIGHUP` (e.g. SSH disconnect) exits `129` with pending artifacts intact on disk.
- `reacterm test -u` updates colocated snapshot files; `reacterm test --ci` rejects `-u` at parse time with exit `2`; `reacterm test --ci` exits `3` on drift and `4` on capability fingerprint mismatch.
- `reacterm test --jobs 4` runs four scenarios in parallel without cross-contamination of React module state.
- `reacterm drive src/App.tsx --press tab --type "hi" --press enter` processes the three inline steps in command-line appearance order.
- `reacterm demo` (no args) launches `examples/reacterm-demo.tsx` and forwards its exit code.
- `reacterm run src/App.tsx --capture out.scenario.yaml` writes a valid YAML scenario file containing the recorded steps; the file parses with `parseScenario` and replays cleanly via `reacterm drive src/App.tsx out.scenario.yaml`.
- Recorder respects `--debounce` (typed text coalesces into `type` steps), `--redact` (matches replaced with `[REDACTED]`), and `--include-snapshots` (snapshot steps emitted at each Enter).
- Captured scenario file includes the `# yaml-language-server: $schema=…` header.
- `reacterm --help` lists exactly four verbs (`demo`, `run`, `drive`, `test`); no mention of `record`, `explore`.

## 15. Known Limitations

- **`.tsx` entry loading depends on `tsx` being installed.** The bin wrapper (`bin/reacterm.mjs`) registers `tsx/esm` as a runtime ESM loader so users can pass TypeScript / TSX entry files directly. `tsx` is currently a `devDependency`; promoting it to `dependency` (or replacing with native Node TS support) is a follow-up before npm publish.
- **`drive --keep-alive` uses a never-firing `setInterval` to keep the event loop open.** A bare unsettled `Promise` is not a libuv handle, so `await new Promise(() => {})` lets Node exit cleanly. Documented inline; harmless but worth noting if anyone refactors the keep-alive loop.

## 16. Post-Implementation Review

### Acceptance results

All 11 acceptance criteria pass:

| # | Criterion | Verified by |
|---|---|---|
| 1 | Hand-written `.scenario.yaml` runs via `reacterm test` | Manual: `node bin/reacterm.mjs test src/cli/__tests__/fixtures/scenarios/pass.scenario.yaml` → `1 passed, 0 failed`, exit 0 |
| 2 | Pipeline: stdout = artifact, stderr = conversation | Manual: `drive --capture text 2>err 1>out` → out has `Hello from fixture`, err empty |
| 3 | `Ctrl-C` → 130, double-`Ctrl-C` within 2s → 130 within 500ms | `signals.integration.test.ts` (2 tests, green) |
| 4 | `SIGHUP` → 129 | `signals.integration.test.ts` (1 test, green) |
| 5 | `test -u` updates; `--ci -u` → exit 2; `--ci` drift → 3; capability mismatch → 4 | Manual: `--ci -u` → "error: --ci and -u are mutually exclusive", exit 2. Drift/fingerprint covered by `snapshot-drift.integration.test.ts` |
| 6 | `--jobs 4` parallel without state contamination | `jobs-isolation.integration.test.ts` (green) |
| 7 | Inline flags processed in command-line appearance order | `inline-flag-order.integration.test.ts` + manual: `drive --press tab --type "hi" --press enter` exit 0 |
| 8 | `reacterm demo` launches `examples/reacterm-demo.tsx` and forwards exit | `demo.test.ts` (`DEMO_PATH` exists, `runDemo` is async function); not invoked in tests because demo is interactive TUI |
| 9 | `run --capture` writes a parseable scenario; `drive` replays it | `run-capture.integration.test.ts` (green) |
| 10 | Recorder respects `--debounce`, `--redact`, `--include-snapshots` | `recorder/debounce.test.ts`, `recorder/redact.test.ts`, `recorder/serializer.test.ts` (all green) |
| 11 | Captured file has `# yaml-language-server: $schema=…` header | `recorder/serializer.test.ts` (green) |
| 12 | `--help` lists 4 verbs, excludes `record` / `explore` | `bin-help.integration.test.ts` + manual `--help` output |

Test totals: **29 CLI test files, 67 tests passing**. Full project: **77 of 78 test files passing, 873 tests** (the one failure is `playground-file-api.test.ts` failing to import a missing `ws` package — unrelated, pre-existing).

Build: `bun run build` → `tsc` clean exit.

### Scope drift

- **`bin/reacterm.mjs` runs in-process via dynamic `import()`** rather than spawning a child. The original spec implied a child-process wrapper. Switching to in-process was driven by the Section 8 signal-handling requirement: signals sent to the wrapper PID don't reach a `spawn()`-ed child, so an in-process model lets the CLI's `installSignalHandlers` fire directly. Cleaner architecture and fewer moving parts. Justified, kept.
- **`tsx/esm` runtime loader registration in `bin/reacterm.mjs`.** Spec §12 said the engine layer would handle dynamic TS loading "via tsx or equivalent" but did not pin where. Registering the loader at the wrapper level means the engine's `import(entryPath)` call works for `.tsx` without further shimming. Justified, kept.
- **`drive --keep-alive` implementation uses `setInterval`** to hold the libuv event loop open. Not in spec, but required for `--keep-alive` to actually keep the process alive (a bare Promise lets Node exit). Justified, kept.

No reverts.

### Refactor proposals

- **Promote `tsx` from `devDependency` to `dependency`** before npm publish, otherwise end-users with only `.tsx` entry files will hit "Unknown file extension". Trigger: first publish, or first user-reported issue.
- **Consider replacing the `setInterval` keep-alive trick with `process.stdin.resume()`** if the CLI ever needs to read interactive stdin in a `--keep-alive` mode. Trigger: when `drive --keep-alive --frames` (continuous capture) lands.
- **Deduplicate the inline-flag definitions across `drive` action and `parseInlineSteps`.** Currently the recognised flag list lives in two places (Commander option declarations + the manual `process.argv` walker). Trigger: when adding a new inline step type and both code paths need an edit.
