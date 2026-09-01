import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, extname } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { WebSocketServer } from "ws";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createFileApi, handleFileApiRequest } from "./file-api.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PORT = process.env.PORT || 3777;
const DEFAULT_MAX_RUN_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 1_048_576;
const DEFAULT_MAX_PAYLOAD_BYTES = 1_048_576;
const TERMINATION_GRACE_MS = 1_000;
const TSX_CLI = join(PROJECT_ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const VENDOR_FILES = new Map([
  ["/vendor/xterm/xterm.css", join(__dirname, "node_modules", "xterm", "css", "xterm.css")],
  ["/vendor/xterm/xterm.js", join(__dirname, "node_modules", "xterm", "lib", "xterm.js")],
  [
    "/vendor/xterm-addon-fit/xterm-addon-fit.js",
    join(__dirname, "node_modules", "xterm-addon-fit", "lib", "xterm-addon-fit.js"),
  ],
]);

// ── Static file server ──────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export function createPlaygroundServer(options = {}) {
  const root = options.root ?? process.env.REACTERM_PLAYGROUND_ROOT ?? PROJECT_ROOT;
  const token = options.token ?? process.env.REACTERM_PLAYGROUND_TOKEN ?? randomBytes(16).toString("hex");
  const maxRunMs = options.maxRunMs ?? DEFAULT_MAX_RUN_MS;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const maxPayloadBytes = options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES;
  const spawnProcess = options.spawnProcess ?? spawn;
  const fileApi = createFileApi({
    allowedRoot: root,
    token,
    maxFileBytes: options.maxFileBytes,
  });

  const server = createServer((req, res) => {
    res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    res.setHeader("Referrer-Policy", "no-referrer");
    if (handleFileApiRequest(req, res, fileApi)) return;

    const parsed = new URL(req.url ?? "/", "http://127.0.0.1");
    const staticPath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;

    // Prevent path traversal
    if (staticPath.includes("..")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const filePath = VENDOR_FILES.get(staticPath) ?? join(__dirname, "public", staticPath);
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(readFileSync(filePath));
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: maxPayloadBytes });
  server.on("upgrade", (request, socket, head) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (requestUrl.searchParams.get("token") !== token) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const origin = request.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== request.headers.host) {
          rejectUpgrade(socket, 403, "Forbidden");
          return;
        }
      } catch {
        rejectUpgrade(socket, 403, "Forbidden");
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
  wireTerminalSocket(wss, { maxRunMs, maxOutputBytes, spawnProcess });

  return { server, token, root, wss, maxRunMs, maxOutputBytes, maxPayloadBytes };
}

// ── WebSocket terminal I/O ──────────────────────────────────────────

function rejectUpgrade(socket, status, message) {
  const body = `${status} ${message}\n`;
  socket.write(
    `HTTP/1.1 ${status} ${message}\r\n` +
      "Connection: close\r\n" +
      "Content-Type: text/plain; charset=utf-8\r\n" +
      `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`,
  );
  socket.destroy();
}

function wireTerminalSocket(wss, { maxRunMs, maxOutputBytes, spawnProcess }) {
  wss.on("connection", (ws) => {
    let run = null;

    function send(obj) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(obj));
      }
    }

    function completeRun(target) {
      if (!target || target.closed) return false;
      target.closed = true;
      clearTimeout(target.timeout);
      clearTimeout(target.killTimer);
      if (run === target) run = null;
      rmSync(target.directory, { recursive: true, force: true });
      return true;
    }

    function terminateRun(target, reason) {
      if (!target || target.closed || target.terminating) return false;
      target.terminating = true;
      target.terminationReason = reason;
      clearTimeout(target.timeout);
      try {
        target.proc.kill("SIGTERM");
      } catch {
        // already dead
      }
      target.killTimer = setTimeout(() => {
        if (target.closed) return;
        try {
          target.proc.kill("SIGKILL");
        } catch {
          // already dead
        }
      }, TERMINATION_GRACE_MS);
      return true;
    }

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "run") {
        terminateRun(run, "replacement");

        let directory;
        let tmpFile;
        let proc;
        try {
          directory = mkdtempSync(join(PROJECT_ROOT, ".reacterm-playground-"));
          tmpFile = join(directory, "example.tsx");
          writeFileSync(tmpFile, String(msg.code ?? ""), "utf-8");

          const cols = String(msg.cols || 120);
          const rows = String(msg.rows || 40);
          const childEnv = {
            PATH: process.env.PATH ?? "",
            TERM: "xterm-256color",
            COLUMNS: cols,
            ROWS: rows,
            FORCE_COLOR: "3",
            NODE_ENV: "production",
            REACTERM_FORCE_TTY: "1",
          };
          proc = spawnProcess(process.execPath, [TSX_CLI, tmpFile], {
            cwd: PROJECT_ROOT,
            env: childEnv,
            stdio: ["pipe", "pipe", "pipe"],
          });
        } catch (error) {
          if (directory) rmSync(directory, { recursive: true, force: true });
          send({ type: "error", message: error instanceof Error ? error.message : String(error) });
          return;
        }

        const nextRun = {
          proc,
          directory,
          timeout: null,
          killTimer: null,
          outputBytes: 0,
          closed: false,
          terminating: false,
          terminationReason: null,
          reportedError: false,
        };
        run = nextRun;

        function relayOutput(data) {
          if (nextRun.closed || nextRun.terminating) return;
          const chunk = Buffer.from(data);
          nextRun.outputBytes += chunk.length;
          if (nextRun.outputBytes > maxOutputBytes) {
            if (terminateRun(nextRun, "output")) {
              nextRun.reportedError = true;
              send({ type: "error", message: "Run exceeded output limit" });
            }
            return;
          }
          send({ type: "output", data: chunk.toString("base64") });
        }

        proc.stdout.on("data", relayOutput);
        proc.stderr.on("data", relayOutput);
        proc.on("exit", (code, signal) => {
          nextRun.exitCode = code;
          nextRun.exitSignal = signal;
        });
        proc.on("error", (err) => {
          nextRun.error = err;
        });
        proc.on("close", (code) => {
          if (!completeRun(nextRun)) return;
          if (nextRun.error) {
            send({ type: "error", message: nextRun.error.message });
          } else if (!nextRun.reportedError && nextRun.terminationReason !== "replacement") {
            send({ type: "exit", code: nextRun.terminationReason === "stop" ? null : code });
          }
        });
        nextRun.timeout = setTimeout(() => {
          if (terminateRun(nextRun, "timeout")) {
            nextRun.reportedError = true;
            send({ type: "error", message: "Run exceeded time limit" });
          }
        }, maxRunMs);
      }

      if (msg.type === "input" && run?.proc && !run.proc.killed) {
        try {
          run.proc.stdin.write(Buffer.from(msg.data, "base64"));
        } catch {
          // stdin may be closed
        }
      }

      if (msg.type === "resize" && run?.proc && !run.proc.killed) {
        // Without a real PTY, we can't send SIGWINCH.
        // The process uses COLUMNS/ROWS from its initial environment.
      }

      if (msg.type === "stop") {
        terminateRun(run, "stop");
      }
    });

    ws.on("close", () => {
      terminateRun(run, "socket");
    });

    ws.on("error", () => {
      terminateRun(run, "socket");
    });
  });
}

