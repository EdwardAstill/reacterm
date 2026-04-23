import { ScreenBuffer } from "./buffer.js";
export interface WebRendererOptions {
    /** HTTP port (default 3000). */
    port?: number;
    /** Bind host (default "localhost"). */
    host?: string;
    /** Browser page title (default "Storm TUI"). */
    title?: string;
}
export declare class WebRenderer {
    private readonly port;
    private readonly host;
    private readonly title;
    private server;
    private clients;
    private started;
    constructor(options?: WebRendererOptions);
    /** Number of connected browser clients. */
    get clientCount(): number;
    /** Start the HTTP + WebSocket server. */
    start(): Promise<void>;
    /** Stop the server and disconnect all clients. */
    stop(): void;
    /** Send a frame to all connected browsers. */
    sendFrame(buffer: ScreenBuffer, cursorX: number, cursorY: number): void;
    private handleHttp;
    private handleUpgrade;
    private processIncoming;
    private sendText;
    private sendPong;
    private sendClose;
    private buildHtmlPage;
}
//# sourceMappingURL=web-renderer.d.ts.map