import type { KeyEvent } from "../input/types.js";
export interface UseInputOptions {
    /** Only receive events when active (default: true) */
    isActive?: boolean;
    /** Priority level. Higher = runs first and suppresses lower-priority handlers (focus trap). */
    priority?: number;
}
/**
 * Subscribe to keyboard events. Handler is skipped when `isActive` is false.
 * Higher `priority` runs first and can shadow lower-priority handlers (useful for modal traps).
 */
export declare function useInput(handler: (event: KeyEvent) => void, options?: UseInputOptions): void;
//# sourceMappingURL=useInput.d.ts.map