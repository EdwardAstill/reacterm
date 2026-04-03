<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-white.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-black.png">
    <img src="assets/logo-black.png" width="56" alt="" valign="middle">
  </picture>
  <br>
  <strong style="font-size: 2em;">STORM</strong><br>
  <strong>A compositor-based terminal UI framework.</strong><br>
  Fast. Layered. Unstoppable.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/components-92-82AAFF?style=flat-square" alt="92 Components">
  <img src="https://img.shields.io/badge/AI_widgets-19-82AAFF?style=flat-square" alt="19 AI Widgets">
  <img src="https://img.shields.io/badge/hooks-82-82AAFF?style=flat-square" alt="82 Hooks">
  <img src="https://img.shields.io/badge/TypeScript-strict-82AAFF?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-82AAFF?style=flat-square" alt="MIT License">
</p>

<br>

<p align="center">
  <img src="examples/demo.gif" width="720" alt="Storm TUI Demo">
</p>

<p align="center">
  <em>Cell matrix. Live metrics. AI agent. Code diff. All running in a terminal.</em>
</p>

<br>

## Why Storm

Most terminal frameworks treat your terminal like a string printer. Storm treats it like a **display server**.

**Cell-level diff** — only changed cells are written. 97% are skipped per frame.<br>
**Dual-speed rendering** — React for structure, `requestRender()` for 60fps animation.<br>
**Typed-array buffers** — Int32Array + Uint8Array. Zero Cell objects. ~90% less GC pressure.<br>
**Pure TypeScript** — flexbox + CSS Grid layout. Zero native dependencies.<br>

<br>

## Quick start

```bash
npm install @orchetron/storm-tui react
```

```tsx
import React from "react";
import { render, Box, Text, Spinner, useInput, useTui } from "@orchetron/storm-tui";

function App() {
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });

  return (
    <Box padding={1}>
      <Spinner type="diamond" color="#82AAFF" />
      <Text bold color="#82AAFF"> storm is alive</Text>
    </Box>
  );
}

render(<App />).waitUntilExit();
```

That's 10 lines. You have a running TUI with animated spinner and keyboard input.

<br>

## Build an AI agent terminal in 30 seconds

```tsx
import React from "react";
import { render, Box, MessageBubble, OperationTree, ApprovalPrompt,
         useTerminal, useTui, useInput } from "@orchetron/storm-tui";

function App() {
  const { width, height } = useTerminal();
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });

  return (
    <Box flexDirection="column" width={width} height={height}>
      <MessageBubble role="assistant">I'll fix the bug in auth.ts.</MessageBubble>

      <OperationTree nodes={[
        { id: "1", label: "Reading auth.ts", status: "completed", durationMs: 120 },
        { id: "2", label: "Editing code", status: "running" },
        { id: "3", label: "Running tests", status: "pending" },
      ]} />

      <ApprovalPrompt tool="writeFile" risk="medium" params={{ path: "auth.ts" }} onSelect={() => {}} />
    </Box>
  );
}

render(<App />).waitUntilExit();
```

The OperationTree spinner animates at 80ms through imperative cell mutation — no React state churn, no layout rebuild.

<br>

## How it renders

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/diagram-pipeline-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/diagram-pipeline-light.svg">
    <img src="assets/diagram-pipeline-dark.svg" width="800" alt="Five-stage rendering pipeline">
  </picture>
</p>

Every frame flows through five stages: **React → Layout → Buffer → Diff → TTY**. Animation frames skip React and Layout entirely — buffer to terminal in 0.5ms.

<br>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/diagram-cell-diff-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/diagram-cell-diff-light.svg">
    <img src="assets/diagram-cell-diff-dark.svg" width="800" alt="Cell-level diffing">
  </picture>
</p>

On a typical scroll frame, **97% of cells are unchanged**. Storm skips them entirely — emitting only the bytes for mutated cells. The typed-array buffer eliminates ~30,000 Cell objects per frame.

**Other rendering features:**
- **DECSTBM hardware scroll** — terminal-native scroll regions for pure scroll ops
- **Optional WASM acceleration** — 33KB Rust module for 3.4x faster diff
- **Correct grapheme rendering** — `Intl.Segmenter` for ZWJ emoji (👨‍👩‍👧‍👦 = 2 columns, not 8)

<br>

## DevTools

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/diagram-devtools-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/diagram-devtools-light.svg">
    <img src="assets/diagram-devtools-dark.svg" width="800" alt="Four built-in DevTools">
  </picture>
</p>

```tsx
const app = render(<App />);
enableDevTools(app); // press 1/2/3/4
```

**Render heatmap** — see exactly where your UI does unnecessary work.<br>
**Accessibility audit** — live WCAG 4.5:1 contrast checking on every cell.<br>
**Time-travel** — freeze, scrub 120 frames, see what changed.<br>
**Inspector** — component tree, computed styles, FPS, events.

All four run as render middleware — non-blocking, the app keeps running.

<br>

## What's inside

**92 components** — Box, Text, ScrollView, Tabs, Modal, Table, DataGrid, Tree, Form, Select, Spinner (14 types), DiffView, Calendar, and more. [Browse all →](docs/components.md)<br>
**19 AI widgets** — OperationTree, MessageBubble, ApprovalPrompt, StreamingText, SyntaxHighlight, MarkdownText, TokenStream, ContextWindow, CostTracker. [Browse all →](docs/widgets.md)<br>
**82 hooks** — 4 tiers: Essential, Common, Interactive, and 15 headless behavior hooks. [Decision matrix →](docs/hook-guide.md)<br>
**12 themes** — Arctic, Midnight, Ember, Voltage, Neon, High Contrast + live `.storm.css` hot-reload. [Guide →](docs/theming.md)<br>
**Animations** — `<Transition>` enter/exit, `<AnimatePresence>` mount/unmount, spring physics. [Guide →](docs/animations.md)<br>
**Plugins** — Vim mode, compact mode, auto-scroll, screenshot, status bar. [Guide →](docs/plugins.md)<br>
**i18n** — Locales, RTL, pluralization for EN/FR/AR/RU/JA. [Guide →](docs/i18n.md)<br>
**SSH** — Serve your app over SSH with built-in auth and rate limiting.

<br>

## Get started

```bash
npx create-storm-app my-app    # scaffold a project
cd my-app && npm run dev
```

```bash
npx tsx examples/storm-code/index.tsx    # AI coding agent
npx tsx examples/storm-ops/index.tsx     # Operations dashboard
npx tsx examples/devtools-demo.tsx       # DevTools showcase
npx tsx examples/storm-website.tsx       # This README's demo
```

<br>

[Getting Started](docs/getting-started.md) · [Components](docs/components.md) · [AI Widgets](docs/widgets.md) · [Hook Guide](docs/hook-guide.md) · [Recipes](docs/recipes.md) · [Theming](docs/theming.md) · [DevTools](docs/devtools.md) · [Animations](docs/animations.md) · [Plugins](docs/plugins.md) · [Pitfalls](docs/pitfalls.md) · [Performance](docs/performance.md) · [i18n](docs/i18n.md)

<br>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-white.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-black.png">
    <img src="assets/logo-black.png" width="24" alt="">
  </picture>
  <br>
  <sub>Built by <b>Orchetron</b> · <a href="./CONTRIBUTING.md">Contributing</a> · MIT License</sub>
</p>
