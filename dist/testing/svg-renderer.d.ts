/**
 * Terminal-to-SVG renderer for visual regression testing.
 *
 * Converts rendered terminal output (with ANSI escape codes) to SVG strings,
 * enabling pixel-perfect visual regression snapshots.
 */
export interface SvgOptions {
    /** Font size in pixels (default 14) */
    fontSize?: number;
    /** Line height multiplier (default 1.2) */
    lineHeight?: number;
    /** Font family (default "Menlo, Monaco, monospace") */
    fontFamily?: string;
    /** Background color (default "#0B0E14") */
    backgroundColor?: string;
    /** Padding in pixels (default 16) */
    padding?: number;
}
/**
 * Convert rendered terminal output to SVG string.
 *
 * @param lines - Plain text output lines (used for dimensions)
 * @param styledOutput - ANSI-styled output string
 * @param width - Width of the render area in columns
 * @param height - Height of the render area in rows
 * @param options - SVG rendering options
 * @returns SVG string
 */
export declare function renderToSvg(lines: string[], styledOutput: string, width: number, height: number, options?: SvgOptions): string;
//# sourceMappingURL=svg-renderer.d.ts.map