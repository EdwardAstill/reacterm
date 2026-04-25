#!/usr/bin/env npx tsx
import React from "react";
import { render, Box, Text, ScrollView, useInput, useTerminal, useTui } from "../../src/index.js";

const MODULES = [
  "src/reconciler/renderer.ts",
  "src/layout/engine.ts",
  "src/reconciler/input-wiring.ts",
  "src/components/core/ScrollView.tsx",
  "src/core/focus.ts",
  "src/templates/showcase/ShowcaseLayout.tsx",
  "examples/debug/horizontal-scroll.tsx",
];

const ROWS = Array.from({ length: 72 }, (_, i) => {
  const module = MODULES[i % MODULES.length]!;
  const line = String(i + 1).padStart(2, "0");
  const offset = String((i * 4) % 64).padStart(2, "0");
  const status = i % 3 === 0 ? "horizontal-overflow" : i % 3 === 1 ? "vertical-overflow" : "both-axes";
  return [
    `row=${line}`,
    `module=${module.padEnd(42, " ")}`,
    `offset=${offset}`,
    `viewport=terminal-minus-gutter`,
    `content-width=wide-row`,
    `status=${status}`,
    `notes=${"wide terminal cell content ".repeat(5)}`,
  ].join("  |  ");
});

function App() {
  const { width, height } = useTerminal();
  const { exit } = useTui();

  useInput((event) => {
    if (event.key === "q" || (event.key === "c" && event.ctrl)) exit();
  });

  const viewportWidth = Math.max(24, width - 2);
  const rowWidth = Math.max(viewportWidth + 64, 132);

  return (
    <Box flexDirection="column" width={width} height={height} paddingX={1}>
      <Text bold color="#82AAFF">Horizontal ScrollView Demo</Text>
      <Text dim>Mouse wheel scrolls vertical. Shift+wheel or Left/Right scrolls horizontal. Press q to exit.</Text>
      <Text color="#565F89">{"─".repeat(Math.max(0, viewportWidth))}</Text>
      <ScrollView
        width={viewportWidth}
        height={Math.max(4, height - 5)}
        horizontalScroll
        scrollSpeed={4}
        borderStyle="single"
        borderColor="#565F89"
        scrollbarThumbColor="#82AAFF"
        scrollbarTrackColor="#30364D"
      >
        {ROWS.map((row, i) => (
          <Box key={row} width={rowWidth}>
            <Text wrap="truncate" color={i % 2 === 0 ? "#C3E88D" : "#89DDFF"}>
              {row.padEnd(rowWidth, " ")}
            </Text>
          </Box>
        ))}
      </ScrollView>
      <Text color="#565F89">{"─".repeat(Math.max(0, viewportWidth))}</Text>
    </Box>
  );
}

render(<App />);
