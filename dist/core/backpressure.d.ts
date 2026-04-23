export interface BackpressureOptions {
    /** High water mark for buffered writes in bytes (default 64 KB). */
    highWaterMark?: number;
    /** Strategy when the buffer is full: drop new data, wait for drain, or coalesce. */
    strategy?: "drop" | "wait" | "coalesce";
}
/**
 * When stdout.write() returns false (kernel buffer full), data is queued
 * internally and flushed once the drain event fires.
 */
export declare class OutputBuffer {
    private pending;
    private draining;
    private readonly stdout;
    private readonly highWaterMark;
    private readonly strategy;
    private _bufferedSize;
    constructor(stdout: NodeJS.WriteStream, options?: BackpressureOptions);
    write(data: string): boolean;
    flush(): Promise<void>;
    get bufferedSize(): number;
    get isReady(): boolean;
    private enqueue;
    private drainPending;
}
//# sourceMappingURL=backpressure.d.ts.map