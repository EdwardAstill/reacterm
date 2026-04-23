const DEFAULT_HIGH_WATER_MARK = 64 * 1024; // 64 KB
/**
 * When stdout.write() returns false (kernel buffer full), data is queued
 * internally and flushed once the drain event fires.
 */
export class OutputBuffer {
    pending = [];
    draining = false;
    stdout;
    highWaterMark;
    strategy;
    _bufferedSize = 0;
    constructor(stdout, options) {
        this.stdout = stdout;
        this.highWaterMark = options?.highWaterMark ?? DEFAULT_HIGH_WATER_MARK;
        this.strategy = options?.strategy ?? "wait";
        this.stdout.on("drain", () => {
            this.drainPending();
        });
    }
    write(data) {
        if (this.draining || this.pending.length > 0) {
            return this.enqueue(data);
        }
        const ok = this.stdout.write(data);
        if (!ok) {
            // stdout signalled backpressure — future writes should buffer.
            this.draining = true;
        }
        return ok;
    }
    flush() {
        if (this.pending.length === 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            const check = () => {
                this.drainPending();
                if (this.pending.length === 0) {
                    resolve();
                }
                else {
                    this.stdout.once("drain", check);
                }
            };
            check();
        });
    }
    get bufferedSize() {
        return this._bufferedSize;
    }
    get isReady() {
        return !this.draining && this.pending.length === 0;
    }
    enqueue(data) {
        const dataSize = Buffer.byteLength(data, "utf8");
        if (this._bufferedSize + dataSize > this.highWaterMark) {
            switch (this.strategy) {
                case "drop":
                    // Silently discard the data.
                    return false;
                case "coalesce":
                    // Replace the entire pending buffer with only the latest write.
                    this.pending = [data];
                    this._bufferedSize = dataSize;
                    return false;
                case "wait":
                    // Allow the buffer to grow — the caller can check `bufferedSize`.
                    break;
            }
        }
        this.pending.push(data);
        this._bufferedSize += dataSize;
        return false;
    }
    drainPending() {
        while (this.pending.length > 0) {
            const chunk = this.pending[0];
            const ok = this.stdout.write(chunk);
            if (!ok) {
                // Still under backpressure — wait for the next drain event.
                return;
            }
            this.pending.shift();
            this._bufferedSize -= Buffer.byteLength(chunk, "utf8");
        }
        // Everything has been flushed.
        this.draining = false;
        this._bufferedSize = 0;
    }
}
//# sourceMappingURL=backpressure.js.map