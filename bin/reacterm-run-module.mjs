#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const target = process.argv[2];
if (!target) {
  process.stderr.write("usage: reacterm-run-module <module-path> [args...]\n");
  process.exit(2);
}

try {
  const { register } = await import("tsx/esm/api");
  register();
} catch {}

process.argv = [process.argv[0], target, ...process.argv.slice(3)];
await import(pathToFileURL(target).href);
