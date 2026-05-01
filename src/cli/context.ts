import { isatty } from "node:tty";

export interface CliContext {
  cwd: string;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
  env: NodeJS.ProcessEnv;
  isStdoutTty: boolean;
  isStderrTty: boolean;
  noColor: boolean;
}

export function createContext(): CliContext {
  return {
    cwd: process.cwd(),
    stdout: process.stdout,
    stderr: process.stderr,
    env: process.env,
    isStdoutTty: isatty(process.stdout.fd),
    isStderrTty: isatty(process.stderr.fd),
    noColor: "NO_COLOR" in process.env,
  };
}
