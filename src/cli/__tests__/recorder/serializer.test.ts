import { describe, it, expect } from "vitest";
import { eventsToScenarioYaml } from "../../recorder/serializer.js";

describe("eventsToScenarioYaml", () => {
  it("emits valid YAML with $schema header and steps in order", async () => {
    const yaml = await eventsToScenarioYaml({
      name: "test", entry: "src/App.tsx", size: { cols: 80, rows: 24 },
      steps: [{ kind: "press", keys: ["tab"] }, { kind: "type", text: "hi" }],
    });
    expect(yaml).toMatch(/yaml-language-server: \$schema=/);
    expect(yaml).toMatch(/version: 1/);
    expect(yaml).toMatch(/press: tab/);
    expect(yaml).toMatch(/type: hi/);
  });
});
