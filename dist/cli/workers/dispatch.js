import { spawnModuleAsMain, resolveSiblingModule } from "../runtime/launch.js";
const WORKER = resolveSiblingModule(import.meta.url, "./scenarioWorker");
export async function dispatchScenarios(scenarios, opts) {
    const results = new Array(scenarios.length);
    const inFlight = new Set();
    let nextIdx = 0;
    const runOne = (idx, job) => new Promise((resolveP) => {
        const child = spawnModuleAsMain(WORKER, [], { stdio: ["pipe", "pipe", "inherit"] });
        let out = "";
        const stdout = child.stdout;
        const stdin = child.stdin;
        if (!stdout || !stdin) {
            results[idx] = { status: "fail", failure: "worker stdio unavailable", finalText: "", durationMs: 0 };
            resolveP();
            return;
        }
        stdout.on("data", (c) => { out += c.toString(); });
        child.on("close", () => {
            try {
                results[idx] = JSON.parse(out);
            }
            catch {
                results[idx] = { status: "fail", failure: "worker crashed", finalText: "", durationMs: 0 };
            }
            resolveP();
        });
        stdin.write(JSON.stringify(job));
        stdin.end();
    });
    while (nextIdx < scenarios.length || inFlight.size > 0) {
        while (inFlight.size < opts.jobs && nextIdx < scenarios.length) {
            const idx = nextIdx++;
            const p = runOne(idx, scenarios[idx]).then(() => { inFlight.delete(p); });
            inFlight.add(p);
        }
        if (inFlight.size > 0)
            await Promise.race(inFlight);
    }
    return results;
}
//# sourceMappingURL=dispatch.js.map