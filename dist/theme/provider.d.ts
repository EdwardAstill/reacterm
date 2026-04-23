import React from "react";
import type { StormColors } from "./colors.js";
import { type ThemeShades } from "./shades.js";
export interface ThemeWithShades {
    colors: StormColors;
    shades: ThemeShades;
}
declare const ThemeContext: React.Context<ThemeWithShades>;
export declare function ThemeProvider(props: {
    theme?: StormColors;
    children: React.ReactNode;
}): React.ReactElement;
export declare function useTheme(): ThemeWithShades;
export { ThemeContext };
//# sourceMappingURL=provider.d.ts.map