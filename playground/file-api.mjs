import { readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { sep } from "node:path";

export const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

export function createFileApi(options) {
  if (!options?.allowedRoot) {
    throw new Error("createFileApi requires allowedRoot");
  }

  return {
    allowedRoot: realpathSync(options.allowedRoot),
    token: String(options.token ?? ""),
    maxFileBytes: options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
  };
}

export function handleFileApiRequest(req, res, api) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== "/api/file") return false;

  if (req.method === "GET") {
    handleRead(url, res, api);
    return true;
  }

  if (req.method === "PUT") {
    void collectJson(req)
      .then((body) => handleWrite(body, res, api))
      .catch(() => sendJson(res, 400, { ok: false, error: "bad_request" }));
    return true;
  }

  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  return true;
}

function handleRead(url, res, api) {
  if (!isAuthorized(url.searchParams.get("token"), api)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const target = url.searchParams.get("path");
  if (!target) {
    sendJson(res, 400, { ok: false, error: "missing_path" });
    return;
  }

  const file = resolveAllowedFile(target, api);
  if (!file.ok) {
    sendJson(res, file.status, { ok: false, error: file.error });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    path: file.path,
    content: readFileSync(file.path, "utf8"),
    mtimeMs: file.stat.mtimeMs,
  });
}

function handleWrite(body, res, api) {
  if (!body || typeof body !== "object") {
    sendJson(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  if (!isAuthorized(body.token, api)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  if (typeof body.path !== "string" || typeof body.content !== "string") {
    sendJson(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  const file = resolveAllowedFile(body.path, api);
  if (!file.ok) {
    sendJson(res, file.status, { ok: false, error: file.error });
    return;
  }

  if (
    typeof body.baseMtimeMs === "number" &&
    Number.isFinite(body.baseMtimeMs) &&
    body.baseMtimeMs !== file.stat.mtimeMs
  ) {
    sendJson(res, 409, {
      ok: false,
      error: "conflict",
      mtimeMs: file.stat.mtimeMs,
    });
    return;
  }

  writeFileSync(file.path, body.content, "utf8");
  const nextStat = statSync(file.path);
  sendJson(res, 200, {
    ok: true,
    path: file.path,
    mtimeMs: nextStat.mtimeMs,
  });
}

function resolveAllowedFile(target, api) {
  let realTarget;
  try {
    realTarget = realpathSync(target);
  } catch {
    return { ok: false, status: 404, error: "not_found" };
  }

  if (!isInsideRoot(realTarget, api.allowedRoot)) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const stat = statSync(realTarget);
  if (!stat.isFile()) {
    return { ok: false, status: 400, error: "not_file" };
  }
  if (stat.size > api.maxFileBytes) {
    return { ok: false, status: 413, error: "file_too_large" };
  }

  return { ok: true, path: realTarget, stat };
}

function isInsideRoot(realTarget, allowedRoot) {
  return realTarget === allowedRoot || realTarget.startsWith(allowedRoot + sep);
}

function isAuthorized(token, api) {
  return Boolean(api.token) && token === api.token;
}

function collectJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error("request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
