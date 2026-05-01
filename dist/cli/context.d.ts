export interface CliContext {
    cwd: string;
    stdout: NodeJS.WriteStream;
    stderr: NodeJS.WriteStream;
    env: NodeJS.ProcessEnv;
    isStdoutTty: boolean;
    isStderrTty: boolean;
    noColor: boolean;
}
export declare function createContext(): CliContext;
//# sourceMappingURL=context.d.ts.map