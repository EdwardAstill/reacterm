# Plan: Bun-native source-only distribution

**Spec:** none — Tier 3 chosen during chat (kill `dist/`, ship `src/` directly, declare bun-only)
**Created:** 2026-05-06T13:35Z
**Status:** approved
**Shape:** plan-execute-review
**Human checkpoints:** 0
**Refinement passes:** 1
**Worktree:** execution should occur in a worktree off `~/projects/reacterm` (e.g. `git worktree add .worktrees/bun-native -b bun-native`). Plan was authored from main branch.

## Context

Reacterm currently dual-ships: `src/*.ts` for editing, `dist/*.js` for runtime. The build is `tsc`, the `prepare` hook tries to run it conditionally, and `dist/` is committed to the repo. This produced two failure modes already documented in `docs/handover-bun-global-install.md`:

1. Stale `dist/` after edits to `src/` without a rebuild.
2. Corrupted `dist/` from `prepare` running in an environment without `node_modules/react`.

User-stated decision: reacterm's consumers are bun-only. The principled fix is to delete the build step and ship source. `tsc` is retained for type-checking only (`--noEmit`).

## Assumptions

- `A1` — Bun's resolver auto-maps `.js` import suffixes in TS source to `.ts`/`.tsx` siblings.
  - Type: external
  - Source: bun docs, observed in current `src/cli/demo/App.tsx:89` (`import ... from "../../hooks/index.js"` resolving today via `tsx` loader)
  - Check: `cd ~/projects/reacterm && bun -e 'import("./src/index.ts").then(m => console.log(Object.keys(m).length))'` → prints a positive integer
  - If false: keep `tsc` build, abort plan, escalate to user
  - Owner: Sub-task 1

- `A2` — All `src/**/*.ts` imports already use `.js` extensions (the convention required for ESM + bun source-shipping).
  - Type: repo-state
  - Source: spot-checks of `src/index.ts`, `src/components/index.ts`, `src/cli/demo/App.tsx`
  - Check: `rg -l 'from "[^"]*\.(ts|tsx)"' ~/projects/reacterm/src` → no matches (every relative import uses `.js` suffix)
  - If false: codemod the offending files to `.js` suffix before flipping `exports`; add a sub-task between 2 and 3
  - Owner: Sub-task 1

- `A3` — No external consumer of reacterm depends on `dist/` paths directly; all imports go through the package name (`"reacterm"`, `"reacterm/components"`, etc.).
  - Type: policy
  - Source: user statement "package is bun-only"; example check: `examples/ui-terminal/showcase/markdown-editor.tsx:8` uses `from "reacterm"`
  - Check: `rg -n 'reacterm/dist' ~/projects/reacterm --glob '!docs/**' --glob '!.warden/**'` → no matches
  - If false: file an issue, do not flip exports until consumers migrate
  - Owner: Sub-task 1

- `A4` — `tsx` dev-dep can be removed once bin is bun-native (no longer needed as a fallback loader).
  - Type: design
  - Source: `bin/reacterm.mjs` only uses `tsx/esm/api` to register the loader; with `#!/usr/bin/env bun` the loader is unnecessary
  - Check: after Sub-task 3, `rg -n 'tsx' ~/projects/reacterm/src ~/projects/reacterm/bin` → no matches outside `tsconfig.json` JSX setting
  - If false: keep `tsx` listed; not a blocker
  - Owner: Sub-task 3

- `A5` — `dist/` can be removed from the working tree and added to `.gitignore` without breaking history (regeneratable, historical-only).
  - Type: repo-state
  - Source: `dist/` is generated; `.gitignore` currently does NOT list it (will be added)
  - Check: `git -C ~/projects/reacterm log --oneline -- dist/ | head -3` shows commits, but `dist/` content is fully derivable from `src/` at any commit via prior `tsc` invocation
  - If false: ship a pre-deletion tag (`pre-bun-native`) so historical builds can be reconstructed
  - Owner: Sub-task 6

## Sub-tasks

### Sub-task 1 — Inventory current state and verify assumptions

**Block:** research
**Skill:** codebase-explainer
**Depends on:** (none)
**Assumption refs:** A1, A2, A3

**Instruction:**

In `~/projects/reacterm`, produce a short inventory document covering:

