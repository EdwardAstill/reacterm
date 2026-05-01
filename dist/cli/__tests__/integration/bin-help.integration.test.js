import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const BIN = resolve(__dirname, "../../../../bin/reacterm.mjs");
describe("bin entry", () => {
    it("--help lists exactly the four v1 verbs", () => {
        const r = spawnSync("node", [BIN, "--help"], { encoding: "utf8" });
        for (const v of ["demo", "run", "drive", "test"]) {
            expect(r.stdout).toMatch(new RegExp(`\\b${v}\\b`));
        }
        for (const cut of ["record", "explore"]) {
            expect(r.stdout).not.toMatch(new RegExp(`\\b${cut}\\b`));
        }
    });
});
//# sourceMappingURL=bin-help.integration.test.js.map