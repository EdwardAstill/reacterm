import { createServer } from "node:http";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileApi, handleFileApiRequest } from "../../playground/file-api.mjs";
import { createPlaygroundServer } from "../../playground/server.mjs";

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
