# Plan: API hardening + invariant tests

**Spec:** none — derived from chat review on 2026-05-06 (verified four claims, dropped two as moot, kept four)
**Created:** 2026-05-06
**Status:** approved
**Shape:** plan-execute-review
**Human checkpoints:** 0
**Refinement passes:** 1
**Worktree:** execute on a worktree off `~/projects/reacterm` (e.g. `git worktree add .worktrees/api-hardening -b api-hardening`).

## Context

Pre-1.0 reliability + security pass on the public surface. Four items survived verification; two were dropped as already-handled or overengineering.

**Verified findings (research dispatched 2026-05-06):**

1. **Test runner inconsistency is real, not "stale dist".** `package.json:42` defines `test: vitest run`; vitest config restricts to `src/__tests__/`, so `bun run test` is clean. But `package.json:49` (`test:all`) and `README.md:212` invoke `bun test` (Bun's native runner), which auto-discovers `**/*.test.{ts,js}` and would pick up any compiled output if present. tsconfig has `noEmit: true`, so dist is rarely populated, but the inconsistency is a footgun.
2. **ESC sanitization is structurally enforced.** `stripAnsi()` runs at `src/reconciler/renderer.ts:1071` before text enters the styled-runs cache; the cell grid in `src/core/buffer.ts` stores codepoints in a `Uint32Array`, not strings. No raw-passthrough component (`<RawAnsi>`, `<Pre ansi>`) exists. Action is to lock the invariant with a test, not add a new sanitizer.
3. **`<Link url>` has no scheme validation.** `src/components/extras/Link.tsx:24` forwards `url` directly into the `_linkUrl` prop; OSC 8 emits at `src/core/diff.ts:532`. `javascript:`, `file:`, and `data:` URLs pass through. Real bug.
4. **`useClipboard` is freely callable.** `src/hooks/useClipboard.ts:13` — any component can call `copy()` / `read()`; emits OSC 52 directly. Decision pending: document as sensitive vs. add capability gate.
5. **API snapshot tests have no existing infrastructure.** ~530 public symbols across 9 entry points. Recommended mechanism: emit `.d.ts` for each entry, snapshot the file. Lightweight, no new deps.

**Items dropped during review (don't reopen here):**

- "Sanitize all user text" — moot per finding #2.
- CLI `--allow-outside-cwd` gate — security theater; CLI runs user code by design.
- Layout diagnostics mode — defer until requested.
- Unified overflow policy — too large for this plan; spec separately.

## Assumptions

- **A1** — Bun-native source-only plan (`2026-05-06-bun-native-source-only-plan.md`) lands first or in parallel. If it lands first, `dist/` ceases to exist and Sub-task 1's bunfig defense becomes unnecessary; only the script/docs alignment remains.
  - Type: sequencing
  - Source: parallel plan in `.warden/plans/`
  - Check: `git log --oneline | head -10` and look for the bun-native commit before starting Sub-task 1
  - If false: Sub-task 1 still applies as written.
  - Owner: Sub-task 1

- **A2** — `<Link>` consumers in this repo only pass `http://`, `https://`, or `mailto:` URLs.
  - Type: repo-state
  - Check: `rg -n '<Link\\s+url=' src/ examples/ playground/ docs/`
  - If false: extend allowlist or land scheme validation as a warning (not throw) for the first release.
  - Owner: Sub-task 3

- **A3** — `useClipboard` callers in this repo are all explicit user-initiated actions (e.g., copy-button widgets), not background writes.
  - Type: repo-state
  - Check: `rg -n 'useClipboard\\(' src/ examples/ playground/`
  - If false: capability gate becomes mandatory, not optional.
  - Owner: Sub-task 4

- **A4** — `tsc --emitDeclarationOnly --outDir tmp` produces deterministic `.d.ts` output across machines (modulo TS version). Pin TS in `devDependencies` is sufficient.
  - Type: tooling
  - Check: emit twice, diff — should be empty
  - If false: post-process to strip non-deterministic comments, or skip API snapshot until stabilized.
  - Owner: Sub-task 5

## Sub-tasks

### Sub-task 1 — Align test runner story

**Why:** Eliminate the `bun test` vs `bun run test` footgun.

**Files:**
- `package.json:49` — change `test:all` from `bun test && ...` to `bun run test && bun run test:pty && bun run typecheck`.
- `README.md:212` — change `bun test` to `bun run test`.
- `docs/plans/2026-04-24-tree-reorder.yaml`, `docs/plans/2026-04-29-tree-table-plan.yaml`: leave as-is (historical artifacts, not user-facing instructions).
- New: `bunfig.toml` at repo root with `[test] root = "src"` to defensively scope Bun's native runner if anyone runs it directly.

**Verify:**
- `bun run test` → green
- `bun test` (Bun native, with the new bunfig) → discovers only `src/**/*.test.ts`; should also pass since the same files run under both
- `bun run test:all` → green

**Skip if:** bun-native plan landed and changed the test story differently — re-read package.json scripts before editing.

### Sub-task 2 — Lock ESC-injection invariant with a test

**Why:** Cell-grid + `stripAnsi()` already prevent injection. Test ensures no future refactor regresses this.

**File:** new `src/__tests__/text-injection-safety.test.ts`.

**Test cases:**
1. `<Text>{"normal\\x1b[31mRED\\x1b[0m text"}</Text>` — render, scan every cell in the buffer, assert no cell holds codepoint `0x1b`. Assert visible text contains the literal characters from the user string (or omits the ESC bytes), never produces an active red attribute on the cells where it appeared.
2. OSC 8 in user text — `<Text>{"\\x1b]8;;evil://x\\x1b\\\\click\\x1b]8;;\\x1b\\\\"}</Text>` — assert the resulting cell grid has no link metadata attached and no surviving ESC bytes.
3. OSC 52 in user text — assert no clipboard write occurs (no `screen.write` call with OSC 52 prefix).

**Use `renderForTest` from `src/testing/`.** Reference `docs/testing.md` for the harness API.

**Documentation:** add a paragraph to `docs/pitfalls.md` titled "Text injection safety: structural guarantee" describing where `stripAnsi()` runs and what is and isn't covered (i.e., this guarantee covers `<Text>`/`<TextInput>`/etc.; it does NOT cover hypothetical future raw-ANSI components, which would need explicit re-sanitization).

**Verify:**
- `bun run test src/__tests__/text-injection-safety.test.ts` → green
- `bun x tsc --noEmit` → green

### Sub-task 3 — Validate `<Link url>` scheme

**Why:** `javascript:`, `file:`, `data:` URLs reach the terminal's OSC 8 handler unfiltered. Real exploit surface.

**File:** `src/components/extras/Link.tsx`.

**Change:**
- Add `ALLOWED_LINK_SCHEMES` constant: `["http:", "https:", "mailto:", "ftp:", "ftps:", "tel:", "ssh:"]`. Bias toward common-practical, not minimal.
- Before passing `url` to `_linkUrl`, parse with `URL` constructor or simple `^[a-z][a-z0-9+.-]*:` prefix match.
- If scheme is not in allowlist: emit a one-time `console.warn` (in dev; gated by `NODE_ENV !== 'production'`) AND drop the link (still render the children as plain text). Don't throw — links in widgets shouldn't crash the app.
- Export `ALLOWED_LINK_SCHEMES` and a new `isAllowedLinkScheme(url: string): boolean` helper from `src/components/index.ts` so consumers can pre-validate before passing to `<Link>`.

**Tests:** new `src/__tests__/link-scheme-validation.test.ts`:
- Allowed schemes render with `_linkUrl` set.
- `javascript:`, `file:`, `data:`, `vbscript:` schemes render plain text (no `_linkUrl`); warn fires once.
- Empty string / malformed URLs render plain text without crashing.
- Relative URLs (`./path`, `#anchor`) — decision: drop them too (no scheme = not safe to pass to OSC 8), with the warn.

**Docs:** update `docs/components.md` Link section listing allowed schemes.

**Verify:**
- `bun run test src/__tests__/link-scheme-validation.test.ts` → green
- `bun run test` (broad) → green
- `rg -n '<Link\\s+url=' src/ examples/ playground/` → all existing usages still functional

### Sub-task 4 — Document `useClipboard` as sensitive; do not gate yet

**Why:** Capability gating adds API friction. The hook is in `src/hooks/`, requires explicit import, requires a `<Tui>` context, and OSC 52 is itself opt-in at the terminal level (most terminals require user-config to honor it). Document, don't gate.

**Files:**
- `src/hooks/useClipboard.ts:1-12` — expand the JSDoc on `UseClipboardResult` with: "Emits raw OSC 52 sequences. Many terminals disable OSC 52 by default (e.g., xterm `disallowedWindowOps`). Treat clipboard write as a user-initiated action; do not call from auto-firing effects, polling, or background work. The terminal owns the final decision."
- `docs/hook-guide.md` — add a "Sensitive hooks" subsection covering `useClipboard`. Same content + a one-line example showing the right call site (button onClick).
- `src/__tests__/` — add a small test asserting `copy()` writes a base64-encoded OSC 52 sequence and `read()` writes the query form. (Locks current behavior.)

**Decision deferred** (note inline in the docs): if a future incident shows clipboard misuse, add a `requireUserGesture: true` policy on the `<Tui>` provider that throws unless `copy` is called inside a focused-input event handler. Not building this now.

**Verify:**
- `bun run test` → green

### Sub-task 5 — API snapshot tests for public exports

**Why:** ~530 public symbols, no surface tracking. Pre-1.0 changes can break consumers silently.

**Mechanism:** `tsc --emitDeclarationOnly --outDir <tmp>` against each public entry, then `toMatchFileSnapshot` of the resulting `.d.ts` text.

**Files:**
- New: `src/__tests__/api-surface.test.ts` — for each of the 9 entry points (`.`, `./components`, `./hooks`, `./headless`, `./widgets`, `./templates`, `./testing`, `./devtools`, `./ssh`):
  - Run `bun x tsc --emitDeclarationOnly --outDir <tmpdir> --rootDir src <entry>` (or use the TypeScript Compiler API directly for in-process emit).
  - Read the resulting `.d.ts`.
  - Compare against `src/__tests__/__snapshots__/api-surface/<entry-slug>.d.ts`.
- New: `src/__tests__/__snapshots__/api-surface/` directory with 9 snapshot files (committed).
- `package.json:scripts` — add `test:api` running just this test, since it's slow.
- `vitest.config.ts` — increase `testTimeout` for this test only (it shells out to tsc) via inline `test.concurrent` config or `vi.setConfig`.

**First-run path:** snapshot doesn't exist → vitest writes it; reviewer eyeballs each `.d.ts` for sanity (no spurious internal types leaked) before committing.

**Update path:** when public API changes intentionally, run `bun run test:api -u` and review the diff during code review.

**Considerations to handle:**
- `tsconfig.json` strictness: snapshots will include `readonly`, `private`, etc. Don't strip — they're part of the contract.
- File path comments TSC emits: if non-deterministic across machines, post-process to strip leading `// <reference path=...>` lines that point to `node_modules`.
- Generated declarations may pull in types from `react`, `react-reconciler`, `ssh2`. Keep them in the snapshot — a peer-dep major change is a breaking change.

**Verify:**
- First run produces 9 snapshot files; all are reviewed and committed.
- Re-running `bun run test:api` → green, no diffs.
- Adding a new export → snapshot test fails until updated; this is the desired behavior.

### Sub-task 6 — Acceptance review

**Files to skim:** every file changed by sub-tasks 1–5.

**Acceptance checklist:**
- [ ] `bun run test` green.
- [ ] `bun run test:all` green.
- [ ] `bun x tsc --noEmit` green.
- [ ] `bun run test:api` green.
- [ ] `<Link url="javascript:alert(1)">x</Link>` renders plain text + dev warn (manual check via playground or a smoke test).
- [ ] `useClipboard` JSDoc and `docs/hook-guide.md` updated.
- [ ] `docs/pitfalls.md` has the text-injection-safety section.
- [ ] No new dependencies added to `package.json`.
- [ ] Worktree cleanly merges into `main`.

## Out of scope

- DataGrid → shared column resolver (item #2 from chat review): worth doing, but requires its own design pass. Spec separately.
- Width property tests for tables (item #6): blocked by DataGrid work above.
- Layout diagnostics mode (#7): defer.
- Unified overflow policy (#9): defer; needs spec.
- Input-priority invariants on every demo (#10): defer; fold into existing demo tests when touched.

## Sequencing notes

- Sub-tasks 1–4 are independent; can ship in any order or as separate PRs.
- Sub-task 5 (API snapshots) should land last so it captures the post-Sub-task-3 `<Link>` API change in the initial snapshot.
- If the bun-native plan ships before this plan starts, re-read `package.json` and `README.md` before Sub-task 1 — the test story may already be aligned.
