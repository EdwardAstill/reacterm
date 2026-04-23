/**
 * Core types for the TUI cell-based rendering engine.
 *
 * Colors are encoded as numbers:
 *   -1          = default (terminal default)
 *   0–255       = ANSI 256-color palette
 *   ≥ 0x1000000 = True color RGB (0x1_RR_GG_BB)
 */
export declare const DEFAULT_COLOR = -1;
export declare function rgb(r: number, g: number, b: number): number;
export declare function isRgbColor(c: number): boolean;
export declare function rgbR(c: number): number;
export declare function rgbG(c: number): number;
export declare function rgbB(c: number): number;
export declare function parseColor(input: string | number | undefined): number;
export declare const Attr: {
    readonly NONE: 0;
    readonly BOLD: number;
    readonly DIM: number;
    readonly ITALIC: number;
    readonly UNDERLINE: number;
    readonly BLINK: number;
    readonly INVERSE: number;
    readonly HIDDEN: number;
    readonly STRIKETHROUGH: number;
};
export interface Cell {
    char: string;
    fg: number;
    bg: number;
    attrs: number;
    ulColor: number;
}
export declare const EMPTY_CELL: Readonly<Cell>;
export declare function cellEquals(a: Readonly<Cell>, b: Readonly<Cell>): boolean;
export declare function makeCell(char: string, fg?: number, bg?: number, attrs?: number, ulColor?: number): Cell;
export interface Style {
    color?: string | number;
    bgColor?: string | number;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    hidden?: boolean;
}
export declare function styleToAttrs(s: Style): number;
export declare function styleToCellProps(s: Style): {
    fg: number;
    bg: number;
    attrs: number;
};
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type BorderStyle = "none" | "single" | "double" | "heavy" | "round" | "ascii" | "storm";
export interface BorderChars {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
}
export declare const BORDER_CHARS: Record<Exclude<BorderStyle, "none">, BorderChars>;
//# sourceMappingURL=types.d.ts.map