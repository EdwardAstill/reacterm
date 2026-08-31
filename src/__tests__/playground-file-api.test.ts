import { createServer } from "node:http";
import { EventEmitter, once } from "node:events";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import WebSocket from "ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileApi, handleFileApiRequest } from "../../playground/file-api.mjs";
import { createPlaygroundServer, listenPlayground } from "../../playground/server.mjs";

class FakeChild extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  killed = false;

  kill() {
    this.killed = true;
    return true;
  }
}

async function waitFor(assertion: () => void) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw lastError;
}

async function rejectedWebSocketStatus(url: string, origin?: string) {
  return new Promise<number>((resolve, reject) => {
    const ws = new WebSocket(url, origin ? { origin } : undefined);
    ws.once("unexpected-response", (_request, response) => {
      response.resume();
      resolve(response.statusCode ?? 0);
    });
    ws.once("open", () => reject(new Error("WebSocket unexpectedly opened")));
    ws.once("error", () => {});
  });
}

function listen(api: ReturnType<typeof createFileApi>) {
  const server = createServer((req, res) => {
    if (!handleFileApiRequest(req, res, api)) {
      res.writeHead(404).end("not found");
    }
  });

  return new Promise<{ baseUrl: string; close: () => Promise<void> }>((resolveListen) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bad address");
      resolveListen({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}

function listenServer(server: ReturnType<typeof createServer>) {
  return new Promise<{ baseUrl: string; close: () => Promise<void> }>((resolveListen) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bad address");
      resolveListen({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}

async function getJson(url: string) {
  const response = await fetch(url);
  return {
    response,
    body: await response.json(),
  };
}

async function putJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    response,
    body: await response.json(),
  };
}

describe("playground file API", () => {
  let tmpParent = "";
  let tmpRoot = "";
  let outsideRoot = "";
  let closeServer: (() => Promise<void>) | undefined;

  beforeEach(() => {
    tmpParent = mkdtempSync(join(tmpdir(), "reacterm-file-api-"));
    tmpRoot = join(tmpParent, "root");
    outsideRoot = join(tmpParent, "outside");
    mkdirSync(tmpRoot);
    mkdirSync(outsideRoot);
  });

  afterEach(async () => {
    if (closeServer) {
      await closeServer();
      closeServer = undefined;
    }
    if (tmpParent) rmSync(tmpParent, { recursive: true, force: true });
  });

  async function start() {
    const api = createFileApi({ allowedRoot: tmpRoot, token: "test-token" });
    const server = await listen(api);
    closeServer = server.close;
    return server.baseUrl;
  }

  it("reads an allowed file when the token matches", async () => {
    const target = join(tmpRoot, "demo.tsx");
    writeFileSync(target, "export const demo = true;\n", "utf8");
    const baseUrl = await start();

    const { response, body } = await getJson(
      `${baseUrl}/api/file?path=${encodeURIComponent(target)}&token=test-token`,
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      path: target,
      content: "export const demo = true;\n",
    });
    expect(typeof body.mtimeMs).toBe("number");
  });

  it("saves an allowed file and returns a fresh mtime", async () => {
    const target = join(tmpRoot, "demo.tsx");
    writeFileSync(target, "old\n", "utf8");
    const baseUrl = await start();

    const { response, body } = await putJson(`${baseUrl}/api/file`, {
      path: target,
      token: "test-token",
      content: "new\n",
    });

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.mtimeMs).toBe("number");
    expect(readFileSync(target, "utf8")).toBe("new\n");
  });

  it("rejects stale saves without overwriting the file", async () => {
    const target = join(tmpRoot, "demo.tsx");
    writeFileSync(target, "current\n", "utf8");
    const baseUrl = await start();

    const { response, body } = await putJson(`${baseUrl}/api/file`, {
      path: target,
      token: "test-token",
      baseMtimeMs: 0,
      content: "stale\n",
    });

    expect(response.status).toBe(409);
    expect(body).toMatchObject({ ok: false, error: "conflict" });
    expect(readFileSync(target, "utf8")).toBe("current\n");
  });

  it("requires the configured token", async () => {
    const target = join(tmpRoot, "demo.tsx");
    writeFileSync(target, "secret\n", "utf8");
    const baseUrl = await start();

    const { response, body } = await getJson(
      `${baseUrl}/api/file?path=${encodeURIComponent(target)}&token=wrong-token`,
    );

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: "unauthorized" });
  });

  it("rejects a real file outside the allowed root", async () => {
    const target = join(outsideRoot, "secret.tsx");
    writeFileSync(target, "secret\n", "utf8");
    const baseUrl = await start();

    const { response, body } = await getJson(
      `${baseUrl}/api/file?path=${encodeURIComponent(target)}&token=test-token`,
    );

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: "forbidden" });
  });

  it("rejects encoded traversal that resolves outside the allowed root", async () => {
    const target = join(outsideRoot, "secret.tsx");
    writeFileSync(target, "secret\n", "utf8");
    const traversal = join(tmpRoot, "..", "outside", "secret.tsx");
    const baseUrl = await start();

    const { response, body } = await getJson(
      `${baseUrl}/api/file?path=${encodeURIComponent(traversal)}&token=test-token`,
    );

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: "forbidden" });
  });

  it("wires the file API through the playground server factory", async () => {
    const target = join(tmpRoot, "demo.tsx");
    writeFileSync(target, "export const demo = true;\n", "utf8");
    const app = createPlaygroundServer({ root: tmpRoot, token: "test-token" });
    const server = await listenServer(app.server);
    closeServer = server.close;

    const { response, body } = await getJson(
      `${server.baseUrl}/api/file?path=${encodeURIComponent(target)}&token=test-token`,
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      path: target,
      content: "export const demo = true;\n",
    });
  });

  it("keeps serving the static playground page from the server factory", async () => {
    const app = createPlaygroundServer({ root: tmpRoot, token: "test-token" });
    const server = await listenServer(app.server);
    closeServer = server.close;

    const response = await fetch(`${server.baseUrl}/`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Storm Playground");
  });
});

