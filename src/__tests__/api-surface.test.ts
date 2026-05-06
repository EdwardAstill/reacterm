/**
 * Snapshots the public TypeScript declaration surface of every entry point.
 *
 * Method: emit `.d.ts` files via `bun x tsc -p tsconfig.dts.json` into a tmp
 * dir, then compare each entry's declaration file against a checked-in
 * snapshot. A diff means the public API changed — that may be intentional
 * (run `bun run test:api -u` to update) or a regression.
 *
 * Note: this test runs tsc, which is slow (multiple seconds). It is excluded
 * from `bun run test`'s default pass via vitest project config; run it with
 * `bun run test:api`.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ENTRIES: Record<string, string> = {
  root: "index",
  components: "components/index",
  hooks: "hooks/index",
  headless: "hooks/headless/index",
  widgets: "widgets/index",
  templates: "templates/index",
  testing: "testing/index",
  devtools: "devtools/index",
  ssh: "ssh/index",
};

let outDir: string;

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), "reacterm-api-surface-"));
  execSync(
    `bun x tsc -p tsconfig.dts.json --outDir ${outDir}`,
    { stdio: "pipe" },
  );
}, 120_000);

afterAll(() => {
  if (outDir && existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
});

describe("public API surface", () => {
  for (const [name, relPath] of Object.entries(ENTRIES)) {
    it(`${name} entry matches snapshot`, async () => {
      const dtsPath = join(outDir, `${relPath}.d.ts`);
      expect(existsSync(dtsPath)).toBe(true);
      const dts = readFileSync(dtsPath, "utf8");
      await expect(dts).toMatchFileSnapshot(`./__snapshots__/api-surface/${name}.d.ts`);
    });
  }
});
