import type { Step } from "../schema/types.js";

export interface RecorderResult {
  name: string;
  entry: string;
  size: { cols: number; rows: number };
  steps: Step[];
}

const SCHEMA_HEADER = `# yaml-language-server: $schema=https://reacterm.dev/schema/scenario-v1.json\n`;

export async function eventsToScenarioYaml(r: RecorderResult): Promise<string> {
  const yamlMod = await import("js-yaml");
  const dump = (yamlMod as any).dump ?? (yamlMod as any).default?.dump;
  const yamlSteps = r.steps.map((s) => {
    if (s.kind === "press") return { press: s.keys.length === 1 ? s.keys[0]! : s.keys };
    if (s.kind === "type") return { type: s.text };
    return { [s.kind]: s };
  });
  const body = dump({ version: 1, name: r.name, entry: r.entry, size: r.size, steps: yamlSteps });
  return SCHEMA_HEADER + body;
}
