/**
 * ReactermSSHServer — serve Reacterm TUI apps over SSH.
 *
 * Users `ssh your-server.com` and get an interactive terminal UI.
 * Each SSH connection gets its own isolated React tree + Screen + InputManager.
 *
 * The ssh2 package is lazy-loaded so it's an optional peer dependency.
 * Install it: npm install ssh2
 */

import React from "react";
import type { Duplex } from "node:stream";
import { render, type TuiApp } from "../reconciler/render.js";

type SSH2Module = typeof import("ssh2");
let ssh2Module: SSH2Module | null = null;

async function loadSSH2(): Promise<SSH2Module> {
  if (!ssh2Module) {
    try {
      const m = await import("ssh2");
      // ESM dynamic import of CJS wraps exports in .default
      ssh2Module = (m.default ?? m) as SSH2Module;
    } catch {
      throw new Error(
        '[reacterm] SSH serving requires the "ssh2" package. Install it: npm install ssh2',
      );
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

export interface ReactermSSHOptions {
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

export type SSHEvent =
  | { type: "connect"; remoteAddress: string }
  | { type: "auth-success"; username: string; remoteAddress: string }
  | { type: "auth-failure"; username: string; remoteAddress: string; method: string }
  | { type: "session-start"; username: string; remoteAddress: string }
  | { type: "session-end"; username: string; remoteAddress: string }
  | { type: "error"; message: string; remoteAddress: string }
  | { type: "rate-limited"; remoteAddress: string };

function clampDim(value: number): number {
  if (!Number.isFinite(value) || value < MIN_TERMINAL_DIM) return MIN_TERMINAL_DIM;
  if (value > MAX_TERMINAL_DIM) return MAX_TERMINAL_DIM;
  return Math.floor(value);
}

/** TTY properties that SSH channels need to emulate for Reacterm's Screen. */
interface TTYWriteProps {
  isTTY: true;
  columns: number;
  rows: number;
  getColorDepth: () => number;
}

/** TTY properties that SSH channels need to emulate for Reacterm's InputManager. */
interface TTYReadProps {
  isTTY: true;
  isRaw: true;
  setRawMode: (mode: boolean) => NodeJS.ReadStream;
}

function adaptChannelAsWriteStream(
  channel: Duplex,
  cols: number,
  rows: number,
): NodeJS.WriteStream {
  const ttyProps: TTYWriteProps = {
    isTTY: true,
    columns: clampDim(cols),
    rows: clampDim(rows),
    getColorDepth: () => 24,
  };
  return Object.assign(channel, ttyProps) as unknown as NodeJS.WriteStream;
}

function adaptChannelAsReadStream(channel: Duplex): NodeJS.ReadStream {
  const ttyProps: TTYReadProps = {
    isTTY: true,
    isRaw: true,
    setRawMode(_mode: boolean) { return channel as unknown as NodeJS.ReadStream; },
  };
  return Object.assign(channel, ttyProps) as unknown as NodeJS.ReadStream;
}

class AuthRateLimiter {
  private failures = new Map<string, number[]>();

  /** Record a failed auth attempt. Returns true if rate-limited (too many failures). */
  recordFailure(ip: string): boolean {
    const now = Date.now();
    let attempts = this.failures.get(ip);
    if (!attempts) {
      attempts = [];
      this.failures.set(ip, attempts);
    }
    // Purge old entries
    while (attempts.length > 0 && now - attempts[0]! > AUTH_FAILURE_WINDOW_MS) {
      attempts.shift();
    }
    attempts.push(now);
    return attempts.length >= MAX_AUTH_FAILURES_PER_IP;
  }

  /** Check if an IP is currently rate-limited. */
  isLimited(ip: string): boolean {
    const now = Date.now();
    const attempts = this.failures.get(ip);
    if (!attempts) return false;
    // Purge old entries
    while (attempts.length > 0 && now - attempts[0]! > AUTH_FAILURE_WINDOW_MS) {
      attempts.shift();
    }
    return attempts.length >= MAX_AUTH_FAILURES_PER_IP;
  }
}

interface ActiveSession {
  app: TuiApp;
  sshSession: SSHSession;
  finalize: () => void;
}

export class ReactermSSHServer {
  private readonly options: ReactermSSHOptions;
  private server: InstanceType<SSH2Module["Server"]> | null = null;
  private activeSessions = new Set<ActiveSession>();
  private activeClientFinalizers = new Set<() => void>();
  private activeConnectionCount = 0;
  private rateLimiter = new AuthRateLimiter();

  constructor(options: ReactermSSHOptions) {
    this.options = options;
  }

  private emit(event: SSHEvent): void {
    try {
      this.options.onEvent?.(event);
    } catch {
      // Don't let event handler crash the server
    }
  }

  /** Start listening for SSH connections. */
  async listen(): Promise<void> {
    const ssh2 = await loadSSH2();
    const maxConns = this.options.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
    const authTimeout = this.options.authTimeout ?? AUTH_TIMEOUT_MS;
    const idleTimeout = this.options.idleTimeout ?? IDLE_TIMEOUT_MS;

    this.server = new ssh2.Server(
      {
        hostKeys: [this.options.hostKey],
        ...(this.options.banner ? { banner: this.options.banner } : {}),
      },
      (client) => {
        this.activeConnectionCount++;
        let authTimer: ReturnType<typeof setTimeout> | null = null;
        const clientSessionFinalizers = new Set<() => void>();
        let clientFinalized = false;
        const finalizeClient = () => {
          if (clientFinalized) return;
          clientFinalized = true;
          if (authTimer) {
            clearTimeout(authTimer);
            authTimer = null;
          }
          for (const finalizeSession of clientSessionFinalizers) {
            finalizeSession();
          }
          this.activeConnectionCount--;
          this.activeClientFinalizers.delete(finalizeClient);
        };
        this.activeClientFinalizers.add(finalizeClient);

        // Attach handlers immediately so every connection exit shares one finalizer.
        client.on("error", finalizeClient);
        client.on("close", finalizeClient);

        let remoteAddress = "unknown";
        try {
          const sock = (client as unknown as { _sock?: { remoteAddress?: string } })._sock; // SSH library private API
          if (sock?.remoteAddress) remoteAddress = sock.remoteAddress;
        } catch { /* ignore */ }

        this.emit({ type: "connect", remoteAddress });

        // Connection limit
        if (this.activeConnectionCount > maxConns) {
          finalizeClient();
          try { client.end(); } catch { /* ignore */ }
          return;
        }

        // Rate limit check
        if (this.rateLimiter.isLimited(remoteAddress)) {
          this.emit({ type: "rate-limited", remoteAddress });
          finalizeClient();
          try { client.end(); } catch { /* ignore */ }
          return;
        }

        let username = "";
        let authenticated = false;

        // Auth timeout — kill connection if auth takes too long
        if (authTimeout > 0) {
          authTimer = setTimeout(() => {
            if (!authenticated) {
              finalizeClient();
              try { client.end(); } catch { /* ignore */ }
            }
          }, authTimeout);
        }

        client.on("authentication", (ctx) => {
          username = ctx.username;

          // Rate limit check per auth attempt
          if (this.rateLimiter.isLimited(remoteAddress)) {
            this.emit({ type: "rate-limited", remoteAddress });
            ctx.reject();
            return;
          }

          const authCtx: {
            username: string;
            method: string;
            password?: string;
            publicKey?: Buffer;
          } = { username: ctx.username, method: ctx.method };

          if (ctx.method === "password") {
            authCtx.password = ctx.password;
          } else if (ctx.method === "publickey") {
            authCtx.publicKey = ctx.key.data;
          }

          try {
            const result = this.options.authenticate(authCtx);
            if (result instanceof Promise) {
              result.then(
                (accepted) => {
                  if (accepted) {
                    authenticated = true;
                    this.emit({ type: "auth-success", username, remoteAddress });
                    ctx.accept();
                  } else {
                    this.rateLimiter.recordFailure(remoteAddress);
                    this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                    ctx.reject();
                  }
                },
                () => {
                  this.rateLimiter.recordFailure(remoteAddress);
                  this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                  ctx.reject();
                },
              );
            } else {
              if (result) {
                authenticated = true;
                this.emit({ type: "auth-success", username, remoteAddress });
                ctx.accept();
              } else {
                this.rateLimiter.recordFailure(remoteAddress);
                this.emit({ type: "auth-failure", username, remoteAddress, method: ctx.method });
                ctx.reject();
              }
            }
          } catch {
            this.rateLimiter.recordFailure(remoteAddress);
            ctx.reject();
          }
        });

        client.on("ready", () => {
          if (authTimer) { clearTimeout(authTimer); authTimer = null; }

          client.on("session", (accept) => {
            const sshSession = accept();
            let ptyInfo: { cols: number; rows: number; term: string } | null = null;
            let onResize: ((cols: number, rows: number) => void) | null = null;

            sshSession.on("pty", (accept, _reject, info) => {
              ptyInfo = {
                cols: clampDim(info.cols),
                rows: clampDim(info.rows),
                term: (info as unknown as { term?: string }).term || "xterm-256color", // SSH library untyped field
              };
              accept();
            });

            sshSession.on("window-change", (accept, _reject, info) => {
              if (accept) accept();
              if (onResize) {
                onResize(clampDim(info.cols), clampDim(info.rows));
              }
            });

            sshSession.on("shell", (accept) => {
              if (!ptyInfo) return; // No PTY — can't render TUI

              const channel = accept();
              const { cols, rows, term } = ptyInfo;

              const ttyOut = adaptChannelAsWriteStream(channel, cols, rows);
              const ttyIn = adaptChannelAsReadStream(channel);

              const sessionInfo: SSHSession = {
                username,
                width: cols,
                height: rows,
                remoteAddress,
                termType: term,
                disconnect() {
                  try { channel.end(); } catch { /* ignore */ }
                },
              };

              try {
                const element = this.options.app(sessionInfo);
                const app = render(element, {
                  stdout: ttyOut,
                  stdin: ttyIn,
                  alternateScreen: true,
                  mouse: true,
                  rawMode: false,
                });

                let sessionFinalized = false;
                let idleTimer: ReturnType<typeof setTimeout> | null = null;
                const resetIdle = () => {
                  if (sessionFinalized) return;
                  if (idleTimer) clearTimeout(idleTimer);
                  if (idleTimeout > 0) {
                    idleTimer = setTimeout(() => {
                      try { channel.end(); } catch { /* ignore */ }
                    }, idleTimeout);
                  }
                };
                if (idleTimeout > 0) {
                  channel.on("data", resetIdle);
                  resetIdle();
                }

                const activeSession: ActiveSession = {
                  app,
                  sshSession: sessionInfo,
                  finalize: () => {
                    if (sessionFinalized) return;
                    sessionFinalized = true;
                    onResize = null;
                    if (idleTimer) {
                      clearTimeout(idleTimer);
                      idleTimer = null;
                    }
                    try { activeSession.app.unmount(); } catch { /* ignore */ }
                    this.activeSessions.delete(activeSession);
                    clientSessionFinalizers.delete(activeSession.finalize);
                    this.emit({ type: "session-end", username, remoteAddress });
                  },
                };
                this.activeSessions.add(activeSession);
                clientSessionFinalizers.add(activeSession.finalize);

                this.emit({ type: "session-start", username, remoteAddress });

                onResize = (newCols: number, newRows: number) => {
                  const writable = ttyOut as NodeJS.WriteStream & TTYWriteProps;
                  writable.columns = newCols;
                  writable.rows = newRows;
                  sessionInfo.width = newCols;
                  sessionInfo.height = newRows;
                  ttyOut.emit("resize");
                };

                channel.on("close", activeSession.finalize);
                channel.on("error", activeSession.finalize);
              } catch (err) {
                try {
                  const msg = err instanceof Error ? err.message : "Internal server error";
                  channel.write(`\r\nError: ${msg}\r\n`);
                  channel.end();
                  this.emit({ type: "error", message: msg, remoteAddress });
                } catch { /* ignore */ }
              }
            });
          });
        });

      },
    );

    return new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => { reject(err); };
      this.server!.once("error", onError);

      this.server!.listen(
        this.options.port ?? DEFAULT_PORT,
        this.options.host ?? DEFAULT_HOST,
        () => {
          this.server!.removeListener("error", onError);
          resolve();
        },
      );
    });
  }

  /** Stop server, disconnect all sessions. */
  async close(): Promise<void> {
    for (const session of this.activeSessions) {
      try { session.sshSession.disconnect(); } catch { /* ignore */ }
    }
    for (const finalizeClient of this.activeClientFinalizers) {
      finalizeClient();
    }

    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => { this.server = null; resolve(); });
      } else {
        resolve();
      }
    });
  }

  /** Number of active sessions. */
  get connections(): number {
    return this.activeSessions.size;
  }

  /** List active sessions (for monitoring). */
  getSessions(): ReadonlyArray<{ username: string; remoteAddress: string; width: number; height: number }> {
    return Array.from(this.activeSessions).map((s) => ({
      username: s.sshSession.username,
      remoteAddress: s.sshSession.remoteAddress,
      width: s.sshSession.width,
      height: s.sshSession.height,
    }));
  }

  /** Disconnect a specific session by username. */
  disconnectUser(username: string): void {
    for (const s of this.activeSessions) {
      if (s.sshSession.username === username) {
        s.sshSession.disconnect();
      }
    }
  }

  /** Broadcast a disconnect to all sessions. */
  disconnectAll(): void {
    for (const s of this.activeSessions) {
      s.sshSession.disconnect();
    }
  }
}
