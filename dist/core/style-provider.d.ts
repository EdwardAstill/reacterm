/**
 * StyleProvider — injects a StyleSheet into the component tree.
 * Components use useStyles() to resolve their computed styles.
 *
 * @example
 * ```tsx
 * import { createStyleSheet, StyleProvider, useStyles } from "reacterm";
 *
 * const sheet = createStyleSheet({
 *   "Text":         { color: "white" },
 *   "Text.title":   { bold: true, color: "cyan" },
 *   "Button:focus": { inverse: true },
 *   "#submit":      { color: "#FFFFFF", backgroundColor: "#FFB800" },
 * });
 *
 * function MyText({ className }: { className?: string }) {
 *   const styles = useStyles("Text", className);
 *   return <Text {...styles}>Hello</Text>;
 * }
 *
 * function App() {
 *   return (
 *     <StyleProvider sheet={sheet}>
 *       <MyText className="title" />
 *     </StyleProvider>
 *   );
 * }
 * ```
 */
import { type ReactNode, type ReactElement } from "react";
import { StyleSheet, type StyleRule } from "./stylesheet.js";
/** React context that carries the active StyleSheet down the component tree. */
export declare const StyleContext: import("react").Context<StyleSheet | null>;
export interface StyleProviderProps {
    sheet: StyleSheet;
    children: ReactNode;
}
/**
 * Provides a StyleSheet to all descendant components.
 *
 * Nest multiple providers to override styles in sub-trees — the nearest
 * ancestor provider wins (standard React context behavior).
 */
export declare function StyleProvider({ sheet, children }: StyleProviderProps): ReactElement;
/**
 * Resolve computed styles for the current component from the nearest StyleSheet.
 *
 * Returns an empty object if no StyleProvider is present in the tree,
 * so components always get a valid StyleRule without null checks.
 *
 * @param type      - Component type name (e.g. "Box", "Text", "Button")
 * @param className - Optional class name(s), space-separated
 * @param id        - Optional element ID for `#id` selector matching
 * @param states    - Active pseudo-class states (e.g. `new Set(["focus"])`)
 * @returns Resolved style rule from all matching stylesheet selectors
 */
export declare function useStyles(type: string, className?: string, id?: string, states?: Set<string>): StyleRule;
//# sourceMappingURL=style-provider.d.ts.map