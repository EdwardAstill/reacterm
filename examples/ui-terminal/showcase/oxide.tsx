/**
 * Demo: Oxide Shell — a dark cloud-shell console.
 *
 * Riff on Oxide's product marketing shot: near-black canvas, clean tab
 * strip up top with a teal underline under the active tab, IP info
 * laid out in quiet labels, a `generate boilerplate` pipe-tree of
 * confirmations, and a green per-tile progress bar.
 *
 * Use this when a CLI tool is showing *operations in progress* — cloud
 * provisioning, CI output, deploy logs. The mood is "calm, competent,
 * almost minimalist".
 */

import React, { useState, useEffect } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const EXTRA_CONFIRMS = [
  { prompt: "Database",    answer: "Postgres 15" },
  { prompt: "Region",      answer: "us-west-2" },
  { prompt: "Monitoring",  answer: "Enabled" },
  { prompt: "Backups",     answer: "Hourly" },
];

const c = {
  bg: "#0F1117",
  fg: "#DDE1E5",
  dim: "#6C7380",
  accent: "#3FB08C",
  accentAlt: "#CBA770",
  barFill: "#3FB08C",
  barEmpty: "#242830",
  border: "#222731",
  tabUnderline: "#3FB08C",
  prompt: "#A8D5C1",
};

const IAM_UPDATES = [
  { who: "Ryan Ray",    tag: "IAM", text: "Updated IAM access for Web1 instance",  ago: "2 HOURS AGO" },
  { who: "Frosty Turek", tag: "IAM", text: "Updated IAM access for DB1 cluster",    ago: "3 HOURS AGO" },
];

const BOILERPLATE = [
  { prompt: "Title",              answer: "Colossal Cave Adventure", color: "#A1E5B8" },
  { prompt: "Generate boilerplate", answer: "Yes",                     color: "#A1E5B8" },
  { prompt: "Deploy",             answer: "Automatic",                 color: "#A1E5B8" },
];

const TABS = ["WEB1", "DB1"];

