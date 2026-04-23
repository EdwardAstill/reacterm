/**
 * Time-travel debugging — record and replay frame history.
 *
 * Records the last N frame buffers in a circular buffer. When activated,
 * pauses live rendering and lets the user scrub through frame history
 * with left/right arrow keys.
 *
 * Usage:
 * ```ts
 * const tt = createTimeTravel({ maxFrames: 120 }); // 2 seconds at 60fps
 * // Register as middleware
 * ctx.addMiddleware(tt.middleware);
 * // After each paint, call capture:
 * tt.captureFrame(buffer, trigger, paintMs);
 * ```
 */
import { parseColor, Attr } from "../core/types.js";
import { colors } from "../theme/index.js";
const COL_BRAND = parseColor(colors.brand.primary);
const COL_BRAND_LT = parseColor(colors.brand.light);
const COL_TEXT_PRI = parseColor(colors.text.primary);
const COL_TEXT_DIM = parseColor(colors.text.dim);
const COL_SURF_OVERLAY = parseColor(colors.surface.overlay);
const COL_WARNING = parseColor(colors.warning);
class CircularBuffer {
    buffer;
    head = 0; // next write position
    count = 0;
    capacity;
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity).fill(undefined);
    }
    push(item) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.count < this.capacity) {
            this.count++;
        }
    }
    /** Get item by logical index (0 = oldest, count-1 = newest). */
    get(index) {
        if (index < 0 || index >= this.count)
            return undefined;
        // The oldest item is at (head - count + capacity) % capacity
        const realIndex = (this.head - this.count + index + this.capacity) % this.capacity;
        return this.buffer[realIndex];
    }
    /** Number of items currently stored. */
    get size() {
        return this.count;
    }
    /** Get the newest item. */
    newest() {
        if (this.count === 0)
            return undefined;
        return this.buffer[(this.head - 1 + this.capacity) % this.capacity];
    }
}
function countChangedCells(prevChars, prevFgs, prevBgs, prevAttrs, prevUlColors, curChars, curFgs, curBgs, curAttrs, curUlColors, size) {
    let changed = 0;
    for (let i = 0; i < size; i++) {
        if (curChars[i] !== prevChars[i] ||
            curFgs[i] !== prevFgs[i] ||
            curBgs[i] !== prevBgs[i] ||
            curAttrs[i] !== prevAttrs[i] ||
            curUlColors[i] !== prevUlColors[i]) {
            changed++;
        }
    }
    return changed;
}
/**
 * Creates a time-travel debugging system.
 *
 * Records the last N frame buffers. When activated (via keyboard shortcut),
 * pauses live rendering and lets the user scrub through frame history
 * with left/right arrow keys.
 */
