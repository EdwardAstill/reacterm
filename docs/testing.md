# Testing Storm Apps

Storm ships with a full testing toolkit that renders components without a terminal. You can simulate keyboard, mouse, and paste input, query output text, and use snapshot utilities -- all without spawning a TTY.

## Setup

Install vitest (or jest):

```bash
npm install -D vitest
```

If you use TypeScript with JSX, make sure your test `tsconfig.json` has `"jsx": "react-jsx"`.

## Basic Testing

```tsx
import { renderForTest } from "reacterm/testing";
import { Box, Text } from "reacterm";

test("renders greeting", () => {
  const result = renderForTest(
    <Box><Text bold>Hello</Text></Box>
  );

  expect(result.hasText("Hello")).toBe(true);
  expect(result.getLine(0)).toContain("Hello");
  expect(result.lines.length).toBeGreaterThan(0);
});
```

`renderForTest` accepts an optional second argument for dimensions:

```tsx
const result = renderForTest(<App />, { width: 80, height: 24 });
```

The returned `RenderResult` exposes:

| Property / Method | Type | Description |
|---|---|---|
| `output` | `string` | Plain text output (no ANSI codes) |
| `lines` | `string[]` | Output split into lines |
| `styledOutput` | `string` | ANSI-styled output |
| `width` | `number` | Width of the render area |
| `height` | `number` | Height of the render area |
| `hasText(text)` | `boolean` | Check if output contains text |
| `getLine(n)` | `string` | Get text at line `n` (empty string if out of bounds) |
| `findText(pattern)` | `string[]` | Get all matches of a RegExp in the output |
| `rerender(element)` | `void` | Re-render with a new element |
| `unmount()` | `void` | Unmount and clean up |

## Simulating Input

### Keyboard

```tsx
test("handles keyboard input", () => {
  const result = renderForTest(<MyForm />);

  result.type("John");                          // Type characters one by one
  result.pressEnter();                          // Enter / return
  result.pressTab();                            // Tab (focus cycling)
  result.pressEscape();                         // Escape
  result.pressUp();                             // Arrow up
  result.pressDown();                           // Arrow down
  result.pressLeft();                           // Arrow left
  result.pressRight();                          // Arrow right
  result.fireKey("a", { ctrl: true });          // Ctrl+A
  result.fireKey("z", { meta: true });          // Meta+Z

  expect(result.hasText("John")).toBe(true);
});
```

`fireKey` takes a key name and optional modifiers (`ctrl`, `shift`, `meta`):

```tsx
result.fireKey("backspace");
result.fireKey("delete");
result.fireKey("space");
result.fireKey("c", { ctrl: true });       // Ctrl+C
result.fireKey("tab", { shift: true });    // Shift+Tab
```

### Paste

```tsx
test("handles paste", () => {
  const result = renderForTest(<MyEditor />);

  result.paste("pasted content here");

  expect(result.hasText("pasted content")).toBe(true);
});
```

### Scroll

```tsx
test("scrolls content", () => {
  const result = renderForTest(<MyScrollableList />, { height: 10 });

  result.scroll("down");                    // Scroll down at (0, 0)
  result.scroll("down", 5, 3);             // Scroll down at column 5, row 3
  result.scroll("up");                      // Scroll up

  expect(result.hasText("Item 6")).toBe(true);
});
```

## Text Queries

### Pattern Matching with findText

```tsx
test("finds patterns in output", () => {
  const result = renderForTest(<StatusDashboard />);

  const timestamps = result.findText(/\d{2}:\d{2}:\d{2}/);
  expect(timestamps.length).toBeGreaterThan(0);

  const errors = result.findText(/ERROR: .+/);
  expect(errors).toEqual([]);
});
```

## Re-rendering