describe("playground file handoff page", () => {
  it("exposes file load and save controls in the browser page", () => {
    const html = readFileSync(join(process.cwd(), "playground", "public", "index.html"), "utf8");

    expect(html).toContain('id="btn-save"');
    expect(html).toContain('id="file-status-text"');
    expect(html).toContain("loadFileFromQuery");
    expect(html).toContain("saveLoadedFile");
    expect(html).toContain("/api/file");
    expect(html).toContain("<kbd>S</kbd> Save");
  });
});

describe("playground runner boundary", () => {
  let tmpRoot = "";
  let closeServer: (() => Promise<void>) | undefined;
  let secret: string | undefined;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), "reacterm-playground-runner-"));
    secret = process.env.REACTERM_TEST_SECRET;
    process.env.REACTERM_TEST_SECRET = "inherited-secret";
  });

  afterEach(async () => {
    if (closeServer) {
      await closeServer();
      closeServer = undefined;
    }
    if (secret === undefined) delete process.env.REACTERM_TEST_SECRET;
    else process.env.REACTERM_TEST_SECRET = secret;
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  });

  async function start(options: Record<string, unknown> = {}) {
    const app = createPlaygroundServer({ root: tmpRoot, token: "test-token", ...options });
    const listener = await listenPlayground(app, { port: 0 });
    closeServer = listener.close;
    return { app, ...listener };
  }

  async function openRunner(baseUrl: string) {
    const ws = new WebSocket(`${baseUrl.replace("http", "ws")}/?token=test-token`, {
      origin: baseUrl,
    });
    await once(ws, "open");
    return ws;
  }

  it("rejects missing and wrong WebSocket tokens during upgrade", async () => {
    const { baseUrl } = await start();
    const wsBaseUrl = baseUrl.replace("http", "ws");

    await expect(rejectedWebSocketStatus(`${wsBaseUrl}/`, baseUrl)).resolves.toBe(401);
    await expect(rejectedWebSocketStatus(`${wsBaseUrl}/?token=wrong-token`, baseUrl)).resolves.toBe(401);
  });

  it("rejects a cross-origin WebSocket upgrade", async () => {
    const { baseUrl } = await start();

    await expect(
      rejectedWebSocketStatus(`${baseUrl.replace("http", "ws")}/?token=test-token`, "http://example.test"),
    ).resolves.toBe(403);
  });

  it("opens an authenticated same-origin WebSocket", async () => {
    const { baseUrl } = await start();
    const ws = await openRunner(baseUrl);

    ws.close();
    await once(ws, "close");
  });

  it("reports the loopback default from the exported listener", async () => {
    const { host } = await start();

    expect(host).toBe("127.0.0.1");
  });

  it("terminates the previous child when a socket starts another run", async () => {
    const children: FakeChild[] = [];
    const { baseUrl } = await start({
      spawnProcess: () => {
        const child = new FakeChild();
        children.push(child);
        return child;
      },
    });
    const ws = await openRunner(baseUrl);

    ws.send(JSON.stringify({ type: "run", code: "console.log('first')", cols: 80, rows: 24 }));
    await waitFor(() => expect(children).toHaveLength(1));
    ws.send(JSON.stringify({ type: "run", code: "console.log('second')", cols: 80, rows: 24 }));
    await waitFor(() => expect(children).toHaveLength(2));

    expect(children[0]!.killed).toBe(true);
    ws.close();
    await once(ws, "close");
  });

  it("terminates a socket-owned child when the socket closes", async () => {
    const children: FakeChild[] = [];
    const { baseUrl } = await start({
      spawnProcess: () => {
        const child = new FakeChild();
        children.push(child);
        return child;
      },
    });
    const ws = await openRunner(baseUrl);
    ws.send(JSON.stringify({ type: "run", code: "console.log('ok')", cols: 80, rows: 24 }));
    await waitFor(() => expect(children).toHaveLength(1));

    ws.close();
    await once(ws, "close");

    expect(children[0]!.killed).toBe(true);
  });

  it("arms the default 30,000 ms run timeout", async () => {
    const children: FakeChild[] = [];
    const timeoutSpy = vi.spyOn(global, "setTimeout");
    const { baseUrl } = await start({
      spawnProcess: () => {
        const child = new FakeChild();
        children.push(child);
        return child;
      },
    });
    const ws = await openRunner(baseUrl);
    ws.send(JSON.stringify({ type: "run", code: "console.log('ok')", cols: 80, rows: 24 }));
    await waitFor(() => expect(children).toHaveLength(1));

    expect(timeoutSpy.mock.calls.some(([, delay]) => delay === 30_000)).toBe(true);
    timeoutSpy.mockRestore();
    ws.close();
    await once(ws, "close");
  });

  it("ends a run whose combined output exceeds 1,048,576 bytes", async () => {
    const children: FakeChild[] = [];
    const { baseUrl } = await start({
      spawnProcess: () => {
        const child = new FakeChild();
        children.push(child);
        return child;
      },
    });
    const ws = await openRunner(baseUrl);
    ws.send(JSON.stringify({ type: "run", code: "console.log('ok')", cols: 80, rows: 24 }));
    await waitFor(() => expect(children).toHaveLength(1));

    const error = once(ws, "message");
    children[0]!.stdout.write(Buffer.alloc(1_048_577));
    const [raw] = await error;

    expect(JSON.parse(raw.toString())).toMatchObject({ type: "error" });
    expect(children[0]!.killed).toBe(true);
    ws.close();
    await once(ws, "close");
  });

  it("spawns with the allowlisted environment only", async () => {
    const spawnCalls: Array<{ command: string; args: string[]; env: NodeJS.ProcessEnv }> = [];
    const { baseUrl } = await start({
      spawnProcess: (command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
        spawnCalls.push({ command, args, env: options.env });
        return new FakeChild();
      },
    });
    const ws = await openRunner(baseUrl);
    ws.send(JSON.stringify({ type: "run", code: "console.log('ok')", cols: 80, rows: 24 }));
    await waitFor(() => expect(spawnCalls).toHaveLength(1));

    expect(spawnCalls[0]!.command).toBe(process.execPath);
    expect(spawnCalls[0]!.env).toEqual({
      PATH: process.env.PATH ?? "",
      TERM: "xterm-256color",
      COLUMNS: "80",
      ROWS: "24",
      FORCE_COLOR: "3",
      NODE_ENV: "production",
      REACTERM_FORCE_TTY: "1",
    });
    expect(spawnCalls[0]!.env.REACTERM_TEST_SECRET).toBeUndefined();
    ws.close();
    await once(ws, "close");
  });

  it("uses a unique temporary file for each run and removes it after exit", async () => {
    const children: FakeChild[] = [];
    const spawnCalls: Array<{ args: string[] }> = [];
    const { baseUrl } = await start({
      spawnProcess: (_command: string, args: string[]) => {
        spawnCalls.push({ args });
        const child = new FakeChild();
        children.push(child);
        return child;
      },
    });
    const ws = await openRunner(baseUrl);
    ws.send(JSON.stringify({ type: "run", code: "console.log('first')", cols: 80, rows: 24 }));
    await waitFor(() => expect(spawnCalls).toHaveLength(1));
    const firstFile = spawnCalls[0]!.args.at(-1)!;
    expect(existsSync(firstFile)).toBe(true);

    children[0]!.emit("exit", 0);
    await waitFor(() => expect(existsSync(firstFile)).toBe(false));
    ws.send(JSON.stringify({ type: "run", code: "console.log('second')", cols: 80, rows: 24 }));
    await waitFor(() => expect(spawnCalls).toHaveLength(2));
    const secondFile = spawnCalls[1]!.args.at(-1)!;

    expect(secondFile).not.toBe(firstFile);
    expect(existsSync(secondFile)).toBe(true);
    children[1]!.emit("exit", 0);
    await waitFor(() => expect(existsSync(secondFile)).toBe(false));
    ws.close();
    await once(ws, "close");
  });
});
