#!/usr/bin/env npx tsx
/**
 * Storm TUI — Showpiece v3 (Cinematic+)
 *
 * Builds on v2 with THREE cinematic enhancements:
 *   1. Cell Matrix spells "STORM" during opening (t=2800-3500)
 *   2. Screen ripple pulse on resolution (t=23000-23500)
 *   3. Dramatic green wave ending (t=24500-26000) + STORM end card
 *
 * 0s:   Cell Matrix — cells pop in randomly across screen.
 * 2.8s: STORM letters form left-to-right within the matrix.
 * 4s:   Transition to main screen.
 * 5s:   User message appears. Breathing room.
 * 6.5s: "Reasoning..." flickers, then response streams.
 * 10s:  Operations appear one by one.
 * 13s:  Right panel — diff fills in.
 * 17s:  Bottom panel — metrics fill in.
 * 20s:  PEAK — everything alive.
 * 23s:  Resolution — ripple pulse, everything completes.
 * 24.5s: Green wave sweeps left-to-right across screen.
 * 26s:  End card — STORM letters replay fast + tagline.
 * 32s:  Exit.
 *
 * Usage: npx tsx examples/showpiece-v3.tsx
 */

import React, { useRef } from "react";
import {
  render,
  Box,
  Text,
  Spinner,
  ScrollView,
  ProgressBar,
  Sparkline,
  DiffView,
  MessageBubble,
  OperationTree,
  BlinkDot,
  StreamingText,
  ModelBadge,
  useTerminal,
  useTui,
  useTick,
  useInput,
  ThemeProvider,
  colors,
  createTheme,
  type OpNode,
} from "../src/index.js";

// ── Brand ─────────────────────────────────────────────────────────

const C = {
  arc: "#82AAFF",
  text: "#C0CAF5",
  dim: "#565F89",
  success: "#9ECE6A",
  error: "#F7768E",
  warning: "#E0AF68",
};

// Light theme for all framework components (OperationTree, DiffView, etc.)
const LIGHT_THEME = createTheme({
  brand: { primary: "#2563EB", light: "#3B82F6", glow: "#1D4ED8" },
  text: { primary: "#000000", secondary: "#484F58", dim: "#6E7781", disabled: "#8C959F" },
  surface: { base: "#FFFFFF", raised: "#F6F8FA", overlay: "#FFFFFF", highlight: "#EBF2FF" },
  divider: "#D1D9E0",
  success: "#1A7F37",
  warning: "#9A6700",
  error: "#CF222E",
  info: "#2563EB",
  tool: { pending: "#8C959F", running: "#2563EB", completed: "#1A7F37", failed: "#CF222E", cancelled: "#8C959F" },
  diff: { added: "#1A7F37", removed: "#CF222E", addedBg: "#DAFBE1", removedBg: "#FFEBE9" },
});

// ── Data ──────────────────────────────────────────────────────────

const AI_RESPONSE = "I found the bug. The token refresh timer in `src/auth.ts` doesn't account for clock skew between client and server — when the server clock is ahead by even a few seconds, the token appears valid locally but gets rejected server-side. I'll add a 30-second safety buffer to the expiry check and wrap the refresh call in retry logic with exponential backoff. This way, even if the first refresh attempt fails due to a network hiccup, the second or third attempt will succeed before the session drops.";

const DIFF = `--- a/src/auth.ts
+++ b/src/auth.ts
@@ -42,8 +42,16 @@
 async function refreshToken(token: AuthToken) {
-  if (Date.now() < token.expiresAt) {
-    return token;
+  const CLOCK_SKEW_BUFFER = 30_000;
+  const expiresAt = token.expiresAt - CLOCK_SKEW_BUFFER;
+
+  if (Date.now() < expiresAt) {
+    return token; // still valid with buffer
   }
-  const fresh = await authApi.refresh(token.refreshToken);
-  return fresh;
+
+  for (let attempt = 0; attempt < 3; attempt++) {
+    try {
+      const fresh = await authApi.refresh(token.refreshToken);
+      return { ...fresh, issuedAt: Date.now() };
+    } catch (err) {
+      if (attempt < 2) await sleep(1000 * (attempt + 1));
+    }
+  }
+
+  throw new AuthError("TOKEN_REFRESH_FAILED", {
+    lastAttempt: Date.now(),
+    tokenAge: Date.now() - token.issuedAt,
+  });
 }`;

