import type { MouseEvent } from "../input/types.js";
export interface UseMouseTargetOptions {
    id?: string;
    disabled?: boolean;
    onMouse?: (event: MouseEvent, localX: number, localY: number) => void;
}
export interface UseMouseTargetResult {
    focusId: string;
}
export declare function useMouseTarget(options?: UseMouseTargetOptions): UseMouseTargetResult;
//# sourceMappingURL=useMouseTarget.d.ts.map