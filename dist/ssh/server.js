/**
 * StormSSHServer — serve Storm TUI apps over SSH.
 *
 * Users `ssh your-server.com` and get an interactive terminal UI.
 * Each SSH connection gets its own isolated React tree + Screen + InputManager.
 *
 * The ssh2 package is lazy-loaded so it's an optional peer dependency.
 * Install it: npm install ssh2
 */
import { render } from "../reconciler/render.js";
let ssh2Module = null;
async function loadSSH2() {
    if (!ssh2Module) {
        try {
            const m = await import("ssh2");
            // ESM dynamic import of CJS wraps exports in .default
            ssh2Module = (m.default ?? m);
        }
        catch {
            throw new Error('[storm] SSH serving requires the "ssh2" package. Install it: npm install ssh2');
        }
    }
    return ssh2Module;
}
const DEFAULT_PORT = 2222;
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_MAX_CONNECTIONS = 100;
const MIN_TERMINAL_DIM = 1;
const MAX_TERMINAL_DIM = 500;
const AUTH_TIMEOUT_MS = 30_000;
const IDLE_TIMEOUT_MS = 0; // 0 = disabled
const MAX_AUTH_FAILURES_PER_IP = 10;
const AUTH_FAILURE_WINDOW_MS = 60_000;
function clampDim(value) {
    if (!Number.isFinite(value) || value < MIN_TERMINAL_DIM)
        return MIN_TERMINAL_DIM;
    if (value > MAX_TERMINAL_DIM)
        return MAX_TERMINAL_DIM;
    return Math.floor(value);
}
function adaptChannelAsWriteStream(channel, cols, rows) {
    const ttyProps = {
        isTTY: true,
        columns: clampDim(cols),
        rows: clampDim(rows),
        getColorDepth: () => 24,
    };
    return Object.assign(channel, ttyProps);
}
function adaptChannelAsReadStream(channel) {
    const ttyProps = {
        isTTY: true,
        isRaw: true,
        setRawMode(_mode) { return channel; },
    };
    return Object.assign(channel, ttyProps);
}
class AuthRateLimiter {
    failures = new Map();
    /** Record a failed auth attempt. Returns true if rate-limited (too many failures). */
    recordFailure(ip) {
        const now = Date.now();
        let attempts = this.failures.get(ip);
        if (!attempts) {
            attempts = [];
            this.failures.set(ip, attempts);
        }
        // Purge old entries
        while (attempts.length > 0 && now - attempts[0] > AUTH_FAILURE_WINDOW_MS) {
            attempts.shift();
        }
        attempts.push(now);
        return attempts.length >= MAX_AUTH_FAILURES_PER_IP;
    }
    /** Check if an IP is currently rate-limited. */
    isLimited(ip) {
        const now = Date.now();
        const attempts = this.failures.get(ip);
        if (!attempts)
            return false;
        // Purge old entries
        while (attempts.length > 0 && now - attempts[0] > AUTH_FAILURE_WINDOW_MS) {
            attempts.shift();
        }
        return attempts.length >= MAX_AUTH_FAILURES_PER_IP;
    }
}
export class StormSSHServer {
    options;
    server = null;
    activeSessions = new Set();
    activeConnectionCount = 0;
    rateLimiter = new AuthRateLimiter();
    constructor(options) {
        this.options = options;
    }
    emit(event) {
        try {
            this.options.onEvent?.(event);
        }
        catch {
            // Don't let event handler crash the server
        }
    }
    /** Start listening for SSH connections. */
    async listen() {
        const ssh2 = await loadSSH2();
        const maxConns = this.options.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
        const authTimeout = this.options.authTimeout ?? AUTH_TIMEOUT_MS;
        const idleTimeout = this.options.idleTimeout ?? IDLE_TIMEOUT_MS;
        this.server = new ssh2.Server({
            hostKeys: [this.options.hostKey],
            ...(this.options.banner ? { banner: this.options.banner } : {}),
        }, (client) => {
            this.activeConnectionCount++;
            let remoteAddress = "unknown";
            try {
                const sock = client._sock; // SSH library private API
                if (sock?.remoteAddress)
                    remoteAddress = sock.remoteAddress;
            }
            catch { /* ignore */ }
            this.emit({ type: "connect", remoteAddress });
            // Connection limit
            if (this.activeConnectionCount > maxConns) {
                this.activeConnectionCount--;
                try {
                    client.end();
                }
                catch { /* ignore */ }
                return;
            }
            // Rate limit check
            if (this.rateLimiter.isLimited(remoteAddress)) {
                this.emit({ type: "rate-limited", remoteAddress });
                this.activeConnectionCount--;
                try {
                    client.end();
                }
                catch { /* ignore */ }
                return;
            }
            let username = "";
            let authenticated = false;
            // Auth timeout — kill connection if auth takes too long
            let authTimer = null;
            if (authTimeout > 0) {
                authTimer = setTimeout(() => {
                    if (!authenticated) {
                        try {
                            client.end();
                        }
                        catch { /* ignore */ }
                    }
                }, authTimeout);
            }
            // Attach error handler immediately to prevent unhandled errors
            client.on("error", () => {
                this.activeConnectionCount--;
                if (authTimer)
                    clearTimeout(authTimer);
                this.cleanupClientSessions(client);
            });
            client.on("authentication", (ctx) => {
                username = ctx.username;
                // Rate limit check per auth attempt
                if (this.rateLimiter.isLimited(remoteAddress)) {
                    this.emit({ type: "rate-limited", remoteAddress });
                    ctx.reject();
                    return;
                }
                const authCtx = { username: ctx.username, method: ctx.method };
                if (ctx.method === "password") {
                    authCtx.password = ctx.password;
                }
                else if (ctx.method === "publickey") {
                    authCtx.publicKey = ctx.key.data;
                }
                try {
                    const result = this.options.authenticate(authCtx);
                    if (result instanceof Promise) {
                        result.then((accepted) => {
                            if (accepted) {
                                authenticated = true;
                                this.emit({ type: "auth-success", username, remoteAddress });
                                ctx.accept();
                            }
                            else {
                                this.rateLimiter.recordFailure(remoteAddress);
                                this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                                ctx.reject();
                            }
                        }, () => {
                            this.rateLimiter.recordFailure(remoteAddress);
                            this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                            ctx.reject();
                        });
                    }
                    else {
                        if (result) {
                            authenticated = true;
                            this.emit({ type: "auth-success", username, remoteAddress });
                            ctx.accept();
                        }
                        else {
                            this.rateLimiter.recordFailure(remoteAddress);
                            this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                            ctx.reject();
                        }
                    }
                }
                catch {
                    this.rateLimiter.recordFailure(remoteAddress);
                    ctx.reject();
                }
            });
            client.on("ready", () => {
                if (authTimer) {
                    clearTimeout(authTimer);
                    authTimer = null;
                }
                client.on("session", (accept) => {
                    const sshSession = accept();
                    let ptyInfo = null;
                    let onResize = null;
                    sshSession.on("pty", (accept, _reject, info) => {
                        ptyInfo = {
                            cols: clampDim(info.cols),
                            rows: clampDim(info.rows),
                            term: info.term || "xterm-256color", // SSH library untyped field
                        };
                        accept();
                    });
                    sshSession.on("window-change", (accept, _reject, info) => {
                        if (accept)
                            accept();
                        if (onResize) {
                            onResize(clampDim(info.cols), clampDim(info.rows));
                        }
                    });
                    sshSession.on("shell", (accept) => {
                        if (!ptyInfo)
                            return; // No PTY — can't render TUI
                        const channel = accept();
                        const { cols, rows, term } = ptyInfo;
                        channel.on("error", () => { });
                        const ttyOut = adaptChannelAsWriteStream(channel, cols, rows);
                        const ttyIn = adaptChannelAsReadStream(channel);
                        const sessionInfo = {
                            username,
                            width: cols,
                            height: rows,
                            remoteAddress,
                            termType: term,
                            disconnect() {
                                try {
                                    channel.end();
                                }
                                catch { /* ignore */ }
                            },
                        };
                        let activeSession = null;
                        try {
                            const element = this.options.app(sessionInfo);
                            const app = render(element, {
                                stdout: ttyOut,
                                stdin: ttyIn,
                                alternateScreen: true,
                                mouse: true,
                                rawMode: false,
                            });
                            // Idle timeout
                            let idleTimer = null;
                            const resetIdle = () => {
                                if (idleTimer)
                                    clearTimeout(idleTimer);
                                if (idleTimeout > 0) {
                                    idleTimer = setTimeout(() => {
                                        try {
                                            channel.end();
                                        }
                                        catch { /* ignore */ }
                                    }, idleTimeout);
                                }
                            };
                            if (idleTimeout > 0) {
                                channel.on("data", resetIdle);
                                resetIdle();
                            }
                            activeSession = { app, sshSession: sessionInfo, client, idleTimer };
                            this.activeSessions.add(activeSession);
                            this.emit({ type: "session-start", username, remoteAddress });
                            onResize = (newCols, newRows) => {
                                const writable = ttyOut;
                                writable.columns = newCols;
                                writable.rows = newRows;
                                sessionInfo.width = newCols;
                                sessionInfo.height = newRows;
                                ttyOut.emit("resize");
                            };
                            const cleanup = () => {
                                onResize = null;
                                if (activeSession) {
                                    if (activeSession.idleTimer)
                                        clearTimeout(activeSession.idleTimer);
                                    try {
                                        activeSession.app.unmount();
                                    }
                                    catch { /* ignore */ }
                                    this.activeSessions.delete(activeSession);
                                    this.emit({ type: "session-end", username, remoteAddress });
                                    activeSession = null;
                                }
                            };
                            channel.on("close", cleanup);
                        }
                        catch (err) {
                            try {
                                const msg = err instanceof Error ? err.message : "Internal server error";
                                channel.write(`\r\nError: ${msg}\r\n`);
                                channel.end();
                                this.emit({ type: "error", message: msg, remoteAddress });
                            }
                            catch { /* ignore */ }
                        }
                    });
                });
            });
            client.on("close", () => {
                this.activeConnectionCount--;
                if (authTimer)
                    clearTimeout(authTimer);
                this.cleanupClientSessions(client);
            });
        });
        return new Promise((resolve, reject) => {
            const onError = (err) => { reject(err); };
            this.server.once("error", onError);
            this.server.listen(this.options.port ?? DEFAULT_PORT, this.options.host ?? DEFAULT_HOST, () => {
                this.server.removeListener("error", onError);
                resolve();
            });
        });
    }
    /** Stop server, disconnect all sessions. */
    async close() {
        for (const session of this.activeSessions) {
            if (session.idleTimer)
                clearTimeout(session.idleTimer);
            try {
                session.app.unmount();
            }
            catch { /* ignore */ }
            try {
                session.sshSession.disconnect();
            }
            catch { /* ignore */ }
        }
        this.activeSessions.clear();
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => { this.server = null; resolve(); });
            }
            else {
                resolve();
            }
        });
    }
    /** Number of active sessions. */
    get connections() {
        return this.activeSessions.size;
    }
    /** List active sessions (for monitoring). */
    getSessions() {
        return Array.from(this.activeSessions).map((s) => ({
            username: s.sshSession.username,
            remoteAddress: s.sshSession.remoteAddress,
            width: s.sshSession.width,
            height: s.sshSession.height,
        }));
    }
    /** Disconnect a specific session by username. */
    disconnectUser(username) {
        for (const s of this.activeSessions) {
            if (s.sshSession.username === username) {
                s.sshSession.disconnect();
            }
        }
    }
    /** Broadcast a disconnect to all sessions. */
    disconnectAll() {
        for (const s of this.activeSessions) {
            s.sshSession.disconnect();
        }
    }
    // ── Private ────────────────────────────────────────────────────────
    cleanupClientSessions(client) {
        for (const s of this.activeSessions) {
            if (s.client === client) {
                if (s.idleTimer)
                    clearTimeout(s.idleTimer);
                try {
                    s.app.unmount();
                }
                catch { /* ignore */ }
                this.activeSessions.delete(s);
                this.emit({ type: "session-end", username: s.sshSession.username, remoteAddress: s.sshSession.remoteAddress });
            }
        }
    }
}
//# sourceMappingURL=server.js.map