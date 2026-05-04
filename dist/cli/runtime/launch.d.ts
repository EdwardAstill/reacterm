import { type SpawnOptions, type SpawnSyncOptions } from "node:child_process";
export declare function resolveSiblingModule(fromImportMetaUrl: string, relativeStem: string): string;
export declare function spawnModuleAsMain(modulePath: string, args?: string[], options?: SpawnOptions): import("child_process").ChildProcess;
export declare function spawnModuleAsMainSync(modulePath: string, args?: string[], options?: SpawnSyncOptions): import("child_process").SpawnSyncReturns<string | NonSharedBuffer>;
//# sourceMappingURL=launch.d.ts.map