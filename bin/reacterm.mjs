#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = resolve(rootDir, "examples/ui-terminal");
const tsx = resolve(rootDir, "node_modules/.bin/tsx");

const BACK = 99;

function run(relPath) {
  const result = spawnSync(tsx, [resolve(examplesDir, relPath)], { stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
  }
  return result.status ?? 1;
}

function runDemo(name) {
  const map = {
    feature: "showcase/feature.tsx",
    logbook: "showcase/logbook.tsx",
    bios95: "showcase/bios95.tsx",
    brutalist: "showcase/brutalist.tsx",
    flightdeck: "showcase/flightdeck.tsx",
    posting: "showcase/posting.tsx",
    oxide: "showcase/oxide.tsx",
    dock: "showcase/dock.tsx",
  };
  const file = map[name];
  if (!file) { process.stderr.write(`unknown demo: ${name}\n`); process.exit(1); }
  const rc = run(file);
  if (rc === BACK) runShowcasePicker();
}

function runShowcasePicker() {
  const rc = run("showcase/app.tsx");
  const demos = ["feature", "logbook", "bios95", "brutalist", "flightdeck", "posting", "oxide", "dock"];
  const demo = demos[rc - 30];
  if (demo) { runDemo(demo); return; }
  if (rc === BACK) { runTopMenu(); return; }
}

function runStyle() {
  const rc = run("style/app.tsx");
  if (rc === BACK) runTopMenu();
}

function runTopMenu() {
  const rc = run("menu.tsx");
  if (rc === 10) { runShowcasePicker(); return; }
  if (rc === 11) { runStyle(); return; }
  if (rc === 20 || rc === 21) { process.stderr.write("web views not supported in reacterm CLI\n"); return; }
}

function usage() {
  process.stdout.write(
    "Usage: reacterm demo [command]\n\n" +
    "Commands:\n" +
    "  demo                       top menu\n" +
    "  demo showcase              showcase picker\n" +
    "  demo showcase <name>       open demo directly\n" +
    "                             names: feature logbook bios95\n" +
    "                                    brutalist flightdeck posting oxide dock\n" +
    "  demo style                 terminal style guide\n",
  );
}

const args = process.argv.slice(2);
const cmd = args[0] ?? "demo";

if (cmd === "-h" || cmd === "--help") { usage(); process.exit(0); }
if (cmd !== "demo") { process.stderr.write(`unknown command: ${cmd}\n`); usage(); process.exit(1); }

const sub = args[1];
const sub2 = args[2];

if (!sub) { runTopMenu(); process.exit(0); }
if (sub === "showcase") {
  if (!sub2) { runShowcasePicker(); process.exit(0); }
  runDemo(sub2); process.exit(0);
}
if (sub === "style") { runStyle(); process.exit(0); }

process.stderr.write(`unknown arg: ${sub}\n`);
usage();
process.exit(1);
