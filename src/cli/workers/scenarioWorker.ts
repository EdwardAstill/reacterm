import { runScenarioFromCli } from "../engine/runScenario.js";

let buf = "";
process.stdin.on("data", (chunk) => { buf += chunk.toString(); });
process.stdin.on("end", async () => {
  try {
    const opts = JSON.parse(buf);
    const result = await runScenarioFromCli(opts);
    const { renderer: _renderer, ...serializable } = result;
    process.stdout.write(JSON.stringify(serializable));
    process.exit(0);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stdout.write(JSON.stringify({ status: "fail", failure: msg, finalText: "", durationMs: 0 }));
    process.exit(1);
  }
});
