# Next Work

Updated: 2026-05-08 19:14 AWST
Branch: serial-refactors
Remote: origin/serial-refactors

## Current Goal

Serially apply the code-map refactoring opportunities and push the branch to origin.

## Completed This Session

- Split the CLI demo into catalog, shell, shared utilities, demo kit, and section modules.
- Generalized nested `Panes` handling and added characterization coverage.
- Extracted shared tree-flattening, navigation, text-editing, layout box-model/types, renderer paint, WebRenderer page, and chart formatting helpers.
- Cleaned up Warden plan artifacts to use the repo's actual verification scripts.
- Kept the worktree-specific code map local-only while preserving a fresh `code-map status`.

## Changed Files

- `src/cli/demo/**` - demo decomposition.
- `src/components/core/Panes.tsx` and `src/__tests__/panes.test.ts` - nested split refactor and tests.
- `src/utils/tree-flatten.ts`, `src/hooks/headless/text-edit/**`, `src/layout/box-model.ts`, `src/layout/types.ts`, `src/reconciler/paint/**`, `src/core/web-renderer-page.ts`, `src/components/data/chart-core/**` - extracted helpers.
- `.warden/plans/2026-05-08-*` - execution and cleanup plans.

## Verification

- `bun run typecheck` -> exit 0
- `bun run test` -> 94 files passed, 964 tests passed
- `bun run test:api` -> 1 file passed, 9 tests passed
- `git diff --check` -> exit 0
- `code-map status --format json | grep -q '"stale": false'` -> exit 0

## Blockers / Open Questions

- None.

## Next Action

- Review the pushed branch or open a PR from `serial-refactors`.
