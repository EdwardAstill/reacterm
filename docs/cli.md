# reacterm CLI Reference

## Overview

The `reacterm` command-line interface exposes the reacterm testing and rendering engine as a shell-level tool. It provides four verbs — `demo`, `run`, `drive`, and `test` — that together cover interactive exploration, session recording, headless artifact capture, and scenario-based CI assertions. All verbs share a single engine; stdout carries artifacts and machine-readable output while stderr carries progress, traces, warnings, and errors.

## Requirements

- **Node 18+.**
- **`tsx` installed** in the project (currently a `devDependency`). The bin wrapper registers `tsx/esm` at startup so any verb can load `.ts` / `.tsx` entry files directly. Pure `.js` / `.mjs` entries work without `tsx`.

---

## Verbs

### `demo`

Launch the bundled showcase. No arguments required.

```
USAGE: reacterm demo
```

`reacterm demo` opens `examples/reacterm-demo.tsx`, a comprehensive interactive demonstration that exercises every reacterm feature across 21 sections. It is the one-keystroke entry point for discovering what reacterm can do.

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

`drive` replays a scenario or an inline script against a reacterm app and writes the resulting artifact to stdout (or `--out`). It is designed for pipelines: stdout is always the pure artifact, stderr carries progress traces.

**Inline script flags** (repeatable; processed in command-line appearance order):

| Flag | Description |
|------|-------------|
| `--press <keys>` | Press one or more keys, comma-separated (e.g. `--press tab,tab,enter`). |
| `--type <text>` | Type a string as character keystrokes. |
| `--paste <text>` | Send text as a bracketed-paste sequence. |
| `--wait-for <text>` | Poll frames until the given text appears. |
| `--resize <WxH>` | Resize the virtual terminal. |
| `--sleep <duration>` | Pause for a duration (e.g. `100ms`, `2s`). |

> **Ordering contract:** inline flags are processed in the order they appear on the command line. Any argument parser that normalizes or groups repeated flags by name breaks this contract.

**Capture flags:**

| Flag | Description |
|------|-------------|
| `--capture <fmt>` | Output format: `text` (default), `svg`, `json`, `ndjson`. |
| `--frames` | Capture every rendered frame, not just the final one. Forces `ndjson` output. |
| `--out <path>` | Write artifact to a file instead of stdout. Use `--out -` to force stdout explicitly. |
| `--size <WxH>` | Initial virtual terminal size (default: `80x24`). |

**Lifecycle flags:**

| Flag | Description |
|------|-------------|
| `--timeout <duration>` | Hard cap on total run time (default: `10s`). |
| `--keep-alive` | Do not auto-quit when the script ends (needed with `--frames`). |

**Verbosity:**

| Flag | Effect |
|------|--------|
| `--quiet` / `-q` | Suppress progress traces on stderr; errors still print. |
| `--verbose` / `-v` | Add per-step trace to stderr. `-vv` adds frame diffs. |

**Stdout:** the captured artifact (text dump, SVG markup, JSON object, or NDJSON event stream).

**Stderr:** progress traces (e.g. `> press tab`, `> wait-for "Saved" matched in 130ms`), warnings, errors.

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
# Press q, capture final frame as SVG, write to file
reacterm drive src/App.tsx --press q --capture svg --out app.svg

# Capture final text to stdout and pipe it
reacterm drive src/App.tsx --press q --capture text | grep "Goodbye"

# Replay a recorded scenario file
reacterm drive src/App.tsx __scenarios__/login.scenario.yaml

# Inline multi-step script: tab, type, enter
reacterm drive src/App.tsx \
  --press tab \
  --type "hello world" \
  --press enter \
  --capture json

# Capture every frame as NDJSON (live frame stream)
reacterm drive src/App.tsx --press tab --capture ndjson --frames --out frames.ndjson
```

---

### `test`

Discover and run scenario files; emit structured output; exit non-zero on any failure.

```
USAGE: reacterm test [OPTIONS] [paths]
```

`reacterm test` is the CI entry point. It discovers `.scenario.yaml` / `.scenario.json` files, runs each one against its declared entry point, checks assertions in the `expect:` block, and exits non-zero on any failure. It runs independently of vitest — no test framework is required.

Default discovery pattern: `__scenarios__/**/*.scenario.{yaml,json}`.

**Selection flags:**

| Flag | Description |
|------|-------------|
| `-t, --grep <pattern>` | Run only scenarios whose name matches the given regex. |
| `--only-failed` | Re-run only scenarios that failed in the last invocation. |

**Snapshot flags:**

| Flag | Description |
|------|-------------|
| `-u, --update-snapshots` | Rewrite snapshot files on disk instead of failing on drift. |
| `--ci` | Forbid `-u` (exits `2` if both are passed); treat snapshot drift as exit code `3`. |

**Output flags:**

| Flag | Description |
|------|-------------|
| `--reporter <name>` | `pretty` (default), `tap`, `json`, `ndjson`. |
| `--quiet` / `-q` | Print errors only. |
| `--verbose` / `-v` | Per-step trace on stderr. |

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
# Run all discovered scenarios
reacterm test

# Run with JSON reporter (suitable for CI artifact upload)
reacterm test --reporter json > results.json

# Run scenarios matching "login"
reacterm test -t login

# Update snapshots locally after intentional UI change
reacterm test -u

# CI mode: fail on drift without allowing -u
reacterm test --ci --reporter ndjson

# Run a specific file
reacterm test __scenarios__/login.scenario.yaml
```

---

## Global Options

These flags apply to every verb and must appear before the verb name.

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Increase verbosity. Repeat for more detail (`-vv`, `-vvv`). |
| `-q, --quiet` | Print errors only; suppress all progress output. |
| `--version` | Print the reacterm version and exit. |
| `-h, --help` | Show the top-level help text and exit. |

Each verb also accepts `--help` for verb-specific usage.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_COLOR` | Disable ANSI color output in all verbs (per [no-color.org](https://no-color.org)). |
| `REACTERM_DEFAULT_SIZE` | Default virtual terminal size for `drive` and `test`, e.g. `80x24`. |

When stdout is not a TTY (i.e. piped), reacterm automatically suppresses progress bars and color in the data stream even without `NO_COLOR`.

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
