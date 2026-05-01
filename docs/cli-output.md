# reacterm CLI Output Schema

This document is the versioned contract for all machine-readable output produced by `reacterm`. It covers `drive --capture json`, `test --reporter json`, `test --reporter ndjson`, and the placeholder `drive --capture ndjson` frame stream.

---

## Schema Versioning Policy

All machine-readable output produced by `reacterm` carries a `schemaVersion` field (integer). The current version is **1**.

Rules:
- A `schemaVersion` bump is a **breaking change**. Consumers must gate on this field.
- Additive fields (new optional keys) within the same `schemaVersion` are non-breaking.
- Field removals, type changes, and semantic changes to existing fields require a version bump.
- `schemaVersion` appears in the first event of NDJSON streams (the `start` event) so consumers can reject early rather than fail mid-stream.

---

## `drive --capture json`

When `reacterm drive` is invoked with `--capture json`, it writes a single JSON object to stdout representing the final captured terminal state.

### Shape

```json
{
  "schemaVersion": 1,
  "finalText": "string — full plain-text content of the final frame",
  "lines": ["array of strings, one per terminal row"],
  "durationMs": 340
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `number` | Always `1` in the current release. |
| `finalText` | `string` | The full plain-text content of the terminal's final rendered frame, rows joined with `\n`. |
| `lines` | `string[]` | One element per terminal row. Length equals the configured terminal height (`--size` rows). Trailing whitespace within each line is preserved. |
| `durationMs` | `number` | Wall-clock time in milliseconds from script start to final frame capture. |

### Example

```bash
reacterm drive src/App.tsx --press q --capture json
```

```json
{
  "schemaVersion": 1,
  "finalText": " Welcome to MyApp \n Press q to quit \n",
  "lines": [" Welcome to MyApp ", " Press q to quit ", ""],
  "durationMs": 183
}
```

---

## `test --reporter json`

When `reacterm test` is invoked with `--reporter json`, it writes a single JSON object to stdout after all scenarios have run.

### Shape

```json
{
  "schemaVersion": 1,
  "scenarios": [
    {
      "name": "string",
      "file": "string — path to scenario file",
      "status": "pass | fail | skip",
      "durationMs": 340,
      "error": "string | null — present and non-null on failure"
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 1,
    "skipped": 0,
    "total": 4
  }
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `number` | Always `1`. |
| `scenarios` | `ScenarioResult[]` | One entry per discovered (and optionally filtered) scenario. |
| `scenarios[].name` | `string` | Scenario name from the `name:` field in the YAML/JSON file. |
| `scenarios[].file` | `string` | Absolute path to the scenario file. |
| `scenarios[].status` | `"pass" \| "fail" \| "skip"` | Outcome. `"skip"` when `--only-failed` is active and the scenario passed last time. |
| `scenarios[].durationMs` | `number` | Wall-clock time in milliseconds for this scenario. |
| `scenarios[].error` | `string \| null` | Human-readable error message when `status` is `"fail"`. `null` otherwise. |
| `summary.passed` | `number` | Count of scenarios with `status === "pass"`. |
| `summary.failed` | `number` | Count of scenarios with `status === "fail"`. |
| `summary.skipped` | `number` | Count of scenarios with `status === "skip"`. |
| `summary.total` | `number` | Total count of scenarios considered (passed + failed + skipped). |

### Example

```bash
reacterm test --reporter json
```

```json
{
  "schemaVersion": 1,
  "scenarios": [
    {
      "name": "smoke-check",
      "file": "/app/__scenarios__/smoke.scenario.yaml",
      "status": "pass",
      "durationMs": 210,
      "error": null
    },
    {
      "name": "login-flow",
      "file": "/app/__scenarios__/login.scenario.yaml",
      "status": "fail",
      "durationMs": 5001,
      "error": "step 3: waitFor \"Welcome\" did not match within 2s"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 1,
    "skipped": 0,
    "total": 2
  }
}
```

---

## `test --reporter ndjson`

When `reacterm test` is invoked with `--reporter ndjson`, it writes one JSON object per line to stdout as scenarios execute. Consumers can stream results in real time.

### Event types

Each line is a valid JSON object with a `type` field.

#### `start` event

Emitted once before any scenarios run.

```json
{
  "type": "start",
  "schemaVersion": 1,
  "total": 4,
  "timestamp": "2026-05-01T15:48:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"start"` | Discriminant. |
| `schemaVersion` | `number` | Always `1`. Present in the first event so consumers can reject incompatible versions early. |
| `total` | `number` | Total number of scenarios that will run. |
| `timestamp` | `string` | ISO 8601 UTC timestamp. |

#### `pass` event

Emitted once per scenario that passes all assertions.

```json
{
  "type": "pass",
  "name": "smoke-check",
  "file": "/app/__scenarios__/smoke.scenario.yaml",
  "durationMs": 210
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"pass"` | Discriminant. |
| `name` | `string` | Scenario name. |
| `file` | `string` | Absolute path to the scenario file. |
| `durationMs` | `number` | Wall-clock time for this scenario. |

#### `fail` event

Emitted once per scenario that fails any assertion or encounters a runtime error.

```json
{
  "type": "fail",
  "name": "login-flow",
  "file": "/app/__scenarios__/login.scenario.yaml",
  "durationMs": 5001,
  "error": "step 3: waitFor \"Welcome\" did not match within 2s"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"fail"` | Discriminant. |
| `name` | `string` | Scenario name. |
| `file` | `string` | Absolute path to the scenario file. |
| `durationMs` | `number` | Wall-clock time for this scenario. |
| `error` | `string` | Human-readable error describing the failure. |

#### `summary` event

Emitted once after all scenarios have run, immediately before the process exits.

```json
{
  "type": "summary",
  "passed": 3,
  "failed": 1,
  "skipped": 0,
  "total": 4,
  "durationMs": 1840
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"summary"` | Discriminant. |
| `passed` | `number` | Scenarios that passed. |
| `failed` | `number` | Scenarios that failed. |
| `skipped` | `number` | Scenarios that were skipped (e.g. via `--only-failed`). |
| `total` | `number` | Total scenarios considered. |
| `durationMs` | `number` | Total wall-clock time from `start` to `summary`. |

### Full example stream

```bash
reacterm test --reporter ndjson
```

```ndjson
{"type":"start","schemaVersion":1,"total":2,"timestamp":"2026-05-01T15:48:00.000Z"}
{"type":"pass","name":"smoke-check","file":"/app/__scenarios__/smoke.scenario.yaml","durationMs":210}
{"type":"fail","name":"login-flow","file":"/app/__scenarios__/login.scenario.yaml","durationMs":5001,"error":"step 3: waitFor \"Welcome\" did not match within 2s"}
{"type":"summary","passed":1,"failed":1,"skipped":0,"total":2,"durationMs":5211}
```

---

## `drive --capture ndjson` — Frame Stream

> **Status: placeholder — implementation pending in v1.1.**

When `reacterm drive` is invoked with `--capture ndjson` (with or without `--frames`), it will emit a stream of frame events to stdout. This format is reserved for live frame capture pipelines and is not fully implemented in v1. The shape is documented here as a forward declaration.

### Planned event types

#### `start` event

```json
{
  "type": "start",
  "schemaVersion": 1,
  "cols": 80,
  "rows": 24,
  "timestamp": "2026-05-01T15:48:00.000Z"
}
```

#### `frame` event

Emitted once per distinct rendered frame (when `--frames` is active) or once for the final frame (without `--frames`).

```json
{
  "type": "frame",
  "index": 0,
  "text": "string — plain-text content of this frame",
  "lines": ["array", "of", "rows"],
  "durationMs": 16
}
```

#### `end` event

```json
{
  "type": "end",
  "frameCount": 12,
  "totalDurationMs": 340
}
```

### Note for v1 consumers

In v1, `--capture ndjson` without `--frames` emits a single-frame stream (one `start`, one `frame`, one `end`), which is equivalent to the `--capture json` output wrapped in NDJSON events. Full frame streaming via `--frames` requires `--keep-alive` to hold the process open and is deferred to v1.1.
