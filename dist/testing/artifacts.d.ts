import { type SvgOptions } from "./svg-renderer.js";
import type { TuiDriver } from "./driver.js";
export interface FailureBundleOptions {
    svg?: SvgOptions;
}
export declare function writeFailureBundle(driver: TuiDriver, dir: string, options?: FailureBundleOptions): string[];
//# sourceMappingURL=artifacts.d.ts.map