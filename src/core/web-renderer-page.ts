export interface WebRendererPageOptions {
  title: string;
}

export function buildWebRendererPage(options: WebRendererPageOptions): string {
  const title = options.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{
    height:100%;
    background:#0d1117;
    color:#c9d1d9;
    font-family:"SF Mono","Cascadia Code","Fira Code","JetBrains Mono",Menlo,Monaco,"Courier New",monospace;
    overflow:hidden;
  }

  #container{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    height:100%;
    padding:16px;
  }

  #status{
    position:fixed;
    top:12px;
    right:16px;
    font-size:11px;
    color:#484f58;
    z-index:10;
    display:flex;
    align-items:center;
    gap:6px;
  }
  #status .dot{
    width:7px;
    height:7px;
    border-radius:50%;
    background:#f85149;
    transition:background 0.3s;
  }
  #status.connected .dot{background:#3fb950}
  #status.connecting .dot{background:#d29922;animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

  #terminal{
    position:relative;
    background:#0d1117;
    border:1px solid #21262d;
    border-radius:8px;
    padding:12px 16px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 16px 48px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.03);
    overflow:hidden;
    line-height:1;
  }

  #terminal .title-bar{
    position:absolute;
    top:0;left:0;right:0;
    height:32px;
    display:flex;
    align-items:center;
    padding:0 12px;
    gap:8px;
    background:#161b22;
    border-bottom:1px solid #21262d;
    border-radius:8px 8px 0 0;
  }
  #terminal .title-bar .btn{
    width:12px;height:12px;border-radius:50%;
  }
  #terminal .title-bar .btn.close{background:#f85149}
  #terminal .title-bar .btn.min{background:#d29922}
  #terminal .title-bar .btn.max{background:#3fb950}
  #terminal .title-bar .title-text{
    flex:1;
    text-align:center;
    font-size:12px;
    color:#484f58;
    user-select:none;
  }

  #grid{
    margin-top:36px;
    position:relative;
    white-space:pre;
    cursor:default;
    user-select:none;
  }

  .row{display:block;height:var(--cell-h)}

  .c{
    display:inline-block;
    width:var(--cell-w);
    height:var(--cell-h);
    text-align:center;
  }
  .c.bold{font-weight:700}
  .c.dim{opacity:0.5}
  .c.italic{font-style:italic}
  .c.underline{text-decoration:underline}
  .c.strikethrough{text-decoration:line-through}
  .c.underline.strikethrough{text-decoration:underline line-through}
  .c.inverse{filter:invert(1)}

  #cursor{
    position:absolute;
    width:var(--cell-w);
    height:var(--cell-h);
    border:none;
    background:rgba(201,209,217,0.7);
    mix-blend-mode:difference;
    pointer-events:none;
    transition:left 50ms,top 50ms;
    animation:blink 1s step-end infinite;
    z-index:5;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

  #splash{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    height:100%;
    gap:16px;
    color:#484f58;
  }
  #splash .logo{font-size:48px;opacity:0.3}
  #splash .msg{font-size:14px}
</style>
</head>
<body>
<div id="container">
  <div id="status" class="connecting">
    <span class="dot"></span>
    <span class="label">connecting</span>
  </div>
  <div id="terminal">
    <div class="title-bar">
      <span class="btn close"></span>
      <span class="btn min"></span>
      <span class="btn max"></span>
      <span class="title-text">${title}</span>
    </div>
    <div id="grid">
      <div id="splash">
        <div class="logo">&#x26A1;</div>
        <div class="msg">Waiting for Storm TUI&hellip;</div>
      </div>
    </div>
    <div id="cursor"></div>
  </div>
