export interface UseScrollOptions {
    /** Lines per scroll tick (default: 3) */
    speed?: number;
    /** Content height in lines */
    contentHeight: number;
    /** Viewport height in lines */
    viewportHeight: number;
}
export interface UseScrollResult {
    scrollTop: number;
    maxScroll: number;
    isAtBottom: boolean;
    scrollTo: (offset: number) => void;
    scrollBy: (delta: number) => void;
    scrollToBottom: () => void;
}
export declare function useScroll(options: UseScrollOptions): UseScrollResult;
//# sourceMappingURL=useScroll.d.ts.map