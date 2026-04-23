export interface ColorShades {
    base: string;
    lighten1: string;
    lighten2: string;
    lighten3: string;
    darken1: string;
    darken2: string;
    darken3: string;
}
/** Generate 6 shades from a base hex color */
export declare function generateShades(hex: string): ColorShades;
/** Generate shades for all semantic colors in a theme */
export interface ThemeShades {
    brand: ColorShades;
    success: ColorShades;
    warning: ColorShades;
    error: ColorShades;
    info: ColorShades;
}
export declare function generateThemeShades(theme: {
    brand: {
        primary: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
}): ThemeShades;
//# sourceMappingURL=shades.d.ts.map