```tsx
test("updates on rerender", () => {
  const result = renderForTest(<Greeting name="Alice" />);
  expect(result.hasText("Alice")).toBe(true);

  result.rerender(<Greeting name="Bob" />);
  expect(result.hasText("Bob")).toBe(true);
  expect(result.hasText("Alice")).toBe(false);
});
```

## Assertion Helpers

Storm provides `expectOutput` for fluent assertions that throw descriptive errors on failure -- useful when you want clear diagnostics without framework-specific matchers:

```tsx
import { renderForTest, expectOutput } from "reacterm/testing";

test("with fluent assertions", () => {
  const result = renderForTest(<App />);

  expectOutput(result).toContainText("Welcome");
  expectOutput(result).toNotContainText("Error");
  expectOutput(result).toHaveLineCount(5);
  expectOutput(result).lineAt(0).toContain("Welcome");
  expectOutput(result).lineAt(0).toEqual("Welcome to Storm");
  expectOutput(result).lineAt(4).toBeEmpty();
});
```

`expectOutput` methods:

| Method | Description |
|---|---|
| `toContainText(text)` | Assert output contains text |
| `toNotContainText(text)` | Assert output does not contain text |
| `toHaveLineCount(n)` | Assert exact number of output lines |
| `toMatchSnapshot(name)` | Compare against an in-memory snapshot (see below) |
| `lineAt(n).toContain(text)` | Assert line `n` contains text |
| `lineAt(n).toEqual(text)` | Assert line `n` equals text exactly |
| `lineAt(n).toBeEmpty()` | Assert line `n` is empty |

## Custom Matchers (Vitest/Jest)

Register Storm's custom matchers for a more natural `expect()` syntax:

```tsx
import { createStormMatchers, renderForTest } from "reacterm/testing";

expect.extend(createStormMatchers());

test("with custom matchers", () => {
  const result = renderForTest(<App />);

  expect(result).toContainStormText("Welcome");
  expect(result).toHaveStormLines(5);
  expect(result).toMatchStormSnapshot("app-initial");
});
```

Available matchers:

| Matcher | Description |
|---|---|
| `toContainStormText(text)` | Check if render output contains text |
| `toHaveStormLines(count)` | Check render output line count |
| `toMatchStormSnapshot(name)` | Compare against an in-memory snapshot |

## Snapshot Testing

### Vitest/Jest Built-in Snapshots

The simplest approach -- use the `output` property with your test framework's built-in snapshot support:

```tsx
test("matches snapshot", () => {
  const result = renderForTest(<Dashboard />, { width: 80, height: 24 });
  expect(result.output).toMatchSnapshot();
});
```

### In-Memory Snapshots

Storm provides its own in-memory snapshot store for cases where you want explicit control:

```tsx
import {
  renderForTest,
  createSnapshot,
  compareSnapshot,
  clearSnapshots,
} from "reacterm/testing";

test("in-memory snapshot workflow", () => {
  const result = renderForTest(<App />);

  // First run: create the baseline
  createSnapshot(result.output, "app-initial");

  // Later: compare against the stored snapshot
  const { match, diff } = compareSnapshot(result.output, "app-initial");
  expect(match).toBe(true);
});

afterAll(() => {
  clearSnapshots(); // Clean up in-memory store
});
```

### File-Based Snapshots

For snapshots that persist across test runs:

```tsx
import {
  renderForTest,
  saveSnapshot,
  compareFileSnapshot,
} from "reacterm/testing";

test("file-based snapshot", () => {
  const result = renderForTest(<App />, { width: 80, height: 24 });
  const snapshotPath = "__snapshots__/app.txt";

  // First run: save the baseline
  // saveSnapshot(result.output, snapshotPath);

  // Subsequent runs: compare
  const { match, isNew, diff } = compareFileSnapshot(result.output, snapshotPath);
  if (isNew) {
    saveSnapshot(result.output, snapshotPath);
  } else {
    expect(match).toBe(true);
  }
});
```

### SVG Snapshots

