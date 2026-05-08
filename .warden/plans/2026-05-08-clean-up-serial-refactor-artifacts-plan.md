# Plan: Clean Up Serial Refactor Artifacts

**Spec:** none
**Created:** 2026-05-08T10:43Z
**Status:** done
**Shape:** research-plan-execute-review
**Human checkpoints:** 0
**Refinement passes:** 0

## Goal

Fix anything I introduced that makes this branch less trustworthy or harder to merge, without reverting the useful source refactors unless a confirmed correctness issue appears.

## Execution Results

- Kept the source refactors. The audit found artifact and hygiene issues, not a confirmed source regression.
- Repaired the serial refactor plan artifacts to use `bun run typecheck`, `bun run test`, `bun run test -- <focused files>`, and `bun run test:api`.
- Removed the nonexistent `bun run build` gate from the serial refactor plan artifacts.
- Removed final verification dependence on ignored `.warden/research/` files; the plan now treats those reports as local-only evidence.
- Kept `.warden/maps/serial-refactors/` available locally for `code-map status`, but excluded it from Git status via `.git/info/exclude` so it is not accidentally committed.
- Restored the missing final newline in `src/core/web-renderer.ts`.

Verification run after cleanup:

- `bun run typecheck` -> exit 0
- `bun run test` -> 94 files passed, 964 tests passed
- `bun run test:api` -> 1 file passed, 9 tests passed
- `bun run test -- src/__tests__/chart-core.test.ts` -> 1 file passed, 3 tests passed
- `git diff --check` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

## Assumptions

- `A1` — The source refactors are worth keeping.
  - Type: repo-state
  - Source: review of the git diff plus passing focused/full verification
  - Check: `bun run typecheck && bun run test && bun run test:api && git diff --check`
  - If false: add a targeted revert sub-task only for the failing slice, not a broad rollback
  - Owner: sub-task 5

- `A2` — Verification commands in Warden plan artifacts should match `package.json` scripts.
  - Type: repo-state
  - Source: `package.json` scripts
  - Check: `nl -ba package.json | sed -n '39,50p'`
  - If false: update the cleanup to match the actual scripts before editing plan artifacts
  - Owner: sub-task 2

- `A3` — The worktree-specific code map under `.warden/maps/serial-refactors/` should not be accidentally committed unless that is the intended Warden artifact policy.
  - Type: policy
  - Source: existing tracked canonical map under `.warden/maps/reacterm/` plus current untracked branch map
  - Check: `git ls-files .warden/maps && git status --short .warden/maps`
  - If false: keep the branch map and document why it is intentionally tracked
  - Owner: sub-task 3

- `A4` — Ignored research reports should not be required by tracked final verification gates.
  - Type: policy
  - Source: `.gitignore` ignores `.warden/research/`
  - Check: `nl -ba .gitignore | sed -n '1,8p'`
  - If false: keep research-file checks, but explicitly state they are local-only acceptance evidence
  - Owner: sub-task 2

## Sub-tasks

### Sub-task 1 — Audit The Cleanup Scope

**Block:** review
**Skill:** warden:reviewer
**Depends on:** (none)
**Assumption refs:** A1, A3, A4

**Instruction:**

Review the current dirty worktree after the serial refactors. Categorize each issue as source correctness, source polish, Warden plan artifact, code-map artifact, or generated/local artifact. Do not propose broad reverts unless there is a concrete failing behavior.

**Inputs (pre-staged):**
- command: `git status --short`
- command: `git diff --stat`
- command: `git diff -- .warden/plans src/core/web-renderer.ts`
- command: `git status --short .warden/maps`

### Sub-task 2 — Repair Warden Plan Artifacts

**Block:** execute
**Skill:** warden:writing
**Depends on:** sub-task 1
**Assumption refs:** A2, A4

**Instruction:**

Finish syncing `.warden/plans/2026-05-08-serial-refactoring-opportunities-plan.md`, `.yaml`, and `.yaml.state.json` with the repo’s actual commands. Replace direct `bun test ...` checks with `bun run test -- ...`, replace `bun x tsc --noEmit` with `bun run typecheck`, replace API-surface checks with `bun run test:api`, and remove the nonexistent `bun run build` check. Also remove or clearly label final checks that require ignored `.warden/research/` files.

