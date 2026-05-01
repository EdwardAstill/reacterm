import { describe, it, expect } from "vitest";
import { parseScenario } from "../../schema/parse.js";
const GOOD_YAML = `
version: 1
name: smoke
entry: src/App.tsx
steps:
  - press: tab
  - type: "hello"
  - waitFor: "Saved"
    timeout: 2s
expect:
  - contains: "Bye"
`;
describe("parseScenario", () => {
    it("parses good YAML and returns a Scenario", async () => {
        const s = await parseScenario(GOOD_YAML, "smoke.yaml");
        expect(s.name).toBe("smoke");
        expect(s.steps).toHaveLength(3);
        expect(s.steps[2]).toMatchObject({ kind: "waitFor", text: "Saved", timeoutMs: 2000 });
    });
    it("parses good JSON identically", async () => {
        const json = JSON.stringify({ version: 1, name: "smoke", steps: [{ press: "tab" }] });
        const s = await parseScenario(json, "smoke.json");
        expect(s.steps[0]).toEqual({ kind: "press", keys: ["tab"] });
    });
    it("rejects unknown step type with offending key in message", async () => {
        await expect(parseScenario(`version: 1\nname: x\nsteps:\n  - leap: 5\n`, "x.yaml"))
            .rejects.toThrow(/leap/);
    });
    it("rejects missing version", async () => {
        await expect(parseScenario(`name: x\nsteps: []\n`, "x.yaml")).rejects.toThrow(/version/);
    });
});
//# sourceMappingURL=parse.test.js.map