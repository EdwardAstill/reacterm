# Reacterm Clean-Break Hardening Design

**Date:** 2026-08-31<br>
**Status:** Approved<br>
**Scope:** Full Storm debranding plus the urgent security, lifecycle, layering, validation, dependency, and release-hygiene work identified during the repository audit.

## Context

Reacterm is already published and structured as the `reacterm` package, but its shipped API, runtime messages, configuration formats, examples, documentation, playground, and obsolete development tools still carry Storm names. The audit also found an unauthenticated playground code-execution channel, process-listener growth in SSH sessions, mismatched overlay paint/input ordering, incomplete validation coverage, vulnerable locked dependencies, and unnecessary files in the package tarball.

The user approved a clean break: maintained surfaces become Reacterm-only, with no deprecated Storm aliases. This is intentionally a semver-major migration.

## Goals

- Remove Storm naming and external Storm-app coupling from maintained source, tests, examples, documentation, package metadata, runtime output, and file formats.
- Harden the local playground without pretending arbitrary user code can be made safe through source filtering.
- Make Screen and SSH teardown idempotent and safe under many concurrent remote sessions.
- Make visible overlay order agree with keyboard-input priority.
- Make all maintained executable TypeScript participate in repeatable local and CI validation.
- Resolve known dependency advisories and ship a deliberate, minimal npm tarball.
- Preserve unrelated Reacterm behavior and avoid speculative framework redesign.

## Non-goals

- Compatibility aliases for Storm public names, CSS variables, configuration filenames, or matcher names.
- A sandbox capable of safely executing untrusted code; the playground remains a trusted local developer tool.
- Refactoring large renderer/layout modules beyond the overlay ordering defect.
- Publishing, pushing, or merging the resulting branch.

## Public rename contract

The migration uses direct Reacterm replacements and updates every maintained caller:

| Old name | New name |
| --- | --- |
| `StormColors` | `ReactermColors` |
| `StormPersonality` | `ReactermPersonality` |
| `StormTextStyleProps` | `ReactermTextStyleProps` |
| `StormLayoutStyleProps` | `ReactermLayoutStyleProps` |
| `StormContainerStyleProps` | `ReactermContainerStyleProps` |
| `StormPlugin` | `ReactermPlugin` |
| `StormSSHServer` | `ReactermSSHServer` |
| `StormSSHOptions` | `ReactermSSHOptions` |
| `parseStormCSS` | `parseReactermCSS` |
| `createStormMatchers` | `createReactermMatchers` |
| `toMatchStormSnapshot` | `toMatchReactermSnapshot` |
| `toContainStormText` | `toContainReactermText` |
| `toHaveStormLines` | `toHaveReactermLines` |

The `.storm.css` and `.storm.json` formats become `.reacterm.css` and `.reacterm.json`; `--storm-*` variables become `--reacterm-*`; warning prefixes become `[reacterm]`; Storm-named spinner values and screenshot filenames receive Reacterm equivalents. The JSX declaration module and its prop interfaces are renamed accordingly. Old names are removed rather than aliased.

The unused, unexposed `create-storm-app` scaffold is deleted instead of growing a new public CLI feature. Storm-named example directories/files are renamed to Reacterm equivalents, with their imports, scripts, and documentation updated atomically. Historical design/plan documents may retain literal historical context only when they are clearly archival; maintained instructions and executable references must use Reacterm.

## Playground security

The playground binds to loopback by default, with an explicit host override for intentional remote access. The existing token authenticates both HTTP file operations and WebSocket upgrades, and browser-origin checks reject cross-site use. Each run receives a unique temporary source file that is removed on completion. Spawned code receives a small allowlisted environment, has bounded runtime/output, and is terminated when its socket closes or a replacement run starts.

These controls reduce accidental network exposure and resource leakage. They do not authorize running untrusted code: authenticated playground code still executes locally by design.

## Screen and SSH lifecycle

Process-global signal/error handlers are installed only for Screens attached to the real process terminal, not fake streams or SSH channels. Per-screen terminal restoration remains unchanged.

Each SSH client owns one idempotent finalizer that clears its authentication timer, cleans its sessions, and decrements the active-client count exactly once. Each session likewise owns one idempotent finalizer so overlapping channel-close, client-error, client-close, and server-stop paths unmount once and emit one `session-end` event.

## Overlay layering

A central overlay-layer registry defines the relative paint bands for inline UI, movable windows, floating panels, modals, and confirmation dialogs. Built-in components set `zIndex` from that registry, while movable windows keep their within-band bring-to-front behavior. Keyboard priorities follow the same semantic order. A confirmation dialog therefore both paints above and receives input before a permanent overlay or modal.

Regression tests cover the original demo failure and direct overlapping-layer behavior.

## Validation and CI

- Freeze the demo calendar test clock so its expected week remains deterministic.
- Convert the orphaned all-exports smoke script into runner-owned assertions with valid fixtures.
- Add dedicated typecheck configurations/scripts for production, tests, examples, and maintained development tools; fix the surfaced errors instead of suppressing them.
- Delete obsolete comparison tools that import a developer's absolute external Storm checkout. Keep and validate repository-native optimization tools.
- Add CI that performs frozen dependency installation, all maintained typechecks, the complete test suite, package-surface tests, tarball inspection, and the selected dependency audit.

## Dependencies and package hygiene

Update direct and locked transitive dependencies to versions that clear the known advisories, using Bun as the declared project package manager and keeping lock state intentional. The playground dependency state is updated in the same change.

The npm package uses explicit inclusions/exclusions so test suites, obsolete scaffolds, repository tooling, and examples are not shipped accidentally. Add the missing MIT `LICENSE` and a concise `CONTRIBUTING.md`, then verify the packed archive contains all exported source modules and no test directories.

## Implementation sequencing

Work is split into reviewed sub-agent tasks. Functional tracks run before the repository-wide rename so their tests establish behavior under existing names. The clean-break rename then updates all maintained surfaces in one coordinated task. Validation/release integration follows the rename, and a final whole-branch review examines interactions across tasks.

No implementation task may silently preserve a Storm compatibility alias. Each behavior fix starts from a failing regression test, and every task is independently reviewed before the next task begins.

## Success criteria

- No maintained runtime, API, package, test, example, or current documentation surface uses Storm branding or references `@orchetron/storm` / an external Storm checkout.
- Unauthorized or cross-origin playground WebSockets cannot execute code; default listening is loopback-only; child processes and temporary files are bounded and cleaned up.
- Starting many SSH-backed Screens adds no process-global listeners, and error/close races cannot double-decrement or double-clean sessions.
- Overlay paint order and input priority agree in the original failing demo and focused tests.
- Production, tests, examples, and maintained tools typecheck under CI.
- The calendar and all-exports regressions pass under the normal test runner.
- Dependency audit reports no known production vulnerability and no unresolved audited advisory in the locked development graph.
- `npm pack --dry-run` contains the intended Reacterm source/docs/license only, with no test suites or stale scaffold.
- The full locally defined verification suite exits successfully.
