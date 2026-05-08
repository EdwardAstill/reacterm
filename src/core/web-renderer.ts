import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import type { Socket } from "node:net";
import { ScreenBuffer, WIDE_CHAR_PLACEHOLDER } from "./buffer.js";
import { DEFAULT_COLOR, Attr, isRgbColor, rgbR, rgbG, rgbB } from "./types.js";
import { buildWebRendererPage } from "./web-renderer-page.js";

const ANSI_256_PALETTE: string[] = buildAnsi256Palette();

function buildAnsi256Palette(): string[] {
  const palette: string[] = new Array(256);

  // Standard 16 colors (0-15)
  const base16 = [
    "#000000", "#aa0000", "#00aa00", "#aa5500",
    "#0000aa", "#aa00aa", "#00aaaa", "#aaaaaa",
    "#555555", "#ff5555", "#55ff55", "#ffff55",
    "#5555ff", "#ff55ff", "#55ffff", "#ffffff",
  ];
  for (let i = 0; i < 16; i++) palette[i] = base16[i]!;

  // 216-color cube (16-231): 6x6x6 RGB cube
  for (let i = 0; i < 216; i++) {
    const r = Math.floor(i / 36);
    const g = Math.floor((i % 36) / 6);
    const b = i % 6;
    const toHex = (v: number) => (v === 0 ? 0 : 55 + v * 40);
    const rr = toHex(r).toString(16).padStart(2, "0");
    const gg = toHex(g).toString(16).padStart(2, "0");
    const bb = toHex(b).toString(16).padStart(2, "0");
    palette[16 + i] = `#${rr}${gg}${bb}`;
  }

  // Grayscale ramp (232-255): 24 shades
  for (let i = 0; i < 24; i++) {
    const v = (8 + i * 10).toString(16).padStart(2, "0");
    palette[232 + i] = `#${v}${v}${v}`;
  }

  return palette;
}

function colorToCSS(c: number): string | null {
  if (c === DEFAULT_COLOR) return null;
  if (isRgbColor(c)) return `#${rgbR(c).toString(16).padStart(2, "0")}${rgbG(c).toString(16).padStart(2, "0")}${rgbB(c).toString(16).padStart(2, "0")}`;
  if (c >= 0 && c < 256) return ANSI_256_PALETTE[c]!;
  return null;
}

const WS_MAGIC = "258EAFA5-E914-47DA-95CA-5AB9064DC5BB";

/** Compute the Sec-WebSocket-Accept header value. */
function wsAcceptKey(clientKey: string): string {
  return createHash("sha1").update(clientKey + WS_MAGIC).digest("base64");
}

/** RFC 6455 opcodes. */
const enum WsOpcode {
  CONTINUATION = 0x0,
  TEXT = 0x1,
  BINARY = 0x2,
  CLOSE = 0x8,
  PING = 0x9,
  PONG = 0xa,
}

/**
 * Encode a WebSocket frame (server → client).
 * Server frames are never masked per RFC 6455.
 */
function encodeFrame(opcode: number, payload: Buffer): Buffer {
  const len = payload.length;
  let headerLen: number;
  if (len < 126) {
    headerLen = 2;
  } else if (len < 65536) {
    headerLen = 4;
  } else {
    headerLen = 10;
  }

  const frame = Buffer.alloc(headerLen + len);
  frame[0] = 0x80 | opcode; // FIN + opcode

  if (len < 126) {
    frame[1] = len;
  } else if (len < 65536) {
    frame[1] = 126;
    frame.writeUInt16BE(len, 2);
  } else {
    frame[1] = 127;
    frame.writeUInt32BE(0, 2);
    frame.writeUInt32BE(len, 6);
  }

  payload.copy(frame, headerLen);
  return frame;
}

/**
 * Decode an incoming WebSocket frame.
 * Returns null if the buffer is incomplete.
 */
interface DecodedFrame {
  opcode: number;
  payload: Buffer;
  totalLength: number; // bytes consumed from the input buffer
}

