import React from "react";
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SSHEvent } from "../ssh/server.js";

const ssh2State = vi.hoisted(() => ({
  onConnection: undefined as ((client: unknown) => void) | undefined,
}));

const renderState = vi.hoisted(() => ({
  unmount: vi.fn(),
}));

vi.mock("ssh2", async () => {
  const { EventEmitter } = await import("node:events");

  class Server extends EventEmitter {
    constructor(_options: unknown, onConnection: (client: unknown) => void) {
      super();
      ssh2State.onConnection = onConnection;
    }

    listen(_port: number, _host: string, callback: () => void): void {
      callback();
    }

    close(callback: () => void): void {
      callback();
    }
  }

  return { Server, default: { Server } };
});

vi.mock("../reconciler/render.js", () => ({
  render: vi.fn(() => ({ unmount: renderState.unmount })),
}));

import { StormSSHServer } from "../ssh/server.js";

interface FakeClient extends EventEmitter {
  _sock: { remoteAddress: string };
  end: ReturnType<typeof vi.fn>;
}

interface FakeChannel extends EventEmitter {
  write: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

function makeClient(remoteAddress: string): FakeClient {
  return Object.assign(new EventEmitter(), {
    _sock: { remoteAddress },
    end: vi.fn(),
  });
}

function makeChannel(): FakeChannel {
  return Object.assign(new EventEmitter(), {
    write: vi.fn(() => true),
    end: vi.fn(),
  });
}

function connect(client: FakeClient): void {
  expect(ssh2State.onConnection).toBeTypeOf("function");
  ssh2State.onConnection!(client);
}

function openSession(client: FakeClient): FakeChannel {
  client.emit("authentication", {
    username: "alice",
    method: "password",
    password: "secret",
    accept: vi.fn(),
    reject: vi.fn(),
  });
  client.emit("ready");

  const session = new EventEmitter();
  client.emit("session", () => session);
  session.emit("pty", vi.fn(), vi.fn(), {
    cols: 80,
    rows: 24,
    term: "xterm-256color",
  });

  const channel = makeChannel();
  session.emit("shell", () => channel);
  return channel;
}

function activeClientCount(server: StormSSHServer): number {
  return (server as unknown as { activeConnectionCount: number })
    .activeConnectionCount;
}

function makeServer(overrides: {
  maxConnections?: number;
  authTimeout?: number;
  idleTimeout?: number;
} = {}) {
  const events: SSHEvent[] = [];
  const server = new StormSSHServer({
    hostKey: "test-host-key",
    authenticate: () => true,
    app: () => React.createElement("div"),
    authTimeout: 0,
    onEvent: (event) => events.push(event),
    ...overrides,
  });
  return { server, events };
}

function sessionEnds(events: SSHEvent[]): SSHEvent[] {
  return events.filter((event) => event.type === "session-end");
}

describe("StormSSHServer teardown", () => {
  beforeEach(() => {
    ssh2State.onConnection = undefined;
    renderState.unmount.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("finalizes a client and session once when error is followed by close", async () => {
    const { server, events } = makeServer();
    await server.listen();
    const client = makeClient("192.0.2.1");
    connect(client);
    openSession(client);

    client.emit("error", new Error("connection lost"));
    client.emit("close");

    expect(activeClientCount(server)).toBe(0);
    expect(renderState.unmount).toHaveBeenCalledTimes(1);
    expect(sessionEnds(events)).toHaveLength(1);
    await server.close();
  });

  it("finalizes a session once when client close is followed by channel close", async () => {
    const { server, events } = makeServer();
    await server.listen();
    const client = makeClient("192.0.2.2");
    connect(client);
    const channel = openSession(client);

    client.emit("close");
    channel.emit("close");

    expect(activeClientCount(server)).toBe(0);
    expect(renderState.unmount).toHaveBeenCalledTimes(1);
    expect(sessionEnds(events)).toHaveLength(1);
    await server.close();
  });

  it("cancels a reset idle timer when the session is cleaned up", async () => {
    vi.useFakeTimers();
    const { server } = makeServer({ idleTimeout: 10 });
    await server.listen();
    const client = makeClient("192.0.2.7");
    connect(client);
    const channel = openSession(client);

    channel.emit("data", Buffer.from("activity"));
    client.emit("close");
    await vi.advanceTimersByTimeAsync(10);

    expect(channel.end).not.toHaveBeenCalled();
    await server.close();
  });

  it("finalizes a session when its channel errors without closing", async () => {
    const { server, events } = makeServer();
    await server.listen();
    const client = makeClient("192.0.2.8");
    connect(client);
    const channel = openSession(client);

    channel.emit("error", new Error("channel lost"));

    expect(server.connections).toBe(0);
    expect(renderState.unmount).toHaveBeenCalledTimes(1);
    expect(sessionEnds(events)).toHaveLength(1);
    await server.close();
  });

  it("does not underflow after a rejected max-connection client closes", async () => {
    const { server } = makeServer({ maxConnections: 1 });
    await server.listen();
    const acceptedClient = makeClient("192.0.2.3");
    const rejectedClient = makeClient("192.0.2.4");

    connect(acceptedClient);
    connect(rejectedClient);
    expect(rejectedClient.end).toHaveBeenCalledTimes(1);

    rejectedClient.emit("close");
    expect(activeClientCount(server)).toBe(1);

    acceptedClient.emit("close");
    expect(activeClientCount(server)).toBe(0);
    await server.close();
  });

  it("finalizes an unauthenticated client when authentication times out", async () => {
    vi.useFakeTimers();
    const { server } = makeServer({ authTimeout: 10 });
    await server.listen();
    const client = makeClient("192.0.2.5");
    connect(client);

    await vi.advanceTimersByTimeAsync(10);
    expect(client.end).toHaveBeenCalledTimes(1);
    expect(activeClientCount(server)).toBe(0);

    client.emit("close");
    expect(activeClientCount(server)).toBe(0);
    await server.close();
  });

  it("finalizes clients and sessions once when the server stops", async () => {
    const { server, events } = makeServer();
    await server.listen();
    const client = makeClient("192.0.2.6");
    connect(client);
    const channel = openSession(client);

    await server.close();
    channel.emit("close");
    client.emit("close");

    expect(activeClientCount(server)).toBe(0);
    expect(renderState.unmount).toHaveBeenCalledTimes(1);
    expect(sessionEnds(events)).toHaveLength(1);
  });
});
