export interface UseAnnounceResult {
    /** Announce a message (polite — waits for idle) */
    announce: (message: string) => void;
    /** Announce urgently (assertive — interrupts) */
    announceUrgent: (message: string) => void;
}
/**
 * Hook to announce dynamic content changes to screen readers.
 *
 * @example
 * ```tsx
 * function StatusUpdate() {
 *   const { announce } = useAnnounce();
 *
 *   function onSave() {
 *     // ... save logic
 *     announce("File saved successfully");
 *   }
 *
 *   return <Button onPress={onSave}>Save</Button>;
 * }
 * ```
 */
export declare function useAnnounce(): UseAnnounceResult;
//# sourceMappingURL=useAnnounce.d.ts.map