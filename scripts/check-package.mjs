import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const expectedPackageFiles = [
  "src/**/*.ts",
  "src/**/*.tsx",
  "!src/**/__tests__/**",
  "!src/**/*.test.ts",
  "bin/reacterm.ts",
  "bin/reacterm-run-module.mjs",
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
];

const requiredRootFiles = ["CONTRIBUTING.md", "LICENSE", "README.md", "package.json"];
const requiredBinFiles = ["bin/reacterm-run-module.mjs", "bin/reacterm.ts"];
const allowedFixedFiles = new Set([...requiredRootFiles, ...requiredBinFiles]);
const normalizeTarget = (target) => target.replace(/^(?:\.\/)+/, "");

const collectExportTargets = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectExportTargets);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectExportTargets);
  return [];
};

const forbiddenPathPatterns = [
  [/(?:^|\/)__tests__(?:\/|$)/, "/__tests__/"],
  [/\.test\./, ".test."],
  [/(?:^|\/)tests\//, "tests/"],
  [/(?:^|\/)examples\//, "examples/"],
  [/(?:^|\/)\.warden\//, ".warden/"],
  [/(?:^|\/)\.github\//, ".github/"],
  [/create-storm-app/, "create-storm-app"],
];

const externalWorkspacePathPatterns = [
  /(?:^|[\s"'`(=])\/(?:Users|home)\/[^/\s"'`]+\/(?:Documents|projects?|repos?|workspaces?|work|src)(?:\/[^\s"'`)]+)?/,
  /(?:^|[\s"'`(=])\/(?:workspaces?|projects?|repos?)\/(?:[^\s"'`)]+\/?)*/,
  /(?:^|[\s"'`(=])[A-Za-z]:[\\/](?:[^\\/\s"'`)]+[\\/])*(?:Documents|projects?|repos?|workspaces?|work|src)[\\/][^\s"'`)]+/i,
  /(?:^|[\s"'`(=])\\\\[^\\/\s"'`)]+[\\/][^\\/\s"'`)]+[\\/][^\s"'`)]+/,
];

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isAllowedPackagePath = (filePath) => {
  if (allowedFixedFiles.has(filePath)) return true;
  if (!/^src\/.+\.tsx?$/.test(filePath)) return false;
  return !forbiddenPathPatterns.some(([pattern]) => pattern.test(filePath));
};

const hasExternalWorkspacePath = (contents) =>
  externalWorkspacePathPatterns.some((pattern) => pattern.test(contents));

const collectReports = (packJson, failures) => {
  if (Array.isArray(packJson)) return packJson;

  if (!isRecord(packJson)) {
    failures.push("npm pack JSON must be an array or an object keyed by package name");
    return [];
  }

  const entries = Object.entries(packJson);
  for (const [key, report] of entries) {
    if (!isRecord(report) || key !== report.name) {
      failures.push(`npm pack object key must match report name: ${key}`);
    }
  }
  return entries.map(([, report]) => report);
};

const validatePackedPath = (filePath, failures) => {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const segments = normalizedPath.split("/");
  const isCanonical =
    !filePath.includes("\\") &&
    !normalizedPath.startsWith("/") &&
    !/^[A-Za-z]:\//.test(normalizedPath) &&
    !segments.includes("..") &&
    !segments.includes(".") &&
    !segments.includes("") &&
    !filePath.includes("\0");

  if (!isCanonical) {
    failures.push(`invalid packed path: ${filePath}`);
  }

  for (const [pattern, label] of forbiddenPathPatterns) {
    if (pattern.test(normalizedPath)) failures.push(`forbidden path (${label}): ${filePath}`);
  }

  if (!isAllowedPackagePath(normalizedPath)) {
    failures.push(`unexpected package file: ${filePath}`);
  }

  return { isCanonical, normalizedPath };
};

export function validatePackage(packJson, packageJson, readTextFile) {
  const failures = [];

  if (JSON.stringify(packageJson.files) !== JSON.stringify(expectedPackageFiles)) {
    failures.push("package.json files must exactly match the release allowlist");
  }

  const reports = collectReports(packJson, failures);
  const matchingReports = reports.filter(
    (candidate) =>
      isRecord(candidate) &&
      candidate.name === packageJson.name &&
      candidate.version === packageJson.version,
  );

  if (matchingReports.length !== 1) {
    failures.push(
      `exactly one npm pack report must match ${packageJson.name}@${packageJson.version}; found ${matchingReports.length}`,
    );
    return { failures, filePaths: [] };
  }

  const report = matchingReports[0];

  if (!Array.isArray(report.files)) {
    failures.push("npm pack JSON did not include a package file list");
    return { failures, filePaths: [] };
  }

  const filePaths = [];
  for (const [index, file] of report.files.entries()) {
    if (!isRecord(file) || typeof file.path !== "string" || file.path.trim() === "") {
      failures.push(`npm pack file record ${index} must contain a nonempty string path`);
      continue;
    }
    filePaths.push(file.path);
  }

  const pathResults = filePaths.map((filePath) => validatePackedPath(filePath, failures));
  const packedFiles = new Set(
    pathResults.filter(({ isCanonical }) => isCanonical).map(({ normalizedPath }) => normalizedPath),
  );

  for (const requiredFile of [...requiredRootFiles, ...requiredBinFiles]) {
    if (!packedFiles.has(requiredFile)) failures.push(`missing required file: ${requiredFile}`);
  }

  for (const target of collectExportTargets(packageJson.exports)) {
    const normalizedTarget = normalizeTarget(target);
    if (!packedFiles.has(normalizedTarget)) {
      failures.push(`missing export target: ${target}`);
    }
  }

  if (typeof readTextFile !== "function") {
    failures.push("package content validation requires a text-file reader");
    return { failures, filePaths };
  }

  for (const [index, filePath] of filePaths.entries()) {
    const { isCanonical, normalizedPath } = pathResults[index];
    if (!isCanonical || !isAllowedPackagePath(normalizedPath)) continue;

    try {
      const contents = readTextFile(filePath);
      if (typeof contents !== "string") {
        failures.push(`unable to inspect packed file content: ${filePath} did not return text`);
      } else if (hasExternalWorkspacePath(contents)) {
        failures.push(`external absolute workspace path in ${filePath}`);
      }
    } catch (error) {
      failures.push(`unable to inspect packed file content: ${filePath} (${error.message})`);
    }
  }

  return { failures, filePaths };
}

function runPackageCheck() {
  const packageRoot = new URL("..", import.meta.url);
  const packageJson = JSON.parse(readFileSync(new URL("package.json", packageRoot), "utf8"));
  const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: packageRoot,
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

  const packageRootPath = fileURLToPath(packageRoot);
  const { failures, filePaths } = validatePackage(packJson, packageJson, (filePath) =>
    readFileSync(join(packageRootPath, filePath), "utf8"),
  );

  if (failures.length > 0) {
    console.error(`Package content check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Package content check passed (${filePaths.length} files)`);
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) runPackageCheck();
