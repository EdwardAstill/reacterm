import { runDemoApp } from "../demo/main.js";
import { resolveSiblingModule } from "../runtime/launch.js";

export const DEMO_PATH = resolveSiblingModule(import.meta.url, "../demo/main");

export async function runDemo(): Promise<number> {
  return await runDemoApp();
}
