# Reacterm Clean-Break Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, fully Reacterm-branded, release-ready repository with deterministic validation and no known audited dependency vulnerabilities.

**Architecture:** Apply the behavior fixes first, each behind a focused regression test, then perform the clean-break public/runtime rename followed by examples and documentation. Finish by bringing every maintained TypeScript surface into CI, updating the Bun dependency graph, and constraining the npm tarball. Tasks are sequential because the debrand consumes files produced by the behavior tasks.

**Tech Stack:** TypeScript 5.9, React 19, Bun 1.4, Vitest 4, Node HTTP/WebSocket APIs, `ssh2`, npm pack/audit tooling, GitHub Actions.

**Spec:** `docs/specs/2026-08-31-reacterm-clean-break-hardening-design.md`

## Global Constraints

- This is a clean break: do not add deprecated aliases for any Storm API, matcher, file format, CSS variable, spinner, or CLI name.
- The exact public mappings are `StormColors` → `ReactermColors`, `StormPersonality` → `ReactermPersonality`, `StormTextStyleProps` → `ReactermTextStyleProps`, `StormLayoutStyleProps` → `ReactermLayoutStyleProps`, `StormContainerStyleProps` → `ReactermContainerStyleProps`, `StormPlugin` → `ReactermPlugin`, `StormSSHServer` → `ReactermSSHServer`, `StormSSHOptions` → `ReactermSSHOptions`, `parseStormCSS` → `parseReactermCSS`, `createStormMatchers` → `createReactermMatchers`, `toMatchStormSnapshot` → `toMatchReactermSnapshot`, `toContainStormText` → `toContainReactermText`, and `toHaveStormLines` → `toHaveReactermLines`.
- Rename `.storm.css` / `.storm.json` to `.reacterm.css` / `.reacterm.json`, `--storm-*` to `--reacterm-*`, `[storm]` to `[reacterm]`, spinner values `storm` / `storm-logo` to `reacterm` / `reacterm-logo`, and `storm-screenshot` to `reacterm-screenshot`.
- Do not publish, push, merge, or change package version `0.1.0`.
- The playground remains a trusted local code runner: secure transport, binding, lifecycle, environment, and limits; do not attempt source-code sanitization.
- Default playground host is `127.0.0.1`, run timeout is 30,000 ms, output cap is 1,048,576 bytes, and WebSocket payload cap is 1,048,576 bytes.
- Production Screen behavior on real process stdio stays unchanged; fake streams and SSH streams must not own process-global listeners.
- Use failing regression tests before changing behavior. Preserve unrelated code and formatting.
- Historical documents under `docs/plans/` and pre-existing `docs/specs/` may describe former Storm names when the text is explicitly historical. Current README, guides, source, tests, examples, and playground must be Reacterm-only.

---

### Task 1: Harden the playground code-runner boundary

**Files:**
- Modify: `playground/server.mjs`
- Modify: `playground/public/index.html`
- Modify: `src/__tests__/playground-file-api.test.ts`

**Interfaces:**
- Consumes: existing `createPlaygroundServer({ root, token, maxFileBytes })` factory.
- Produces: `createPlaygroundServer(options)` with `maxRunMs`, `maxOutputBytes`, `maxPayloadBytes`, and injectable `spawnProcess`; exported `listenPlayground(app, { port, host, maxRetries })`; authenticated WebSocket URL `/?token=<token>`.

- [ ] **Step 1: Add failing transport and lifecycle regressions**

Extend the existing playground suite with real `ws` clients. Assert these exact cases: no token gets HTTP 401 during upgrade, a wrong token gets 401, a mismatched `Origin` gets 403, a matching token and origin opens, `listenPlayground(app, { port: 0 })` reports host `127.0.0.1`, a second run terminates the first child, socket close terminates its child, the 30,000 ms default timeout is passed to the runner, output above 1,048,576 bytes ends the run, child env omits a sentinel inherited secret, and unique temporary files are removed after exit.

