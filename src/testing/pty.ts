export interface PtyRunOptions {
  command: string;
  args?: string[];
  cols?: number;
  rows?: number;
  timeoutMs?: number;
}

export interface PtyRunResult {
  skipped: boolean;
  reason?: string;
  output: string;
  exitCode?: number;
}

interface NodePtyProcess {
  onData(fn: (data: string) => void): void;
  onExit(fn: (event: { exitCode: number }) => void): void;
  kill(): void;
}

interface NodePtyModule {
  spawn(command: string, args: string[], options: {
    cols: number;
    rows: number;
    name: string;
    cwd: string;
    env: NodeJS.ProcessEnv;
  }): NodePtyProcess;
}

export async function runPtySmoke(options: PtyRunOptions): Promise<PtyRunResult> {
  let nodePty: NodePtyModule;
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    nodePty = await dynamicImport("node-pty") as NodePtyModule;
  } catch {
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
