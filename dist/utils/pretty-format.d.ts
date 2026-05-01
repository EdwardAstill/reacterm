import type { StormColors } from "../theme/colors.js";
export interface Line {
    text: string;
    color?: string;
    bold?: boolean;
    /** JSON path for this line (used for collapse tracking). */
    path?: string;
    /** Whether this line is the opening of a collapsible node. */
    collapsible?: boolean;
    /** Whether this is an inline collapsed representation. */
    isCollapsed?: boolean;
}
export declare function formatValue(data: unknown, indent: number, useColor: boolean, maxDepth: number, currentDepth: number, prefix: string, currentPath: string, collapsedPaths: Set<string>, colors: StormColors, visited?: Set<object>): Line[];
//# sourceMappingURL=pretty-format.d.ts.map