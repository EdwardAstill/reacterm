import type { Server } from "node:http";

export interface PlaygroundServer {
  server: Server;
  token: string;
  root: string;
  wss: { clients: Iterable<{ terminate(): void }> };
  maxRunMs: number;
  maxOutputBytes: number;
  maxPayloadBytes: number;
}

export interface CreatePlaygroundServerOptions {
  root?: string;
  token?: string;
  maxRunMs?: number;
  maxOutputBytes?: number;
  maxPayloadBytes?: number;
  maxFileBytes?: number;
  spawnProcess?: (...args: unknown[]) => unknown;
}

export function createPlaygroundServer(options?: CreatePlaygroundServerOptions): PlaygroundServer;
export function listenPlayground(
  app: PlaygroundServer,
  options?: { port?: number; host?: string; maxRetries?: number },
): Promise<{ host: string; port: number; baseUrl: string; close(): Promise<void> }>;
