#!/usr/bin/env node
// bin/reacterm.mjs — thin dispatcher into compiled CLI
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = resolve(rootDir, "dist/cli/index.js");
const srcEntry = resolve(rootDir, "src/cli/index.ts");
const tsx = resolve(rootDir, "node_modules/.bin/tsx");

const args = process.argv.slice(2);
const useDist = existsSync(distEntry);
const cmd = useDist ? "node" : tsx;
const cmdArgs = useDist ? [distEntry, ...args] : [srcEntry, ...args];

const child = spawn(cmd, cmdArgs, { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