// ── Start ───────────────────────────────────────────────────────────

export function listenPlayground(app, { port = Number(PORT), host = "127.0.0.1", maxRetries = 5 } = {}) {
  const { server, wss } = app;

  return new Promise((resolve, reject) => {
    function listen(nextPort, retriesLeft) {
      function onError(error) {
        server.removeListener("listening", onListening);
        if (error.code === "EADDRINUSE" && retriesLeft > 0) {
          listen(nextPort + 1, retriesLeft - 1);
        } else {
          reject(error);
        }
      }

      function onListening() {
        server.removeListener("error", onError);
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("Playground server did not report a TCP address"));
          return;
        }
        resolve({
          host: address.address,
          port: address.port,
          baseUrl: `http://${address.address}:${address.port}`,
          close: () => new Promise((resolveClose) => {
            for (const client of wss.clients) client.terminate();
            server.close(() => resolveClose());
          }),
        });
      }

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(nextPort, host);
    }

    listen(port, maxRetries);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createPlaygroundServer();
  listenPlayground(app, {
    port: Number(PORT),
    host: process.env.REACTERM_PLAYGROUND_HOST ?? "127.0.0.1",
  })
    .then(({ baseUrl }) => {
      console.log(`\n  Reacterm Playground`);
      console.log(`  ${baseUrl}/?token=${encodeURIComponent(app.token)}\n`);
    })
    .catch((error) => {
      console.error(`  Failed to start: ${error.message}`);
      process.exitCode = 1;
    });
}
