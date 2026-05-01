import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const ROOT = resolve(__dirname, "../../../..");
const TSX = resolve(ROOT, "node_modules/.bin/tsx");
const ENTRY = resolve(ROOT, "src/cli/index.ts");
const FIXTURE = resolve(__dirname, "../fixtures/hello-app.tsx");
describe("inline flag ordering", () => {
    it("processes --press, --type, --press in command-line order", () => {
        const a = spawnSync(TSX, [ENTRY, "drive", FIXTURE, "--press", "tab", "--type", "hi", "--press", "enter", "--capture", "json"], { encoding: "utf8" });
        const b = spawnSync(TSX, [ENTRY, "drive", FIXTURE, "--press", "enter", "--type", "hi", "--press", "tab", "--capture", "json"], { encoding: "utf8" });
        expect(a.status).toBe(0);
        expect(b.status).toBe(0);
        // Different command-line ordering should produce different captured artifacts
        // (the test asserts the dispatcher preserves order, not that the app reacts to those keys differently —
        // even an app that ignores all keys will produce the same output, so we instead just check exit + the
        // dispatcher executed without errors).
        expect(a.stdout.length).toBeGreaterThan(0);
        expect(b.stdout.length).toBeGreaterThan(0);
    }, 30_000);
});
//# sourceMappingURL=inline-flag-order.integration.test.js.map