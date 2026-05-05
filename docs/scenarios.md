# reacterm Scenario Reference

Scenario files are the primary way to author black-box regression checks for reacterm applications. A scenario describes a sequence of user interactions (steps) and the expected state of the terminal at the end (expect). Scenario files are executed with assertions by `reacterm test` and can be produced automatically by `reacterm run --capture`.

---

## File Format and Extension

| Extension | Usage |
|-----------|-------|
| `.scenario.yaml` | Canonical format. Supports comments and is the default output of `reacterm run --capture`. |
| `.scenario.json` | Accepted with the same schema. Useful for programmatic generation or when you want to avoid a YAML parser dependency. |

**Convention:** place scenario files in a `__scenarios__/` directory at the project root or alongside the entry point they test. This mirrors the `__tests__/` convention and keeps scenario files close to the code they exercise.

**Execution:** pass scenario files explicitly to `reacterm test`. Automatic discovery is not implemented yet.

**IDE autocomplete:** files recorded by `reacterm run --capture` include a header for IDE YAML validation:

```yaml
# yaml-language-server: $schema=./node_modules/reacterm/docs/schema/scenario-v1.json
```

Add this to hand-authored files to enable validation and autocomplete in VS Code, JetBrains IDEs, and any editor that supports the yaml-language-server protocol.

---

## Top-Level Fields

```yaml
version: 1
name: save-and-quit
entry: src/App.tsx
size: { cols: 80, rows: 24 }
env:
  NODE_ENV: test
timeout: 5s
steps: [...]
expect: [...]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `number` | Yes | Schema version. Always `1` for the current release. |
| `name` | `string` | Yes | Human-readable scenario name. Appears in reporter output. |
| `entry` | `string` | Yes | Path to the reacterm app entry point (TypeScript/TSX file). Relative paths resolve from the scenario file's directory. |
| `size` | `{ cols, rows }` | No | Virtual terminal dimensions. Defaults to `80x24`. |
| `env` | `Record<string, string>` | No | Environment variables to inject into the app process. Merged on top of the parent environment. |
| `timeout` | duration string | No | Parsed by the schema. A scenario-level hard timeout is not enforced yet. Format: integer + unit suffix (`ms`, `s`, `m`). |
| `steps` | `Step[]` | No | Ordered list of user interaction steps. See step type reference below. |
| `expect` | `Expectation[]` | No | Assertions checked after all steps complete. Files without an `expect:` block run as smoke checks — the scenario passes as long as it does not time out or crash. |

---

## Step Types

Steps are processed in the order they appear in the `steps:` array. Each step is an object with exactly one top-level key naming the step type.

| Step | Shape | Description |
|------|-------|-------------|
| `press` | `string` or `string[]` | Press one key or a sequence of keys. Key names: `tab`, `enter`, `up`, `down`, `left`, `right`, `escape`, `ctrl+c`, `ctrl+z`, etc. An array value is expanded into N individual press steps. |
| `type` | `string` | Send a string as character-by-character keystrokes. |
| `paste` | `string` | Send text as a bracketed-paste sequence (as if pasted from clipboard). Supports multi-line strings. |
| `click` | `{ x, y, button? }` | Send a mouse click at column `x`, row `y`. `button` defaults to `"left"`. Accepted values: `"left"`, `"right"`, `"middle"`. |
| `scroll` | `{ direction: "up" \| "down", target?: { x, y } }` | Send one scroll wheel notch in the given direction. Optional `target` specifies the cell under the pointer. Magnitude is not configurable in v1; use repeated `scroll` steps for multi-notch scrolling. |
| `resize` | `{ cols, rows }` | Resize the virtual terminal to the given dimensions and trigger the app's resize handler. |
| `waitFor` | `string` or `{ text: string, timeout?: duration }` | Poll rendered frames every 16ms until the given text appears anywhere in the terminal. Fails the scenario if the text does not appear before the step timeout (or the scenario-level `timeout`). |
| `sleep` | duration string | Pause execution for the given duration. Useful for letting animations settle or for timing-sensitive scenarios. |
| `snapshot` | `{ as: "svg" \| "text" \| "json", path: string }` | Parsed by the schema but currently a no-op during execution. Use `expectSnapshot` with `reacterm test -u` to create or update the final-frame snapshot. |

### Duration string format

Durations are expressed as an integer followed immediately by a unit suffix. No fractional values, no spaces between the number and the unit.

| Suffix | Unit |
|--------|------|
| `ms` | milliseconds |
| `s` | seconds |
| `m` | minutes |

Valid: `100ms`, `2s`, `1m`, `500ms`. Invalid: `1.5s`, `2 s`, `100`.

---

## Expectation Types

Expectations in the `expect:` block are checked after all steps complete. In the current CLI implementation, `contains` and `expectSnapshot` are enforced against the final rendered terminal frame. The other expectation shapes are parsed but not enforced yet.

| Expectation | Shape | Description |
|-------------|-------|-------------|
| `contains` | `string` | Passes if the given text appears anywhere in the final terminal frame. |
| `line` | `{ at: number, equals?: string, contains?: string, matches?: string }` | Parsed but not enforced yet. |
| `expectSnapshot` | `string` (path) | Compare the current final frame to a stored snapshot file. Fails if they differ (drift). Path is relative to the scenario file. Use `-u` to update on intentional change; use `--ci` to treat drift as exit code `3`. |
| `exitCode` | `number` | Parsed but not enforced yet. |
| `noWarnings` | `boolean` | Parsed but not enforced yet. |
| `frameCount` | `{ min?: number, max?: number }` | Parsed but not enforced yet. |

---

## Worked Recipes

### Recipe 1: Smoke Check

A smoke check verifies that the app starts, responds to a key, and exits cleanly. It is the simplest useful scenario and a good starting point for any reacterm application.

```yaml
# yaml-language-server: $schema=./node_modules/reacterm/docs/schema/scenario-v1.json
version: 1
name: smoke-check
entry: src/App.tsx
size: { cols: 80, rows: 24 }
timeout: 5s

