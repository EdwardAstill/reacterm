import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runTest } from "../../verbs/test.js";
import { Writable } from "node:stream";

const collect = () => {
  const stream: any = new Writable({ write(_c, _e, cb) { cb(); } });
  return stream as Writable;
};

describe("test verb snapshot semantics", () => {
  it("--ci exits 3 on drift", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "WRONG");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 80, rows: 24 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, ci: true });
    expect(code).toBe(3);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("--ci exits 4 on capability fingerprint mismatch", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "Hello from fixture");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 200, rows: 100 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsize: { cols: 80, rows: 24 }\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, ci: true });
    expect(code).toBe(4);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("-u rewrites snapshot files instead of failing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rcli-"));
    const fixtureSrc = resolve(__dirname, "../fixtures/hello-app.tsx");
    const scenarioPath = join(dir, "x.scenario.yaml");
    const snapPath = join(dir, "x.txt");
    writeFileSync(snapPath, "WRONG");
    writeFileSync(snapPath + ".fp.json", JSON.stringify({ cols: 80, rows: 24 }));
    writeFileSync(scenarioPath, `version: 1\nname: x\nentry: ${fixtureSrc}\nsteps: []\nexpect:\n  - expectSnapshot: x.txt\n`);
    const code = await runTest({ paths: [scenarioPath], reporter: "pretty", stdout: collect(), stderr: collect(), jobs: 1, updateSnapshots: true });
    expect(code).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);
});