</div>
<script>
(function(){
  "use strict";

  // ── Configuration ──────────────────────────────────────────────
  var FONT_SIZE = 14;
  var CELL_W = FONT_SIZE * 0.6;   // monospace character width
  var CELL_H = FONT_SIZE * 1.35;  // line height

  var grid = document.getElementById("grid");
  var cursor = document.getElementById("cursor");
  var terminal = document.getElementById("terminal");
  var status = document.getElementById("status");
  var statusLabel = status.querySelector(".label");

  // Set CSS custom properties
  document.documentElement.style.setProperty("--cell-w", CELL_W + "px");
  document.documentElement.style.setProperty("--cell-h", CELL_H + "px");
  grid.style.fontSize = FONT_SIZE + "px";

  // ── State ──────────────────────────────────────────────────────
  var width = 0;
  var height = 0;
  var cells = null;    // flat array of DOM <span> elements
  var rows = null;     // array of row <div> elements
  var ws = null;
  var reconnectTimer = null;
  var reconnectDelay = 500;
  var MAX_RECONNECT_DELAY = 8000;

  // ── Grid management ────────────────────────────────────────────

  function rebuildGrid(w, h) {
    width = w;
    height = h;
    grid.innerHTML = "";
    cells = new Array(w * h);
    rows = new Array(h);

    var fragment = document.createDocumentFragment();
    for (var y = 0; y < h; y++) {
      var row = document.createElement("div");
      row.className = "row";
      for (var x = 0; x < w; x++) {
        var span = document.createElement("span");
        span.className = "c";
        span.textContent = " ";
        row.appendChild(span);
        cells[y * w + x] = span;
      }
      fragment.appendChild(row);
      rows[y] = row;
    }
    grid.appendChild(fragment);

    // Size the terminal frame
    terminal.style.width = (w * CELL_W + 32) + "px";
    terminal.style.height = (h * CELL_H + 36 + 24) + "px";
  }

  function applyCell(index, ch, fgCSS, bgCSS, attrs) {
    var span = cells[index];
    if (!span) return;

    // Character
    span.textContent = (ch === "" || ch === "\\0") ? " " : ch;

    // Foreground
    span.style.color = fgCSS || "";

    // Background
    span.style.backgroundColor = bgCSS || "";

    // Attributes via class toggling (faster than style manipulation)
    var cls = "c";
    if (attrs & 1)   cls += " bold";           // Attr.BOLD
    if (attrs & 2)   cls += " dim";            // Attr.DIM
    if (attrs & 4)   cls += " italic";         // Attr.ITALIC
    if (attrs & 8)   cls += " underline";      // Attr.UNDERLINE
    if (attrs & 32)  cls += " inverse";        // Attr.INVERSE
    if (attrs & 128) cls += " strikethrough";  // Attr.STRIKETHROUGH
    span.className = cls;
  }

  function updateCursor(cx, cy) {
    cursor.style.left = (16 + cx * CELL_W) + "px";
    cursor.style.top = (36 + cy * CELL_H) + "px";
  }

  // ── Message handling ───────────────────────────────────────────

  function handleMessage(data) {
    var msg;
    try { msg = JSON.parse(data); } catch(e) { return; }

    if (msg.type === "full") {
      if (msg.width !== width || msg.height !== height) {
        rebuildGrid(msg.width, msg.height);
      }
      var c = msg.cells;
      var total = msg.width * msg.height;
      for (var i = 0; i < total; i++) {
        var base = i * 4;
        applyCell(i, c[base], c[base+1], c[base+2], c[base+3]);
      }
      updateCursor(msg.cursorX, msg.cursorY);

    } else if (msg.type === "diff") {
      if (msg.width !== width || msg.height !== height) {
        // Dimensions changed — can't apply diff, wait for full frame
        return;
      }
      var ch = msg.changes;
      for (var j = 0; j < ch.length; j += 5) {
        applyCell(ch[j], ch[j+1], ch[j+2], ch[j+3], ch[j+4]);
      }
      updateCursor(msg.cursorX, msg.cursorY);

    } else if (msg.type === "cursor") {
      updateCursor(msg.cursorX, msg.cursorY);
    }
  }

  // ── WebSocket connection ───────────────────────────────────────

  function setStatus(state, text) {
    status.className = state;
    statusLabel.textContent = text;
  }

  function connect() {
    if (ws) return;

    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(protocol + "//" + location.host);

    ws.onopen = function() {
      setStatus("connected", "connected");
      reconnectDelay = 500;
    };

    ws.onmessage = function(e) {
      handleMessage(e.data);
    };

    ws.onclose = function() {
      ws = null;
      setStatus("connecting", "reconnecting\u2026");
      scheduleReconnect();
    };

    ws.onerror = function() {
      if (ws) ws.close();
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(function() {
      reconnectTimer = null;
      connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
  }

  // ── Boot ───────────────────────────────────────────────────────
  connect();
})();
</script>
</body>
</html>`;
}
