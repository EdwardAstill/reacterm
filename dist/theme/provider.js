import React, { createContext, useContext, useRef } from "react";
import { colors as defaultColors } from "./colors.js";
import { generateThemeShades } from "./shades.js";
import { TuiContext } from "../context/TuiContext.js";
function buildThemeWithShades(theme) {
    return {
        colors: theme,
        shades: generateThemeShades(theme),
    };
}
const defaultValue = buildThemeWithShades(defaultColors);
const ThemeContext = createContext(defaultValue);
export function ThemeProvider(props) {
    const theme = props.theme ?? defaultColors;
    const cacheRef = useRef(null);
    if (!cacheRef.current || cacheRef.current.theme !== theme) {
        cacheRef.current = { theme, value: buildThemeWithShades(theme) };
    }
    // Keep RenderContext.theme in sync so the renderer always has the
    // current theme for fallback colors (e.g. default background).
    // useContext(TuiContext) is safe here — ThemeProvider is always
    // rendered inside TuiProvider.
    const tuiCtx = useContext(TuiContext);
    if (tuiCtx && tuiCtx.renderContext.theme !== theme) {
        tuiCtx.renderContext.theme = theme;
    }
    return React.createElement(ThemeContext.Provider, { value: cacheRef.current.value }, props.children);
}
export function useTheme() {
    return useContext(ThemeContext);
}
export { ThemeContext };
//# sourceMappingURL=provider.js.map