/**
 * useStyleSheet — load and apply a stylesheet file with optional live reloading.
 *
 * Reads a `.storm.css` or `.storm.json` file, converts its rules into a
 * StyleSheet, and injects it into the component tree via StyleContext.
 * When `watch` is enabled, file changes trigger a re-parse and re-render
 * so styles update live without restarting the app.
 *
 * @example
 * ```tsx
 * import { useStyleSheet, Box, Text } from "reacterm";
 *
 * function App() {
 *   useStyleSheet({ path: "./app.storm.css", watch: true });
 *   return (
 *     <Box className="sidebar">
 *       <Text className="title">Hello</Text>
 *     </Box>
 *   );
 * }
 * ```
 */
import { type StyleSheetLoaderOptions } from "../core/stylesheet-loader.js";
import { type DeepPartial } from "../theme/index.js";
import type { StormColors } from "../theme/colors.js";
/** Return value of {@link useStyleSheet}. */
export interface UseStyleSheetResult {
    /**
     * Partial StormColors extracted from `--storm-*` CSS custom properties
     * defined in `:root` blocks. Pass this to `extendTheme(baseTheme, themeOverrides)`
     * and feed the merged theme into `<ThemeProvider>` to close the gap between
     * Layer 4 (.storm.css variables) and Layer 1 (ThemeProvider).
     *
     * @example
     * ```tsx
     * function App() {
     *   const { themeOverrides } = useStyleSheet({ path: "./app.storm.css", watch: true });
     *   const mergedTheme = extendTheme(baseTheme, themeOverrides);
     *   return (
     *     <ThemeProvider theme={mergedTheme}>
     *       <MyContent />
     *     </ThemeProvider>
     *   );
     * }
     * ```
     */
    themeOverrides: DeepPartial<StormColors>;
}
/**
 * Load and apply a stylesheet from a file, with optional live reloading.
 *
 * On first call, the file is synchronously read and parsed. The resulting
 * styles are injected into the nearest `StyleContext`. If no provider is
 * present, a warning is logged and the hook is a no-op.
 *
 * When `watch` is enabled (default in non-production), the file is watched
 * for changes. On change, the stylesheet is re-parsed, the context is
 * updated, and a re-render is triggered so components pick up the new styles.
 *
 * The file watcher is cleaned up when the app unmounts.
 *
 * Additionally, any `--storm-*` CSS custom properties found in `:root`
 * blocks are extracted into `themeOverrides` — a partial `StormColors`
 * object that can be merged with `extendTheme()` and passed to
 * `<ThemeProvider>` so that `useColors()` reflects live stylesheet values.
 *
 * @param options - Loader options (path, watch, onReload, onError)
 * @returns An object containing `themeOverrides` extracted from `:root` CSS variables
 */
export declare function useStyleSheet(options: StyleSheetLoaderOptions): UseStyleSheetResult;
//# sourceMappingURL=useStyleSheet.d.ts.map