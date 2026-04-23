export interface UseClipboardResult {
    /** Copy text to clipboard via OSC 52 */
    copy: (text: string) => void;
    /** Read clipboard (not universally supported) */
    read: () => void;
    /** Last clipboard content received */
    content: string | null;
}
export declare function useClipboard(): UseClipboardResult;
//# sourceMappingURL=useClipboard.d.ts.map