#!/usr/bin/env npx tsx
/**
 * SyntaxHighlight scroll demo — 10,000 lines of TypeScript, scrollable.
 * Arrow keys, PgUp/PgDn, mouse wheel to scroll. Ctrl+C to quit.
 */
import React from "react";
import { render, Box, Text, SyntaxHighlight, useTerminal, useTui, useInput } from "../src/index.js";

// Generate 10K lines of realistic TypeScript
function generateCode(lines: number): string {
  const templates = [
    'const value_{i}: number = Math.floor(Math.random() * 1000);',
    'function process_{i}(input: string): boolean { return input.length > 0; }',
    'interface Config_{i} { name: string; enabled: boolean; timeout: number; }',
    'export class Handler_{i} extends BaseHandler { handle() { return true; } }',
    '// TODO: optimize this section for better performance',
    'const result = await fetch(`https://api.example.com/data/${{}{i}}`);',
    'if (value > threshold) { console.log("exceeded limit"); counter++; }',
    'const items: Array<{ id: string; label: string }> = [];',
    'for (let j = 0; j < data.length; j++) { sum += data[j] ?? 0; }',
    'type EventMap_{i} = Record<string, (...args: unknown[]) => void>;',
  ];
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const t = templates[i % templates.length]!;
    out.push(t.replace(/\{i\}/g, String(i)));
  }
  return out.join("\n");
}

const CODE = generateCode(10_000);

function App() {
  const { width, height } = useTerminal();
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box height={1} width={width}>
        <Text bold color="#82AAFF"> 10,000 lines of TypeScript </Text>
        <Text dim> — scroll with ↑↓ PgUp/PgDn mouse wheel — Ctrl+C to quit</Text>
      </Box>
      <SyntaxHighlight code={CODE} language="typescript" width={width} height={height - 1} />
    </Box>
  );
}

render(<App />).waitUntilExit();
