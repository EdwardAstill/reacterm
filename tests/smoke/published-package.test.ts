import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(__dirname, "../..");

describe("published package runtime", () => {
  it("packs a self-contained CLI that can run help and the bundled demo", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "reacterm-pack-"));
    try {
      const build = spawnSync("bun", ["run", "build"], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(build.status).toBe(0);

      const pack = spawnSync("npm", ["pack", "--json", "--pack-destination", tempRoot], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(pack.status).toBe(0);
      const packed = JSON.parse(pack.stdout) as Array<{ filename: string }>;
      const tarball = join(tempRoot, packed[0]!.filename);

      const installRoot = join(tempRoot, "install-root");
      mkdirSync(installRoot);
      writeFileSync(join(installRoot, "package.json"), JSON.stringify({
        name: "reacterm-pack-smoke",
        private: true,
      }));

      const install = spawnSync("npm", ["install", "--no-package-lock", tarball], {
        cwd: installRoot,
        encoding: "utf8",
      });
      expect(install.status).toBe(0);

      const packageDir = join(installRoot, "node_modules", "reacterm");
      expect(existsSync(join(packageDir, "bin", "reacterm.mjs"))).toBe(true);
      expect(existsSync(join(packageDir, "bin", "reacterm-run-module.mjs"))).toBe(true);
      expect(existsSync(join(packageDir, "dist", "cli", "demo", "main.js"))).toBe(true);
      expect(existsSync(join(packageDir, "examples"))).toBe(false);

      const help = spawnSync("node", [join(packageDir, "bin", "reacterm.mjs"), "--help"], {
        cwd: packageDir,
        encoding: "utf8",
      });
      expect(help.status).toBe(0);
      expect(help.stdout).toMatch(/\bdemo\b/);

      const demo = spawnSync("node", [join(packageDir, "bin", "reacterm.mjs"), "demo"], {
        cwd: packageDir,
        encoding: "utf8",
        env: {
          ...process.env,
          REACTERM_DEMO_SMOKE: "1",
          TERM: process.env.TERM ?? "xterm-256color",
        },
      });
      expect(demo.status).toBe(0);
      expect(`${demo.stderr}${demo.stdout}`).not.toMatch(/ENOENT/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 120_000);
});
