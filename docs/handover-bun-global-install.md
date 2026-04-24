# Handover: Bun Global Install / Dependency Loop

Date: 2026-04-24

## Status

Cleanup complete as of 2026-04-24. Root cause has been fixed at source. Safe to reinstall without recurrence.

Files changed to effect the fix:

- `package.json` — `prepare` script now guards on `node_modules/react` presence.
- `tsconfig.json` — added `"noEmitOnError": true`.

Additional cleanup performed:

- `git restore dist/` — 232 degraded `.d.ts` files restored to good typings.
- `~/.bun/install/global/package.json` and `~/.bun/install/global/bun.lock` deduplicated; exactly one `reacterm` entry (the `file:` form) remains in each.

## Summary

The dependency loop was not caused by Reacterm's `package.json`. It was caused by running:

```bash
bun install -g .
```

With Bun 1.3.11, that command treats the bare `.` incorrectly in global-install mode. In a clean throwaway `BUN_INSTALL`, it created this invalid global manifest:

```json
{
  "dependencies": {
    "": "."
  }
}
```

That is why Bun later reported a package named `@` and a dependency loop:

```text
error: Package "@" has a dependency loop
Resolution: "@"
Dependency: "@."
```

The correct editable/global install command is one of these:

```bash
bun link
```

or:

```bash
bun install -g /home/eastill/projects/reacterm
```

Do not use `bun install -g .` for this repo until Bun fixes that behavior.

## What was verified

The Reacterm CLI itself works:

```bash
reacterm --help
```

It prints the expected CLI help:

```text
Usage: reacterm demo [command]

Commands:
  demo                       top menu
  demo showcase              showcase picker
  demo showcase <name>       open demo directly
                             names: feature logbook bios95
                                    brutalist flightdeck posting oxide dock
  demo style                 terminal style guide
```

The global binary resolves back to the project:

```text
/home/eastill/projects/reacterm/bin/reacterm.mjs
```

This means the editable command path is working.

## Past damage (now repaired)

### 1. User global Bun install state was dirty

The files under `~/.bun/install/global` contained duplicate `reacterm` entries:

```text
"reacterm": "/home/eastill/projects/reacterm"
"reacterm": "file:/home/eastill/projects/reacterm"
```

The lockfile also carried duplicate package entries for `reacterm`.

Resolved: both `~/.bun/install/global/package.json` and `~/.bun/install/global/bun.lock` were deduplicated by hand. Exactly one canonical `reacterm` entry (the `file:/home/eastill/projects/reacterm` form) remains in each.

### 2. Repo `dist/` was corrupted by a failed prepare build

Package dry-run commands triggered the `prepare` script, which ran `tsc` without local `node_modules`. Missing `react` / `@types/react` / `@types/node` resolutions caused tsc to fall back to emitting `.d.ts` files with `export declare const X: any;` in place of the correct React types. 232 declaration files in `dist/components/**`, `dist/context/**`, `dist/core/**`, `dist/theme/**`, and `dist/widgets/**` were silently overwritten with garbage typings.

Resolved: `git restore dist/` reverted all 232 files to HEAD. The underlying cause is now fixed (see "Root cause (fixed)" below), so this cannot recur from a `prepare`-triggered build in an empty workspace.

## If this recurs

If the bug bites again before the upstream Bun issue is fixed:

1. Edit `~/.bun/install/global/package.json` and `~/.bun/install/global/bun.lock` by hand. Remove any duplicate `reacterm` rows, keeping only the `file:/home/eastill/projects/reacterm` form. Remove any empty-string (`""`) dependency entries.
2. In the repo, `git restore dist/` to undo any corrupted declaration files.
3. Reinstall using the explicit path, not the bare dot:

```bash
bun install -g /home/eastill/projects/reacterm
```

Verify:

```bash
which reacterm
readlink -f "$(which reacterm)"
reacterm --help
```

Expected binary target:

```text
/home/eastill/projects/reacterm/bin/reacterm.mjs
```

## Root cause (fixed)

The original framing treated `prepare: bun run build` as a packaging ergonomics issue. It was actually the direct cause of the dist corruption.

- `prepare: bun run build` runs `tsc` whenever the package is installed. That is useful for git installs (consumers installing from GitHub get a built `dist/`), but harmful when the source tree's `node_modules` is empty: `tsc` can't resolve `react` / `@types/react` / `@types/node`, and without `noEmitOnError` it silently falls back to emitting `.d.ts` files with `any` instead of the real types — overwriting the good committed output.
- Any command that triggers lifecycle scripts (`npm pack`, `bun pm pack --dry-run`, `bun install -g <path>` from a source tree without devDeps) would therefore ship garbage typings.

### Fix 1: `tsconfig.json` — `noEmitOnError: true`

```json
{
  "compilerOptions": {
    "noEmitOnError": true
  }
}
```

tsc now refuses to emit any files when type errors exist. A broken build fails loudly instead of silently corrupting `dist/`.

### Fix 2: `package.json` — `prepare` gated on devDeps

```json
"prepare": "test -d node_modules/react && bun run build || (echo '[reacterm prepare] skipping build: node_modules/react not installed; run \"bun install\" first if you need dist/' >&2; exit 0)"
```

When `node_modules/react` is absent, the `prepare` script skips the build, prints a stderr notice, and exits 0. Local `bun install -g .` / `npm pack` against a bare source tree can no longer trigger a broken build.

### Consumer install flow is unaffected

For git installs (`npm install github:EdwardAstill/reacterm`, `bun add github:...`), npm/bun install the package's devDependencies before running `prepare`, so `node_modules/react` is present and the build runs normally. Published tarballs ship the prebuilt `dist/` anyway.

## Commands that reproduced the Bun bug

This isolated the behavior in `/tmp` without touching the real Bun home:

```bash
BUN_INSTALL=/tmp/reacterm-bun-global-test bun install -g .
```

It produced:

```text
installed @
```

and wrote:

```json
{
  "dependencies": {
    "": "."
  }
}
```

That confirms the bare-dot global install issue is Bun behavior, not Reacterm package metadata.

## Open question

`bun install -g .` with a bare dot is still a bug upstream in Bun 1.3.11. Our fix mitigates the downstream symptom (dist no longer corrupts; global state is deduped), but the upstream CLI quirk that turns `.` into an empty-name dependency remains. Worth filing an issue against oven-sh/bun if one has not been filed already.
