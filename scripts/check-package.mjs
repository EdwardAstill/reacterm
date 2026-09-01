import { spawnSync } from "node:child_process";
import { isAbsolute } from "node:path";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8",
});

if (pack.error) {
  console.error(`Unable to run npm pack: ${pack.error.message}`);
  process.exit(1);
}

if (pack.status !== 0) {
  if (pack.stderr) process.stderr.write(pack.stderr);
  console.error(`npm pack exited with status ${pack.status}`);
  process.exit(pack.status ?? 1);
}

let packJson;
try {
  packJson = JSON.parse(pack.stdout);
} catch (error) {
  if (pack.stderr) process.stderr.write(pack.stderr);
  console.error(`Unable to parse npm pack JSON: ${error.message}`);
  process.exit(1);
}

const reports = Array.isArray(packJson) ? packJson : Object.values(packJson);
const report = reports.find((candidate) => candidate?.name === packageJson.name) ?? reports[0];

if (!report || !Array.isArray(report.files)) {
  console.error("npm pack JSON did not include a package file list");
  process.exit(1);
}

const normalizeTarget = (target) => target.replace(/^\.\//, "");
const filePaths = report.files.map((file) => file.path);
const packedFiles = new Set(filePaths.map(normalizeTarget));
const failures = [];

for (const requiredFile of ["LICENSE", "README.md"]) {
  if (!packedFiles.has(requiredFile)) failures.push(`missing required file: ${requiredFile}`);
}

const collectExportTargets = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectExportTargets);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectExportTargets);
  return [];
};

for (const target of collectExportTargets(packageJson.exports)) {
  const normalizedTarget = normalizeTarget(target);
  if (!packedFiles.has(normalizedTarget)) {
    failures.push(`missing export target: ${target}`);
  }
}

const forbiddenPathPatterns = [
  [/(?:^|\/)__tests__(?:\/|$)/, "/__tests__/"],
  [/\.test\./, ".test."],
  [/(?:^|\/)tests\//, "tests/"],
  [/(?:^|\/)examples\//, "examples/"],
  [/(?:^|\/)\.warden\//, ".warden/"],
  [/(?:^|\/)\.github\//, ".github/"],
  [/create-storm-app/, "create-storm-app"],
];

for (const filePath of filePaths) {
  for (const [pattern, label] of forbiddenPathPatterns) {
    if (pattern.test(filePath)) failures.push(`forbidden path (${label}): ${filePath}`);
  }

  if (isAbsolute(filePath) || /^[A-Za-z]:[\\/]/.test(filePath)) {
    failures.push(`absolute external path: ${filePath}`);
  }
}

if (failures.length > 0) {
  console.error(`Package content check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Package content check passed (${filePaths.length} files)`);
