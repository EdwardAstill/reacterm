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
  it("uses Reacterm-only public declaration names", () => {
    const removedBrand = ["Sto", "rm"].join("");
    const jsxDeclarationPath = join(process.cwd(), "src", "reacterm-jsx.d.ts");
    expect(existsSync(jsxDeclarationPath)).toBe(true);
    expect(existsSync(join(process.cwd(), "src", `${removedBrand.toLowerCase()}-jsx.d.ts`))).toBe(false);

    const declarations = [
      ...Object.values(ENTRIES).map((relPath) =>
        readFileSync(join(outDir, `${relPath}.d.ts`), "utf8"),
      ),
      readFileSync(jsxDeclarationPath, "utf8"),
    ].join("\n");

    for (const name of [
      "ReactermColors",
      "ReactermPersonality",
      "ReactermTextStyleProps",
      "ReactermLayoutStyleProps",
      "ReactermContainerStyleProps",
      "ReactermPlugin",
      "ReactermSSHServer",
      "ReactermSSHOptions",
      "parseReactermCSS",
      "createReactermMatchers",
      "toMatchReactermSnapshot",
      "toContainReactermText",
      "toHaveReactermLines",
      "ReactermBoxProps",
      "ReactermTextProps",
      "ReactermScrollViewProps",
      "ReactermTextInputProps",
      "ReactermOverlayProps",
    ]) {
      expect(declarations, `missing ${name}`).toContain(name);
    }

    const removedNames = [
      `${removedBrand}Colors`,
      `${removedBrand}Personality`,
      `${removedBrand}TextStyleProps`,
      `${removedBrand}LayoutStyleProps`,
      `${removedBrand}ContainerStyleProps`,
      `${removedBrand}Plugin`,
      `${removedBrand}SSHServer`,
      `${removedBrand}SSHOptions`,
      `parse${removedBrand}CSS`,
      `create${removedBrand}Matchers`,
      `toMatch${removedBrand}Snapshot`,
      `toContain${removedBrand}Text`,
      `toHave${removedBrand}Lines`,
    ];
    for (const name of removedNames) {
      expect(declarations, `unexpected removed declaration ${name}`).not.toContain(name);
    }
  });

  for (const [name, relPath] of Object.entries(ENTRIES)) {
    it(`${name} entry matches snapshot`, async () => {
      const dtsPath = join(outDir, `${relPath}.d.ts`);
      expect(existsSync(dtsPath)).toBe(true);
      const dts = readFileSync(dtsPath, "utf8");
      await expect(dts).toMatchFileSnapshot(`./__snapshots__/api-surface/${name}.d.ts`);
    });
  }
});