function decodeFrame(data: Buffer): DecodedFrame | null {
  if (data.length < 2) return null;

  const opcode = data[0]! & 0x0f;
  const masked = (data[1]! & 0x80) !== 0;
  let payloadLen = data[1]! & 0x7f;
  let offset = 2;

  if (payloadLen === 126) {
    if (data.length < 4) return null;
    payloadLen = data.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (data.length < 10) return null;
    payloadLen = data.readUInt32BE(6);
    offset = 10;
  }

  const maskLen = masked ? 4 : 0;
  const totalLength = offset + maskLen + payloadLen;
  if (data.length < totalLength) return null;

  const payload = Buffer.alloc(payloadLen);
  if (masked) {
    const maskKey = data.subarray(offset, offset + 4);
    const payloadStart = offset + 4;
    for (let i = 0; i < payloadLen; i++) {
      payload[i] = data[payloadStart + i]! ^ maskKey[i % 4]!;
    }
  } else {
    data.copy(payload, 0, offset, offset + payloadLen);
  }

  return { opcode, payload, totalLength };
}

interface WsClient {
  socket: Socket;
  /** Accumulation buffer for incomplete frames. */
  recvBuffer: Buffer;
  /** Previous frame snapshot for diffing. null = send full frame next. */
  prevSnapshot: CellSnapshot[] | null;
  /** Previous buffer dimensions. */
  prevWidth: number;
  prevHeight: number;
  alive: boolean;
}

/** Compact cell representation for diffing. */
interface CellSnapshot {
  char: string;
  fg: number;
  bg: number;
  attrs: number;
}

//
// Messages are JSON for simplicity and debuggability.
//
// Full frame:
//   { type: "full", width, height, cursorX, cursorY, cells: [[char, fg, bg, attrs], ...] }
//
// Diff frame:
//   { type: "diff", width, height, cursorX, cursorY, changes: [[index, char, fg, bg, attrs], ...] }
//
// Resize (dimensions changed → send full):
//   Same as full frame.

export interface WebRendererOptions {
  /** HTTP port (default 3000). */
  port?: number;
  /** Bind host (default "localhost"). */
  host?: string;
  /** Browser page title (default "Storm TUI"). */
  title?: string;
}

export class WebRenderer {
  private readonly port: number;
  private readonly host: string;
  private readonly title: string;
  private server: Server | null = null;
  private clients: Set<WsClient> = new Set();
  private started = false;

  constructor(options?: WebRendererOptions) {
    this.port = options?.port ?? 3000;
    this.host = options?.host ?? "localhost";
    this.title = options?.title ?? "Storm TUI";
  }

  /** Number of connected browser clients. */
  get clientCount(): number {
    return this.clients.size;
  }

