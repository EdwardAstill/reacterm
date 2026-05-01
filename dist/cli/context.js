import { isatty } from "node:tty";
export function createContext() {
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
//# sourceMappingURL=context.js.map