1. Every `dist/*` reference outside `dist/` itself and outside historical docs (`docs/handover-*.md`, `docs/plans/*`). Use `rg -n 'dist/' --glob '!dist/**' --glob '!docs/handover-*' --glob '!docs/plans/**' --glob '!.warden/**'`.
2. Confirm every relative import in `src/` uses `.js` suffix. Run `rg -n 'from "\.{1,2}/[^"]*\.(ts|tsx)"' src` — empty output is the pass.
3. Confirm bun resolves `src/index.ts`. Run `bun -e 'import("./src/index.ts").then(m => console.log(Object.keys(m).length, "exports"))'`.
4. List `package.json` fields to be modified: `main`, `types`, `bin`, `exports`, `files`, `scripts.build`, `scripts.prepare`, `engines`.
5. List `tsconfig.json` fields to be modified for `noEmit`: `outDir`, `declaration`, `declarationMap`, `sourceMap`, `noEmit`.

Output: a short markdown summary in chat (not a file). No code changes.

**Acceptance:**
- `rg -n 'dist/' ~/projects/reacterm --glob '!dist/**' --glob '!docs/handover-*' --glob '!docs/plans/**' --glob '!.warden/**'` → produces a known finite list (≤20 hits, all classified as docs/historical/runtime)
- `bun -e 'import("./src/index.ts").then(m => console.log(Object.keys(m).length))'` → prints positive integer, exit 0
- `rg -n 'from "\.{1,2}/[^"]*\.(ts|tsx)"' ~/projects/reacterm/src` → exit 1 (no matches)

### Sub-task 2 — Rewrite `package.json` to point at source

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 1
**Assumption refs:** A1, A2, A3

**Instruction:**

Edit `~/projects/reacterm/package.json`:

1. Remove top-level `"main"` and `"types"` fields (or repoint to `./src/index.ts`).
2. Replace each `exports[<path>]` block. Each path entry becomes a single string pointing at the corresponding `src/*/index.ts`:
   - `"."` → `"./src/index.ts"`
   - `"./components"` → `"./src/components/index.ts"`
   - `"./hooks"` → `"./src/hooks/index.ts"`
   - `"./widgets"` → `"./src/widgets/index.ts"`
   - `"./templates"` → `"./src/templates/index.ts"`
   - `"./testing"` → `"./src/testing/index.ts"`
   - `"./devtools"` → `"./src/devtools/index.ts"`
   - `"./headless"` → `"./src/hooks/headless/index.ts"`
   - `"./ssh"` → `"./src/ssh/index.ts"`
3. Update `"bin"` from `"./bin/reacterm.mjs"` to `"./bin/reacterm.ts"`.
4. Update `"files"` to `["src", "bin", "README.md", "LICENSE"]` (drop `"dist"`).
5. Replace `"scripts.build": "tsc"` with `"scripts.typecheck": "tsc --noEmit"`. Drop `"scripts.prepare"` entirely.
6. Update `"scripts.test:all"` if it references `bun run build` — replace with `bun run typecheck`.
7. Update `"engines"` to require `"bun": ">=1.3.0"`. Remove or keep `"node"` engine field at user's discretion (recommend remove since bun-only).
8. Optional: remove `"tsx"` from `devDependencies` if A4 holds after Sub-task 3.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/package.json (current state)
- prior: Sub-task 1 inventory (confirms scope)

**Acceptance:**
- `node -e 'JSON.parse(require("fs").readFileSync("/home/eastill/projects/reacterm/package.json","utf8"))'` → exit 0 (valid JSON)
- `jq -r '.exports["."]' ~/projects/reacterm/package.json` → `./src/index.ts`
- `jq -r '.scripts.prepare // "absent"' ~/projects/reacterm/package.json` → `absent`
- `jq -r '.scripts.typecheck' ~/projects/reacterm/package.json` → `tsc --noEmit`
- `jq -r '.engines.bun' ~/projects/reacterm/package.json` → starts with `>=1.3`
- `jq -r '.bin.reacterm' ~/projects/reacterm/package.json` → `./bin/reacterm.ts`
- `jq -r '.files | index("dist") // "absent"' ~/projects/reacterm/package.json` → `absent`

### Sub-task 3 — Convert bin to bun-native

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 2
**Assumption refs:** A4

**Instruction:**

Create `~/projects/reacterm/bin/reacterm.ts` with content:

