# reacterm CLI Reference

## Overview

The `reacterm` command-line interface exposes the reacterm testing and rendering engine as a shell-level tool. It provides four verbs — `demo`, `run`, `drive`, and `test` — that together cover interactive exploration, session recording, headless artifact capture, and scenario-based CI assertions. All verbs share a single engine; stdout carries artifacts and machine-readable output while stderr carries progress, traces, warnings, and errors.

## Requirements

- **Node 20+.**
- **`tsx` installed** in the project (currently a `devDependency`). The bin wrapper registers `tsx/esm` at startup so any verb can load `.ts` / `.tsx` entry files directly. Pure `.js` / `.mjs` entries work without `tsx`.

---

## Verbs

### `demo`

Launch the bundled showcase. No arguments required.

```
USAGE: reacterm demo
```

`reacterm demo` opens the bundled published demo app, a comprehensive interactive demonstration that exercises every reacterm feature across 22 sections. The installed CLI does not depend on repo-local `examples/` files to launch it.

**Options:** none.

**Stdout:** terminal output from the showcase itself.

**Stderr:** warnings.

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Showcase exited normally |
| 130 | SIGINT (Ctrl-C) |
| 143 | SIGTERM |
| 129 | SIGHUP |

**Examples:**

```bash
# Open the showcase
reacterm demo

# Pipe stderr to a log file while watching the demo
reacterm demo 2>demo.log
```

---

### `run`

Launch a reacterm app interactively with optional session recording.

```
USAGE: reacterm run [OPTIONS] <entry>
```

`run` is a thin wrapper over `tsx <entry>` that adds reacterm-specific terminal hygiene. Its primary purpose is hosting `--capture`, which records the interactive session into a replayable `.scenario.yaml` file.

**Options:**

| Flag | Description |
|------|-------------|
| `--capture <path>` | Record the session into a scenario file. Path extension determines format (`.yaml` or `.json`). Convention: `__scenarios__/`. |
| `--include-snapshots` | With `--capture`: emit a `snapshot` step at every Enter press. |
| `--redact <regex>` | With `--capture`: replace matched text in typed input with `[REDACTED]` before serialization. |
| `--debounce <duration>` | With `--capture`: coalesce rapid keystrokes into `type` steps (default: `50ms`). |
| `--size <WxH>` | Force a virtual terminal size (e.g. `80x24`). Otherwise inherits from the current terminal. |
| `--no-alt-screen` | Do not switch to the alternate screen buffer. |

**Stdout:** terminal output from the app.

**Stderr:** warnings; a recording banner when `--capture` is active.

**Exit codes:** forwards the app's exit code. Signal codes: `130` SIGINT, `143` SIGTERM, `129` SIGHUP.

**Capture flow:**

When `--capture <path>` is active, reacterm writes a `# yaml-language-server: $schema=...` header to the output file and records each keystroke as a scenario step. Keystrokes within the `--debounce` window coalesce into a single `type` step; non-text keys (`tab`, `enter`, `ctrl+c`) become individual `press` steps. The resulting file has no `expect:` block — add assertions by hand, then run `reacterm test` to execute them.

**Examples:**

```bash
# Interactive launch
reacterm run src/App.tsx

# Record a session to a scenario file
reacterm run src/App.tsx --capture __scenarios__/login.scenario.yaml

# Record with snapshots at each Enter press, redacting passwords
reacterm run src/App.tsx \
  --capture __scenarios__/login.scenario.yaml \
  --include-snapshots \
  --redact "password.*"

# Force 120×40 terminal size
reacterm run src/App.tsx --size 120x40
```

---

### `drive`

Scripted, headless execution that captures an artifact. No assertions.

```
USAGE: reacterm drive [OPTIONS] <entry> [script.yaml]
```

`drive` replays inline command-line steps against a reacterm app and writes the resulting artifact to stdout. It is designed for pipelines: stdout is the artifact and stderr is reserved for errors.

The optional `[script.yaml]` argument, `--out`, `--size`, `--timeout`, and `--keep-alive` are present in the current help output but are not fully wired into execution yet. Use scenario files with `reacterm test` for file-backed scripts.

**Inline script flags** (repeatable; processed in command-line appearance order):

| Flag | Description |
|------|-------------|
| `--press <keys>` | Press one or more keys, comma-separated (e.g. `--press tab,tab,enter`). |
| `--type <text>` | Type a string as character keystrokes. |
| `--paste <text>` | Send text as a bracketed-paste sequence. |
| `--wait-for <text>` | Poll frames until the given text appears. |
| `--sleep <duration>` | Pause for a duration (e.g. `100ms`, `2s`). |

> **Ordering contract:** inline flags are processed in the order they appear on the command line. Any argument parser that normalizes or groups repeated flags by name breaks this contract.

**Capture flags:**

| Flag | Description |
|------|-------------|
| `--capture <fmt>` | Output format: `text` (default), `svg`, `json`, `ndjson`. |
| `--frames` | Not currently exposed by `drive --help`. |
| `--out <path>` | Reserved; currently ignored. |
| `--size <WxH>` | Reserved; current execution uses default or scenario-provided dimensions. |

