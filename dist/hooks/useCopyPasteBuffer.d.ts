export interface UseCopyPasteBufferOptions {
    isActive?: boolean;
    onCopy?: (text: string) => void;
    onPaste?: (text: string) => void;
}
export interface UseCopyPasteBufferResult {
    copy: (text: string) => void;
    lastCopied: string | null;
}
export declare function useCopyPasteBuffer(options?: UseCopyPasteBufferOptions): UseCopyPasteBufferResult;
//# sourceMappingURL=useCopyPasteBuffer.d.ts.map