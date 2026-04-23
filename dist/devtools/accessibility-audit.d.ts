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
import type { RenderMiddleware } from "../core/middleware.js";
export interface AccessibilityViolation {
    /** Cell position */
    x: number;
    y: number;
    /** Type of violation */
    type: "contrast-aa" | "contrast-aaa" | "invisible-text";
    /** The contrast ratio found */
    contrastRatio: number;
    /** The foreground color (as hex) */
    fg: string;
    /** The background color (as hex) */
    bg: string;
    /** The character at this cell */
    char: string;
}
export interface AuditOptions {
    /** Minimum contrast ratio to enforce (default: 4.5 for WCAG AA) */
    minContrast?: number;
    /** Whether to show violation overlay (default: true when active) */
    showOverlay?: boolean;
    /** Whether to check AAA level too (7:1) (default: false) */
    checkAAA?: boolean;
    /** Run scan every N frames to limit perf overhead (default: 10) */
    scanInterval?: number;
}
export interface AuditReport {
    /** Total cells scanned */
    totalCells: number;
    /** Total cells with text content (non-space) */
    textCells: number;
    /** Cells failing AA contrast (< 4.5:1) */
    aaViolations: number;
    /** Cells failing AAA contrast (< 7:1) */
    aaaViolations: number;
    /** List of unique color pair violations */
    uniqueViolations: Array<{
        fg: string;
        bg: string;
        ratio: number;
        count: number;
    }>;
    /** Overall score: percentage of text cells meeting AA */
    scoreAA: number;
    /** Overall score: percentage of text cells meeting AAA */
    scoreAAA: number;
}
export declare function createAccessibilityAudit(options?: AuditOptions): {
    /** Middleware that scans buffer and overlays violations */
    middleware: RenderMiddleware;
    /** Toggle audit overlay */
    toggle: () => void;
    /** Whether audit is currently active */
    isActive: () => boolean;
    /** Get the latest audit report */
    getReport: () => AuditReport;
    /** Get all current violations */
    getViolations: () => readonly AccessibilityViolation[];
};
//# sourceMappingURL=accessibility-audit.d.ts.map