function Bar({ total, filled, width }: { total: number; filled: number; width?: number }) {
  return (
    <Text>
      <Text color={c.barFill} backgroundColor={c.barFill}>
        {"█".repeat(filled)}
      </Text>
      <Text color={c.barEmpty}>
        {"█".repeat(Math.max(0, total - filled))}
      </Text>
    </Text>
  );
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const [tab, setTab] = useState(0);
  const [progress, setProgress] = useState(12);
  const [running, setRunning] = useState(false);
  const [extras, setExtras] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 60) { setRunning(false); return 60; }
        return p + 1;
      });
    }, 120);
    return () => clearInterval(t);
  }, [running]);

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "h" || e.key === "left") setTab(t => (t - 1 + TABS.length) % TABS.length);
    else if (e.key === "l" || e.key === "right") setTab(t => (t + 1) % TABS.length);
    else if (e.key === "j" || e.key === "down") setProgress(p => Math.max(0, p - 2));
    else if (e.key === "k" || e.key === "up") setProgress(p => Math.min(60, p + 2));
    else if (e.key === "return" || e.key === "space") { setProgress(0); setRunning(true); }
    else if (e.key === "p") setRunning(r => !r);
    else if (e.key === "r") setExtras(n => Math.min(EXTRA_CONFIRMS.length, n + 1));
    else if (e.key === "x") setExtras(0);
  });

  const allBoiler = [...BOILERPLATE, ...EXTRA_CONFIRMS.slice(0, extras)];

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Top activity strip (subtle) */}
      <Box flexDirection="column" paddingX={2} paddingTop={1} gap={0}>
        {IAM_UPDATES.map((u, i) => (
          <Box key={i} flexDirection="row" alignItems="center" gap={1}>
            <Box width={3}>
              <Text dim color={c.dim}>◯</Text>
            </Box>
            <Text dim color={c.dim}>{u.who}</Text>
            <Text color={c.fg}> Updated </Text>
            <Box backgroundColor={c.accentAlt} paddingX={1}>
              <Text color={c.bg} bold>{u.tag}</Text>
            </Box>
            <Text color={c.fg}> {u.text}</Text>
            <Box flex={1} />
            <Text dim color={c.dim}>{u.ago}</Text>
          </Box>
        ))}
      </Box>

      {/* Tab strip + shell */}
      <Box flex={1} flexDirection="column" paddingX={2} paddingTop={2}>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <Box flexDirection="column">
            <Text dim color={c.dim}>OXIDE INSTANCE</Text>
            <Text color={c.fg} bold>TERMINAL</Text>
          </Box>
          <Box width={2} />
          {TABS.map((t, i) => {
            const active = i === tab;
            return (
              <Box key={t} flexDirection="column" alignItems="center">
                <Box flexDirection="row" alignItems="center" gap={1}>
                  <Text color={active ? c.accent : c.fg} bold={active}>{t}</Text>
                  <Text dim color={c.dim}>×</Text>
                </Box>
                <Text color={active ? c.tabUnderline : c.bg}>
                  {active ? "─────" : "     "}
                </Text>
              </Box>
            );
          })}
          <Text color={c.fg} bold>  +</Text>
          <Text dim color={c.dim}>▾</Text>
        </Box>

        <Box
          flex={1}
          flexDirection="column"
          borderStyle="round"
          borderColor={c.border}
          paddingX={2}
          paddingTop={1}
          marginTop={1}
        >
          {/* IP block */}
          <Box flexDirection="row" gap={6}>
            <Box flexDirection="column">
              <Text dim color={c.dim}>PUBLIC IP ADDRESS</Text>
              <Text color={c.fg} bold>35.289.97.966</Text>
            </Box>
            <Box flexDirection="column">
              <Text dim color={c.dim}>PRIVATE IP ADDRESS</Text>
              <Text color={c.fg} bold>10.495.720.325</Text>
            </Box>
          </Box>

          <Box height={1} />
          <Text dim color={c.dim}>
            Welcome to the oxide cloud shell! Type{" "}
            <Text color={c.fg}>"help"</Text> to get started.
          </Text>
          <Text dim color={c.dim}>
            You are now interacting through this shell on instance{" "}
            <Text color={c.fg}>web1</Text>.
          </Text>

          <Box height={1} />
          {/* Prompt line */}
          <Box flexDirection="row" gap={1}>
            <Text color={c.prompt}>cameron@web1:~</Text>
            <Text dim color={c.dim}>$</Text>
            <Text color={c.accent} bold>0x</Text>
            <Text color={c.fg}>-n init</Text>
          </Box>

          <Box height={1} />
          {/* Pipe-tree confirmations */}
          {allBoiler.map((b, i) => {
            const lastIdx = allBoiler.length - 1;
            const glyph = i === lastIdx ? "└" : "├";
            return (
              <Box key={i} flexDirection="row" gap={1}>
                <Text color={c.accentAlt}>{glyph}</Text>
                <Text color={c.fg}>{b.prompt}</Text>
                <Text color={c.accent} bold>{b.answer}</Text>
              </Box>
            );
          })}

          <Box height={1} />
          <Text color={c.fg}>Initializing new project in <Text dim color={c.dim}>~/var/www/</Text></Text>
          <Box flexDirection="row" alignItems="center" marginTop={1}>
            <Bar total={60} filled={progress} />
          </Box>
          <Box height={1} />
          <Box flexDirection="row" gap={2}>
            <Text dim color={c.dim}>
              {Math.round((progress / 60) * 100)}% · {(progress / 2).toFixed(1)} MB/s · ETA {Math.max(0, 30 - progress)}s
            </Text>
            <Text color={running ? c.accent : c.dim} bold={running}>
              {running ? "● RUN" : progress >= 60 ? "✓ DONE" : "◌ idle"}
            </Text>
          </Box>

          <Box flex={1} />
        </Box>
      </Box>

      <Footer
        bindings={[
          { key: "h/l", label: "tab" },
          { key: "j/k", label: "progress" },
          { key: "Enter", label: "restart" },
          { key: "p", label: running ? "pause" : "run" },
          { key: "r/x", label: "add/clear" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