**Inputs (pre-staged):**
- file: `.warden/plans/2026-05-08-serial-refactoring-opportunities-plan.md`
- file: `.warden/plans/2026-05-08-serial-refactoring-opportunities-plan.yaml`
- file: `.warden/plans/2026-05-08-serial-refactoring-opportunities-plan.yaml.state.json`
- file: `package.json`
- file: `.gitignore`

**Acceptance:**
- `bash -lc 'if rg -q "bun x tsc|bun run build|bun test " .warden/plans/2026-05-08-serial-refactoring-opportunities-plan.md .warden/plans/2026-05-08-serial-refactoring-opportunities-plan.yaml; then exit 1; fi'` → exit 0
- `rg "bun run typecheck|bun run test:api" .warden/plans/2026-05-08-serial-refactoring-opportunities-plan.md .warden/plans/2026-05-08-serial-refactoring-opportunities-plan.yaml` → exits 0
- `bash -lc 'if rg -q "Final gate complete:.*bun x tsc|Final gate complete:.*build" .warden/plans/2026-05-08-serial-refactoring-opportunities-plan.yaml.state.json; then exit 1; fi'` → exit 0

### Sub-task 3 — Decide Code-Map Artifact Policy

**Block:** research
**Skill:** warden:code-mapping
**Depends on:** sub-task 1
**Assumption refs:** A3

**Instruction:**

Inspect how `code-map` chooses the artifact path in this worktree, compare the tracked `.warden/maps/reacterm/` artifact with the untracked `.warden/maps/serial-refactors/` artifact, and decide the least surprising merge policy. The expected recommendation is either: keep the worktree map local/untracked and rely on `.warden/maps/reacterm/` as canonical, or intentionally commit the branch map with a short explanation.

**Inputs (pre-staged):**
- command: `code-map status --format json`
- command: `git ls-files .warden/maps`
- command: `git status --short .warden/maps`
- file: `.warden/maps/reacterm/README.md`
- file: `.warden/maps/serial-refactors/README.md`

### Sub-task 4 — Apply Code-Map Hygiene Decision

**Block:** execute
**Skill:** warden:code-mapping
**Depends on:** sub-task 3
**Assumption refs:** A3

**Instruction:**

Apply the decision from sub-task 3. If the branch map is not meant to be committed, remove or ignore only `.warden/maps/serial-refactors/` and leave `.warden/maps/reacterm/` intact. If it is meant to be committed, ensure `code-map status --format json` reports `"stale": false` and document why the branch-specific map is present.

**Inputs (pre-staged):**
- prior: output of sub-task 3

**Acceptance:**
- `code-map status --format json | grep -q '"stale": false'` → exit 0
- `git status --short .warden/maps` → shows only intentional map changes

### Sub-task 5 — Source Polish Only

**Block:** execute
**Skill:** warden:typescript
**Depends on:** sub-task 1
**Assumption refs:** A1

**Instruction:**

Make source-only polish that improves hygiene without changing behavior. Currently planned: restore the final newline in `src/core/web-renderer.ts`. Do not refactor further and do not revert source slices unless sub-task 1 found a confirmed bug.

**Inputs (pre-staged):**
- file: `src/core/web-renderer.ts`

**Acceptance:**
- `git diff --check` → exit 0
- `tail -c 1 src/core/web-renderer.ts | od -An -t x1 | grep -qi '0a'` → exit 0

### Sub-task 6 — Final Verification And Review

**Block:** review
**Skill:** warden:verification-before-completion
**Depends on:** sub-task 2, sub-task 4, sub-task 5
**Assumption refs:** A1, A2, A3, A4

**Instruction:**

Run the final verification gate fresh and report the exact result. Then give a reviewer-style summary of what was fixed, what remains intentionally unchanged, and whether any source reverts are still warranted.

**Inputs (pre-staged):**
- command: `bun run typecheck`
- command: `bun run test`
- command: `bun run test:api`
- command: `git diff --check`
- command: `code-map status --format json`
