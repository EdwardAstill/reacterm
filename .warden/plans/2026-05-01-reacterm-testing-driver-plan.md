# Plan: Reacterm Testing Driver

**Spec:** none; design captured in this plan from the prior testing research and brainstorming pass
**Created:** 2026-05-01T04:48Z
**Status:** done
**Shape:** plan-execute-review
**Human checkpoints:** 1
**Refinement passes:** 1

## Goal

Build a first-class Reacterm TUI testing system that lets maintainers and agents test full apps programmatically, using a fast in-process driver for most coverage and a small PTY smoke layer for real terminal behavior.

The target shape is a Playwright-style API over Reacterm:

```ts
await scenario("demo edits revenue", <DemoApp />, {
  terminal: { width: 100, height: 30 },
  seed: 1,
})
  .press("tab", { repeat: 4 })
  .expectText("Data widgets")
  .click({ role: "gridcell", name: /Revenue.*Q1/ })
  .scroll("up")
  .expectText("Revenue · Q1 = 121")
  .snapshotSvg("demo-revenue-edited")
  .assertNoWarnings()
  .assertNoOverlaps();
```

And a declarative scenario format for repeatable agent/CI runs:

```yaml
name: demo edits revenue
app: examples/reacterm-demo.tsx#DemoApp
terminal:
  width: 100
  height: 30
steps:
  - press: tab
    repeat: 4
  - expectText: Data widgets
  - click:
      role: gridcell
      name: Revenue Q1
  - scroll: up
  - expectText: Revenue · Q1 = 121
artifacts:
  - text
  - frames
  - svg
  - trace
```

## Design Decisions

- Keep `renderForTest` and current tests compatible.
- Put the public API behind `reacterm/testing`; do not expose test-only hooks through the main runtime package.
- Use in-process rendering as the main test surface because it is deterministic, fast, and already exercises Reacterm's reconciler, layout, input, and paint path.
- Use semantic selectors where possible: role, label, focused entry, accessible name, text, and stable test IDs.
- Keep coordinate actions as an escape hatch, not the primary script style.
- Use bounded model exploration, not unbounded "try every possible input".
- Add PTY tests only for real terminal contracts: startup, raw input, resize, alternate screen cleanup, Ctrl+C, and normal quit.
- Make failure artifacts mandatory for scripted flows: final text screen, styled output, SVG, frame log, input trace, warnings, and errors.

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `examples/reacterm-demo.tsx` | Preserve existing user changes while resolving the current scroll-to-edit behavior/test mismatch. |
| Modify | `src/__tests__/robustness.test.ts` | Align robustness coverage with the intended scroll-to-edit behavior. |
| Modify | `src/reconciler/render-to-string.ts` | Surface test metadata from the headless render path. |
| Modify | `src/testing/index.ts` | Export compatible existing utilities plus the new driver, scenario, artifacts, explorer, and optional PTY APIs. |
| Create | `src/testing/driver.ts` | Fluent app driver over `renderForTest`. |
| Create | `src/testing/queries.ts` | Text, role, label, focused, and test-id selector implementation. |
| Create | `src/testing/metadata.ts` | Semantic tree, focusable bounds, warnings, frame records, and screen-hash types. |
| Create | `src/testing/artifacts.ts` | Text, styled text, SVG, trace, and frame-diff artifact writers. |
| Create | `src/testing/scenario.ts` | Programmatic and declarative scenario runner. |
| Create | `src/testing/explorer.ts` | Bounded action explorer with invariants and screen-state hashing. |
| Create | `src/testing/pty.ts` | Optional `node-pty` smoke harness. |
| Create | `src/__tests__/testing-driver.test.ts` | Driver API, selectors, waits, resize, fake time, and artifacts. |
| Create | `src/__tests__/testing-scenario.test.ts` | Declarative scenario parsing and replay. |
| Create | `src/__tests__/testing-explorer.test.ts` | Explorer action bounds, loop avoidance, and invariant failures. |
| Create | `src/__tests__/testing-pty.test.ts` | PTY API shape and skip behavior when PTY is unavailable. |
| Create | `tests/scenarios/demo-revenue.scenario.json` | Real example script for the demo revenue edit flow. |
| Create | `tests/scenarios/demo-navigation.scenario.json` | Real example script for tab/focus/navigation coverage. |
| Modify | `package.json` | Add test scripts and any required dev dependency for PTY smoke. |
| Modify | `vitest.config.ts` | Include new unit/driver tests without accidentally running PTY smoke by default. |
| Modify | `docs/testing.md` | Document the driver, scenario runner, explorer, artifacts, and PTY smoke layer. |
| Modify | `README.md` | Add a short testing capability mention and link to `docs/testing.md`. |

