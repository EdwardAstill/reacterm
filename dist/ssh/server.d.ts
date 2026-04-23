/**
 * StormSSHServer — serve Storm TUI apps over SSH.
 *
 * Users `ssh your-server.com` and get an interactive terminal UI.
 * Each SSH connection gets its own isolated React tree + Screen + InputManager.
 *
 * The ssh2 package is lazy-loaded so it's an optional peer dependency.
 * Install it: npm install ssh2
 */
import React from "react";
export interface StormSSHOptions {
    /** Port to listen on. Default: 2222 */
    port?: number;
    /** Host to bind to. Default: "0.0.0.0" */
    host?: string;
    /** Host key (PEM string or Buffer). Required. */
    hostKey: string | Buffer;
    /**
     * Authentication handler. Return true to accept, false to reject.
     * REQUIRED — there is no default. You must explicitly handle auth.
     * For development, pass `() => true` to accept all.
     */
    authenticate: (ctx: {
        username: string;
        method: string;
        password?: string;
        publicKey?: Buffer;
    }) => boolean | Promise<boolean>;
    /** Called for each new SSH session — return the React element to render. */
    app: (session: SSHSession) => React.ReactElement;
    /** Max concurrent connections. Default: 100 */
    maxConnections?: number;
    /** Banner text shown before auth. Optional. */
    banner?: string;
    /** Auth phase timeout in ms. Default: 30000 (30s). 0 = no timeout. */
    authTimeout?: number;
    /** Idle session timeout in ms. Default: 0 (disabled). */
    idleTimeout?: number;
    /** Called when a connection event occurs (for logging/monitoring). */
    onEvent?: (event: SSHEvent) => void;
}
export interface SSHSession {
    /** SSH username */
    username: string;
    /** Terminal dimensions */
    width: number;
    height: number;
    /** Remote IP */
    remoteAddress: string;
    /** Client's TERM type (e.g., "xterm-256color") */
    termType: string;
    /** Disconnect this session */
    disconnect(): void;
}
export type SSHEvent = {
    type: "connect";
    remoteAddress: string;
} | {
    type: "auth-success";
    username: string;
    remoteAddress: string;
} | {
    type: "auth-failure";
    username: string;
    remoteAddress: string;
    method: string;
} | {
    type: "session-start";
    username: string;
    remoteAddress: string;
} | {
    type: "session-end";
    username: string;
    remoteAddress: string;
} | {
    type: "error";
    message: string;
    remoteAddress: string;
} | {
    type: "rate-limited";
    remoteAddress: string;
};
export declare class StormSSHServer {
    private readonly options;
    private server;
    private activeSessions;
    private activeConnectionCount;
    private rateLimiter;
    constructor(options: StormSSHOptions);
    private emit;
    /** Start listening for SSH connections. */
    listen(): Promise<void>;
    /** Stop server, disconnect all sessions. */
    close(): Promise<void>;
    /** Number of active sessions. */
    get connections(): number;
    /** List active sessions (for monitoring). */
    getSessions(): ReadonlyArray<{
        username: string;
        remoteAddress: string;
        width: number;
        height: number;
    }>;
    /** Disconnect a specific session by username. */
    disconnectUser(username: string): void;
    /** Broadcast a disconnect to all sessions. */
    disconnectAll(): void;
    private cleanupClientSessions;
}
//# sourceMappingURL=server.d.ts.map