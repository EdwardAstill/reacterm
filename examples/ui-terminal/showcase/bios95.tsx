/**
 * Demo: BIOS 95 — a 90s retro OS main-menu.
 *
 * Riff on "FOBOS ver 8.1.4": dithered gray field, navy-bordered drop-shadow
 * cards with yellow-on-navy menu entries, chunky gamepad-button prompts.
 *
 * Use this when your CLI tool wants to feel distinctly pre-Y2K —
 * installers, config wizards, retro games, anything that benefits from
 * a "boot screen" mood.
 */

import React, { useState } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const c = {
  bg: "#9aa2af",           // dithered-feeling mid grey
  bgDark: "#1c2847",        // card navy
  bgLight: "#c8cdd6",       // frame highlight
  fg: "#f0e6c2",            // yellow menu text
  fgDim: "#cfc08b",
  border: "#1c2847",
  accent: "#f0c74d",        // highlight yellow
  accentBg: "#1c5aa6",      // blue selection bar
  shadow: "#2a3658",
  danger: "#9a4a3a",
};

const MAIN_MENU = [
  { label: "Run Program",          enabled: true,  active: false },
  { label: "View Hardware",        enabled: true,  active: true  },
  { label: "Join Multi-user Session", enabled: true, active: false },
  { label: "Load Data",            enabled: false, active: false },
  { label: "",                     enabled: true,  active: false },
  { label: "Configure Settings",   enabled: true,  active: false },
  { label: "Test Volumes",         enabled: true,  active: false },
  { label: "",                     enabled: true,  active: false },
  { label: "Open Command Line",    enabled: true,  active: false },
];

const SUB_MENU = ["System", "Specs", "Display", "Network", "", "About"];

const SPECS = [
  { label: "CPU",   brand: "OUTTELL 64:",       value: "64 MHz" },
  { label: "RAM",   brand: "PAWNSTONE ULTRA",   value: "10 MB"  },
  { label: "VRAM",  brand: "ANOMALY GRAPHICS 2.5D", value: "5 MB" },
  { label: "SOUND", brand: "CAMELON SC-42",     value: "MIDI"    },
];