## Sub-tasks

### Sub-task 1 — Restore the current testing baseline

**Block:** execute
**Skill:** warden:systematic-debugging
**Depends on:** (none)

**Instruction:**

Resolve the current red suite before adding new testing infrastructure. Inspect the existing modified `examples/reacterm-demo.tsx` and `src/__tests__/robustness.test.ts` without reverting user changes. Decide whether the intended behavior is "click to select before wheel edits" or "hover wheel edits immediately", then update the smallest surface so the robustness test and implementation agree. Run the focused robustness test first, then TypeScript.

**Inputs (pre-staged):**
- file: `examples/reacterm-demo.tsx`
- file: `src/__tests__/robustness.test.ts`
- prior: `bun test` currently fails at `Demo global shortcuts > lets the Scroll-to-edit table consume wheel events to edit a cell`.

**Acceptance:**
- `bun test src/__tests__/robustness.test.ts -t "Scroll-to-edit table"`
- `bun x tsc --noEmit`

### Sub-task 2 — Confirm public API scope before implementation

**Block:** human
**Skill:** warden:ask
**Depends on:** sub-task 1

**Instruction:**

Ask the user to approve the public testing API scope before implementation starts. The approval prompt must summarize that `reacterm/testing` will gain a fluent app driver, semantic selectors, scenario runner, explorer, artifacts, and optional PTY smoke helpers while keeping existing `renderForTest` behavior compatible.

**Inputs (pre-staged):**
- file: `.warden/plans/2026-05-01-reacterm-testing-driver-plan.md`

**Acceptance:**
- User explicitly approves continuing with this public API scope.

### Sub-task 3 — Add test metadata to the headless render path

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** sub-task 2

**Instruction:**

Test-drive metadata capture for the in-process testing path. Extend the current headless render result so the driver can inspect frame history, screen hashes, warnings, focusable entries, semantic nodes, and bounds. Preserve existing `renderForTest` and `renderToString` properties and behavior. Keep metadata types in `src/testing/metadata.ts` and expose them through `src/testing/index.ts`.

**Inputs (pre-staged):**
- file: `src/reconciler/render-to-string.ts`
- file: `src/testing/index.ts`
- create: `src/testing/metadata.ts`
- create: `src/__tests__/testing-driver.test.ts`

**Acceptance:**
- `bun test src/__tests__/testing-driver.test.ts -t "metadata"`
- `bun test src/__tests__/integration.test.ts -t "End-to-end rendering"`
- `bun x tsc --noEmit`

### Sub-task 4 — Build the fluent TUI driver

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** sub-task 3

**Instruction:**

Create `src/testing/driver.ts` with `renderDriver` and `scenario` APIs over the existing `renderForTest` implementation. The driver must support `press`, `type`, `paste`, `click`, `scroll`, `resize`, `waitForText`, `waitForNoText`, `waitForIdle`, `waitForFrameChange`, `expectText`, `expectNoText`, `expectFocused`, `assertNoWarnings`, and cleanup. It must record an input trace and frame history after each action. Update `src/testing/index.ts` exports.

**Inputs (pre-staged):**
- create: `src/testing/driver.ts`
- modify: `src/testing/index.ts`
- modify: `src/__tests__/testing-driver.test.ts`

**Acceptance:**
- `bun test src/__tests__/testing-driver.test.ts -t "driver"`
- `bun test src/__tests__/textinput.test.ts`
- `bun x tsc --noEmit`

### Sub-task 5 — Add semantic selectors and actionability checks

**Block:** execute
**Skill:** warden:typescript
**Depends on:** sub-task 4

**Instruction:**

Implement semantic query helpers in `src/testing/queries.ts`: `getByText`, `queryByText`, `getByRole`, `getByLabel`, `getByTestId`, `getFocused`, and coordinate fallback helpers. Selectors must use captured role/ARIA/test-id metadata when available and fall back to text output only when semantic metadata is absent. Driver click actions that use selectors must resolve to a concrete point or throw a diagnostic error with the current screen text.

**Inputs (pre-staged):**
- create: `src/testing/queries.ts`
- modify: `src/testing/driver.ts`
- modify: `src/testing/metadata.ts`
- modify: `src/__tests__/testing-driver.test.ts`

**Acceptance:**
- `bun test src/__tests__/testing-driver.test.ts -t "selectors"`
- `bun test src/__tests__/components.test.ts -t "Button"`
- `bun x tsc --noEmit`

### Sub-task 6 — Add artifacts and visual snapshots

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** sub-task 4

**Instruction:**

