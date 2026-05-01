export interface PollOptions {
    timeoutMs: number;
    tickMs: number;
}
export interface PollResult {
    matched: boolean;
    elapsedMs: number;
}
export declare function pollWaitFor(predicate: () => boolean, opts: PollOptions): Promise<PollResult>;
//# sourceMappingURL=pollWaitFor.d.ts.map