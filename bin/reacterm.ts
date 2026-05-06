#!/usr/bin/env bun
// bin/reacterm.ts — bun-native CLI entry. Imports source directly.

if (typeof (globalThis as { Bun?: unknown }).Bun === "undefined") {
  console.error(
    "reacterm requires the Bun runtime (>=1.3). Install: https://bun.sh"
  );
  process.exit(1);
}

await import("../src/cli/index.ts");

export {};