export function createTimeTravel(options) {
    const maxFrames = options?.maxFrames ?? 120;
    const frames = new CircularBuffer(maxFrames);
    let frameCounter = 0;
    let active = false;
    let currentIndex = 0;
    // ── Capture ────────────────────────────────────────────────────
    function captureFrame(buffer, trigger, paintMs) {
        // Don't capture while scrubbing through history
        if (active)
            return;
        const size = buffer.width * buffer.height;
        // Clone buffer data — typed arrays via .slice(), chars via spread
        const chars = new Array(size);
        for (let i = 0; i < size; i++) {
            chars[i] = buffer.getChar(i % buffer.width, Math.floor(i / buffer.width));
        }
        const fgs = new Int32Array(size);
        const bgs = new Int32Array(size);
        const attrs = new Uint8Array(size);
        const ulColors = new Int32Array(size);
        for (let i = 0; i < size; i++) {
            const x = i % buffer.width;
            const y = Math.floor(i / buffer.width);
            fgs[i] = buffer.getFg(x, y);
            bgs[i] = buffer.getBg(x, y);
            attrs[i] = buffer.getAttrs(x, y);
            ulColors[i] = buffer.getUlColor(x, y);
        }
        // Count changed cells by comparing with the previous snapshot
        let cellsChanged = size; // first frame: all cells changed
        const prev = frames.newest();
        if (prev && prev.width === buffer.width && prev.height === buffer.height) {
            cellsChanged = countChangedCells(prev.chars, prev.fgs, prev.bgs, prev.attrs, prev.ulColors, chars, fgs, bgs, attrs, ulColors, size);
        }
        const snapshot = {
            frame: frameCounter++,
            timestamp: performance.now(),
            chars,
            fgs,
            bgs,
            attrs,
            ulColors,
            width: buffer.width,
            height: buffer.height,
            trigger,
            paintMs,
            cellsChanged,
        };
        frames.push(snapshot);
    }
    // ── Navigation ─────────────────────────────────────────────────
    function enter() {
        if (frames.size === 0)
            return;
        active = true;
        currentIndex = frames.size - 1; // start at newest
    }
    function exit() {
        active = false;
    }
    function toggle() {
        if (active) {
            exit();
        }
        else {
            enter();
        }
    }
    function prevFrame() {
        if (!active || frames.size === 0)
            return;
        currentIndex = Math.max(0, currentIndex - 1);
    }
    function nextFrame() {
        if (!active || frames.size === 0)
            return;
        currentIndex = Math.min(frames.size - 1, currentIndex + 1);
    }
    function goToFrame(index) {
        if (!active || frames.size === 0)
            return;
        currentIndex = Math.max(0, Math.min(frames.size - 1, index));
    }
    function getState() {
        const snapshot = active ? (frames.get(currentIndex) ?? null) : null;
        return {
            isActive: active,
            currentIndex,
            frameCount: frames.size,
            currentSnapshot: snapshot,
        };
    }
    function getSnapshot(index) {
        return frames.get(index) ?? null;
    }
    // ── Status bar drawing ─────────────────────────────────────────
    function drawStatusBar(buffer, width, height) {
        const snapshot = frames.get(currentIndex);
        if (!snapshot)
            return;
        const statusY = height - 1;
        const now = performance.now();
        const agoMs = now - snapshot.timestamp;
        const agoStr = agoMs < 1000
            ? `${Math.round(agoMs)}ms`
            : `${(agoMs / 1000).toFixed(1)}s`;
        const label = `[Time Travel] Frame ${currentIndex + 1}/${frames.size}` +
            ` | ${agoStr} ago` +
            ` | trigger: ${snapshot.trigger}` +
            ` | ${snapshot.cellsChanged} cells changed` +
            ` | paint: ${snapshot.paintMs.toFixed(1)}ms` +
            ` | \u2190\u2192 navigate | Esc exit`;
        // Fill the status bar background
        buffer.fill(0, statusY, width, 1, " ", COL_TEXT_PRI, COL_SURF_OVERLAY);
        const prefixEnd = "[Time Travel]".length;
        buffer.writeString(0, statusY, "[Time Travel]", COL_WARNING, COL_SURF_OVERLAY, Attr.BOLD, width);
        const rest = label.slice(prefixEnd);
        buffer.writeString(prefixEnd, statusY, rest, COL_TEXT_DIM, COL_SURF_OVERLAY, Attr.NONE, width);
        // Draw a mini progress bar on the line above if there's room
        if (height >= 3) {
            const barY = height - 2;
            const barWidth = Math.min(width - 4, frames.size);
            const barStartX = 2;
            // Background fill for progress bar row
            buffer.fill(0, barY, width, 1, " ", COL_TEXT_PRI, COL_SURF_OVERLAY);
            if (barWidth > 0 && frames.size > 1) {
                const thumbPos = Math.round((currentIndex / (frames.size - 1)) * (barWidth - 1));
                for (let i = 0; i < barWidth; i++) {
                    const x = barStartX + i;
                    if (x >= width)
                        break;
                    const isThumb = i === thumbPos;
                    buffer.setCell(x, barY, {
                        char: isThumb ? "\u2588" : "\u2591",
                        fg: isThumb ? COL_BRAND_LT : COL_TEXT_DIM,
                        bg: COL_SURF_OVERLAY,
                        attrs: Attr.NONE,
                        ulColor: -1,
                    });
                }
                // Frame number at right end of bar
                const frameLabel = ` #${snapshot.frame} `;
                const frameLabelX = barStartX + barWidth + 1;
                if (frameLabelX + frameLabel.length < width) {
                    buffer.writeString(frameLabelX, barY, frameLabel, COL_BRAND, COL_SURF_OVERLAY, Attr.NONE, width);
                }
            }
        }
    }
    // ── Restore snapshot into buffer ───────────────────────────────
    function restoreSnapshot(buffer, snapshot, width, height) {
        // Overwrite the live buffer with the historical snapshot data.
        // If dimensions differ, we write as much as fits.
        const copyW = Math.min(snapshot.width, width);
        const copyH = Math.min(snapshot.height, height);
        for (let y = 0; y < copyH; y++) {
            const srcBase = y * snapshot.width;
            for (let x = 0; x < copyW; x++) {
                const si = srcBase + x;
                buffer.setCell(x, y, {
                    char: snapshot.chars[si],
                    fg: snapshot.fgs[si],
                    bg: snapshot.bgs[si],
                    attrs: snapshot.attrs[si],
                    ulColor: snapshot.ulColors[si],
                });
            }
        }
    }
    // ── Middleware ──────────────────────────────────────────────────
    const middleware = {
        name: "time-travel",
        onPaint(buffer, width, height) {
            if (!active) {
                // Auto-capture every frame so history is available when time-travel is entered
                captureFrame(buffer, "repaint", 0);
                return buffer;
            }
            const snapshot = frames.get(currentIndex);
            if (!snapshot)
                return buffer;
            // Replace the live buffer with the historical snapshot
            restoreSnapshot(buffer, snapshot, width, height);
            // Draw the status bar overlay on top
            drawStatusBar(buffer, width, height);
            return buffer;
        },
    };
    // ── Public API ─────────────────────────────────────────────────
    return {
        middleware,
        captureFrame,
        enter,
        exit,
        toggle,
        prevFrame,
        nextFrame,
        goToFrame,
        getState,
        getSnapshot,
    };
}
//# sourceMappingURL=time-travel.js.map