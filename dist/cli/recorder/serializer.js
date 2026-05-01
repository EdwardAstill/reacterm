const SCHEMA_HEADER = `# yaml-language-server: $schema=https://reacterm.dev/schema/scenario-v1.json\n`;
export async function eventsToScenarioYaml(r) {
    const yamlMod = await import("js-yaml");
    const dump = yamlMod.dump ?? yamlMod.default?.dump;
    const yamlSteps = r.steps.map((s) => {
        if (s.kind === "press")
            return { press: s.keys.length === 1 ? s.keys[0] : s.keys };
        if (s.kind === "type")
            return { type: s.text };
        return { [s.kind]: s };
    });
    const body = dump({ version: 1, name: r.name, entry: r.entry, size: r.size, steps: yamlSteps });
    return SCHEMA_HEADER + body;
}
//# sourceMappingURL=serializer.js.map