// ── Diamond ───────────────────────────────────────────────────────

const DIAMOND = [
  "    ██    \n  ██  ██  \n██  ◆◆  ██\n  ██  ██  \n    ██    ",
  "    █▓    \n  █▓  ▓█  \n█▓  ◆◆  ▓█\n  █▓  ▓█  \n    █▓    ",
  "    ▓▒    \n  ▓▒  ▒█  \n▓▒  ◆◆  ▒█\n  ▓▒  ▒█  \n    ▓▒    ",
  "    ▒░    \n    ▒░    \n    ▒░    \n    ▒░    \n    ▒░    ",
  "    ▒▓    \n  █▒  ▒▓  \n█▒  ◆◆  ▒▓\n  █▒  ▒▓  \n    ▒▓    ",
  "    ▓█    \n  ▓█  █▓  \n▓█  ◆◆  █▓\n  ▓█  █▓  \n    ▓█    ",
  "    █▓    \n  █▓  ▓█  \n█▓  ◆◆  ▓█\n  █▓  ▓█  \n    █▓    ",
  "    ██    \n  ██  █▓  \n██  ◆◆  █▓\n  ██  █▓  \n    ██    ",
];

// ── STORM ASCII Art (direct character rendering, not cell-grid based) ──

const STORM_ART: string[] = [
  "\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588   \u2588\u2588   \u2588\u2588",
  "\u2588      \u2588    \u2588   \u2588  \u2588   \u2588  \u2588\u2588\u2588 \u2588\u2588\u2588",
  "\u2588\u2588\u2588\u2588   \u2588    \u2588   \u2588  \u2588\u2588\u2588\u2588   \u2588 \u2588\u2588\u2588 \u2588",
  "   \u2588   \u2588    \u2588   \u2588  \u2588  \u2588   \u2588  \u2588  \u2588",
  "\u2588\u2588\u2588\u2588   \u2588     \u2588\u2588\u2588\u2588\u2588  \u2588   \u2588  \u2588     \u2588",
];
const STORM_ART_HEIGHT = STORM_ART.length;
const STORM_ART_WIDTH = 37; // character width of the art

/**
 * Render STORM ASCII art onto a screen buffer at center.
 * Reveals left-to-right over revealMs.
 */
function renderStormArt(
  scr: string[][],
  width: number,
  height: number,
  elapsed: number,
  revealMs: number,
): void {
  const startX = Math.floor((width - STORM_ART_WIDTH) / 2);
  const startY = Math.floor((height - STORM_ART_HEIGHT) / 2);
  if (startX < 0 || startY < 0) return;

  const colsRevealed = Math.min(
    STORM_ART_WIDTH,
    Math.floor((elapsed / revealMs) * STORM_ART_WIDTH),
  );

  for (let r = 0; r < STORM_ART_HEIGHT; r++) {
    const row = STORM_ART[r]!;
    const y = startY + r;
    if (y >= height) break;
    for (let c = 0; c < colsRevealed && c < row.length; c++) {
      const x = startX + c;
      if (x >= width) break;
      if (row[c] !== " ") {
        scr[y]![x] = row[c]!;
      }
    }
  }
}

// ── Showpiece ─────────────────────────────────────────────────────