```ts
const ws = new WebSocket(`${baseUrl.replace("http", "ws")}/?token=test-token`, {
  origin: baseUrl,
});
await once(ws, "open");
ws.send(JSON.stringify({ type: "run", code: "console.log('ok')", cols: 80, rows: 24 }));
expect(spawnCalls[0]!.env.REACTERM_TEST_SECRET).toBeUndefined();
```

- [ ] **Step 2: Run the focused suite and capture the red state**

Run: `bunx vitest run src/__tests__/playground-file-api.test.ts`

Expected: FAIL because WebSocket upgrades are unauthenticated, the CLI has no exported listener, the full environment is inherited, and runs share `.tmp-example.tsx`.

- [ ] **Step 3: Implement authenticated upgrades and bounded run ownership**

Use `new WebSocketServer({ noServer: true, maxPayload: maxPayloadBytes })` and handle `server.on("upgrade")`. Reject invalid tokens before `handleUpgrade`; when `Origin` exists, require `new URL(origin).host === request.headers.host`. Keep one child and one run directory per socket, replace the child atomically on a new run, and remove the run directory on exit/error/stop/close.

Spawn the local TSX CLI through `process.execPath`, not `npx`, and construct the environment exactly from `PATH`, `TERM`, `COLUMNS`, `ROWS`, `FORCE_COLOR`, `NODE_ENV`, and `REACTERM_FORCE_TTY`. Count stdout and stderr bytes together; kill and emit an error once the cap is exceeded. Arm a 30,000 ms timer and clear it in the idempotent run finalizer.

```js
const childEnv = {
  PATH: process.env.PATH ?? "",
  TERM: "xterm-256color",
  COLUMNS: String(cols),
  ROWS: String(rows),
  FORCE_COLOR: "3",
  NODE_ENV: "production",
  REACTERM_FORCE_TTY: "1",
};
```

Export `listenPlayground`; have the CLI call it with `host: process.env.REACTERM_PLAYGROUND_HOST ?? "127.0.0.1"`. Update the browser client to append its existing page token to the WebSocket URL and display policy/auth closure as a connection error.

- [ ] **Step 4: Verify focused behavior**

Run: `bunx vitest run src/__tests__/playground-file-api.test.ts`

Expected: PASS with all HTTP, WebSocket, process lifecycle, environment, and cleanup assertions green.

- [ ] **Step 5: Commit the task**

```bash
git add playground/server.mjs playground/public/index.html src/__tests__/playground-file-api.test.ts
git commit -m "fix: harden the local playground runner"
```

---

### Task 2: Make Screen and SSH teardown idempotent

**Files:**
- Modify: `src/core/screen.ts`
- Modify: `src/ssh/server.ts`
- Modify: `src/__tests__/screen.test.ts`
- Create: `src/__tests__/ssh-server.test.ts`

**Interfaces:**
- Consumes: existing `Screen.start()` / `Screen.stop()` and SSH server event contracts.
- Produces: internal `usesProcessTerminal` lifecycle predicate, one client finalizer, and one session finalizer; no public API addition.

- [ ] **Step 1: Add failing listener and teardown race tests**

