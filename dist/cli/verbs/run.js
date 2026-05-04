import { writeFile } from "node:fs/promises";
import { coalesceKeystrokes } from "../recorder/debounce.js";
import { applyRedact } from "../recorder/redact.js";
import { eventsToScenarioYaml } from "../recorder/serializer.js";
import { EventSink } from "../recorder/eventSink.js";
import { spawnModuleAsMain } from "../runtime/launch.js";
export async function runRun(opts) {
    if (!opts.capture && !opts._testEvents) {
        return await new Promise((res) => {
            const child = spawnModuleAsMain(opts.entry, [], { stdio: "inherit" });
            child.on("exit", (code) => res(code ?? 1));
        });
    }
    const sink = new EventSink();
    if (opts._testEvents) {
        for (const e of opts._testEvents)
            sink.events.push(e);
    }
    else {
        process.stderr.write(`[reacterm] recording session → ${opts.capture}\n`);
        process.stdin.setRawMode?.(true);
        process.stdin.on("data", (buf) => sink.push(buf.toString("utf8")));
        await new Promise((res) => {
            const child = spawnModuleAsMain(opts.entry, [], { stdio: ["pipe", "inherit", "inherit"] });
            process.stdin.pipe(child.stdin);
            child.on("exit", (code) => res(code ?? 1));
        });
    }
    const coalesced = coalesceKeystrokes(sink.events, opts.debounceMs ?? 50);
    const steps = coalesced.map((s) => {
        if (s.kind === "type") {
            return { kind: "type", text: opts.redact ? applyRedact(s.text, opts.redact) : s.text };
        }
        return s;
    });
    const yaml = await eventsToScenarioYaml({
        name: "recorded",
        entry: opts.entry,
        size: opts.size ?? { cols: 80, rows: 24 },
        steps,
    });
    await writeFile(opts.capture, yaml, "utf8");
    if (!opts._testEvents) {
        process.stderr.write(`[reacterm] wrote ${steps.length} steps to ${opts.capture}\n`);
    }
    return 0;
}
//# sourceMappingURL=run.js.map