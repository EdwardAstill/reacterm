import assert from "node:assert/strict";
import test from "node:test";

import { validatePackage } from "./check-package.mjs";

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

const packageJson = {
  name: "reacterm",
  version: "0.1.0",
  files: expectedPackageFiles,
  exports: {
    ".": "./src/index.ts",
  },
};

const validPaths = [
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "package.json",
  "bin/reacterm-run-module.mjs",
  "bin/reacterm.ts",
  "src/index.ts",
  "src/components/App.tsx",
];

const makeReport = (overrides = {}) => ({
  name: "reacterm",
  version: "0.1.0",
  files: validPaths.map((path) => ({ path })),
  ...overrides,
});

const validate = ({
  packJson = [makeReport()],
  manifest = packageJson,
  contents = {},
} = {}) =>
  validatePackage(packJson, manifest, (path) => contents[path] ?? "");

test("accepts documented array and package-name-keyed npm report shapes", () => {
  assert.deepEqual(validate().failures, []);
  assert.deepEqual(validate({ packJson: { reacterm: makeReport() } }).failures, []);
});

test("rejects missing or mismatched package report identity and version", () => {
  const invalidReports = [
    makeReport({ name: "other-package" }),
    makeReport({ name: undefined }),
    makeReport({ version: "9.9.9" }),
  ];

  for (const report of invalidReports) {
    const { failures } = validate({ packJson: [report] });
    assert.match(failures.join("\n"), /exactly one npm pack report must match reacterm@0\.1\.0/);
  }

  const { failures } = validate({ packJson: { other: makeReport() } });
  assert.match(failures.join("\n"), /npm pack object key must match report name/);
});

test("rejects malformed npm file records without throwing", () => {
  const malformedRecords = [null, {}, { path: "" }, { path: "   " }, { path: 42 }];

  for (const record of malformedRecords) {
    let result;
    assert.doesNotThrow(() => {
      result = validate({ packJson: [makeReport({ files: [...makeReport().files, record] })] });
    });
    assert.match(result.failures.join("\n"), /file record .*must contain a nonempty string path/);
  }
});

test("rejects a manifest whose package allowlist differs from the release contract", () => {
  const manifest = {
    ...packageJson,
    files: [...expectedPackageFiles, "scripts/check-package.mjs"],
  };

  const { failures } = validate({ manifest });
  assert.match(failures.join("\n"), /package\.json files must exactly match the release allowlist/);
});

test("rejects a packed tooling file outside the exact allowlist", () => {
  const report = makeReport({
    files: [...makeReport().files, { path: "scripts/release.mjs" }],
  });

  const { failures } = validate({ packJson: [report] });
  assert.match(failures.join("\n"), /unexpected package file: scripts\/release\.mjs/);
});

test("rejects absolute, UNC, traversal, and backslash-form package entries", () => {
  const invalidPaths = [
    "/tmp/workspace/src/secret.ts",
    "C:\\workspace\\src\\secret.ts",
    "\\\\server\\share\\src\\secret.ts",
    "src\\__tests__\\secret.ts",
    "src\\..\\scripts\\secret.ts",
    "src/../scripts/secret.ts",
  ];

  for (const path of invalidPaths) {
    const report = makeReport({ files: [...makeReport().files, { path }] });
    const { failures } = validate({ packJson: [report] });
    assert.match(
      failures.join("\n"),
      /invalid packed path|absolute external path|forbidden path|unexpected package file/,
    );
  }
});

test("does not read package contents through a traversal entry", () => {
  const traversalPath = "src/nested/../../../outside.ts";
  const report = makeReport({ files: [...makeReport().files, { path: traversalPath }] });
  const reads = [];

  const { failures } = validatePackage([report], packageJson, (path) => {
    reads.push(path);
    return "";
  });

  assert.match(failures.join("\n"), /invalid packed path/);
  assert.equal(reads.includes(traversalPath), false);
});

test("preserves every existing forbidden package-path check", () => {
  const forbiddenPaths = [
    "src/__tests__/secret.ts",
    "src/secret.test.ts",
    "tests/secret.ts",
    "examples/secret.ts",
    ".warden/secret.ts",
    ".github/workflows/release.ts",
    "bin/create-storm-app.mjs",
  ];

  for (const path of forbiddenPaths) {
    const report = makeReport({ files: [...makeReport().files, { path }] });
    const { failures } = validate({ packJson: [report] });
    assert.match(failures.join("\n"), /forbidden path/);
  }
});

test("rejects an allowed source file containing an external absolute workspace path", () => {
  const contents = {
    "src/index.ts": 'import secret from "/Users/alice/work/reacterm/src/secret.ts";\n',
  };

  const { failures } = validate({ contents });
  assert.match(failures.join("\n"), /external absolute workspace path in src\/index\.ts/);
});