```ts
#!/usr/bin/env bun
// bin/reacterm.ts — bun-native CLI entry. Imports source directly.

if (typeof (globalThis as { Bun?: unknown }).Bun === "undefined") {
  console.error(
    "reacterm requires the Bun runtime (>=1.3). Install: https://bun.sh"
  );
  process.exit(1);
}

await import("../src/cli/index.ts");
```

Mark it executable: `chmod +x ~/projects/reacterm/bin/reacterm.ts`.

Delete `~/projects/reacterm/bin/reacterm.mjs`.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/bin/reacterm.mjs (to be deleted)
- file: ~/projects/reacterm/src/cli/index.ts (target import)

**Acceptance:**
- `test -x ~/projects/reacterm/bin/reacterm.ts` → exit 0
- `test ! -e ~/projects/reacterm/bin/reacterm.mjs` → exit 0
- `head -1 ~/projects/reacterm/bin/reacterm.ts` → `#!/usr/bin/env bun`
- `grep -q "typeof.*Bun.*undefined" ~/projects/reacterm/bin/reacterm.ts` → exit 0

### Sub-task 4 — Update `tsconfig.json` for typecheck-only

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 2
**Assumption refs:** (none)

**Instruction:**

Edit `~/projects/reacterm/tsconfig.json`:

1. Add `"noEmit": true`.
2. Remove `"outDir"`, `"declaration"`, `"declarationMap"`, `"sourceMap"`, `"noEmitOnError"` (all moot under `noEmit`).
3. Update `"exclude"` to drop `"dist"` (it will not exist after Sub-task 6).

**Acceptance:**
- `jq -r '.compilerOptions.noEmit' ~/projects/reacterm/tsconfig.json` → `true`
- `jq -r '.compilerOptions.outDir // "absent"' ~/projects/reacterm/tsconfig.json` → `absent`
- `jq -r '.compilerOptions.declaration // "absent"' ~/projects/reacterm/tsconfig.json` → `absent`
- `cd ~/projects/reacterm && bun run typecheck` → exit 0 (no type errors, no files emitted)

### Sub-task 5 — Update README to declare bun-only

**Block:** execute
**Skill:** writing
**Depends on:** Sub-task 2
**Assumption refs:** (none)

**Instruction:**

Edit `~/projects/reacterm/README.md`:

1. At the top of the README, immediately under the title, add a "Requirements" section: a single short paragraph stating that reacterm requires the Bun runtime (≥1.3) and does not support plain Node. Link to https://bun.sh.
2. Update any "Install" / "Getting started" section to use `bun add reacterm` (or `bun link reacterm` for local dev). Remove any `npm install` / `pnpm add` examples — Bun is the only supported install path.
3. Add a one-line "Why bun-only" note: reacterm ships TypeScript source directly; consumers need a runtime that executes `.ts` natively.
4. Update any "Build" / "Development" section to remove `bun run build`; replace with `bun run typecheck` (type-check only) and `bun test` for testing. Note that there is no compile step.
5. Do NOT add emojis. Do NOT pad the document with marketing prose. Edit minimally — only the sections affected by the bun-only switch.

**Inputs (pre-staged):**
- file: ~/projects/reacterm/README.md

**Acceptance:**
- `grep -qi "bun" ~/projects/reacterm/README.md` → exit 0
- `grep -qiE "(npm|pnpm) (add|install)" ~/projects/reacterm/README.md` → exit 1 (no Node-package-manager install instructions remain)
- `grep -q "bun add reacterm\|bun link" ~/projects/reacterm/README.md` → exit 0
- `grep -q "bun run build" ~/projects/reacterm/README.md` → exit 1 (build script no longer documented)

### Sub-task 6 — Remove `dist/` from working tree and gitignore it

**Block:** execute
**Skill:** reacterm
**Depends on:** Sub-task 2, Sub-task 3, Sub-task 4
**Assumption refs:** A5

**Instruction:**

In `~/projects/reacterm`:

1. Tag the current commit before deletion as `pre-bun-native` (recoverable history pointer): `git tag pre-bun-native HEAD`.
2. Remove `dist/` from the working tree and from git: `git rm -r dist/`. Do not force; if the command reports unstaged changes inside `dist/`, abort and surface to user.
3. Add `dist/` to `.gitignore` (alongside existing entries like `node_modules/`, `tmp/`).
4. Commit message suggestion (do not auto-commit unless user authorizes): `chore: drop dist/ — reacterm is bun-native source-only`.

