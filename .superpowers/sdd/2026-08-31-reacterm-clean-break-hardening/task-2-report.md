# Task 2 Report: Screen and SSH teardown idempotence

## Status

Implemented Task 2 in the shared `reacterm-cleanup` worktree. Fake and SSH-backed screens no longer install global process listeners, and every SSH client/session teardown path now converges on an idempotent finalizer without adding a public API.

The parent expanded the file scope to add `ssh2@^1.17.0` to root `devDependencies` and update `bun.lock`, while retaining `ssh2` as an optional peer dependency. This is required so Vitest can resolve and mock the optional integration during unit tests; consumer installation remains optional.

## RED evidence

Command:

```text
bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts
```

Result before production changes: exit 1, 2 failed files, 5 failed / 2 passed tests.

- Twelve fake Screens added 12 listeners to each of `exit`, `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, and `unhandledRejection`, reproducing six `MaxListenersExceededWarning` messages.
- Client `error` followed by `close` decremented the active connection count to `-1`.
- Client close followed by channel close called `app.unmount()` twice.
- Authentication timeout left the active connection count at `1`.
- Server close followed by channel/client close called `app.unmount()` twice.
- The max-connection rejection control passed before the fix and protects against underflow introduced by future finalizer changes.

An initial SSH run failed before reaching behavior because the optional `ssh2` package was absent. After the parent-authorized dev dependency was added and the mock supplied both CommonJS/default and named export shapes, the RED run above reached the intended lifecycle assertions.

## GREEN evidence

Focused command:

```text
bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts
```

Result after production changes: exit 0, 2 passed files, 7/7 tests passed, with no process-listener warnings.

Type check:

```text
bun run typecheck
```

Result: exit 0 (`tsc --noEmit`).

Repository suite:

```text
bun run test
```

Result: exit 1, 97/98 files and 994/995 tests passed. The sole failure was the unrelated `src/__tests__/demo-calendar.test.ts` test `keeps demo EventCalendar week layout stable across previous and next`, at its fixed-title assertion. Task 2's focused suites and the API-surface suites passed within this run.

I also accidentally ran `bun test`, which invokes Bun's native test runner instead of the repository's Vitest script. It reported 978 passing, 13 failing, and 1 error while parallel work was still present. This output is non-authoritative and is not used as completion evidence.

## Files changed

- `src/core/screen.ts` — gates process handler installation/removal on both streams being the real process terminal streams.
- `src/ssh/server.ts` — adds one guarded client finalizer and one guarded finalizer per session; all overlapping teardown paths share them.
- `src/__tests__/screen.test.ts` — verifies 12 fake Screens leave all six process listener counts at baseline before and after stop.
- `src/__tests__/ssh-server.test.ts` — covers error/close, client/channel close, max-connection rejection, auth timeout, and server-stop races.
- `package.json` — adds `ssh2@^1.17.0` to dev dependencies while retaining the optional peer.
- `bun.lock` — locks the SSH test dependency and transitive packages.

## Self-review

- Confirmed real process stdin/stdout still take the existing handler-registration path; fake, mixed, and SSH streams do not.
- Confirmed the client finalizer is registered immediately after incrementing the active count and is used by error, close, auth timeout, connection rejection, rate-limit rejection, and server stop.
- Confirmed each client owns a set of session finalizers. Channel close and client cleanup both invoke the same session finalizer, and only that finalizer clears the idle timer, unmounts, removes membership, and emits `session-end`.
- Confirmed re-entrant close/error events are harmless because guard state is set before cleanup side effects.
- Confirmed no new exports or public methods were added; API-surface tests passed.
- Mutation review: removing the process predicate, client guard, session guard, timeout finalization, or rejection guard causes a focused assertion to fail.
- `git diff --check` passed for all owned files.

## Concerns

- The repository-wide Vitest suite is not fully green because of the unrelated demo-calendar fixed-date assertion described above. No Task 2 focused or API-surface test failed.

## Fix Round 1: SSH idle reset and channel-error teardown

### Status

Fixed the two scoped SSH teardown regressions from the Task 2 review. Session cleanup now clears the closure-local live idle timer and retained data events cannot schedule a new timer after finalization. A channel `error` now invokes the same idempotent session finalizer as `close`.

### Covering regressions

- `src/__tests__/ssh-server.test.ts` — `cancels a reset idle timer when the session is cleaned up` catches a cleanup that clears the initial timer snapshot instead of the timer installed after channel activity.
- `src/__tests__/ssh-server.test.ts` — `finalizes a session when its channel errors without closing` catches a no-op channel-error listener that leaves the rendered session registered.

### RED evidence

Command:

```text
bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts
```

Output before the production fix:

```text
Test Files  1 failed | 1 passed (2)
Tests  2 failed | 7 passed (9)
FAIL cancels a reset idle timer when the session is cleaned up
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
FAIL finalizes a session when its channel errors without closing
AssertionError: expected 1 to be +0
```

### GREEN and verification evidence

Focused suites command:

```text
bunx vitest run src/__tests__/screen.test.ts src/__tests__/ssh-server.test.ts
```

Output after the production fix:

```text
Test Files  2 passed (2)
Tests  9 passed (9)
```

Production typecheck command:

```text
bun run typecheck
```

Output:

```text
$ tsc --noEmit
```

Diff validation command:

```text
git diff --check
```

Output: exit 0 with no whitespace errors.

### Files changed

- `src/ssh/server.ts` — owns the live idle timer in the session-finalizer closure, guards idle resets after finalization, and routes `channel.error` to the session finalizer.
- `src/__tests__/ssh-server.test.ts` — adds the two focused regression tests and permits an `idleTimeout` test override.
- `.superpowers/sdd/2026-08-31-reacterm-clean-break-hardening/task-2-report.md` — records this fix round.

### Self-review

- The idle test fails if cleanup clears a stale timer snapshot, or if a data event can reset the timer after teardown.
- The channel-error test fails if the error listener does not invoke session cleanup; it asserts unmount, session removal, and one `session-end` event.
- `sessionFinalized` is set before cleanup effects, retaining idempotence when `error`, `close`, or client finalization overlap.
- No public API or unrelated source file changed.

### Concerns

- None for this scoped fix. The previously documented unrelated repository-wide demo-calendar failure was not re-run or changed in this fix round.
