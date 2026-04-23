export declare const MAX_LAYOUT_DEPTH = 100;
export declare const MAX_CHILDREN = 10000;
export declare const MAX_BUFFER_WIDTH = 1000;
export declare const MAX_BUFFER_HEIGHT = 500;
/** Returns 0 for negative/NaN values and `max` for values exceeding the cap. */
export declare function clampDimension(value: number, max: number): number;
/** Throws if any layout prop value is outside safe bounds. */
export declare function validateLayoutProps(props: Record<string, unknown>): void;
/** Detects detached TTYs or closed pipes. */
export declare function isTerminalAlive(stdout: NodeJS.WriteStream): boolean;
//# sourceMappingURL=guards.d.ts.map