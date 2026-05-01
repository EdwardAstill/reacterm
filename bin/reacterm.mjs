#!/usr/bin/env node
// bin/reacterm.mjs — thin in-process dispatcher into the CLI.
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Register tsx loader for .ts/.tsx entry files when tsx is installed.
// Best-effort: silently skip if tsx is absent (only .js/.mjs entries supported).
try {
  const { register } = await import("tsx/esm/api");
  register();
} catch {}

const distEntry = resolve(rootDir, "dist/cli/index.js");
const srcEntry = resolve(rootDir, "src/cli/index.ts");
const entry = existsSync(distEntry) ? distEntry : srcEntry;

// Run in-process so signal handlers in src/cli/index.ts fire directly.
await import(pathToFileURL(entry).href);
