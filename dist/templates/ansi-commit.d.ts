export declare function abbreviateNumber(n: number): string;
export declare function formatDuration(ms: number): string;
interface OpNodeLike {
    readonly id: string;
    readonly label: string;
    readonly status: "pending" | "running" | "completed" | "failed" | "cancelled";
    readonly children: readonly string[];
    readonly detail?: string;
    readonly durationMs?: number;
}
export declare function renderOpTreeToAnsi(nodes: ReadonlyMap<string, OpNodeLike>, rootIds: readonly string[]): string;
interface DiffLike {
    readonly path: string;
    readonly lines: string;
}
export interface CommittableTurn {
    readonly userText: string;
    readonly ops: ReadonlyMap<string, OpNodeLike>;
    readonly opRootIds: readonly string[];
    readonly diffs: readonly DiffLike[];
    readonly assistantText: string;
    readonly tokens: number;
    readonly durationMs: number;
    readonly toolCount: number;
    readonly status: "streaming" | "completed" | "failed" | "cancelled";
}
export declare function renderTurnToAnsi(turn: CommittableTurn): string;
export interface CommittableNotice {
    readonly text: string;
    readonly style?: "default" | "timing" | "diff";
}
export declare function renderNoticeToAnsi(notice: CommittableNotice): string;
export declare function renderWelcomeBannerToAnsi(appName: string, modelStr: string, autonomy: string, cwd: string): string;
export {};
//# sourceMappingURL=ansi-commit.d.ts.map