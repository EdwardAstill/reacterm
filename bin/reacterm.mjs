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
    "horizontal-scroll": "../debug/horizontal-scroll.tsx",
    hscroll: "../debug/horizontal-scroll.tsx",
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
  // BACK or any other exit code: no parent menu, just exit.
}

function runStyle() {
  run("style/app.tsx");
}

function usage() {
  process.stdout.write(
    "Usage: reacterm demo [command]\n\n" +
    "Commands:\n" +
    "  demo                       showcase picker (8 demos, dock is #8)\n" +
    "  demo horizontal-scroll     terminal horizontal scrolling demo\n" +
    "  demo showcase              alias for demo\n" +
    "  demo showcase <name>       open demo directly\n" +
    "                             names: feature horizontal-scroll hscroll logbook bios95\n" +
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

if (!sub) { runShowcasePicker(); process.exit(0); }
if (sub === "horizontal-scroll" || sub === "hscroll") {
  runDemo(sub); process.exit(0);
}
if (sub === "showcase") {
  if (!sub2) { runShowcasePicker(); process.exit(0); }
  runDemo(sub2); process.exit(0);
}
if (sub === "style") { runStyle(); process.exit(0); }

process.stderr.write(`unknown arg: ${sub}\n`);
usage();
process.exit(1);