function Showpiece() {
  const { width, height } = useTerminal();
  const { exit, requestRender } = useTui();
  const startRef = useRef(Date.now());
  const logoFrameRef = useRef(0);
  const logoTextRef = useRef<any>(null);

  // Master timer — 10fps, reactive (triggers React re-render)
  useTick(100, () => {});

  // Logo rotation — imperative (mutates text node directly, no React re-render)
  useTick(150, () => {
    logoFrameRef.current = (logoFrameRef.current + 1) % DIAMOND.length;
    if (logoTextRef.current) {
      logoTextRef.current.text = DIAMOND[logoFrameRef.current]!;
    }
  }, { reactive: false });

  const lightRef = useRef(false);
  useInput((e) => {
    if ((e.key === "c" && e.ctrl) || e.key === "q") exit();
    if (e.key === "t") {
      lightRef.current = !lightRef.current;
      requestRender();
    }
  });

  const t = Date.now() - startRef.current;
  const light = lightRef.current;
  const L = light
    ? { arc: "#2563EB", text: "#000000", dim: "#484F58", success: "#1A7F37", error: "#CF222E", warning: "#9A6700", bg: "#FFFFFF", gridDim: "#F0F1F3" }
    : { arc: C.arc, text: C.text, dim: C.dim, success: C.success, error: C.error, warning: C.warning, bg: "", gridDim: "#2A2F3A" };
  const activeTheme = light ? LIGHT_THEME : colors;

  // ── PHASE 0: Cell Matrix (0-4s) with STORM spell (Enhancement 1) ──
  if (t < 4000) {
    const cw = 6;  // cell box width
    const ch = 3;  // cell box height
    const gapX = 1;
    const pitchX = cw + gapX;
    const pitchY = ch;
    const gridCols = Math.floor((width - 2) / pitchX);
    const gridRows = Math.floor((height - 1) / pitchY);
    const totalCells = gridCols * gridRows;
    const padX = Math.floor((width - gridCols * pitchX) / 2);
    const padY = Math.floor((height - gridRows * pitchY) / 2);

    // Deterministic random pop order
    const popOrder: Array<[number, number]> = [];
    const used = new Set<string>();
    let seed = 9173;
    for (let i = 0; i < totalCells && popOrder.length < totalCells; i++) {
      seed = (seed * 48271 + 11) & 0x7fffffff;
      const r = seed % gridRows;
      seed = (seed * 48271 + 11) & 0x7fffffff;
      const c = seed % gridCols;
      const k = `${r},${c}`;
      if (!used.has(k)) { used.add(k); popOrder.push([r, c]); }
    }
    // Fill any remaining
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const k = `${r},${c}`;
        if (!used.has(k)) { used.add(k); popOrder.push([r, c]); }
      }
    }

    // Cells visible — ease in then out, cap at ~50 cells
    const progress = Math.min(1, t / 3000);
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const maxCells = Math.min(totalCells, Math.max(40, Math.floor(totalCells * 0.4)));
    const visibleCount = Math.floor(eased * maxCells);

    const visible = new Set<string>();
    for (let i = 0; i < visibleCount && i < popOrder.length; i++) {
      visible.add(`${popOrder[i]![0]},${popOrder[i]![1]}`);
    }

    // Highlighted cells (pop up late, shown with diamond and brighter)
    const hlIndices = [8, 22, 38];
    const hlSet = new Set<string>();
    for (const idx of hlIndices) {
      if (idx < popOrder.length && t > 1500 + idx * 30) {
        hlSet.add(`${popOrder[idx]![0]},${popOrder[idx]![1]}`);
      }
    }

    // Enhancement 1: STORM ASCII art overlay (rendered directly to scrStorm buffer)
    const showStormArt = t > 2800;

    // Track when each cell appeared (for brightness ripple)
    const popTime = new Map<string, number>();
    for (let i = 0; i < visibleCount && i < popOrder.length; i++) {
      const k = `${popOrder[i]![0]},${popOrder[i]![1]}`;
      // Approximate time this cell popped
      const cellProgress = i / maxCells;
      // Invert easing to get approximate time
      const cellTime = cellProgress < 0.5
        ? Math.sqrt(cellProgress / 2) * 3000
        : (1 - Math.sqrt((1 - cellProgress) * 2)) * 3000 + 1500;
      popTime.set(k, cellTime);
    }

    // Build screen buffer
    const scrDim: string[][] = [];
    const scrBright: string[][] = [];
    const scrStorm: string[][] = []; // separate layer for STORM letters (bright blue filled)
    for (let y = 0; y < height; y++) {
      scrDim.push(new Array(width).fill(" "));
      scrBright.push(new Array(width).fill(" "));
      scrStorm.push(new Array(width).fill(" "));
    }

    // Layer 1: Background grid with dots at intersections
    if (t > 150) {
      for (let gr = 0; gr <= gridRows; gr++) {
        for (let gc = 0; gc <= gridCols; gc++) {
          const dx = padX + gc * pitchX;
          const dy = padY + gr * pitchY;
          if (dy < height && dx < width) scrDim[dy]![dx] = "·";
        }
      }
    }

    // Draw visible cells
    for (const key of visible) {
      const [gr, gc] = key.split(",").map(Number) as [number, number];
      const x0 = padX + gc * pitchX;
      const y0 = padY + gr * pitchY;
      const hl = hlSet.has(key);

      if (y0 >= height || x0 + cw > width) continue;

      const age = t - (popTime.get(key) ?? 0);
      const isFresh = age < 300;
      const target = (hl || isFresh) ? scrBright : scrDim;

      target[y0]![x0] = "\u250C";
      for (let i = 1; i < cw - 1; i++) target[y0]![x0 + i] = "\u2500";
      target[y0]![x0 + cw - 1] = "\u2510";

      if (y0 + 1 < height) {
        target[y0 + 1]![x0] = "\u2502";
        target[y0 + 1]![x0 + cw - 1] = "\u2502";
        for (let i = 1; i < cw - 1; i++) target[y0 + 1]![x0 + i] = " ";
        const label = hl ? "\u25C6\u25C6" : `${String.fromCharCode(65 + (gr % 26))}${gc}`;
        const start = x0 + 1 + Math.floor((cw - 2 - label.length) / 2);
        for (let i = 0; i < label.length && start + i < width; i++) {
          target[y0 + 1]![start + i] = label[i]!;
        }
      }

      if (y0 + 2 < height) {
        target[y0 + 2]![x0] = "\u2514";
        for (let i = 1; i < cw - 1; i++) target[y0 + 2]![x0 + i] = "\u2500";
        target[y0 + 2]![x0 + cw - 1] = "\u2518";
      }

      scrDim[y0]![x0] = " ";
    }

    // Fill a few cells solid
    const fillIndices = [5, 14, 27, 33, 45];
    for (const idx of fillIndices) {
      if (idx < popOrder.length && visible.has(`${popOrder[idx]![0]},${popOrder[idx]![1]}`)) {
        const [fr, fc] = popOrder[idx]!;
        const fx = padX + fc * pitchX;
        const fy = padY + fr * pitchY;
        if (fy + 1 < height && fx + cw <= width) {
          for (let i = 1; i < cw - 1; i++) scrBright[fy + 1]![fx + i] = "\u2588";
        }
      }
    }

    // Enhancement 1: Overlay STORM ASCII art on scrStorm layer
    if (showStormArt) {
      renderStormArt(scrStorm, width, height, t - 2800, 500);
    }

    // Boot sequence text at bottom
    if (t > 2200) {
      const bootLines = [
        { text: "\u25C6 initializing renderer", time: 2200 },
        { text: "\u25C6 loading 92 components", time: 2500 },
        { text: "\u25C6 mounting agent interface", time: 2800 },
        { text: "\u25C6 storm ready", time: 3100 },
      ];
      const bootY = height - bootLines.length - 1;
      for (let i = 0; i < bootLines.length; i++) {
        const bl = bootLines[i]!;
        if (t > bl.time && bootY + i < height) {
          const bx = 2;
          for (let j = 0; j < bl.text.length && bx + j < width; j++) {
            scrBright[bootY + i]![bx + j] = bl.text[j]!;
          }
        }
      }
    }

    // Transition
    if (t > 3500) {
      return <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})} />;
    }

    // Render: dim layer + bright layer + storm layer
    const rowEls: React.ReactElement[] = [];
    for (let y = 0; y < height; y++) {
      const dimLine = scrDim[y]!.join("");
      const brightLine = scrBright[y]!.join("");
      const stormLine = scrStorm[y]!.join("");
      const hasStorm = stormLine.trim().length > 0;
      const hasBright = brightLine.trim().length > 0;

      if (hasStorm) {
        // STORM cells take priority — bright blue filled blocks
        // Merge: storm chars replace spaces, bright chars fill remaining spaces
        const merged: string[] = [];
        for (let x = 0; x < width; x++) {
          const sc = stormLine[x];
          const bc = brightLine[x];
          if (sc && sc !== " ") {
            merged.push(sc);
          } else if (bc && bc !== " ") {
            merged.push(bc);
          } else {
            merged.push(dimLine[x] ?? " ");
          }
        }
        // We render two lines: the merged dim content, then overlay the storm+bright
        // Actually, for simplicity render two overlapping tui-text.
        // But since we can only have one text per row in this model, merge into one bright line.
        rowEls.push(
          React.createElement("tui-text", { key: `${y}s`, color: L.arc, bold: true }, merged.join("")),
        );
      } else if (hasBright) {
        rowEls.push(
          React.createElement("tui-text", { key: `${y}b`, color: L.arc }, brightLine),
        );
      } else {
        rowEls.push(
          React.createElement("tui-text", { key: y, color: L.gridDim, dim: true }, dimLine),
        );
      }
    }

    return (
      <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})}>
        {rowEls}
      </Box>
    );
  }

  // ── END CARD + WAVE (24.5-31s): Unified — wave sweeps over end card content ──
  // ── GREEN WAVE (24.5-26s) ──
  if (t >= 24500 && t < 26000) {
    const waveProgress = (t - 24500) / 1500;
    const waveX = Math.floor(waveProgress * width);
    const waveRows: React.ReactElement[] = [];
    for (let y = 0; y < height; y++) {
      const chars: string[] = [];
      for (let x = 0; x < width; x++) {
        if (x === waveX || x === waveX + 1) chars.push("\u2588");
        else if (x < waveX) chars.push("\u2591");
        else chars.push(" ");
      }
      waveRows.push(React.createElement("tui-text", { key: y, color: L.success }, chars.join("")));
    }
    return (
      <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})}>
        {waveRows}
      </Box>
    );
  }

  // ── END CARD (26-30s) — v2 original ──
  if (t >= 26000) {
    const ct = t - 26000;
    if (t >= 30000) { exit(); return <Box />; }
    return (
      <Box flexDirection="column" width={width} height={height} justifyContent="center" alignItems="center" {...(L.bg ? { backgroundColor: L.bg } : {})}>
        {React.createElement("tui-text", { color: L.arc, bold: true, _textNodeRef: logoTextRef }, DIAMOND[0])}
        {ct > 500 && <Box height={1} />}
        {ct > 500 && <Text bold color={L.text}>storm</Text>}
        {ct > 1200 && <Box height={1} />}
        {ct > 1000 && <Text color={L.dim}>The high-performance rendering engine for terminal user interfaces.</Text>}
        {ct > 2000 && <Box height={1} />}
        {ct > 2000 && <Text bold color={L.arc}>Fast. Layered. Unstoppable.</Text>}
      </Box>
    );
  }

  // ── MAIN EVOLVING SCREEN (4-28s) ────────────────────────────────

  // Operations — staggered appearance and completion
  const ops: OpNode[] = [];
  if (t > 10000)  ops.push({ id: "1", label: "Reading src/auth.ts", status: t > 12000 ? "completed" : "running", ...(t > 12000 ? { durationMs: 340 } : {}) });
  if (t > 12000) ops.push({ id: "2", label: "Analyzing token logic", status: t > 15000 ? "completed" : "running", ...(t > 15000 ? { durationMs: 1200 } : {}) });
  if (t > 15000) ops.push({ id: "3", label: "Patching refreshToken()", status: t > 18000 ? "completed" : "running", ...(t > 18000 ? { durationMs: 2100 } : {}) });
  if (t > 18000) ops.push({ id: "4", label: "Running 42 tests", status: t > 23000 ? "completed" : "running", ...(t > 23000 ? { durationMs: 4200 } : {}) });

  // Panel reveals
  const showDiff = t > 13000;
  const showDiffContent = t > 13500;
  const showMetrics = t > 17000;
  const showMetricsContent = t > 17500;
  const allDone = t > 23000;

  // Enhancement 2: Ripple pulse state (t=23000-23500)
  const inRipple = t >= 23000 && t < 23500;
  const rippleProgress = inRipple ? (t - 23000) / 500 : 0; // 0 to 1
  // During ripple, flash separator and borders bright green, then fade back
  const rippleBorderColor = inRipple
    ? (rippleProgress < 0.5 ? L.success : L.dim)
    : L.dim;
  const rippleSepColor = inRipple
    ? (rippleProgress < 0.3 ? L.success : (rippleProgress < 0.6 ? L.arc : L.dim))
    : L.dim;

  // Enhancement 3 Phase 1: Resolution drama (t=23000-24500)
  const inResolution = t >= 23000 && t < 24500;
  const resolutionMetricsColor = inResolution || t >= 24500 ? L.success : L.arc;

  // Enhancement 3 Phase 2: Green wave (t=24500-26000)
  const inGreenWave = t >= 24500 && t < 26000;
  const greenWaveX = inGreenWave ? Math.floor(((t - 24500) / 1500) * width) : -1;

  // Enhancement 3 Phase 1 continued: All metrics turn green after resolution
  const postResolution = t >= 23000;

  // Live metrics
  const tokens = showMetricsContent ? Math.round((t - 17500) * 1.8) : 0;
  const tokPerSec = allDone ? 28 : 28 + Math.round(Math.sin(t / 400) * 18);
  const testsTotal = 42;
  const testsRun = showMetricsContent ? Math.min(testsTotal, Math.floor((t - 17500) / 120)) : 0;
  const cost = (tokens * 0.000003).toFixed(4);
  const progress = allDone ? 100 : (showMetricsContent ? Math.min(96, Math.round((t - 17500) / 60)) : 0);

  // Growing sparkline — descends to baseline after resolution
  const sparkData: number[] = [];
  if (showMetricsContent) {
    const len = Math.min(24, Math.floor((t - 17500) / 220) + 2);
    for (let i = 0; i < len; i++) {
      if (allDone) {
        // Smooth descent to baseline
        const fadeT = Math.min(1, (t - 23000) / 2000);
        const base = 20 + Math.round(Math.sin((23000 / 350) + i * 0.6) * 20);
        sparkData.push(Math.round(base * (1 - fadeT) + 5 * fadeT));
      } else {
        sparkData.push(20 + Math.round(Math.sin((t / 350) + i * 0.6) * 20 + Math.random() * 6));
      }
    }
  }

  // Live events — Enhancement 3: all checkmarks after resolution
  const events: string[] = [];
  if (t > 12000) events.push("\u2713 src/auth.ts read (340ms)");
  if (t > 15000) events.push("\u2713 Token logic analyzed");
  if (t > 18000) events.push("\u2713 refreshToken() patched");
  if (t > 19000 && !allDone) events.push("\u2801 Test suite started");
  if (t > 19000 && allDone) events.push("\u2713 Test suite started");
  if (t > 21000 && !allDone) events.push(`\u2801 ${Math.min(testsTotal, testsRun)} / ${testsTotal} tests passed`);
  if (t > 21000 && allDone) events.push(`\u2713 ${testsTotal} / ${testsTotal} tests passed`);
  if (t > 23000) events.push("\u2713 All 42 tests passed");
  if (t > 23500) events.push("\u2713 Pipeline complete");
  if (t > 24000) events.push(`\u2713 ${tokens.toLocaleString()} tokens · $${cost}`);

  // Layout
  const mainW = showDiff ? Math.floor((width - 1) / 2) : width;
  const rightW = showDiff ? width - mainW - 1 : 0;
  const btmH = showMetrics ? Math.min(8, Math.max(6, Math.floor(height * 0.25))) : 0;

  // Enhancement 2: Ripple — horizontal bright line expanding from center
  const rippleLineY = inRipple ? Math.floor(height / 2) : -1;
  const rippleRadius = inRipple ? Math.floor(rippleProgress * height / 2) : 0;

  // ── Green wave overlay helper ──
  // If in green wave phase, we wrap the main render and add an overlay
  const mainContent = (
    <ThemeProvider theme={activeTheme}>
    <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})}>
      {/* ── HEADER ── */}
      <Box height={1} paddingLeft={1} overflow="hidden" flexDirection="row">
        <Box width={4}><Spinner type="storm-logo" color={postResolution ? L.success : L.arc} interval={120} /></Box>
        <Text bold color={postResolution ? L.success : L.arc}>storm</Text>
        <Text color={L.dim}> · qwen-2.5-coder-32b</Text>
        <Box flex={1} />
        {t > 10000 && <BlinkDot state={allDone ? "completed" : "running"} />}
        {t > 10000 && <Text color={allDone ? L.success : L.arc}>{allDone ? " done" : " working"}</Text>}
      </Box>
      <Box height={1} overflow="hidden">
        <Text color={postResolution ? L.success : rippleSepColor}>{"\u2500".repeat(Math.max(0, width - 2))}</Text>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box flex={1} flexDirection="row" overflow="hidden">
        {/* LEFT — Chat + Operations */}
        <Box flexDirection="column" width={mainW} overflow="hidden">
          <ScrollView flex={1} stickToBottom>
            <Box flexDirection="column" paddingLeft={1} paddingRight={3} paddingY={1} gap={1}>

              {/* User message — 5s */}
              {t > 5000 && (
                <Box flexDirection="row" paddingX={1}>
                  <Text bold color={L.dim}>{"\u203A "}</Text>
                  <Text bold color={L.text}>Fix the token refresh bug in auth.ts — tokens expire during long sessions</Text>
                </Box>
              )}

              {/* Thinking — 6.5s, visible for 1.5 seconds */}
              {t > 6500 && t < 8000 && (
                <Box flexDirection="row" paddingX={1}>
                  <Text dim color={L.dim}>{"\u27E1 "}</Text>
                  <Text dim color={L.dim}>Reasoning...</Text>
                </Box>
              )}

              {/* AI response — 8s, streams */}
              {t > 8000 && (
                <Box flexDirection="row" paddingX={1}>
                  <Text bold color={postResolution ? L.success : L.arc}>{"\u25C6 "}</Text>
                  <Box flex={1}>
                    <StreamingText
                      text={AI_RESPONSE}
                      streaming={!allDone}
                      animate
                      speed={6}
                      color={L.text}
                    />
                  </Box>
                </Box>
              )}

              {/* Operations — 9s, one by one */}
              {ops.length > 0 && <OperationTree nodes={ops} showDuration />}
            </Box>
          </ScrollView>
        </Box>

        {/* RIGHT — Diff panel, slides in at 12s */}
        {showDiff && (
          <Box flexDirection="column" width={rightW} borderStyle="single" borderColor={rippleBorderColor} overflow="hidden">
            {showDiffContent ? (
              <>
                <Box paddingX={1}>
                  <Text bold color={postResolution ? L.success : L.arc}>Changes</Text>
                  <Text color={L.dim}>{" · src/auth.ts"}</Text>
                </Box>
                <ScrollView flex={1}>
                  <Box paddingX={1}>
                    <DiffView diff={DIFF} showLineNumbers={false} />
                  </Box>
                </ScrollView>
              </>
            ) : (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Spinner type="dots" color={L.dim} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── BOTTOM — Metrics panel, slides in at 16s ── */}
      {showMetrics && (
        <Box height={btmH} borderStyle="single" borderColor={rippleBorderColor} overflow="hidden">
          {showMetricsContent ? (
            <Box flexDirection="row" flex={1}>
              {/* Left: Performance */}
              <Box flex={1} flexDirection="column" paddingX={1} overflow="hidden">
                <Box flexDirection="row" gap={2}>
                  <Text bold color={resolutionMetricsColor}>Performance</Text>
                  <Text bold color={postResolution ? L.success : L.text}>{tokPerSec}</Text>
                  <Text color={L.dim}>tok/s</Text>
                  <Text color={postResolution ? L.success : L.warning}>${cost}</Text>
                </Box>
                <Sparkline data={sparkData} width={Math.max(8, Math.floor(width / 3))} height={2} color={postResolution ? L.success : L.arc} />
                <Box flexDirection="row" gap={1}>
                  <ProgressBar value={progress} showPercent {...(postResolution ? { color: L.success, trackColor: L.success } : {})} />
                </Box>
              </Box>

              {/* Center: Status */}
              <Box flex={1} flexDirection="column" paddingX={1} overflow="hidden">
                <Text bold color={resolutionMetricsColor}>Status</Text>
                <Box flexDirection="row" gap={1}>
                  <BlinkDot state={allDone ? "completed" : "running"} />
                  <Text color={allDone ? L.success : L.text}>
                    {allDone ? `\u2713 ${testsTotal}/${testsTotal} passed` : `${testsRun}/${testsTotal} running`}
                  </Text>
                </Box>
                <ModelBadge model="qwen-2.5-coder-32b" provider="community" />
              </Box>

              {/* Right: Events */}
              <Box flex={1} flexDirection="column" paddingX={1} overflow="hidden">
                <Text bold color={resolutionMetricsColor}>Events</Text>
                {events.slice(-4).map((ev, i) => (
                  <Text key={i} color={postResolution ? L.success : L.dim}>{ev}</Text>
                ))}
              </Box>
            </Box>
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner type="dots" color={L.dim} />
            </Box>
          )}
        </Box>
      )}

      {/* Enhancement 2: Ripple horizontal lines expanding from center */}
      {inRipple && (
        <Box flexDirection="column" width={width} height={0} overflow="visible">
          {/* This is a visual-only element — renders bright lines at ripple positions */}
        </Box>
      )}
    </Box>
    </ThemeProvider>
  );

  // Enhancement 3 Phase 2: Green wave sweeps over STORM end card
  // The STORM text is rendered underneath; wave changes it from arc to green
  if (inGreenWave) {
    const scr: string[][] = [];
    for (let y = 0; y < height; y++) {
      scr.push(new Array(width).fill(" "));
    }
    renderStormArt(scr, width, height, 9999, 1); // fully rendered underneath

    const rowEls: React.ReactElement[] = [];
    for (let y = 0; y < height; y++) {
      // Split each row at the wave front: left=green, front=bright, right=arc
      const line = scr[y]!;
      const parts: React.ReactElement[] = [];
      const leftChars: string[] = [];
      const frontChars: string[] = [];
      const rightChars: string[] = [];

      for (let x = 0; x < width; x++) {
        if (x < greenWaveX - 1) {
          leftChars.push(line[x]!);
        } else if (x >= greenWaveX - 1 && x <= greenWaveX + 1) {
          frontChars.push(line[x] !== " " ? "\u2588" : "\u2591");
        } else {
          rightChars.push(line[x]!);
        }
      }

      if (leftChars.length > 0) {
        parts.push(React.createElement("tui-text", { key: `l${y}`, color: L.success, bold: true }, leftChars.join("")));
      }
      if (frontChars.length > 0) {
        parts.push(React.createElement("tui-text", { key: `f${y}`, color: L.success }, frontChars.join("")));
      }
      if (rightChars.length > 0) {
        parts.push(React.createElement("tui-text", { key: `r${y}`, color: L.arc, bold: true }, rightChars.join("")));
      }

      rowEls.push(React.createElement("tui-box", { key: y, flexDirection: "row" }, ...parts));
    }

    return (
      <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})}>
        {rowEls}
      </Box>
    );
  }

  // After wave: hold end card in green (26000 → end card takes over at 26500)
  if (t >= 26000 && t < 26500) {
    return <Box flexDirection="column" width={width} height={height} {...(L.bg ? { backgroundColor: L.bg } : {})} />;
  }

  return mainContent;
}

// ── Run ───────────────────────────────────────────────────────────

const app = render(<Showpiece />);
await app.waitUntilExit();
