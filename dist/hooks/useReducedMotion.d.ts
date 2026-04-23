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
export declare function useReducedMotion(): boolean;
//# sourceMappingURL=useReducedMotion.d.ts.map