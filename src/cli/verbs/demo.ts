import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const DEMO_PATH = resolve(ROOT, "examples/reacterm-demo.tsx");

export async function runDemo(): Promise<number> {
  const tsx = resolve(ROOT, "node_modules/.bin/tsx");
  const result = spawnSync(tsx, [DEMO_PATH], { stdio: "inherit" });
  return result.status ?? 1;
}