Create `src/testing/artifacts.ts` and wire artifact capture into the driver. Support text snapshots, styled-output snapshots, SVG snapshots through the existing `renderToSvg`, frame logs, input trace JSON, and failure bundles under a caller-provided artifact directory. Ensure artifacts are deterministic for fixed terminal dimensions and include enough diagnostic context to reproduce a failing scenario.

**Inputs (pre-staged):**
- create: `src/testing/artifacts.ts`
- modify: `src/testing/driver.ts`
- modify: `src/testing/index.ts`
- modify: `src/__tests__/testing-driver.test.ts`

**Acceptance:**
- `bun test src/__tests__/testing-driver.test.ts -t "artifacts"`
- `bun test src/__tests__/demo-visual-effects.test.ts`
- `bun x tsc --noEmit`

### Sub-task 7 — Add declarative scenario runner

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** sub-task 5, sub-task 6

**Instruction:**

Create `src/testing/scenario.ts` with a JSON-first scenario schema and replay engine. Support steps for `press`, `type`, `paste`, `click`, `scroll`, `resize`, `expectText`, `expectNoText`, `expectRole`, `waitForText`, `snapshotText`, `snapshotSvg`, `assertNoWarnings`, and `assertNoOverlaps`. Add real scenario fixtures under `tests/scenarios/`. Do not add YAML parsing in this task unless the repo already has a dependency for it; the schema should be YAML-compatible later.

**Inputs (pre-staged):**
- create: `src/testing/scenario.ts`
- create: `src/__tests__/testing-scenario.test.ts`
- create: `tests/scenarios/demo-revenue.scenario.json`
- create: `tests/scenarios/demo-navigation.scenario.json`
- modify: `src/testing/index.ts`

**Acceptance:**
- `bun test src/__tests__/testing-scenario.test.ts`
- `test -f tests/scenarios/demo-revenue.scenario.json`
- `test -f tests/scenarios/demo-navigation.scenario.json`
- `bun x tsc --noEmit`

### Sub-task 8 — Add bounded explorer mode

**Block:** execute
**Skill:** warden:test-driven-development
**Depends on:** sub-task 5, sub-task 6

**Instruction:**

Create `src/testing/explorer.ts` for bounded automated exploration. The explorer should discover focusable/semantic targets, try a configured action inventory, hash screens to avoid loops, stop at max depth/max frames, and report invariant failures. Initial invariants must include `no-crash`, `not-blank`, `no-warning`, `focus-visible`, and `no-overlap` where metadata makes overlap detection reliable. The explorer should return a structured report and artifact bundle.

**Inputs (pre-staged):**
- create: `src/testing/explorer.ts`
- create: `src/__tests__/testing-explorer.test.ts`
- modify: `src/testing/index.ts`

**Acceptance:**
- `bun test src/__tests__/testing-explorer.test.ts`
- `bun test src/__tests__/robustness.test.ts -t "Demo global shortcuts"`
- `bun x tsc --noEmit`

### Sub-task 9 — Add optional PTY smoke harness

**Block:** execute
**Skill:** warden:typescript
**Depends on:** sub-task 4

**Instruction:**

Create `src/testing/pty.ts` and package scripts for real-terminal smoke coverage. Use `node-pty` as a dev dependency if it installs cleanly in the repo; otherwise implement a clear skip path with an explicit diagnostic. The PTY harness must support spawning a command in a fixed terminal size, sending keys/text, resizing, waiting for output, capturing final output, and asserting clean exit. Keep PTY tests outside the default `bun test` path unless they are explicitly skipped by default.

**Inputs (pre-staged):**
- create: `src/testing/pty.ts`
- create: `src/__tests__/testing-pty.test.ts`
- modify: `package.json`
- modify: `vitest.config.ts`
- modify: `src/testing/index.ts`

**Acceptance:**
- `bun test src/__tests__/testing-pty.test.ts`
- `bun run test:pty`
- `bun x tsc --noEmit`

### Sub-task 10 — Update package scripts and documentation

**Block:** execute
**Skill:** warden:docs-writing
**Depends on:** sub-task 7, sub-task 8, sub-task 9

**Instruction:**

Update `package.json`, `docs/testing.md`, and `README.md` so developers can discover and use the new testing system. Documentation must include one component test, one fluent app-driver test, one declarative scenario, one explorer run, one artifact example, and one PTY smoke example. The package scripts must distinguish fast default tests from optional PTY smoke.

**Inputs (pre-staged):**
- modify: `package.json`
- modify: `docs/testing.md`
- modify: `README.md`