steps:
  - waitFor: "Welcome"
  - press: q

expect:
  - contains: "Bye"
```

This scenario waits for the app to render its initial "Welcome" text (confirming the app started and drew its first frame), then presses `q` to trigger the quit flow. The `expect:` block confirms that the final frame contains "Bye". If the app hangs or crashes before printing "Welcome", the `waitFor` step times out and the scenario fails with a clear error.

---

### Recipe 2: Login Flow

A multi-step scenario that simulates a user typing credentials, submitting a form, and verifying that the authenticated view appears.

```yaml
# yaml-language-server: $schema=./node_modules/reacterm/docs/schema/scenario-v1.json
version: 1
name: login-flow
entry: src/LoginApp.tsx
size: { cols: 100, rows: 30 }
env:
  NODE_ENV: test
timeout: 10s

steps:
  - waitFor: "Username:"
  - click: { x: 12, y: 4 }
  - type: "alice"
  - press: tab
  - type: "hunter2"
  - press: enter
  - waitFor:
      text: "Welcome, alice"
      timeout: 3s

expect:
  - contains: "Welcome, alice"
  - line: { at: 0, contains: "Dashboard" }
  - exitCode: 0
```

The `waitFor` steps act as synchronization barriers — the scenario does not advance until the app has rendered the expected text. This makes the test resilient to variable rendering timing. The `line` assertion in `expect:` checks that the top row of the terminal displays "Dashboard", confirming the correct screen is shown.

---

### Recipe 3: Snapshot Drift Detection

Snapshot assertions capture the exact terminal output as an SVG file and fail on any visual change. This is the primary way to detect unintended UI regressions.

```yaml
# yaml-language-server: $schema=./node_modules/reacterm/docs/schema/scenario-v1.json
version: 1
name: dashboard-snapshot
entry: src/App.tsx
size: { cols: 120, rows: 40 }
timeout: 5s

steps:
  - waitFor: "Dashboard"
expect:
  - expectSnapshot: __snapshots__/dashboard.svg
```

**Initial setup:** run `reacterm test -u __scenarios__/dashboard.scenario.yaml` once to create `__snapshots__/dashboard.svg`. Commit the file alongside the scenario.

**Day-to-day:** run `reacterm test` (or `reacterm test --ci` in CI). If the rendered output matches the stored SVG, the scenario passes. If it differs (drift), the scenario fails with exit code `1` (or `3` under `--ci`).

**Accepting an intentional change:** run `reacterm test -u __scenarios__/dashboard.scenario.yaml` locally after confirming the change is correct. Commit the updated snapshot file. In CI, `--ci` prevents `-u` from running (exits `2` if both are passed), ensuring snapshots can only be updated by a developer with local access.

**Capability fingerprint:** snapshot files include a terminal capability hash. If the hash in the stored snapshot does not match the current environment (e.g. after a system font change), `reacterm test --ci` exits `4` rather than `3`, distinguishing environment drift from a real UI regression.

---

### Recipe 4: Multi-Step Assertion

Combining multiple expectation types in a single scenario to create a thorough regression check.

```yaml
# yaml-language-server: $schema=./node_modules/reacterm/docs/schema/scenario-v1.json
version: 1
name: save-and-quit
entry: src/Editor.tsx
size: { cols: 80, rows: 24 }
env:
  NODE_ENV: test
timeout: 8s

steps:
  - waitFor: "Ready"
  - type: "hello world"
  - press: [ctrl+s]
  - waitFor:
      text: "Saved"
      timeout: 2s
  - press: q

expect:
  - contains: "Bye"
  - expectSnapshot: __snapshots__/after-save.svg
```

This scenario verifies two implemented properties simultaneously:

1. **`contains: "Bye"`** — the quit flow completed and the final frame includes the expected farewell text.
2. **`expectSnapshot`** — the final terminal state matches the stored snapshot, catching visual regression in the completed save-and-quit flow.
