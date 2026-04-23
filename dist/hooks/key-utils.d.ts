import type { KeyEvent } from "../input/types.js";
export interface KeySpec {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
}
export declare function matchKeySpec(event: KeyEvent, spec: KeySpec): boolean;
//# sourceMappingURL=key-utils.d.ts.map