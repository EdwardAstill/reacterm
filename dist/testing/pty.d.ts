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
export declare function runPtySmoke(options: PtyRunOptions): Promise<PtyRunResult>;
//# sourceMappingURL=pty.d.ts.map