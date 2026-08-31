# Reacterm cleanup handoff

Last updated: 2026-09-01 (Australia/Perth)

## Where the work lives

- Original checkout: `/home/eastill/projects/reacterm` on `main` (left untouched).
- Active worktree: `/home/eastill/projects/reacterm/.worktrees/reacterm-cleanup`
- Branch: `codex/reacterm-cleanup`
- Latest implementation commit: `1567296f891b23192dca576ff479377ce7ea8161`; this handoff document is committed immediately after it.
- Working tree was clean before this handoff file was added.
- Nothing has been pushed, merged, or published.

Start/resume here:

```bash
cd /home/eastill/projects/reacterm/.worktrees/reacterm-cleanup
git status --short
git log --oneline --decorate -10
```

## Authority and scope

The approved outcome is a clean-break, full Reacterm debrand plus all urgent audit fixes. There must be no compatibility aliases for old Storm APIs or formats. This is intentionally breaking, but `package.json` must remain at version `0.1.0`; publishing is out of scope.

Read these before resuming:

- Design: `docs/specs/2026-08-31-reacterm-clean-break-hardening-design.md`
- Implementation plan: `docs/superpowers/plans/2026-08-31-reacterm-clean-break-hardening.md`
- Execution ledger: `.superpowers/sdd/2026-08-31-reacterm-clean-break-hardening/progress.md`
- Per-task briefs/reports/review packages: `.superpowers/sdd/2026-08-31-reacterm-clean-break-hardening/`

The environment supports at most three child agents alongside the controller, not eight simultaneous children. The user asked for maximum parallelism, so independent, file-disjoint work ran in waves.

## Implementation commits on the branch

```text
1567296 fix: keep overlay registration render-safe
7f8e345 fix: make remote terminal lifecycle idempotent
a25fd13 fix: preserve overlay order at layer boundary
0a6f4a5 fix: complete playground process teardown
e6a4ca0 fix: unify overlay paint and input layers
fb1be60 fix: harden the local playground runner
e6ea395 docs: plan Reacterm clean-break hardening
d887afc docs: record Reacterm clean-break hardening design
```

## Task status

### Task 1 — Playground hardening: complete and review-clean

Implemented across `fb1be60` and `0a6f4a5`:

- Loopback-only default listener (`127.0.0.1`) with explicit host override.
- Token-authenticated WebSocket upgrades and supplied-Origin validation.
- 1 MiB WebSocket payload/output caps and 30-second run timeout.
- Exact child environment allowlist and local TSX runner.
- Unique per-run temporary directories.
- Idempotent SIGTERM then SIGKILL teardown, stream draining on `close`, and cleanup-safe setup failures.

Evidence: `src/__tests__/playground-file-api.test.ts` 22/22 passed. Scoped re-review approved every finding.

### Task 2 — Screen/SSH lifecycle: implementation committed, review fixes required

Commit `7f8e345` adds:

- Process handlers only for Screens attached to both real process streams.
- Guarded per-client and per-session finalizers.
- `ssh2@^1.17.0` as a dev dependency while it remains an optional peer.
- Focused Screen/SSH tests (7/7 passed); production typecheck passed.

The independent review found two Important issues that must be fixed before Task 2 is complete:

1. In `src/ssh/server.ts`, `resetIdle` replaces closure-local `idleTimer`, but the finalizer clears `activeSession.idleTimer`, which is only the initial snapshot. After activity, the live timer can survive cleanup. `resetIdle` also needs a finalized guard so retained data events cannot schedule another timer.
2. Channel `error` currently has a no-op handler. An error without a following close leaves the session mounted and registered. Route channel error through the same idempotent session finalizer.

Add focused regressions for idle reset followed by cleanup and channel error without close. Resume the original implementer if available; otherwise use a fresh Task 2 fixer. Append fix evidence to:

`.superpowers/sdd/2026-08-31-reacterm-clean-break-hardening/task-2-report.md`

Then create a scoped review package from `7f8e345` to the fix commit and re-review both findings.

### Task 3 — Overlay layering: second fix committed, re-review pending

Commits `e6a4ca0`, `a25fd13`, and `1567296` add the semantic overlay bands, `INPUT_PRIORITY.WINDOW`, built-in z-index assignments, the original occlusion regression, bounded bring-to-front ordering, and a render-safe/public-contract correction.

Latest evidence: 21/21 Task 3 focused tests passed; `tsc --noEmit` passed.

The second fix addresses these prior findings:

- Registration must never update another component's state during render.
- `OverlayContext` must continue accepting the exported two-method `OverlayManagerValue` interface.
- Newly registered and brought-forward windows must remain strictly ordered inside the window band.

A review package is already prepared:

`.superpowers/sdd/2026-08-31-reacterm-clean-break-hardening/review-7f8e345..1567296.diff`

Dispatch a read-only scoped re-review using the Task 3 brief/report and those three findings. If clean, ledger Task 3 complete. If not, continue at fix round 3/5.

### Tasks 4–8 — not started

Task briefs already exist as `task-4-brief.md` through `task-8-brief.md` in the SDD workspace.

Run them in this dependency order after Tasks 2 and 3 are review-clean:

1. Task 4: deterministic calendar, Vitest-owned export smoke test, strict test typecheck.
2. Task 5: clean-break public/runtime rename from Storm to Reacterm.
3. Task 6: examples, playground copy, docs, paths, and stale scaffold debrand/removal.
4. Task 7: examples/tools typechecks and removal of nine absolute-path Storm comparison scripts.
5. Task 8: dependency/lock updates, package allowlist, LICENSE, CONTRIBUTING, CI, audit, and tarball check.

Tasks 5–8 are dependent and should not edit concurrently. Task 4 shares `package.json`, so start it only after the Task 2 fix is committed.

## Current verification state

Fresh evidence at current HEAD is limited to Task 3's focused suite (21/21) and production typecheck, both passing.

The most recent repository-wide Vitest run was just before `1567296`: 994/995 passed, with only the known date-dependent failure in `src/__tests__/demo-calendar.test.ts`. That test is intentionally assigned to Task 4. Run the full suite again after the Task 2 and Task 3 review loops close; do not claim current full-suite green from the older run.

Baseline before implementation was 968/970, with calendar and overlay failures. The overlay failure is now covered and passing.

## Exact next actions

```text
1. Scoped re-review of Task 3 using review-7f8e345..1567296.diff.
2. Fix the two Task 2 review findings with failing tests, commit, and scoped re-review.
3. Mark Tasks 2 and 3 complete in the SDD ledger.
4. Dispatch Task 4 from task-4-brief.md.
5. Continue Tasks 5–8 with a fresh implementer and independent reviewer per task.
6. Run final integrated commands from the implementation plan.
7. Dispatch the most-capable whole-branch reviewer.
8. Use the finishing-a-development-branch workflow; do not push/merge/publish without user direction.
```

## Rulings made so far

- Proceeded from the known two-test failing baseline because both failures were explicitly assigned repairs. Cost if wrong: a separate cause inside either test could have been misattributed until its task investigation.
- Kept one coordinated plan because the clean-break rename consumes interfaces and files from every behavior task. Cost if wrong: a larger ledger/review cycle than separate subsystem plans.
- Used parallel waves after the user requested eight agents; only three child slots exist, and only file-disjoint work was run together. Cost if wrong: cross-task integration conflicts may still require final repair.
- Added `ssh2@^1.17.0` as a dev dependency so tests exercise the real optional integration while consumers retain an optional peer. Cost if wrong: development installs gain the SSH implementation and its transitive footprint.