function Card({
  title, children, width, shadow = true,
}: {
  title?: string;
  children: React.ReactNode;
  width?: number;
  shadow?: boolean;
}) {
  return (
    <Box flexDirection="row">
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={c.border}
        backgroundColor={c.bgDark}
        paddingX={1}
        width={width}
      >
        {title !== undefined && (
          <Box flexDirection="row" marginBottom={1}>
            <Text color={c.accent} bold>/{title}</Text>
          </Box>
        )}
        {children}
      </Box>
      {shadow && <Text color={c.shadow}>{"  "}</Text>}
    </Box>
  );
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const [mainIdx, setMainIdx] = useState(1);
  const [subIdx, setSubIdx] = useState(0);
  const [focus, setFocus] = useState<"main" | "sub">("main");
  const [status, setStatus] = useState<string | null>(null);
  const [specsRev, setSpecsRev] = useState(0);

  const flash = (m: string) => {
    setStatus(m);
    setTimeout(() => setStatus(null), 1400);
  };

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "tab") { setFocus(f => f === "main" ? "sub" : "main"); return; }
    if (e.key === "return" || e.key === "space") {
      const lbl = focus === "main" ? MAIN_MENU[mainIdx]?.label : SUB_MENU[subIdx];
      if (lbl) flash(`♥ running: ${lbl}`);
      return;
    }
    if (e.key === "r") { setSpecsRev(r => r + 1); flash("♦ specs refreshed"); return; }
    const list = focus === "main" ? MAIN_MENU : SUB_MENU.map(l => ({ label: l, enabled: l !== "" }));
    const setter = focus === "main" ? setMainIdx : setSubIdx;
    const current = focus === "main" ? mainIdx : subIdx;
    if (e.key === "j" || e.key === "down") {
      let n = current;
      for (let i = 0; i < list.length; i++) {
        n = (n + 1) % list.length;
        if (list[n]!.label !== "" && (list[n] as any).enabled !== false) break;
      }
      setter(n);
    } else if (e.key === "k" || e.key === "up") {
      let n = current;
      for (let i = 0; i < list.length; i++) {
        n = (n - 1 + list.length) % list.length;
        if (list[n]!.label !== "" && (list[n] as any).enabled !== false) break;
      }
      setter(n);
    }
  });

  const specsDisplay = SPECS.map((s, i) => ({
    ...s,
    value: specsRev === 0 ? s.value : `${s.value} · rev ${specsRev}`,
  }));

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Title bar */}
      <Box flexDirection="row" paddingX={1}>
        <Text bold color={c.bgDark}>FOBOS ver 8.1.4</Text>
        <Box flex={1} />
        <Text color={c.bgDark}>8/25/1993</Text>
        <Text bold color={c.bgDark}>  10:05</Text>
      </Box>

      {/* Dithered field (just spacing) */}
      <Box height={1} />

      {/* Main panels */}
      <Box flexDirection="row" paddingX={2} gap={2}>
        {/* Main menu card */}
        <Card title="main_menu" width={30}>
          {MAIN_MENU.map((item, i) => {
            if (item.label === "") return <Box key={i} height={1} />;
            const focused = focus === "main" && i === mainIdx;
            const color = !item.enabled ? c.fgDim : focused ? c.fg : c.fg;
            return (
              <Text
                key={i}
                color={color}
                backgroundColor={focused ? c.accentBg : undefined}
                bold={focused}
                dim={!item.enabled}
              >
                {` ${item.label.padEnd(26)}`}
              </Text>
            );
          })}
          <Box height={1} />
          <Box flexDirection="row" gap={1}>
            <Text color={c.fg}>♠</Text><Text color={c.fg}>=Quit</Text>
            <Text color={c.fg}>♣</Text><Text color={c.fg}>=Run</Text>
            <Text color={c.danger}>♥</Text><Text color={c.fg}>=Select</Text>
          </Box>
        </Card>

        {/* Sub menu */}
        <Card title="hardware" width={16}>
          {SUB_MENU.map((item, i) => {
            if (item === "") return <Box key={i} height={1} />;
            const focused = focus === "sub" && i === subIdx;
            return (
              <Text
                key={i}
                color={c.fg}
                backgroundColor={focused ? c.accentBg : undefined}
                bold={focused}
              >
                {` ${item.padEnd(12)}`}
              </Text>
            );
          })}
        </Card>

        {/* Specs panel */}
        <Box flex={1} flexDirection="column">
          <Box
            borderStyle="single"
            borderColor={c.bgDark}
            backgroundColor={c.bgLight}
            paddingX={1}
            paddingTop={1}
          >
            <Text color={c.bgDark} dim>... eye ...</Text>
            <Text color={c.bgDark}>   ╱┈┈┈┈┈┈╲</Text>
            <Text color={c.bgDark}>  /  ◉    \</Text>
            <Text color={c.bgDark}>  \_______/</Text>
            <Box height={1} />
            {specsDisplay.map((s, i) => (
              <Box key={i} flexDirection="row" gap={1} marginBottom={1}>
                <Box flexDirection="column">
                  <Text dim color={c.bgDark}>{s.label}: {s.brand}</Text>
                  <Text bold color={c.bgDark}>{s.value}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box flex={1} />

      {/* Bottom bar */}
      <Box flexDirection="row" paddingX={1} borderColor={c.bgDark}>
        <Text color={c.bgDark} bold>✚</Text>
        <Text color={c.bgDark}>=Navigation</Text>
        <Box flex={1} />
        {status ? (
          <Text color={c.accent} backgroundColor={c.bgDark} bold>{` ${status} `}</Text>
        ) : (
          <>
            <Text color={c.bgDark} bold>≡</Text>
            <Text color={c.bgDark}>=Main Menu</Text>
            <Text color={c.bgDark}>   </Text>
            <Text color={c.bgDark} bold>⌂</Text>
            <Text color={c.bgDark}>=File Manager</Text>
          </>
        )}
      </Box>

      <Footer
        bindings={[
          { key: "Tab", label: `pane (${focus})` },
          { key: "j/k", label: "move" },
          { key: "Enter", label: "run" },
          { key: "r", label: "refresh specs" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
