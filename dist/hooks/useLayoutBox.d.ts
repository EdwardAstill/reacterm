export interface LayoutRect {
    x: number;
    y: number;
    width: number;
    height: number;
    innerX: number;
    innerY: number;
    innerWidth: number;
    innerHeight: number;
    contentWidth: number;
    contentHeight: number;
}
export interface UseLayoutBoxOptions {
    id?: string;
    fallback?: Partial<LayoutRect>;
    onChange?: (layout: LayoutRect, previous: LayoutRect | null) => void;
}
export interface UseLayoutBoxResult {
    id: string;
    measured: boolean;
    layout: LayoutRect | null;
    rect: LayoutRect;
    layoutProps: {
        measureId: string;
    };
}
/**
 * Attach a public `measureId` prop and read the element's last completed layout.
 *
 * Measurements are populated after paint, so the first render normally uses
 * `fallback`; the measured rect is available on the following render.
 */
export declare function useLayoutBox(options?: UseLayoutBoxOptions): UseLayoutBoxResult;
//# sourceMappingURL=useLayoutBox.d.ts.map