**Acceptance:**
- `git -C ~/projects/reacterm tag --list pre-bun-native` → prints `pre-bun-native`
- `test ! -e ~/projects/reacterm/dist` → exit 0
- `grep -q '^dist/$\|^dist$' ~/projects/reacterm/.gitignore` → exit 0
- `git -C ~/projects/reacterm status --porcelain | grep -E "^D\s+dist/"` → at least one line (deletion staged) OR commit already made

### Sub-task 7 — End-to-end verification

**Block:** review
**Skill:** verification-before-completion
**Depends on:** Sub-task 2, Sub-task 3, Sub-task 4, Sub-task 5, Sub-task 6
**Assumption refs:** A1, A2, A3, A4, A5

**Instruction:**

Run the full proving sequence and report each command's exit code. Do not declare success until every check passes.

1. `cd ~/projects/reacterm && bun install` → exit 0 (no `prepare` running, no build emitted)
2. `cd ~/projects/reacterm && bun run typecheck` → exit 0
3. `cd ~/projects/reacterm && bun link` → exit 0; verify `~/.bun/install/global/node_modules/reacterm` is a symlink (`test -L ~/.bun/install/global/node_modules/reacterm`)
4. `timeout 3 reacterm demo; test $? -eq 124 -o $? -eq 143` → demo started without `SyntaxError` or import error (timeout-killed = success)
5. `cd ~/projects/reacterm && bun test` → exit 0 (test suite still passes; framework testing layer unaffected)
6. `cd ~/projects/reacterm && rg -n 'dist/' --glob '!docs/handover-*' --glob '!docs/plans/**' --glob '!.warden/**' --glob '!.gitignore'` → only references in historical docs (matches Sub-task 1 inventory)
7. Confirm the `EventCalendar` regression specifically: `bun -e 'import("reacterm").then(m => console.log("EventCalendar" in m))'` → prints `true`

If any check fails: do NOT mark plan done. Re-plan with the failure as input.

**Acceptance:**
- All 7 commands above pass as specified.
- Verification output is captured in the chat (not a file).

### Sub-task 8 — Independent code review

**Block:** review
**Skill:** reviewer
**Depends on:** Sub-task 7
**Assumption refs:** (none)

**Instruction:**

Independent review of the diff against `pre-bun-native` tag. Focus areas:

1. `package.json` — exports map is complete (no entry points lost), engines field correct, no dangling `dist/` references.
2. `bin/reacterm.ts` — runtime guard is correct (`typeof Bun === "undefined"` is the canonical bun-detection idiom), shebang resolves, no leftover `tsx`/`node` paths.
3. `tsconfig.json` — `noEmit` is set; no other emit-related flags remain.
4. `README.md` — bun requirement is prominent; no stale "build step" guidance; no unrequested marketing additions.
5. `.gitignore` — `dist/` listed exactly once.
6. No emoji introduced anywhere.

Output: pass/fail per area, with concrete line refs for any concern. Confidence-filtered (only real issues, no nits).

**Acceptance:**
- Review report produced in chat with explicit pass/fail per area
- All HIGH-confidence issues resolved before declaring plan done

## Out of scope

- Migrating `docs/plans/*.md` historical references to `dist/` — they are point-in-time records, leaving them intact preserves the audit trail.
- Republishing to npm — repo is not currently published; if and when published, a follow-up plan handles the publish workflow under the bun-only contract.
- Removing the `~/.bun/install/global/node_modules/reacterm` global install — Sub-task 7 step 3 already replaces it via `bun link`.
- Documenting bun-version pinning for CI (worth a follow-up but not load-bearing for this change).

## Refinement record

Pass 1 — Phase 6.5 checks:
- All file paths exist: verified (`package.json`, `bin/reacterm.mjs`, `tsconfig.json`, `README.md`, `src/cli/index.ts`).
- Skill names valid: `codebase-explainer`, `reacterm`, `writing`, `verification-before-completion`, `reviewer` all in catalog.
- Assumption A2 verified inline before plan write: `rg -n 'from "\.{1,2}/[^"]*\.(ts|tsx)"' src` returned no matches in spot checks (`src/index.ts`, `src/components/index.ts`, `src/cli/demo/App.tsx`).
- Assumption A1 deferred to Sub-task 1 owner (cheap to validate; no blocker).
- Acceptance criteria are runnable shell commands with explicit expected exit codes.
- No `<TBD>` / `<NEEDS_CLARIFICATION>` placeholders.

Status bumped: `draft` → `approved`.
