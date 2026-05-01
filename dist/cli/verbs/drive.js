import { runScenarioFromCli } from "../engine/runScenario.js";
import { captureFinal } from "../engine/capture.js";
export async function runDrive(opts) {
    const steps = opts.inline ?? [];
    const result = await runScenarioFromCli({
        entry: opts.entry,
        scenario: { version: 1, name: "drive", steps },
        ...(opts.size !== undefined ? { size: opts.size } : {}),
    });
    if (result.status === "fail") {
        opts.stderr.write(`error: ${result.failure}\n`);
        return 1;
    }
    if (!result.renderer) {
        opts.stderr.write("error: engine returned no renderer handle (internal bug)\n");
        return 1;
    }
    const out = await captureFinal(result.renderer, { as: opts.capture });
    opts.stdout.write(out);
    if (opts.keepAlive) {
        // Hold the event loop open until a signal exits the process.
        const handle = setInterval(() => { }, 1 << 30);
        await new Promise(() => { });
        clearInterval(handle);
    }
    return 0;
}
//# sourceMappingURL=drive.js.map