Render your component to an SVG image for visual regression testing:

```tsx
import {
  renderForTest,
  saveSvgSnapshot,
  compareSvgSnapshot,
  renderToSvg,
} from "reacterm/testing";

test("SVG visual snapshot", () => {
  const result = renderForTest(<Dashboard />, { width: 80, height: 24 });
  const snapshotPath = "__snapshots__/dashboard.svg";

  // First run: save the SVG baseline
  // saveSvgSnapshot(result, snapshotPath);

  // Subsequent runs: compare
  const { match, isNew, diff } = compareSvgSnapshot(result, snapshotPath);
  expect(match).toBe(true);
});
```

You can also render SVG directly for inspection:

```tsx
const svg = renderToSvg(result.lines, result.styledOutput, result.width, result.height, {
  // SvgOptions -- customize fonts, colors, etc.
});
```

## Testing with the TestInputManager Directly

For advanced scenarios where you need to control input at a lower level, use `TestInputManager` (also exported as `MockInputManager`):

```tsx
import { TestInputManager } from "reacterm/testing";

test("low-level input simulation", () => {
  const input = new TestInputManager();

  const keys: string[] = [];
  input.onKey((e) => keys.push(e.key));

  input.pressKey("a");
  input.pressKey("return");
  input.type("hello");

  expect(keys).toContain("a");
  expect(keys).toContain("return");
});
```

`TestInputManager` methods:

| Method | Description |
|---|---|
| `pressKey(key, opts?)` | Simulate a key press with optional `ctrl`, `shift`, `meta`, `char` |
| `type(text)` | Simulate typing a string character by character |
| `pressEnter()` | Simulate Enter key |
| `scroll(direction, x?, y?)` | Simulate mouse scroll (`"up"` or `"down"`) |
| `paste(text)` | Simulate a paste event |
| `onKey(handler)` | Register a key event handler (returns unsubscribe function) |
| `onKeyPrioritized(handler, priority)` | Register a prioritized key handler |
| `onMouse(handler)` | Register a mouse event handler |
| `onPaste(handler)` | Register a paste event handler |

## App Driver

Use `renderDriver` when you want to test a full TUI flow instead of one
component render. It wraps the same in-process renderer as `renderForTest`,
but adds fluent actions, semantic queries, frame history, and diagnostics.

```tsx
import { renderDriver } from "reacterm/testing";
import { Button, TextInput } from "reacterm";

test("submits a name", async () => {
  const driver = renderDriver(<ProfileForm />, { width: 80, height: 20 });

  await driver
    .type("Ada")
    .press("enter")
    .expectText("Saved Ada")
    .assertNoWarnings();

  driver.unmount();
});
```

Driver actions:

| Method | Description |
|---|---|
| `press(key, opts?)` | Press a key, with optional modifiers and `repeat` |
| `type(text)` | Type text with a render refresh after each character |
| `paste(text)` | Fire a paste event |
| `click(target)` | Click coordinates or a semantic target |
| `scroll(direction, target?)` | Send a wheel event at coordinates or a semantic target |
| `resize(width, height)` | Re-render at a deterministic terminal size |
| `expectText(text)` / `expectNoText(text)` | Assert screen text |
| `waitForText(text)` / `waitForNoText(text)` | Retry-shaped aliases for deterministic in-process tests |
| `assertNoWarnings()` | Fail if render warnings were captured |
| `frames()` / `trace()` | Inspect frame history and input trace |

Semantic targets use metadata captured from roles, labels, focus IDs, and
`testId` props:

```tsx
await driver.click({ role: "button", name: "Save file" });
await driver.click({ label: /Search/ });
await driver.click({ testId: "primary-action" });
await driver.click({ x: 10, y: 4 }); // coordinate fallback
```

## Scenario runner

The Scenario runner replays declarative steps against an app. Keep scenarios
JSON-first for now; the schema is intentionally YAML-friendly.

