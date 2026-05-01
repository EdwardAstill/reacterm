import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { runRun } from "../../verbs/run.js";
import { parseScenario } from "../../schema/parse.js";
describe("run --capture", () => {
    it("writes a valid scenario YAML with $schema header that parses round-trip", async () => {
        const fixture = resolve(__dirname, "../fixtures/hello-app.tsx");
        const out = join(tmpdir(), `cap-${Date.now()}.scenario.yaml`);
        const code = await runRun({
            entry: fixture,
            capture: out,
            _testEvents: [
                { t: 0, kind: "key", key: "tab" },
                { t: 30, kind: "key", key: "h" },
                { t: 50, kind: "key", key: "i" },
                { t: 100, kind: "key", key: "enter" },
            ],
        });
        expect(code).toBe(0);
        expect(existsSync(out)).toBe(true);
        const yaml = readFileSync(out, "utf8");
        expect(yaml).toMatch(/yaml-language-server: \$schema=/);
        const scenario = await parseScenario(yaml, out);
        expect(scenario.steps.map((s) => s.kind)).toEqual(["press", "type", "press"]);
    }, 30_000);
});
//# sourceMappingURL=run-capture.integration.test.js.map