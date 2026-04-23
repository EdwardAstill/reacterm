/**
 * StyleSheet — CSS-like styling for terminal components.
 *
 * Supports type selectors, class selectors, ID selectors, state pseudo-classes,
 * and descendant combinators. Styles cascade with specificity.
 *
 * @example
 * ```ts
 * const sheet = createStyleSheet({
 *   "Box":            { padding: 1 },
 *   "Text":           { color: "white" },
 *   "Text.title":     { bold: true, color: "cyan" },
 *   "Button:focus":   { inverse: true },
 *   "Box.sidebar Text": { dim: true },
 *   "#submit":        { color: "#FFFFFF", backgroundColor: "#FFB800" },
 * });
 *
 * // Resolve styles for a focused Button with className "primary"
 * const styles = sheet.resolve("Button", "primary", new Set(["focus"]));
 *
 * // Resolve styles by ID
 * const idStyles = sheet.resolve("Button", undefined, undefined, undefined, "submit");
 * ```
 */
/** Declarative style properties for terminal components. */
export interface StyleRule {
    color?: string | number;
    backgroundColor?: string | number;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    borderStyle?: string;
    borderColor?: string | number;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    margin?: number;
    marginX?: number;
    marginY?: number;
    gap?: number;
    flex?: number;
    flexDirection?: string;
    alignItems?: string;
    justifyContent?: string;
}
/**
 * A parsed segment of a compound selector.
 *
 * Examples:
 *   "Button"        -> { type: "Button" }
 *   ".title"        -> { classes: ["title"] }
 *   "Text.title"    -> { type: "Text", classes: ["title"] }
 *   "Button:focus"  -> { type: "Button", pseudos: ["focus"] }
 *   "#submit"       -> { id: "submit" }
 *   "Button#submit" -> { type: "Button", id: "submit" }
 */
interface SelectorSegment {
    type?: string;
    id?: string;
    classes: string[];
    pseudos: string[];
}
/** A full parsed selector is a list of segments (descendant combinator). */
interface ParsedSelector {
    segments: SelectorSegment[];
    specificity: number;
}
interface CompiledRule {
    parsed: ParsedSelector;
    style: StyleRule;
}
/**
 * A compiled stylesheet that resolves styles for components based on
 * type, className, ID, states, and ancestor context.
 *
 * Rules are pre-parsed and sorted by specificity on creation.
 * The `resolve` method returns merged styles from all matching rules.
 *
 * @example
 * ```ts
 * const styles = StyleSheet.create({
 *   "Button": { color: "#00FF00", bold: true },
 *   "Button.danger": { color: "#FF0000" },
 *   "Card:focused": { borderColor: "#FFB800" },
 *   "#submit": { color: "#FFFFFF", backgroundColor: "#FFB800" },
 * });
 *
 * <StyleProvider stylesheet={styles}>
 *   <Button className="danger" label="Delete" />
 * </StyleProvider>
 * ```
 */
export declare class StyleSheet {
    /** @internal */
    private readonly rules;
    /** @internal */
    constructor(rules: CompiledRule[]);
    /**
     * Add a single rule to the stylesheet. Returns a new StyleSheet
     * (stylesheets are treated as immutable after creation).
     *
     * @param selector - CSS-like selector string
     * @param styles   - Style properties to apply
     * @returns A new StyleSheet with the added rule
     */
    add(selector: string, styles: StyleRule): StyleSheet;
    /**
     * Add multiple rules at once. Returns a new StyleSheet.
     *
     * @param rules - Record of selector strings to style rules
     * @returns A new StyleSheet with the added rules
     */
    addAll(rules: Record<string, StyleRule>): StyleSheet;
    /**
     * Resolve the computed style for a component.
     *
     * @param type      - Component type name (e.g. "Box", "Text", "Button")
     * @param className - Optional class name(s), space-separated (e.g. "title sidebar")
     * @param states    - Active pseudo-class states (e.g. new Set(["focus", "hover"]))
     * @param ancestors - Ancestor components from root to parent (e.g. ["Box.sidebar", "Text"])
     * @param id        - Optional element ID (e.g. "submit-btn")
     * @returns Merged style from all matching rules, ordered by specificity
     */
    resolve(type: string, className?: string, states?: Set<string>, ancestors?: string[], id?: string): StyleRule;
    /**
     * Create a StyleSheet from a record of CSS-like selectors to style rules.
     * Equivalent to `createStyleSheet()` but as a static method.
     *
     * @example
     * ```ts
     * const sheet = StyleSheet.create({
     *   "Button": { color: "#00FF00", bold: true },
     *   "Button.danger": { color: "#FF0000" },
     *   "Card:focused": { borderColor: "#FFB800" },
     *   "#submit": { color: "#FFFFFF", backgroundColor: "#FFB800" },
     * });
     * ```
     */
    static create(rules: Record<string, StyleRule>): StyleSheet;
}
/**
 * Create a StyleSheet from a record of CSS-like selectors to style rules.
 *
 * @example
 * ```ts
 * const sheet = createStyleSheet({
 *   "Text":           { color: "white" },
 *   "Text.heading":   { bold: true, color: "cyan" },
 *   "Button":         { backgroundColor: "blue" },
 *   "Button:focus":   { inverse: true },
 *   "Button:disabled": { dim: true },
 *   "Box.sidebar Text": { color: "gray" },
 *   "#submit":        { color: "#FFFFFF", backgroundColor: "#FFB800" },
 *   "Button#submit":  { bold: true },
 * });
 * ```
 *
 * Selector syntax:
 *   - Type:       `"Box"`, `"Text"`, `"Button"`
 *   - Class:      `".title"`, `"Text.title"`
 *   - ID:         `"#submit"`, `"Button#submit"`
 *   - Pseudo:     `":focus"`, `"Button:focus"`, `":disabled"`
 *   - Combined:   `"Button.primary:focus"`, `"Button#submit.primary"`
 *   - Descendant: `"Box Text"`, `"Box.sidebar Text.heading"`
 */
export declare function createStyleSheet(rules: Record<string, StyleRule>): StyleSheet;
export {};
//# sourceMappingURL=stylesheet.d.ts.map