  /** Start the HTTP + WebSocket server. */
  start(): Promise<void> {
    if (this.started) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleHttp(req, res);
      });

      server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
        this.handleUpgrade(req, socket, head);
      });

      server.on("error", (err) => {
        if (!this.started) reject(err);
      });

      server.listen(this.port, this.host, () => {
        this.started = true;
        this.server = server;
        resolve();
      });
    });
  }

  /** Stop the server and disconnect all clients. */
  stop(): void {
    if (!this.server) return;
    this.started = false;

    for (const client of this.clients) {
      this.sendClose(client);
      client.socket.destroy();
    }
    this.clients.clear();

    this.server.close();
    this.server = null;
  }

  /** Send a frame to all connected browsers. */
  sendFrame(buffer: ScreenBuffer, cursorX: number, cursorY: number): void {
    if (this.clients.size === 0) return;

    const w = buffer.width;
    const h = buffer.height;
    const size = w * h;

    // Snapshot the buffer once — shared across all clients for diffing
    const snapshot: CellSnapshot[] = new Array(size);
    for (let i = 0; i < size; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      snapshot[i] = {
        char: buffer.getChar(x, y),
        fg: buffer.getFg(x, y),
        bg: buffer.getBg(x, y),
        attrs: buffer.getAttrs(x, y),
      };
    }

    for (const client of this.clients) {
      if (!client.alive) continue;

      const needsFull = !client.prevSnapshot
        || client.prevWidth !== w
        || client.prevHeight !== h;

      let message: string;

      if (needsFull) {
        // Full frame: send every cell as a flat array
        // Format: [char, fgCSS, bgCSS, attrBitmask, ...]
        const cells: (string | number | null)[] = [];
        for (let i = 0; i < size; i++) {
          const s = snapshot[i]!;
          cells.push(
            s.char === WIDE_CHAR_PLACEHOLDER ? "" : s.char,
            colorToCSS(s.fg),
            colorToCSS(s.bg),
            s.attrs,
          );
        }
        message = JSON.stringify({
          type: "full",
          width: w,
          height: h,
          cursorX,
          cursorY,
          cells,
        });
      } else {
        // Diff frame: only changed cells
        const changes: (string | number | null)[] = [];
        const prev = client.prevSnapshot!;
        for (let i = 0; i < size; i++) {
          const s = snapshot[i]!;
          const p = prev[i];
          if (!p || s.char !== p.char || s.fg !== p.fg || s.bg !== p.bg || s.attrs !== p.attrs) {
            changes.push(
              i,
              s.char === WIDE_CHAR_PLACEHOLDER ? "" : s.char,
              colorToCSS(s.fg),
              colorToCSS(s.bg),
              s.attrs,
            );
          }
        }

        if (changes.length === 0) {
          // Only cursor may have moved
          message = JSON.stringify({
            type: "cursor",
            cursorX,
            cursorY,
          });
        } else {
          message = JSON.stringify({
            type: "diff",
            width: w,
            height: h,
            cursorX,
            cursorY,
            changes,
          });
        }
      }

      client.prevSnapshot = snapshot;
      client.prevWidth = w;
      client.prevHeight = h;

      this.sendText(client, message);
    }
  }

  // ── HTTP handler ────────────────────────────────────────────────

  private handleHttp(_req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.end(buildWebRendererPage({ title: this.title }));
  }

  // ── WebSocket upgrade (RFC 6455 handshake) ─────────────────────

  private handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): void {
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = wsAcceptKey(key);
    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      "",
    ].join("\r\n");

    socket.write(responseHeaders);

    const client: WsClient = {
      socket,
      recvBuffer: Buffer.alloc(0),
      prevSnapshot: null,
      prevWidth: 0,
      prevHeight: 0,
      alive: true,
    };

    if (head.length > 0) {
      client.recvBuffer = head;
      this.processIncoming(client);
    }

    socket.on("data", (data: Buffer) => {
      client.recvBuffer = Buffer.concat([client.recvBuffer, data]);
      this.processIncoming(client);
    });

    socket.on("close", () => {
      client.alive = false;
      this.clients.delete(client);
    });

    socket.on("error", () => {
      client.alive = false;
      this.clients.delete(client);
    });

    this.clients.add(client);
  }

  // ── WebSocket frame I/O ────────────────────────────────────────

  private processIncoming(client: WsClient): void {
    while (client.recvBuffer.length > 0) {
      const frame = decodeFrame(client.recvBuffer);
      if (!frame) break;

      client.recvBuffer = client.recvBuffer.subarray(frame.totalLength);

      switch (frame.opcode) {
        case WsOpcode.PING:
          this.sendPong(client, frame.payload);
          break;
        case WsOpcode.PONG:
          break;
        case WsOpcode.CLOSE:
          this.sendClose(client);
          client.socket.end();
          client.alive = false;
          this.clients.delete(client);
          break;
        case WsOpcode.TEXT:
          // Client messages (keyboard/mouse events) — reserved for future use
          break;
      }
    }
  }

  private sendText(client: WsClient, text: string): void {
    if (!client.alive) return;
    try {
      const payload = Buffer.from(text, "utf-8");
      client.socket.write(encodeFrame(WsOpcode.TEXT, payload));
    } catch {
      client.alive = false;
      this.clients.delete(client);
    }
  }

  private sendPong(client: WsClient, payload: Buffer): void {
    if (!client.alive) return;
    try {
      client.socket.write(encodeFrame(WsOpcode.PONG, payload));
    } catch {
      client.alive = false;
      this.clients.delete(client);
    }
  }

  private sendClose(client: WsClient): void {
    try {
      client.socket.write(encodeFrame(WsOpcode.CLOSE, Buffer.alloc(0)));
    } catch {
      // Socket may already be dead
    }
  }
}
