import { Command } from "commander";
import { cpus } from "node:os";
import { runDrive } from "./verbs/drive.js";
import { runTest } from "./verbs/test.js";
import { runDemo } from "./verbs/demo.js";
import { runRun } from "./verbs/run.js";
import { formatError } from "./errors.js";
import { parseDuration } from "./schema/duration.js";
import { installSignalHandlers } from "./signals/handler.js";
const program = new Command()
    .name("reacterm")
    .description("react renderer for the terminal")
    .version("0.2.0");
program.command("demo")
    .description("Launch the bundled showcase")
    .action(async () => process.exit(await runDemo()));
program.command("run <entry>")
    .description("Launch a reacterm app interactively; --capture records the session")
    .option("--capture <path>", "record session to a scenario file (.scenario.yaml)")
    .option("--include-snapshots", "with --capture: emit snapshot step at each Enter")
    .option("--redact <regex>", "with --capture: scrub matched typed input")
    .option("--debounce <dur>", "with --capture: keystroke coalesce window", "50ms")
    .option("--size <wxh>", "force virtual size")
    .option("--no-alt-screen", "render inline instead of alt buffer")
    .action(async (entry, opts) => {
    const runOpts = {
        entry,
        debounceMs: parseDuration(opts.debounce),
    };
    if (opts.capture)
        runOpts.capture = opts.capture;
    if (opts.includeSnapshots)
        runOpts.includeSnapshots = true;
    if (opts.redact)
        runOpts.redact = new RegExp(opts.redact);
    process.exit(await runRun(runOpts));
});
program.command("drive <entry> [script]")
    .description("Replay a scenario and capture output")
    .option("--capture <fmt>", "text|svg|json|ndjson", "text")
    .option("--out <path>", "output file (default stdout)")
    .option("--size <wxh>", "terminal size", "80x24")
    .option("--timeout <dur>", "timeout", "10s")
    .option("--keep-alive", "don't auto-quit when script ends")
    .allowUnknownOption(true)
    .action(async (entry, _script, opts) => {
    const inline = parseInlineSteps(process.argv);
    const driveOpts = {
        entry, inline, capture: opts.capture, stdout: process.stdout, stderr: process.stderr,
    };
    if (opts.keepAlive)
        driveOpts.keepAlive = true;
    const code = await runDrive(driveOpts);
    process.exit(code);
});
program.command("test [paths...]")
    .description("Run scenario files with assertions")
    .option("--reporter <name>", "pretty|json|ndjson|tap", "pretty")
    .option("--jobs <n>", "parallel", String(cpus().length))
    .option("-u, --update-snapshots", "update snapshots")
    .option("--ci", "fail on snapshot drift; reject -u")
    .action(async (paths, opts) => {
    const code = await runTest({
        paths, reporter: opts.reporter, jobs: Number(opts.jobs),
        ci: opts.ci, updateSnapshots: opts.updateSnapshots,
        stdout: process.stdout, stderr: process.stderr,
    });
    process.exit(code);
});
function parseInlineSteps(argv) {
    const steps = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--press") {
            i++;
            const v = argv[i];
            steps.push({ kind: "press", keys: v.split(",") });
        }
        else if (a === "--type") {
            i++;
            const v = argv[i];
            steps.push({ kind: "type", text: v });
        }
        else if (a === "--paste") {
            i++;
            const v = argv[i];
            steps.push({ kind: "paste", text: v });
        }
        else if (a === "--wait-for") {
            i++;
            const v = argv[i];
            steps.push({ kind: "waitFor", text: v });
        }
        else if (a === "--sleep") {
            i++;
            const v = argv[i];
            steps.push({ kind: "sleep", ms: parseDuration(v) });
        }
    }
    return steps;
}
installSignalHandlers({
    onTeardown: () => { },
    onExit: (code) => process.exit(code),
});
program.parseAsync(process.argv).catch((e) => {
    process.stderr.write(formatError(e) + "\n");
    process.exit(1);
});
//# sourceMappingURL=index.js.map