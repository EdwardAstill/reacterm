export async function runPtySmoke(options) {
    let nodePty;
    try {
        const dynamicImport = new Function("specifier", "return import(specifier)");
        nodePty = await dynamicImport("node-pty");
    }
    catch {
        return {
            skipped: true,
            reason: "node-pty is not installed; PTY smoke tests are optional",
            output: "",
        };
    }
    return new Promise((resolve) => {
        let output = "";
        const child = nodePty.spawn(options.command, options.args ?? [], {
            cols: options.cols ?? 80,
            rows: options.rows ?? 24,
            name: "xterm-256color",
            cwd: process.cwd(),
            env: process.env,
        });
        const timer = setTimeout(() => {
            child.kill();
            resolve({ skipped: false, output });
        }, options.timeoutMs ?? 2000);
        child.onData((data) => { output += data; });
        child.onExit((event) => {
            clearTimeout(timer);
            resolve({ skipped: false, output, exitCode: event.exitCode });
        });
    });
}
//# sourceMappingURL=pty.js.map