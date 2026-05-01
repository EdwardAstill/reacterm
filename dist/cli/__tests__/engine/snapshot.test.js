import { describe, it, expect } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { writeSnapshot, compareSnapshot } from "../../engine/snapshot.js";
describe("snapshot helpers", () => {
    it("writeSnapshot stores text + fingerprint sidecar", () => {
        const path = join(tmpdir(), `snap-${Date.now()}.txt`);
        writeSnapshot(path, "hello", { cols: 80, rows: 24 });
        expect(readFileSync(path, "utf8")).toBe("hello");
        expect(existsSync(path + ".fp.json")).toBe(true);
    });
    it("compareSnapshot returns match", () => {
        const path = join(tmpdir(), `snap-eq-${Date.now()}.txt`);
        writeSnapshot(path, "x", { cols: 80, rows: 24 });
        expect(compareSnapshot(path, "x", { cols: 80, rows: 24 }).status).toBe("match");
    });
    it("compareSnapshot returns drift", () => {
        const path = join(tmpdir(), `snap-drift-${Date.now()}.txt`);
        writeSnapshot(path, "x", { cols: 80, rows: 24 });
        expect(compareSnapshot(path, "y", { cols: 80, rows: 24 }).status).toBe("drift");
    });
    it("compareSnapshot returns capabilityMismatch", () => {
        const path = join(tmpdir(), `snap-cap-${Date.now()}.txt`);
        writeSnapshot(path, "x", { cols: 80, rows: 24 });
        expect(compareSnapshot(path, "x", { cols: 100, rows: 30 }).status).toBe("capabilityMismatch");
    });
});
//# sourceMappingURL=snapshot.test.js.map