**Lifecycle flags:**

| Flag | Description |
|------|-------------|
| `--timeout <duration>` | Reserved; currently ignored. |
| `--keep-alive` | Holds the process open after capture. |

**Verbosity:**

| Flag | Effect |
|------|--------|
| `--quiet` / `-q` | Not currently exposed by `drive --help`. |
| `--verbose` / `-v` | Not currently exposed by `drive --help`. |

**Stdout:** the captured artifact (text dump, SVG markup, or JSON object). `ndjson` is reserved but currently throws.

**Stderr:** errors.

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Script completed successfully |
| 1 | Timeout or `--wait-for` failure |
| 2 | Argument misuse |
| 130 | SIGINT |
| 143 | SIGTERM |
| 129 | SIGHUP |

**Examples:**

```bash
# Press q and capture the final frame as SVG
reacterm drive src/App.tsx --press q --capture svg > app.svg

# Capture final text to stdout and pipe it
reacterm drive src/App.tsx --press q --capture text | grep "Goodbye"

# Inline multi-step script: tab, type, enter
reacterm drive src/App.tsx \
  --press tab \
  --type "hello world" \
  --press enter \
  --capture json

# Capture final text to a file through shell redirection
reacterm drive src/App.tsx --press tab --capture text > final-frame.txt
```

---

### `test`

Discover and run scenario files; emit structured output; exit non-zero on any failure.

```
USAGE: reacterm test [OPTIONS] [paths]
```

`reacterm test` is the CI entry point. It runs the `.scenario.yaml` / `.scenario.json` files passed on the command line against their declared entry points, checks implemented assertions in the `expect:` block, and exits non-zero on any failure. It runs independently of vitest — no test framework is required.

Pass scenario files explicitly. Automatic discovery is not implemented yet.

**Selection flags:**

| Flag | Description |
|------|-------------|
| `-t, --grep <pattern>` | Not currently exposed. |
| `--only-failed` | Not currently exposed. |

**Snapshot flags:**

| Flag | Description |
|------|-------------|
| `-u, --update-snapshots` | Rewrite snapshot files on disk instead of failing on drift. |
| `--ci` | Forbid `-u` (exits `2` if both are passed); treat snapshot drift as exit code `3`. |

**Output flags:**

| Flag | Description |
|------|-------------|
| `--reporter <name>` | `pretty` (default), `tap`, `json`, `ndjson`. |
| `--quiet` / `-q` | Not currently exposed. |
| `--verbose` / `-v` | Not currently exposed. |

**Concurrency:**

| Flag | Description |
|------|-------------|
| `--jobs <n>` | Number of parallel scenarios (default: CPU count). Each scenario runs in an isolated child process to prevent React module state cross-contamination. |

**Stdout:** reporter output — colored summary for `pretty`, a single JSON object for `json`, one event object per line for `ndjson`.

**Stderr:** progress, warnings, panics.

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | All scenarios passed |
| 1 | One or more scenarios failed (assertion mismatch, runtime error, timeout) |
| 2 | Argument misuse (e.g. `--ci` + `-u` together) |
| 3 | Snapshot drift detected under `--ci` (UI changed; run `-u` locally to accept) |
| 4 | Terminal capability fingerprint mismatch under `--ci` (environment drift, not a regression) |
| 130 | SIGINT |
| 143 | SIGTERM |
| 129 | SIGHUP |

**Examples:**

```bash
# Run one scenario file
reacterm test __scenarios__/smoke.scenario.yaml

# Run with JSON reporter (suitable for CI artifact upload)
reacterm test --reporter json > results.json

# Update snapshots locally after intentional UI change
reacterm test -u __scenarios__/dashboard.scenario.yaml

# CI mode: fail on drift without allowing -u
reacterm test --ci --reporter ndjson __scenarios__/dashboard.scenario.yaml
```

---

## Global Options

These flags apply to the top-level command and must appear before the verb name.

| Flag | Description |
|------|-------------|
| `--version` | Print the reacterm version and exit. |
| `-h, --help` | Show the top-level help text and exit. |

Each verb also accepts `--help` for verb-specific usage.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_COLOR` | Recognized by CLI context helpers. Reporter output is currently emitted without color. |

Machine-readable output is written without progress bars.

---

## Exit Code Reference (consolidated for `test`)

| Code | Triggered by |
|------|-------------|
| 0 | All scenarios passed |
| 1 | Assertion mismatch, runtime error, or timeout in any scenario |
| 2 | Bad arguments — e.g. `--ci --update-snapshots` together, unknown flag |
| 3 | Snapshot drift under `--ci` — the stored `.svg`/`.txt` does not match the current frame |
| 4 | Capability fingerprint mismatch under `--ci` — the terminal environment changed (font metrics, capability set) since the snapshot was recorded; treat as environment drift rather than a regression |
| 129 | SIGHUP (controlling terminal closed) |
| 130 | SIGINT (Ctrl-C) |
| 143 | SIGTERM |

> **Note on `--ci` + `-u`:** these flags are mutually exclusive. Passing both exits `2` immediately at argument-parse time without running any scenarios. This prevents accidental snapshot acceptance in CI pipelines.