In `screen.test.ts`, record listener counts for `exit`, `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, and `unhandledRejection`; start twelve Screens backed by fake stdin/stdout; assert every count stays at baseline before and after stop.

In `ssh-server.test.ts`, drive mocked clients/channels through `error` then `close`, and through client close then channel close. Assert active client count returns to zero, `app.unmount()` is called once, and `session-end` emits once. Cover max-connection rejection followed by close without underflow.

```ts
for (const event of PROCESS_EVENTS) {
  expect(process.listenerCount(event)).toBe(baseline[event]);
}
expect(unmount).toHaveBeenCalledTimes(1);
expect(sessionEnds).toHaveLength(1);
```

- [ ] **Step 2: Run the focused suites and capture the red state**

Run: `bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts`

Expected: FAIL because fake Screens add six global listeners and overlapping SSH teardown paths decrement/clean more than once.

- [ ] **Step 3: Gate global handlers and centralize finalization**

In `Screen`, install/remove process handlers only when both streams are the real process streams:

```ts
const usesProcessTerminal = this.stdout === process.stdout && this.stdin === process.stdin;
```

In the SSH server, create a closure-local `clientFinalized` guard immediately after incrementing the active count. Route error, close, authentication timeout, rejection, and server stop through that one finalizer. Store an idempotent session cleanup function in the client's session set; both channel cleanup and client cleanup invoke it, while it alone unmounts, deletes membership, and emits `session-end`.

- [ ] **Step 4: Verify focused behavior and the warning reproduction**

Run: `bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts`

Expected: PASS; listener counts stay flat and every teardown assertion is exactly-once.

- [ ] **Step 5: Commit the task**

```bash
git add src/core/screen.ts src/ssh/server.ts src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts
git commit -m "fix: make remote terminal lifecycle idempotent"
```

---

### Task 3: Align overlay paint order with input priority

**Files:**
- Create: `src/components/overlay-layers.ts`
- Modify: `src/input/priorities.ts`
- Modify: `src/components/core/Overlay.tsx`
- Modify: `src/components/core/Modal.tsx`
- Modify: `src/components/extras/CommandPalette.tsx`
- Modify: `src/components/extras/ConfirmDialog.tsx`
- Modify: `src/components/extras/HelpPanel.tsx`
- Modify: `src/__tests__/priorities.test.ts`
- Modify: `src/__tests__/overlay-demo-no-warn.test.ts`
- Create: `src/__tests__/overlay-layering.test.ts`

**Interfaces:**
- Produces: internal `OVERLAY_LAYER` constant with `INLINE: 10_000`, `WINDOW_BASE: 20_000`, `FLOATING_PANEL: 30_000`, `MODAL: 40_000`, and `CONFIRM_DIALOG: 50_000`; `INPUT_PRIORITY.WINDOW: 700` between inline 500 and floating 900.

- [ ] **Step 1: Add failing semantic-order tests**

Assert the exact layer and input ordering, render overlapping raw overlays for every semantic band, and preserve the original demo assertion that `ConfirmDialog preview` is visible after clicking Confirm while permanent overlay A exists.

```ts
expect(OVERLAY_LAYER.CONFIRM_DIALOG).toBeGreaterThan(OVERLAY_LAYER.MODAL);
expect(INPUT_PRIORITY.FLOATING_PANEL).toBeGreaterThan(INPUT_PRIORITY.WINDOW);
expect(result.hasText("ConfirmDialog preview")).toBe(true);
```

- [ ] **Step 2: Run focused tests and capture the red state**

Run: `bunx vitest run src/__tests__/priorities.test.ts src/__tests__/overlay-layering.test.ts src/__tests__/overlay-demo-no-warn.test.ts`

Expected: FAIL because the layer registry and WINDOW priority do not exist and the dialog paints below the permanent Overlay.

- [ ] **Step 3: Apply one semantic layer registry**

Create the constant exactly as specified. Initialize the Overlay manager counters at `OVERLAY_LAYER.WINDOW_BASE`, keep bring-to-front increments within the window band, set generic Overlay Escape handling to `INPUT_PRIORITY.WINDOW`, and assign built-in raw `tui-overlay` nodes the corresponding `zIndex`. HelpPanel and CommandPalette use `FLOATING_PANEL`, Modal uses `MODAL`, and ConfirmDialog uses `CONFIRM_DIALOG`.

- [ ] **Step 4: Verify focused and renderer suites**

Run: `bunx vitest run src/__tests__/priorities.test.ts src/__tests__/overlay-layering.test.ts src/__tests__/overlay-demo-no-warn.test.ts src/__tests__/renderer.test.ts`

Expected: PASS; visual and input ordering agree.

- [ ] **Step 5: Commit the task**

```bash
git add src/components/overlay-layers.ts src/input/priorities.ts src/components/core/Overlay.tsx src/components/core/Modal.tsx src/components/extras/CommandPalette.tsx src/components/extras/ConfirmDialog.tsx src/components/extras/HelpPanel.tsx src/__tests__/priorities.test.ts src/__tests__/overlay-demo-no-warn.test.ts src/__tests__/overlay-layering.test.ts
git commit -m "fix: unify overlay paint and input layers"
```

---

### Task 4: Make core test validation deterministic and runner-owned

**Files:**
- Modify: `src/__tests__/demo-calendar.test.ts`
- Rename: `tests/smoke/all-exports.ts` → `tests/smoke/all-exports.test.ts`
- Modify: `vitest.config.ts`
- Create: `tsconfig.tests.json`
- Modify: `package.json`
- Modify: test files reported by `tsc -p tsconfig.tests.json`

**Interfaces:**
- Produces: script `typecheck:tests`; normal Vitest ownership of `tests/smoke/all-exports.test.ts`.

- [ ] **Step 1: Freeze the calendar and move the export smoke test under Vitest**

Use fake time around every calendar test and restore real timers after each test:

```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 4, 12, 0, 0));
});
afterEach(() => vi.useRealTimers());
```

Replace the smoke script's custom counter with `describe` / `it` / `expect`. Supply valid inputs to hooks that require them:

```ts
useGhostText({ value: "", cursor: 0, suggest: ["hello"] });
useStyleSheet({ path: styleFixturePath, watch: false });
```

Create `styleFixturePath` with `mkdtempSync` / `writeFileSync` in `beforeAll`, remove its directory in `afterAll`, and add `tests/smoke/all-exports.test.ts` to normal Vitest inclusion.

- [ ] **Step 2: Add the failing maintained-test typecheck**

Create `tsconfig.tests.json` extending the root config, overriding `exclude` to only `node_modules`, and including `src`, `src/__tests__`, `src/cli/__tests__`, and `tests/smoke`. Add `"typecheck:tests": "tsc -p tsconfig.tests.json --noEmit"`.

Run: `bun run typecheck:tests`

Expected: FAIL on the current test-only TypeScript errors; record the error list in the task report.

- [ ] **Step 3: Fix every reported maintained-test type error at its source**

Correct invalid fixtures, optional-property construction, and stale test API usage. Do not add `as any`, `@ts-ignore`, or weaken `strict`, `exactOptionalPropertyTypes`, or `noUncheckedIndexedAccess`.

- [ ] **Step 4: Verify tests and their typecheck**

Run: `bun run typecheck:tests && bunx vitest run src/__tests__/demo-calendar.test.ts tests/smoke/all-exports.test.ts`

Expected: PASS with the date fixed at May 4, 2026 and all exported hooks/components exercised by Vitest.

- [ ] **Step 5: Commit the task**

```bash
git add package.json vitest.config.ts tsconfig.tests.json src/__tests__ src/cli/__tests__ tests/smoke
git commit -m "test: make maintained validation deterministic"
```

---

### Task 5: Perform the clean-break public and runtime debrand

**Files:**
- Rename: `src/storm-jsx.d.ts` → `src/reacterm-jsx.d.ts`
- Modify: `src/index.ts`
- Modify: `src/theme/**/*.ts`
- Modify: `src/styles/**/*.ts`
- Modify: `src/core/**/*.ts`
- Modify: `src/components/**/*.ts`
- Modify: `src/components/**/*.tsx`
- Modify: `src/hooks/**/*.ts`
- Modify: `src/plugins/**/*.ts`
- Modify: `src/reconciler/**/*.ts`
- Modify: `src/ssh/**/*.ts`
- Modify: `src/testing/**/*.ts`
- Modify: `src/utils/**/*.ts`
- Modify: `src/widgets/**/*.ts`
- Modify: `src/widgets/**/*.tsx`
- Modify: current tests and API snapshots under `src/__tests__`
- Modify: `tests/smoke/all-exports.test.ts`

**Interfaces:**
- Consumes: every mapping and format rename in Global Constraints.
- Produces: Reacterm-only public exports, runtime identifiers, configuration formats, logs, matcher declaration augmentation, and API snapshots.

- [ ] **Step 1: Add a failing clean-break guard**

Create a Vitest assertion in `src/__tests__/api-surface.test.ts` that public declaration snapshots contain the Reacterm names and exclude the old public names. Add focused tests for `.reacterm.css`, `--reacterm-*`, `[reacterm]`, `reacterm` spinner names, and `reacterm-screenshot`.

Run: `bun run test:api`

Expected: FAIL because public declarations and runtime contracts still use Storm.

- [ ] **Step 2: Rename declarations and implementation symbols atomically**

Use `git mv src/storm-jsx.d.ts src/reacterm-jsx.d.ts`. Apply every Global Constraints mapping to definitions, imports, exports, declaration merging, tests, and snapshots. Change `STORM_FORCE_TTY` to `REACTERM_FORCE_TTY`, `StormHostConfig` to `ReactermHostConfig`, JSX intrinsic prop interfaces to `Reacterm*Props`, and remaining shipped internal identifiers whose only meaning is the former product name.

- [ ] **Step 3: Rename shipped formats, values, and visible runtime strings**

Change stylesheet/config discovery, CSS variables, warning prefixes, web renderer title/waiting text, spinner values, screenshot prefix, docblocks, and test matcher names. Do not leave legacy parsing branches or aliases.

- [ ] **Step 4: Prove the shipped/runtime tree is clean and valid**

Run:

```bash
rg -n '\bStorm[A-Z]|\.storm\.(css|json)|--storm-|storm-logo|storm-screenshot|\[storm\]|STORM_FORCE_TTY' src tests/smoke
bun run typecheck
bun run typecheck:tests
bun run test:api
```

Expected: `rg` exits 1 with no matches; all three Bun commands pass.

- [ ] **Step 5: Commit the task**

```bash
git add src tests/smoke
git commit -m "refactor!: rename public runtime surfaces to Reacterm"
```

---

### Task 6: Debrand examples, playground, and current documentation

**Files:**
- Delete: `bin/create-storm-app.mjs`
- Rename: `examples/storm-agent/` → `examples/reacterm-agent/`
- Rename: `examples/storm-code/` → `examples/reacterm-code/`
- Rename: `examples/storm-ops/` → `examples/reacterm-ops/`
- Rename: `examples/storm-website.tsx` → `examples/reacterm-website.tsx`
- Modify: other files under `examples/`
- Modify: `playground/public/index.html`
- Modify: `playground/server.mjs`
- Modify: `playground/examples/*.tsx`
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `ROADMAP.md`
- Modify: current guides under `docs/` excluding historical `docs/plans/` and pre-existing `docs/specs/`
- Modify: `tests/scenarios/demo-navigation.scenario.json`

**Interfaces:**
- Consumes: Reacterm public names from Task 5.
- Produces: Reacterm-only maintained examples, playground copy, documentation, and paths.

- [ ] **Step 1: Add a failing maintained-surface branding check**

Run this exact inventory and save its output in the task report:

```bash
rg -n 'Storm TUI|Storm Playground|Storm apps|Storm is|Storm ships|StormSSH|StormPlugin|StormColors|@orchetron/storm|create-storm-app|examples/storm-|storm-pre/storm' README.md ARCHITECTURE.md ROADMAP.md docs examples playground bin tests/scenarios --glob '!docs/plans/**' --glob '!docs/specs/**'
```

Expected: matches in README, current guides, examples, playground, scenario text, and the stale scaffold.

- [ ] **Step 2: Remove the unused scaffold and rename example paths**

Delete `bin/create-storm-app.mjs`; do not replace or expose it. Rename the four exact example paths listed above with `git mv`, then update every maintained command/import/path that points to them. Rename example-local exported types/components such as `StormTheme` and `StormLogo` to `ReactermTheme` and `ReactermLogo`.

- [ ] **Step 3: Replace maintained product copy**

Use “Reacterm” / “Reacterm TUI” consistently in README, active guides, playground, examples, runtime launch output, and scenarios. Remove the Storm Product Hunt badge instead of pointing it at an unrelated product. Preserve historical migration language only inside archival plans/specs.

- [ ] **Step 4: Verify names, links, and focused behavior**

Run:

```bash
rg -n 'Storm TUI|Storm Playground|Storm apps|Storm is|Storm ships|StormSSH|StormPlugin|StormColors|@orchetron/storm|create-storm-app|examples/storm-|storm-pre/storm' README.md ARCHITECTURE.md ROADMAP.md docs examples playground bin tests/scenarios --glob '!docs/plans/**' --glob '!docs/specs/**'
bunx vitest run src/__tests__/playground-file-api.test.ts src/__tests__/api-surface.test.ts
```

Expected: `rg` has no matches outside archival `docs/plans/` and pre-existing `docs/specs/`; focused tests pass.

- [ ] **Step 5: Commit the task**

```bash
git add -A bin examples playground README.md ARCHITECTURE.md ROADMAP.md docs tests/scenarios
git commit -m "docs!: complete the Reacterm clean-break debrand"
```

---

### Task 7: Typecheck maintained examples and repository tools

**Files:**
- Create: `tsconfig.examples.json`
- Create: `tsconfig.tools.json`
- Modify: `package.json`
- Modify: maintained TypeScript under `examples/`
- Modify: maintained TypeScript under `tests/optimization/`
- Delete: the nine `tests/optimization/**` files importing `/Users/hardy30894/Documents/storm-pre/storm`

**Interfaces:**
- Produces: scripts `typecheck:examples`, `typecheck:tools`, and `typecheck:all`.

- [ ] **Step 1: Remove the external comparison harness and add strict configs**

Delete exactly the nine files identified by:

```bash
rg -l '/Users/hardy30894/Documents/storm-pre/storm' tests/optimization
```

Create configs extending `tsconfig.json`, overriding `exclude` to `node_modules`; include `src` plus `examples/**/*.ts` / `examples/**/*.tsx` in one and `src` plus remaining `tests/optimization/**/*.ts` in the other. Add scripts:

```json
"typecheck:examples": "tsc -p tsconfig.examples.json --noEmit",
"typecheck:tools": "tsc -p tsconfig.tools.json --noEmit",
"typecheck:all": "bun run typecheck && bun run typecheck:tests && bun run typecheck:examples && bun run typecheck:tools"
```

- [ ] **Step 2: Run both new checks and capture the red state**

Run: `bun run typecheck:examples; bun run typecheck:tools`

Expected: both expose stale example/tool API usage or strict typing errors.

- [ ] **Step 3: Fix every maintained error without weakening compiler settings**

Update imports for renamed example paths and Reacterm APIs, correct fixtures and exact-optional construction, and remove stale calls to APIs that no longer exist. Do not add `as any`, `@ts-ignore`, or new exclusions.

- [ ] **Step 4: Verify every maintained TypeScript category**

Run: `bun run typecheck:all`

Expected: PASS for production, tests, examples, and repository-native optimization tools.

- [ ] **Step 5: Commit the task**

```bash
git add package.json tsconfig.examples.json tsconfig.tools.json examples tests/optimization
git commit -m "test: typecheck maintained examples and tools"
```

---

### Task 8: Update dependencies, package contents, and CI

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `playground/package.json`
- Create or modify: `playground/bun.lock`
- Delete: `package-lock.json`
- Delete: `playground/package-lock.json`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `.github/workflows/ci.yml`
- Create: `scripts/check-package.mjs`

**Interfaces:**
- Consumes: `typecheck:all` and complete tests from earlier tasks.
- Produces: Bun-only lock ownership, `check:package`, `audit`, and final `test:all` scripts plus CI.

- [ ] **Step 1: Add a failing tarball contract**

Create `scripts/check-package.mjs` to run `npm pack --dry-run --json`, parse the returned file list, and fail unless all of these are true: `LICENSE` exists; `README.md` exists; every package export target exists in the archive; no path contains `/__tests__/`, `.test.`, `tests/`, `examples/`, `.warden/`, `.github/`, or `create-storm-app`; and the archive contains no absolute external path string.

Add `"check:package": "node scripts/check-package.mjs"` and run it.

Expected: FAIL because LICENSE is absent and source test directories are currently packed.

- [ ] **Step 2: Update exact vulnerable direct versions and Bun locks**

Set `js-yaml` to `^4.3.1`, `ws` to `^8.21.3` in both root and playground manifests, `vitest` to `^4.1.11`, and `tsx` to `^4.23.13`. Regenerate root and playground Bun locks with Bun 1.4. Delete both npm lockfiles so the declared Bun project has one lock format per package root.

- [ ] **Step 3: Constrain the package and add project files**

Replace the broad source inclusion with this exact allowlist/negation set, and confirm its behavior with `check:package`:

```json
"files": [
  "src/**/*.ts",
  "src/**/*.tsx",
  "!src/**/__tests__/**",
  "!src/**/*.test.ts",
  "bin/reacterm.ts",
  "bin/reacterm-run-module.mjs",
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md"
]
```

Add the standard MIT license naming Edward Astill and a concise `CONTRIBUTING.md` that documents Bun 1.4 setup plus `bun run typecheck:all`, `bun run test:all`, and `bun run check:package`.

- [ ] **Step 4: Add audit/full-suite scripts and CI**

Define:

```json
"audit": "bun audit",
"test:all": "bun run typecheck:all && bun run test && bun run test:pty && bun run test:api && bun run test:package && bun run check:package && bun run audit"
```

Create `.github/workflows/ci.yml` for pushes and pull requests. Use `oven-sh/setup-bun@v2` with `bun-version: 1.4.0`, run `bun install --frozen-lockfile`, then `bun run test:all`. In `playground/`, run `bun install --frozen-lockfile` and `bun audit` as separate steps.

- [ ] **Step 5: Verify audit, archive, and complete suite**

Run:

```bash
bun install --frozen-lockfile
(cd playground && bun install --frozen-lockfile && bun audit)
bun run check:package
bun run test:all
```

Expected: every command exits 0; audits report no vulnerabilities; the tarball contains Reacterm source, README, LICENSE, and package metadata without tests or stale scaffolding.

- [ ] **Step 6: Commit the task**

```bash
git add -A package.json bun.lock playground/package.json playground/bun.lock package-lock.json playground/package-lock.json LICENSE CONTRIBUTING.md .github/workflows/ci.yml scripts/check-package.mjs
git commit -m "build: harden Reacterm release validation"
```

---

## Final integrated verification

After all reviewed tasks, run these commands fresh from the worktree root:

```bash
git diff --check main...HEAD
bun install --frozen-lockfile
(cd playground && bun install --frozen-lockfile && bun audit)
bun run test:all
rg -n '@orchetron/storm|create-storm-app|/Users/.*/storm-pre/storm|\bStorm[A-Z]|\.storm\.(css|json)|--storm-|storm-logo|storm-screenshot|\[storm\]|STORM_FORCE_TTY' src tests examples playground bin README.md ARCHITECTURE.md ROADMAP.md docs --glob '!docs/plans/**' --glob '!docs/specs/2026-08-31-reacterm-clean-break-hardening-design.md'
```

Expected: diff check, installs, audits, and `test:all` exit 0; final `rg` exits 1 with no maintained-surface matches. Then generate the whole-branch review package from the pre-design base commit and dispatch the most capable reviewer.
