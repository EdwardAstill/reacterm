/**
 * Deep profiler -- per-frame timing, memory, GC pressure, and Storm internals.
 *
 * Designed for zero overhead when disabled. Memory is sampled every 10th frame
 * to avoid the cost of process.memoryUsage() on every tick.
 *
 * Usage:
 * ```ts
 * const profiler = createProfiler(renderCtx);
 * profiler.start();
 * // ... after each frame:
 * profiler.recordFrame({ layoutMs, paintMs, diffMs, flushMs });
 * // ... read data:
 * const snap = profiler.snapshot();
 * const csv = profiler.exportCSV();
 * ```
 */
/** Bytes per cell in the ScreenBuffer (see buffer.ts layout):
 *  - chars: 1 string ref (~8 bytes on V8)
 *  - fgs: 4 bytes (Int32Array)
 *  - bgs: 4 bytes (Int32Array)
 *  - attrs: 1 byte (Uint8Array)
 *  - ulColors: 4 bytes (Int32Array)
 *  Total: ~21 bytes per cell */
const BYTES_PER_CELL = 21;
const MAX_HISTORY = 600; // 10 seconds at 60fps — hard cap
const MEMORY_SAMPLE_INTERVAL = 10; // Sample process.memoryUsage() every 10th frame
function emptySnapshot() {
    return {
        timestamp: 0,
        frame: 0,
        layoutMs: 0,
        paintMs: 0,
        diffMs: 0,
        flushMs: 0,
        totalMs: 0,
        rssBytes: 0,
        heapUsedBytes: 0,
        heapTotalBytes: 0,
        externalBytes: 0,
        arrayBufferBytes: 0,
        heapDelta: 0,
        gcPressure: 0,
        bufferBytes: 0,
        cellsChanged: 0,
        totalCells: 0,
        hostElementCount: 0,
        activeTimerCount: 0,
        fps: 0,
    };
}
function countHostElements(root) {
    let count = 0;
    function walk(node) {
        if (node.type === "TEXT_NODE")
            return;
        count++;
        for (const child of node.children) {
            walk(child);
        }
    }
    for (const child of root.children) {
        walk(child);
    }
    return count;
}
export function createProfiler(renderCtx, maxHistory = 120) {
    let active = false;
    let frameCounter = 0;
    const historySize = Math.min(maxHistory, MAX_HISTORY);
    const snapshots = [];
    // Memory state for GC pressure estimation
    let prevHeapUsed = 0;
    let lastMemory = null;
    // Rolling window for GC pressure (tracks heap oscillation)
    const heapDeltas = [];
    const GC_WINDOW = 30;
    // Element tree root (optional)
    let treeRoot = null;
    // Alert registrations
    const highMemoryAlerts = [];
    const slowFrameAlerts = [];
    const gcPressureAlerts = [];
    function sampleMemory(frame) {
        if (frame % MEMORY_SAMPLE_INTERVAL !== 0)
            return;
        lastMemory = process.memoryUsage();
    }
    function estimateGCPressure(heapDelta) {
        heapDeltas.push(heapDelta);
        if (heapDeltas.length > GC_WINDOW)
            heapDeltas.shift();
        if (heapDeltas.length < 3)
            return 0;
        // GC pressure = ratio of negative deltas (heap drops = GC collections)
        // combined with overall volatility
        let negativeCount = 0;
        let totalMagnitude = 0;
        for (const d of heapDeltas) {
            if (d < 0)
                negativeCount++;
            totalMagnitude += Math.abs(d);
        }
        const collectionRate = negativeCount / heapDeltas.length;
        const avgMagnitude = totalMagnitude / heapDeltas.length;
        // High collection rate + large magnitudes = high GC pressure
        // Normalize magnitude: 1MB+ oscillation = high
        const magnitudeScore = Math.min(1, avgMagnitude / (1024 * 1024));
        return Math.min(1, collectionRate * 0.6 + magnitudeScore * 0.4);
    }
    function fireAlerts(snap) {
        const rssMB = snap.rssBytes / (1024 * 1024);
        for (const alert of highMemoryAlerts) {
            if (rssMB >= alert.threshold) {
                try {
                    alert.callback(snap);
                }
                catch { /* ignore alert errors */ }
            }
        }
        for (const alert of slowFrameAlerts) {
            if (snap.totalMs >= alert.threshold) {
                try {
                    alert.callback(snap);
                }
                catch { /* ignore alert errors */ }
            }
        }
        for (const alert of gcPressureAlerts) {
            if (snap.gcPressure >= alert.threshold) {
                try {
                    alert.callback(snap);
                }
                catch { /* ignore alert errors */ }
            }
        }
    }
    const profiler = {
        start() {
            active = true;
            frameCounter = 0;
            snapshots.length = 0;
            heapDeltas.length = 0;
            prevHeapUsed = 0;
            lastMemory = null;
        },
        stop() {
            active = false;
        },
        isActive() {
            return active;
        },
        setRoot(root) {
            treeRoot = root;
        },
        recordFrame(timing) {
            if (!active)
                return;
            frameCounter++;
            const now = Date.now();
            // Sample memory every Nth frame
            sampleMemory(frameCounter);
            const mem = lastMemory;
            const heapUsed = mem?.heapUsed ?? 0;
            const heapDelta = prevHeapUsed > 0 ? heapUsed - prevHeapUsed : 0;
            if (mem)
                prevHeapUsed = heapUsed;
            const gcPressure = estimateGCPressure(heapDelta);
            // Buffer size from render context
            const buf = renderCtx.buffer;
            const bufW = buf?.width ?? 0;
            const bufH = buf?.height ?? 0;
            const totalCells = bufW * bufH;
            const bufferBytes = totalCells * BYTES_PER_CELL;
            // Host element count (only every 10th frame — tree walk is O(n))
            let hostElementCount = 0;
            if (treeRoot && frameCounter % MEMORY_SAMPLE_INTERVAL === 0) {
                hostElementCount = countHostElements(treeRoot);
            }
            else if (snapshots.length > 0) {
                hostElementCount = snapshots[snapshots.length - 1].hostElementCount;
            }
            // Timer count from cleanup registry
            const activeTimerCount = renderCtx.cleanups.size;
            const snap = {
                timestamp: now,
                frame: frameCounter,
                layoutMs: timing.layoutMs,
                paintMs: timing.paintMs,
                diffMs: timing.diffMs,
                flushMs: timing.flushMs,
                totalMs: timing.layoutMs + timing.paintMs + timing.diffMs + timing.flushMs,
                rssBytes: mem?.rss ?? 0,
                heapUsedBytes: heapUsed,
                heapTotalBytes: mem?.heapTotal ?? 0,
                externalBytes: mem?.external ?? 0,
                arrayBufferBytes: mem?.arrayBuffers ?? 0,
                heapDelta,
                gcPressure,
                bufferBytes,
                cellsChanged: renderCtx.metrics.cellsChanged,
                totalCells,
                hostElementCount,
                activeTimerCount,
                fps: renderCtx.metrics.fps,
            };
            snapshots.push(snap);
            if (snapshots.length > historySize) {
                snapshots.shift();
            }
            fireAlerts(snap);
        },
        snapshot() {
            if (snapshots.length === 0)
                return emptySnapshot();
            return { ...snapshots[snapshots.length - 1] };
        },
        history(n) {
            if (n === undefined)
                return snapshots.map(s => ({ ...s }));
            const start = Math.max(0, snapshots.length - n);
            return snapshots.slice(start).map(s => ({ ...s }));
        },
        exportJSON() {
            return JSON.stringify({
                exported: new Date().toISOString(),
                frameCount: frameCounter,
                snapshots: snapshots,
            }, null, 2);
        },
        exportCSV() {
            const headers = [
                "timestamp", "frame",
                "layoutMs", "paintMs", "diffMs", "flushMs", "totalMs",
                "rssBytes", "heapUsedBytes", "heapTotalBytes", "externalBytes", "arrayBufferBytes",
                "heapDelta", "gcPressure",
                "bufferBytes", "cellsChanged", "totalCells",
                "hostElementCount", "activeTimerCount", "fps",
            ];
            const lines = [headers.join(",")];
            for (const s of snapshots) {
                lines.push([
                    s.timestamp, s.frame,
                    s.layoutMs.toFixed(2), s.paintMs.toFixed(2), s.diffMs.toFixed(2), s.flushMs.toFixed(2), s.totalMs.toFixed(2),
                    s.rssBytes, s.heapUsedBytes, s.heapTotalBytes, s.externalBytes, s.arrayBufferBytes,
                    s.heapDelta, s.gcPressure.toFixed(4),
                    s.bufferBytes, s.cellsChanged, s.totalCells,
                    s.hostElementCount, s.activeTimerCount, s.fps,
                ].join(","));
            }
            return lines.join("\n");
        },
        onHighMemory(thresholdMB, callback) {
            const entry = { threshold: thresholdMB, callback };
            highMemoryAlerts.push(entry);
            return () => {
                const idx = highMemoryAlerts.indexOf(entry);
                if (idx >= 0)
                    highMemoryAlerts.splice(idx, 1);
            };
        },
        onSlowFrame(thresholdMs, callback) {
            const entry = { threshold: thresholdMs, callback };
            slowFrameAlerts.push(entry);
            return () => {
                const idx = slowFrameAlerts.indexOf(entry);
                if (idx >= 0)
                    slowFrameAlerts.splice(idx, 1);
            };
        },
        onGCPressure(threshold, callback) {
            const entry = { threshold, callback };
            gcPressureAlerts.push(entry);
            return () => {
                const idx = gcPressureAlerts.indexOf(entry);
                if (idx >= 0)
                    gcPressureAlerts.splice(idx, 1);
            };
        },
    };
    return profiler;
}
//# sourceMappingURL=profiler.js.map