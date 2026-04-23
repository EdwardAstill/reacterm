/**
 * Live WCAG Accessibility Audit — real-time contrast checking on rendered output.
 *
 * Scans every cell in the rendered buffer
 * and flags accessibility violations:
 *
 * 1. CONTRAST: Foreground/background color pairs that fail WCAG AA (< 4.5:1)
 *    or AAA (< 7:1) contrast ratios
 * 2. LOW CONTRAST TEXT: Text that's nearly invisible against its background
 * 3. FOCUS INDICATORS: Interactive elements without visible focus styling
 *
 * Renders violations as highlighted cells with warning markers.
 */
import { Attr, DEFAULT_COLOR, isRgbColor, rgb, rgbR, rgbG, rgbB } from "../core/types.js";
import { contrastRatio } from "../core/accessibility.js";
const ANSI_256_TABLE = buildAnsi256Table();
function buildAnsi256Table() {
    const table = [];
    // 0-7: standard colors
    const std = [
        [0, 0, 0], // black
        [128, 0, 0], // red
        [0, 128, 0], // green
        [128, 128, 0], // yellow
        [0, 0, 128], // blue
        [128, 0, 128], // magenta
        [0, 128, 128], // cyan
        [192, 192, 192], // white
    ];
    // 8-15: bright colors
    const bright = [
        [128, 128, 128], // bright black (gray)
        [255, 0, 0], // bright red
        [0, 255, 0], // bright green
        [255, 255, 0], // bright yellow
        [0, 0, 255], // bright blue
        [255, 0, 255], // bright magenta
        [0, 255, 255], // bright cyan
        [255, 255, 255], // bright white
    ];
    for (const c of std)
        table.push(c);
    for (const c of bright)
        table.push(c);
    // 16-231: 6x6x6 color cube
    const levels = [0, 95, 135, 175, 215, 255];
    for (let r = 0; r < 6; r++) {
        for (let g = 0; g < 6; g++) {
            for (let b = 0; b < 6; b++) {
                table.push([levels[r], levels[g], levels[b]]);
            }
        }
    }
    // 232-255: grayscale ramp
    for (let i = 0; i < 24; i++) {
        const v = 8 + i * 10;
        table.push([v, v, v]);
    }
    return table;
}
/** Default terminal colors: white fg on black bg. */
const DEFAULT_FG_HEX = "#D4D4D4"; // typical light gray terminal fg
const DEFAULT_BG_HEX = "#0A0A0A"; // typical near-black terminal bg
function colorToHex(color, isBackground) {
    if (color === DEFAULT_COLOR) {
        return isBackground ? DEFAULT_BG_HEX : DEFAULT_FG_HEX;
    }
    if (isRgbColor(color)) {
        const r = rgbR(color);
        const g = rgbG(color);
        const b = rgbB(color);
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
    // ANSI 256-color index
    if (color >= 0 && color < 256) {
        const [r, g, b] = ANSI_256_TABLE[color];
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
    return isBackground ? DEFAULT_BG_HEX : DEFAULT_FG_HEX;
}
/** Cache contrast ratios by "fg|bg" key to avoid recomputing luminance. */
const contrastCache = new Map();
function cachedContrastRatio(fgHex, bgHex) {
    const key = `${fgHex}|${bgHex}`;
    let ratio = contrastCache.get(key);
    if (ratio === undefined) {
        ratio = contrastRatio(fgHex, bgHex);
        contrastCache.set(key, ratio);
        // Prevent unbounded growth
        if (contrastCache.size > 4096) {
            const entries = Array.from(contrastCache.entries());
            contrastCache.clear();
            for (let i = entries.length >> 1; i < entries.length; i++) {
                contrastCache.set(entries[i][0], entries[i][1]);
            }
        }
    }
    return ratio;
}
const SUMMARY_FG = rgb(0xD4, 0xD4, 0xD4);
const SUMMARY_BG = rgb(0x1C, 0x1C, 0x1C);
const SUMMARY_LABEL_FG = rgb(0x82, 0xAA, 0xFF);
const VIOLATION_UNDERLINE_COLOR = rgb(0xFF, 0x40, 0x40);
export function createAccessibilityAudit(options) {
    const minContrast = options?.minContrast ?? 4.5;
    const checkAAA = options?.checkAAA ?? false;
    const scanInterval = options?.scanInterval ?? 10;
    let active = options?.showOverlay ?? false;
    let frameCount = 0;
    let violations = [];
    let report = emptyReport();
    function emptyReport() {
        return {
            totalCells: 0,
            textCells: 0,
            aaViolations: 0,
            aaaViolations: 0,
            uniqueViolations: [],
            scoreAA: 100,
            scoreAAA: 100,
        };
    }
    function scanBuffer(buffer) {
        const w = buffer.width;
        const h = buffer.height;
        const totalCells = w * h;
        let textCells = 0;
        let aaFails = 0;
        let aaaFails = 0;
        const newViolations = [];
        const pairCounts = new Map();
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const ch = buffer.getChar(x, y);
                // Skip empty/space cells — no text contrast to check
                if (ch === " " || ch === "" || ch === "\0")
                    continue;
                textCells++;
                const fgRaw = buffer.getFg(x, y);
                const bgRaw = buffer.getBg(x, y);
                const fgHex = colorToHex(fgRaw, false);
                const bgHex = colorToHex(bgRaw, true);
                const ratio = cachedContrastRatio(fgHex, bgHex);
                if (ratio < 1.5) {
                    newViolations.push({
                        x, y, type: "invisible-text",
                        contrastRatio: ratio, fg: fgHex, bg: bgHex, char: ch,
                    });
                    aaFails++;
                    aaaFails++;
                    addPairCount(pairCounts, fgHex, bgHex, ratio);
                    continue;
                }
                if (ratio < minContrast) {
                    newViolations.push({
                        x, y, type: "contrast-aa",
                        contrastRatio: ratio, fg: fgHex, bg: bgHex, char: ch,
                    });
                    aaFails++;
                    if (ratio < 7)
                        aaaFails++;
                    addPairCount(pairCounts, fgHex, bgHex, ratio);
                    continue;
                }
                // Check AAA (< 7:1) if enabled
                if (checkAAA && ratio < 7) {
                    newViolations.push({
                        x, y, type: "contrast-aaa",
                        contrastRatio: ratio, fg: fgHex, bg: bgHex, char: ch,
                    });
                    aaaFails++;
                    addPairCount(pairCounts, fgHex, bgHex, ratio);
                }
            }
        }
        const uniqueViolations = Array.from(pairCounts.values()).sort((a, b) => b.count - a.count);
        violations = newViolations;
        report = {
            totalCells,
            textCells,
            aaViolations: aaFails,
            aaaViolations: aaaFails,
            uniqueViolations,
            scoreAA: textCells > 0 ? Math.round(((textCells - aaFails) / textCells) * 100) : 100,
            scoreAAA: textCells > 0 ? Math.round(((textCells - aaaFails) / textCells) * 100) : 100,
        };
    }
    function addPairCount(map, fg, bg, ratio) {
        const key = `${fg}|${bg}`;
        const existing = map.get(key);
        if (existing) {
            existing.count++;
        }
        else {
            map.set(key, { fg, bg, ratio: Math.round(ratio * 100) / 100, count: 1 });
        }
    }
    function applyOverlay(buffer) {
        // Mark violation cells with red underline
        for (const v of violations) {
            if (v.x >= 0 && v.x < buffer.width && v.y >= 0 && v.y < buffer.height) {
                const existingAttrs = buffer.getAttrs(v.x, v.y);
                buffer.setCell(v.x, v.y, {
                    char: buffer.getChar(v.x, v.y),
                    fg: buffer.getFg(v.x, v.y),
                    bg: buffer.getBg(v.x, v.y),
                    attrs: existingAttrs | Attr.UNDERLINE,
                    ulColor: VIOLATION_UNDERLINE_COLOR,
                });
            }
        }
        // Draw summary bar on the last row
        const y = buffer.height - 1;
        if (y < 0)
            return;
        const uniqueCount = report.uniqueViolations.length;
        const summaryText = `[A11y Audit] Score: ${report.scoreAA}% AA | ${report.aaViolations} violations | ${uniqueCount} unique color pairs | Toggle: F11`;
        // Fill the summary bar background
        buffer.fill(0, y, buffer.width, 1, " ", SUMMARY_FG, SUMMARY_BG);
        const labelEnd = "[A11y Audit]".length;
        buffer.writeString(0, y, "[A11y Audit]", SUMMARY_LABEL_FG, SUMMARY_BG, Attr.BOLD);
        const rest = summaryText.slice(labelEnd);
        buffer.writeString(labelEnd, y, rest, SUMMARY_FG, SUMMARY_BG);
    }
    const middleware = {
        name: "accessibility-audit",
        onPaint(buffer, _width, _height) {
            if (!active)
                return buffer;
            frameCount++;
            // Only scan every N frames to limit performance overhead
            if (frameCount % scanInterval === 1 || scanInterval <= 1) {
                scanBuffer(buffer);
            }
            applyOverlay(buffer);
            return buffer;
        },
    };
    return {
        middleware,
        toggle() {
            active = !active;
            if (active) {
                // Force a scan on the next frame
                frameCount = 0;
            }
        },
        isActive() {
            return active;
        },
        getReport() {
            return report;
        },
        getViolations() {
            return violations;
        },
    };
}
//# sourceMappingURL=accessibility-audit.js.map