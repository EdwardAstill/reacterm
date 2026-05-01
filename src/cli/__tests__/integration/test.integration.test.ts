import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runTest } from "../../verbs/test.js";
import { Writable } from "node:stream";

const collect = () => {
  let s = "";
  const stream: any = new Writable({ write(c, _e, cb) { s += c.toString(); cb(); } });
  Object.defineProperty(stream, "text", { get: () => s });
  return stream as Writable & { text: string };
};

describe("test verb", () => {
  it("exits 0 when expectations pass", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [resolve(__dirname, "../fixtures/scenarios/pass.scenario.yaml")],
      reporter: "pretty", stdout, stderr, jobs: 1,
    });
    expect(code).toBe(0);
  });

  it("exits 1 when expectations fail", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [resolve(__dirname, "../fixtures/scenarios/fail.scenario.yaml")],
      reporter: "pretty", stdout, stderr, jobs: 1,
    });
    expect(code).toBe(1);
  });

  it("exits 2 when --ci and -u given together", async () => {
    const stdout = collect(), stderr = collect();
    const code = await runTest({
      paths: [], reporter: "pretty", stdout, stderr, jobs: 1, ci: true, updateSnapshots: true,
    });
    expect(code).toBe(2);
  });
});
