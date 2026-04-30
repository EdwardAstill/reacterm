import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { WebSocketServer } from "ws";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createFileApi, handleFileApiRequest } from "./file-api.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PORT = process.env.PORT || 3777;

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
  const fileApi = createFileApi({
    allowedRoot: root,
    token,
    maxFileBytes: options.maxFileBytes,
  });

  const server = createServer((req, res) => {
    if (handleFileApiRequest(req, res, fileApi)) return;

    const parsed = new URL(req.url ?? "/", "http://127.0.0.1");
    const staticPath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;

    // Prevent path traversal
    if (staticPath.includes("..")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const filePath = join(__dirname, "public", staticPath);
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(readFileSync(filePath));
  });

  const wss = new WebSocketServer({ server });
  wireTerminalSocket(wss);

  return { server, token, root, wss };
}

// ── WebSocket terminal I/O ──────────────────────────────────────────

function wireTerminalSocket(wss) {
  wss.on("connection", (ws) => {
    let proc = null;

    function killProc() {
      if (proc) {
        try {
          proc.kill("SIGTERM");
        } catch {
          // already dead
        }
        proc = null;
      }
    }

    function send(obj) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(obj));
      }
    }

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "run") {
        // Kill any existing process
        killProc();

        // Write the example code to a temp file
        const tmpFile = join(__dirname, ".tmp-example.tsx");
        writeFileSync(tmpFile, msg.code, "utf-8");

        const cols = String(msg.cols || 120);
        const rows = String(msg.rows || 40);

        // Spawn directly with STORM_FORCE_TTY=1 so Storm renders
        // alt-screen, colors, and cursor positioning even without a real PTY.
        // xterm.js in the browser interprets the escape sequences.
        proc = spawn("npx", ["tsx", tmpFile], {
          cwd: PROJECT_ROOT,
          env: {
            ...process.env,
            TERM: "xterm-256color",
            COLUMNS: cols,
            ROWS: rows,
            FORCE_COLOR: "3",
            NODE_ENV: "production",
            STORM_FORCE_TTY: "1",
          },
          stdio: ["pipe", "pipe", "pipe"],
        });

        proc.stdout.on("data", (d) => {
          send({ type: "output", data: d.toString("base64") });
        });

        proc.stderr.on("data", (d) => {
          send({ type: "output", data: Buffer.from(d).toString("base64") });
        });

        proc.on("exit", (code) => {
          send({ type: "exit", code });
          proc = null;
        });

        proc.on("error", (err) => {
          send({ type: "error", message: err.message });
          proc = null;
        });
      }

      if (msg.type === "input" && proc && !proc.killed) {
        try {
          proc.stdin.write(Buffer.from(msg.data, "base64"));
        } catch {
          // stdin may be closed
        }
      }

      if (msg.type === "resize" && proc && !proc.killed) {
        // Without a real PTY, we can't send SIGWINCH.
        // The process uses COLUMNS/ROWS from its initial environment.
      }

      if (msg.type === "stop") {
        killProc();
        send({ type: "exit", code: null });
      }
    });

    ws.on("close", () => {
      killProc();
    });

    ws.on("error", () => {
      killProc();
    });
  });
}

// ── Start ───────────────────────────────────────────────────────────

function tryListen(app, port, maxRetries = 5) {
  const { server, token } = app;

  function onError(err) {
    server.removeListener("listening", onListening);
    if (err.code === "EADDRINUSE" && maxRetries > 0) {
      console.log(`  Port ${port} in use, trying ${port + 1}...`);
      tryListen(app, port + 1, maxRetries - 1);
    } else {
      console.error(`  Failed to start: ${err.message}`);
      process.exit(1);
    }
  }

  function onListening() {
    server.removeListener("error", onError);
    console.log(`\n  Storm Playground`);
    console.log(`  http://localhost:${port}`);
    console.log(`  token: ${token}\n`);
  }

  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(port);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  tryListen(createPlaygroundServer(), Number(PORT));
}
