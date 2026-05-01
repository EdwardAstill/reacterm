import { z } from "zod";
import { normalizeScenario } from "./normalize.js";
import type { Scenario } from "./types.js";

const RawStep = z.union([
  z.object({ press: z.union([z.string(), z.array(z.string())]) }).passthrough(),
  z.object({ type: z.string() }).passthrough(),
  z.object({ paste: z.string() }).passthrough(),
  z.object({ click: z.object({ x: z.number(), y: z.number(), button: z.string().optional() }) }).passthrough(),
  z.object({ scroll: z.object({ direction: z.enum(["up", "down"]), target: z.object({ x: z.number(), y: z.number() }).optional() }) }).passthrough(),
  z.object({ resize: z.object({ cols: z.number(), rows: z.number() }) }).passthrough(),
  z.object({ waitFor: z.union([z.string(), z.object({ text: z.string(), timeout: z.string().optional() })]), timeout: z.string().optional() }).passthrough(),
  z.object({ sleep: z.string() }).passthrough(),
  z.object({ snapshot: z.object({ as: z.enum(["svg", "text", "json"]), path: z.string() }) }).passthrough(),
]);

const RawExpect = z.union([
  z.object({ contains: z.string() }),
  z.object({ line: z.object({ at: z.number(), equals: z.string().optional(), contains: z.string().optional(), matches: z.string().optional() }) }),
  z.object({ expectSnapshot: z.string() }),
  z.object({ exitCode: z.number() }),
  z.object({ noWarnings: z.boolean() }),
  z.object({ frameCount: z.object({ min: z.number().optional(), max: z.number().optional() }) }),
]);

const RawScenario = z.object({
  version: z.literal(1),
  name: z.string(),
  entry: z.string().optional(),
  size: z.object({ cols: z.number(), rows: z.number() }).optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.string().optional(),
  steps: z.array(RawStep),
  expect: z.array(RawExpect).optional(),
});

export async function parseScenario(source: string, filename: string): Promise<Scenario> {
  let raw: unknown;
  if (filename.endsWith(".json") || source.trim().startsWith("{")) {
    raw = JSON.parse(source);
  } else {
    const yamlMod = await import("js-yaml");
    const load = (yamlMod as any).load ?? (yamlMod as any).default?.load;
    raw = load(source);
  }
  const parsed = RawScenario.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(i => {
      const pathStr = i.path.join(".");
      // For union failures on steps, include the offending keys for better DX
      if (pathStr.startsWith("steps.") && i.message === "Invalid input" && Array.isArray((raw as any)?.steps)) {
        const idx = parseInt(i.path[1] as string, 10);
        const stepObj = (raw as any).steps[idx];
        if (stepObj && typeof stepObj === "object") {
          const keys = Object.keys(stepObj).join(", ");
          return `${pathStr}: unknown step key(s): ${keys}`;
        }
      }
      return `${pathStr}: ${i.message}`;
    });
    throw new Error(`scenario ${filename}: ${messages.join("; ")}`);
  }
  return normalizeScenario(parsed.data, filename);
}
