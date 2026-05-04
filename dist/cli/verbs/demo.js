import { runDemoApp } from "../demo/main.js";
import { resolveSiblingModule } from "../runtime/launch.js";
export const DEMO_PATH = resolveSiblingModule(import.meta.url, "../demo/main");
export async function runDemo() {
    return await runDemoApp();
}
//# sourceMappingURL=demo.js.map