**Acceptance:**
- `grep -q "renderDriver" docs/testing.md`
- `grep -q "Scenario runner" docs/testing.md`
- `grep -q "Explorer" docs/testing.md`
- `grep -q "PTY smoke" docs/testing.md`
- `node -e "const p=require('./package.json'); for (const s of ['test','test:driver','test:scenarios','test:pty','test:all']) if (!p.scripts[s]) process.exit(1)"`
- `bun x tsc --noEmit`

### Sub-task 11 — Review the public testing API

**Block:** review
**Skill:** warden:code-review
**Depends on:** sub-task 10

**Instruction:**

Review the new testing API as a public package surface. Prioritize API compatibility with existing `reacterm/testing`, deterministic behavior, clear diagnostics, artifact usefulness, selector brittleness, cleanup/leak risks, and whether PTY smoke is isolated from fast tests. Produce findings with file/line references and require fixes for any correctness or API-stability issue.

**Inputs (pre-staged):**
- file: `src/testing/index.ts`
- file: `src/testing/driver.ts`
- file: `src/testing/queries.ts`
- file: `src/testing/scenario.ts`
- file: `src/testing/explorer.ts`
- file: `src/testing/pty.ts`
- file: `docs/testing.md`
- file: `package.json`

**Acceptance:**
- Code review returns no unresolved high-severity or medium-severity findings.

### Sub-task 12 — Final verification

**Block:** review
**Skill:** warden:verification-before-completion
**Depends on:** sub-task 11

**Instruction:**

Run the full verification gate and summarize residual risk. Include the current git diff, TypeScript, default Vitest suite, driver/scenario/explorer tests, PTY smoke script, and build. If PTY smoke is skipped on the local machine, the skip must be explicit and documented in the final report.

**Inputs (pre-staged):**
- file: `.warden/plans/2026-05-01-reacterm-testing-driver-plan.md`
- file: `.warden/plans/2026-05-01-reacterm-testing-driver-plan.yaml`

**Acceptance:**
- `git diff --check`
- `bun x tsc --noEmit`
- `bun test`
- `bun test src/__tests__/testing-driver.test.ts`
- `bun test src/__tests__/testing-scenario.test.ts`
- `bun test src/__tests__/testing-explorer.test.ts`
- `bun run test:pty`
- `bun run build`

## Coverage Matrix

| Behavior | Risk | Layer | Tool/driver | Assertions | Fixture/data | Owner skill |
|---|---|---|---|---|---|---|
| Existing Reacterm tests stay compatible | High | Regression | Vitest | Existing tests still pass | Current `src/__tests__` | warden:systematic-debugging |
| Headless render exposes metadata | High | Integration | `renderForTest` | Metadata present, stable, non-breaking | Tiny focused app | warden:test-driven-development |
| Driver key/input flow works | High | Driver | `renderDriver` | Press/type/paste mutate UI correctly | TextInput/form fixtures | warden:test-driven-development |
| Driver mouse/scroll flow works | High | Driver | `renderDriver` | Click/scroll route to expected target | Table/tree/demo fixtures | warden:test-driven-development |
| Semantic selectors avoid coordinate brittleness | High | Driver | Query helpers | Role/label/text/focused/test-id resolve correctly | Button/form/list fixtures | warden:typescript |
| Failure artifacts are useful | Medium | Driver | Artifact writer | Text/SVG/trace/frame logs are written | Temp artifact directory | warden:test-driven-development |
| Declarative scenarios replay deterministically | High | Scenario | Scenario runner | JSON script actions and assertions pass | `tests/scenarios/*.json` | warden:test-driven-development |
| Explorer finds invariant failures without loops | Medium | Explorer | Bounded explorer | Hashing, max depth, invariant report | Small generated apps | warden:test-driven-development |
| Real terminal lifecycle works | High | PTY smoke | `node-pty` harness | spawn, input, resize, quit, cleanup | Built example command | warden:typescript |
| Public docs teach correct use | Medium | Docs | Markdown checks | Required sections and examples present | `docs/testing.md` | warden:docs-writing |

## Execution Notes

- Do not revert the existing modified `examples/reacterm-demo.tsx`; treat it as user work and reconcile tests with it.
- Prefer adding small files under `src/testing/` over turning `src/testing/index.ts` into a large mixed-responsibility module.
- Keep PTY smoke outside the default fast suite unless it is explicitly skipped by default.
- Avoid adding YAML parsing until JSON scenarios have proven useful; the schema should remain YAML-compatible.
- Use deterministic terminal dimensions in every driver and scenario test.
- If semantic metadata requires host element support such as `testId`, add it narrowly and document it as testing metadata.
- Keep all new public exports under `reacterm/testing`.

## Hand-off

This plan is approved for implementation after the human checkpoint in sub-task 2. Execution should proceed task-by-task, starting with the current failing robustness test, and should not dispatch implementation work from a red baseline.
