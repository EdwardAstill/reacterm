# reacterm CLI Output Schema

This document is the versioned contract for machine-readable output produced by the current `reacterm` CLI. It covers `drive --capture json`, `test --reporter json`, and `test --reporter ndjson`.

---

## Schema Versioning Policy

Versioned reporter output carries a `schemaVersion` field (integer). The current version is **1**. `drive --capture json` does not currently include this field.

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
  "finalText": "string — full plain-text content of the final frame",
  "lines": ["array of strings, one per terminal row"],
  "durationMs": 0
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `finalText` | `string` | The full plain-text content of the terminal's final rendered frame, rows joined with `\n`. |
| `lines` | `string[]` | One element per terminal row. Length equals the configured terminal height (`--size` rows). Trailing whitespace within each line is preserved. |
| `durationMs` | `number` | Currently emitted as `0`. |

### Example

```bash
reacterm drive src/App.tsx --press q --capture json
```

```json
{
  "finalText": " Welcome to MyApp \n Press q to quit \n",
  "lines": [" Welcome to MyApp ", " Press q to quit ", ""],
  "durationMs": 0
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
      "status": "pass | fail",
      "durationMs": 340,
      "failure": "string — present on failure"
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 1,
    "total": 4
  }
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `number` | Always `1`. |
| `scenarios` | `ScenarioResult[]` | One entry per scenario path passed to `reacterm test`. |
| `scenarios[].name` | `string` | Scenario name from the `name:` field in the YAML/JSON file. |
| `scenarios[].status` | `"pass" \| "fail"` | Outcome. |
| `scenarios[].durationMs` | `number` | Wall-clock time in milliseconds for this scenario. |
| `scenarios[].failure` | `string \| undefined` | Human-readable error message when `status` is `"fail"`. |
| `summary.passed` | `number` | Count of scenarios with `status === "pass"`. |
| `summary.failed` | `number` | Count of scenarios with `status === "fail"`. |
| `summary.total` | `number` | Total count of scenarios considered. |

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
      "status": "pass",
      "durationMs": 210
    },
    {
      "name": "login-flow",
      "status": "fail",
      "durationMs": 5001,
      "failure": "step waitFor: waitFor \"Welcome\" did not match within 2000ms"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 1,
    "total": 2
  }
}
```

---

## `test --reporter ndjson`

When `reacterm test` is invoked with `--reporter ndjson`, it writes one JSON object per line to stdout after all scenarios complete.

### Event types

Each line is a valid JSON object with a `type` field.

#### `start` event

Emitted once before scenario results in the buffered output.

```json
{
  "type": "start",
  "schemaVersion": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"start"` | Discriminant. |
| `schemaVersion` | `number` | Always `1`. Present in the first event so consumers can reject incompatible versions early. |

#### `pass` event

Emitted once per scenario that passes all assertions.

```json
{
  "type": "pass",
  "name": "smoke-check",
  "durationMs": 210
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"pass"` | Discriminant. |
| `name` | `string` | Scenario name. |
| `durationMs` | `number` | Wall-clock time for this scenario. |

#### `fail` event

Emitted once per scenario that fails any assertion or encounters a runtime error.

```json
{
  "type": "fail",
  "name": "login-flow",
  "durationMs": 5001,
  "failure": "step waitFor: waitFor \"Welcome\" did not match within 2000ms"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"fail"` | Discriminant. |
| `name` | `string` | Scenario name. |
| `durationMs` | `number` | Wall-clock time for this scenario. |
| `failure` | `string` | Human-readable error describing the failure. |

#### `summary` event

Emitted once after all scenarios have run, immediately before the process exits.

```json
{
  "type": "summary",
  "passed": 3,
  "failed": 1,
  "total": 4
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"summary"` | Discriminant. |
| `passed` | `number` | Scenarios that passed. |
| `failed` | `number` | Scenarios that failed. |
| `total` | `number` | Total scenarios considered. |

### Full example stream

```bash
reacterm test --reporter ndjson __scenarios__/smoke.scenario.yaml __scenarios__/login.scenario.yaml
```

```ndjson
{"type":"start","schemaVersion":1}
{"type":"pass","name":"smoke-check","durationMs":210}
{"type":"fail","name":"login-flow","durationMs":5001,"failure":"step waitFor: waitFor \"Welcome\" did not match within 2000ms"}
{"type":"summary","passed":1,"failed":1,"total":2}
```

---

## `drive --capture ndjson` — Frame Stream

> **Status: not implemented.** The current CLI throws for `drive --capture ndjson`.

The shape below is a forward declaration for live frame capture pipelines. Do not depend on it in the current CLI.

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

Emitted once per distinct rendered frame in the planned stream.

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

### Note for current consumers

Use `--capture json`, `--capture text`, or `--capture svg` for implemented `drive` capture formats.
