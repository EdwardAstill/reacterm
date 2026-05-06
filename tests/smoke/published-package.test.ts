import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(__dirname, "../..");

describe("published package runtime", () => {
  it("packs a bun-native source-only CLI and runs help via bun", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "reacterm-pack-"));
    try {
      const pack = spawnSync("bun", ["pm", "pack", "--destination", tempRoot], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(pack.status).toBe(0);

      const tarballName = readdirSync(tempRoot).find((f) => f.endsWith(".tgz"));
      expect(tarballName).toBeDefined();
      const tarball = join(tempRoot, tarballName!);

      const installRoot = join(tempRoot, "install-root");
      mkdirSync(installRoot);
      writeFileSync(join(installRoot, "package.json"), JSON.stringify({
        name: "reacterm-pack-smoke",
        private: true,
      }));

      const install = spawnSync("bun", ["add", tarball], {
        cwd: installRoot,
        encoding: "utf8",
      });
      expect(install.status).toBe(0);

      const packageDir = join(installRoot, "node_modules", "reacterm");
      expect(existsSync(join(packageDir, "bin", "reacterm.ts"))).toBe(true);
      expect(existsSync(join(packageDir, "src", "index.ts"))).toBe(true);
      expect(existsSync(join(packageDir, "src", "cli", "index.ts"))).toBe(true);
      expect(existsSync(join(packageDir, "dist"))).toBe(false);
      expect(existsSync(join(packageDir, "examples"))).toBe(false);

      const help = spawnSync("bun", [join(packageDir, "bin", "reacterm.ts"), "--help"], {
        cwd: packageDir,
        encoding: "utf8",
      });
      expect(help.status).toBe(0);
      expect(help.stdout).toMatch(/\bdemo\b/);

      const demo = spawnSync("bun", [join(packageDir, "bin", "reacterm.ts"), "demo"], {
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
