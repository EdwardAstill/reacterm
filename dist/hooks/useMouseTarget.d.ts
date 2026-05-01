import type { MouseEvent } from "../input/types.js";
export interface UseMouseTargetOptions {
    id?: string;
    disabled?: boolean;
    onMouse?: (event: MouseEvent, localX: number, localY: number) => void;
}
export interface UseMouseTargetResult {
    /** Raw focus id for advanced integrations. Prefer spreading targetProps. */
    focusId: string;
    /** Opaque host props for attaching this mouse target to a rendered element. */
    targetProps: {
        /** @internal Renderer focus plumbing. Spread targetProps instead of using directly. */
        _focusId: string;
    };
}
export declare function useMouseTarget(options?: UseMouseTargetOptions): UseMouseTargetResult;
//# sourceMappingURL=useMouseTarget.d.ts.map