```tsx
import { runScenario } from "reacterm/testing";

await runScenario({
  name: "open command palette",
  terminal: { width: 100, height: 30 },
  steps: [
    { press: "k" },
    { expectText: "Command Palette" },
    { assertNoWarnings: true }
  ]
}, {
  app: <App />,
  artifactDir: "tmp/scenario-open-command-palette"
});
```

Example scenario files live under `tests/scenarios/`.

## Explorer

`exploreForTest` performs bounded model-style exploration. It is useful for
finding crashes, blank screens, warnings, or focus regressions without writing
every path by hand.

```tsx
import { exploreForTest } from "reacterm/testing";

const report = await exploreForTest(<App />, {
  terminal: { width: 100, height: 30 },
  maxDepth: 40,
  actions: ["tab", "enter", "escape", "up", "down"]
});

expect(report.failures).toEqual([]);
```

The explorer hashes screens to avoid reporting only repeated frames. Keep
`maxDepth` modest and use explicit actions for the surface under test.

## Failure Artifacts

Use `writeFailureBundle` to persist the state needed to debug a failed app
flow:

```tsx
import { renderDriver, writeFailureBundle } from "reacterm/testing";

const driver = renderDriver(<App />, { width: 80, height: 24 });
try {
  await driver.expectText("Ready");
} catch (error) {
  writeFailureBundle(driver, "tmp/app-failure");
  throw error;
}
```

The bundle includes `screen.txt`, `styled.ansi`, `screen.svg`, `frames.json`,
and `trace.json`.

## PTY smoke

Most tests should use the in-process driver. Use PTY smoke tests only for
terminal lifecycle behavior: spawning, raw input, resize, Ctrl+C, alternate
screen cleanup, and clean exit.

```tsx
import { runPtySmoke } from "reacterm/testing";

const result = await runPtySmoke({
  command: process.execPath,
  args: ["-e", "console.log('ready')"],
  cols: 80,
  rows: 24
});

if (!result.skipped) {
  expect(result.output).toContain("ready");
}
```

`runPtySmoke` skips explicitly when optional `node-pty` is not installed.
Run PTY checks separately with:

```bash
bun run test:pty
```

## Testing Async Components

```tsx
test("loads data", async () => {
  const result = renderForTest(<AsyncComponent />);

  // Wait for loading to complete
  await new Promise(r => setTimeout(r, 100));
  result.rerender(<AsyncComponent />);

  expect(result.hasText("Loaded")).toBe(true);
});
```

## Best Practices

1. **Always provide explicit dimensions** -- `renderForTest(<App />, { width: 80, height: 24 })`. This makes tests deterministic across different terminal sizes.

2. **Test behavior, not exact layout** -- prefer `hasText()` and `findText()` over exact line matching. Layout can shift with minor changes.

3. **Use snapshots sparingly** -- they break on any visual change. Reserve them for high-value visual regression tests (e.g., a dashboard layout).

4. **For components with timers, test the initial state** -- mock time with `vi.useFakeTimers()` (vitest) or `jest.useFakeTimers()` if you need to advance through timer-driven state.

5. **Clean up** -- call `result.unmount()` in teardown if your component registers listeners or timers. Call `clearSnapshots()` in `afterAll` if using in-memory snapshots.

6. **Use `expectOutput` for clear failure messages** -- when a test fails, `expectOutput` shows the actual output in the error, making diagnosis fast.

7. **Prefer `renderForTest` over `renderToString`** -- `renderForTest` wraps `renderToString` with input simulation and query helpers. Use `renderToString` directly only for headless/CI output generation.

8. **Prefer `renderDriver` for full app flows** -- it gives better diagnostics, semantic selectors, frame history, and artifacts than hand-written coordinate scripts.

9. **Keep PTY tests small** -- PTY smoke is for real terminal lifecycle behavior. Use the in-process driver for most interaction coverage.
