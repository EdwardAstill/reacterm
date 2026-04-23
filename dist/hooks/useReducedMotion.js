import { useAccessibility } from "./useAccessibility.js";
/**
 * Returns true if reduced motion is preferred.
 *
 * Components should check this before starting animations:
 *
 * @example
 * ```tsx
 * function MySpinner() {
 *   const reducedMotion = useReducedMotion();
 *   if (reducedMotion) return <Text>*</Text>;
 *   return <Spinner />;
 * }
 * ```
 */
export function useReducedMotion() {
    return useAccessibility().reducedMotion;
}
//# sourceMappingURL=useReducedMotion.js.map