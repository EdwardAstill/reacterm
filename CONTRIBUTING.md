# Contributing to Reacterm

Install [Bun 1.4](https://bun.sh/) and restore the locked dependencies:

```sh
bun install --frozen-lockfile
```

Before submitting a change, run the complete validation commands:

```sh
bun run typecheck:all
bun run test:all
bun run check:package
```

Keep changes focused, add tests for behavior changes, and update documentation when public behavior changes.
