import { type AccessibilityOptions } from "../core/accessibility.js";
/**
 * Returns the current accessibility options.
 *
 * The options are detected once from environment variables and cached
 * in a ref so repeated calls within the same component are free.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const a11y = useAccessibility();
 *   if (a11y.reducedMotion) {
 *     return <Text>Loading...</Text>;
 *   }
 *   return <Spinner />;
 * }
 * ```
 */
export declare function useAccessibility(): AccessibilityOptions;
//# sourceMappingURL=useAccessibility.d.ts.map