/**
 * Demo: Logbook — Ornithology Logbook v2.1.
 *
 * Black tactical HUD with a single red accent. Triangle-glyph tab hooks
 * (`◥/SPECIES◤`), corner-bracket panel frames, full-row red selection,
 * proper pixel-art tui rendered with half-block `▀` color pairs (top
 * pixel = fg, bottom pixel = bg).
 */

import React, { useState } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const c = {
  bg: "#000000",
  chrome: "#2a2a2a",
  fg: "#DDDDDD",
  dim: "#8A8A8A",
  dimmer: "#3d3d3d",
  accent: "#E5333D",
  accentFg: "#FFFFFF",
};

type Observation = {
  id: string;
  time: string;
  location: string;
  status: "Feeding" | "Vocalizing" | "Perched";
};

const OBSERVATIONS: Observation[] = [
  { id: "001", time: "14:15", location: "Forest Edge", status: "Feeding" },
  { id: "002", time: "14:21", location: "Canopy",      status: "Vocalizing" },
  { id: "003", time: "14:30", location: "Garden",      status: "Perched" },
  { id: "004", time: "14:41", location: "Gardon",      status: "Feeding" },
  { id: "005", time: "14:50", location: "Canopy",      status: "Vocalizing" },
  { id: "006", time: "14:51", location: "Forest Edge", status: "Feeding" },
];

const TABS = ["SPECIES", "HABITAT", "CALLS"] as const;

type Species = {
  family: string;
  genus: string;
  common: string;
  latin: string;
  region: string;
  status: string;
};

const SPECIES: Species[] = [
  {
    family: "MELIPHAGIDAE",
    genus: "Prosthemadera",
    common: "Tui",
    latin: "Prosthemadera novaeseelandiae",
    region: "NZ Endemic",
    status: "SECURE",
  },
  {
    family: "PSITTACIDAE",
    genus: "Nestor",
    common: "Kea",
    latin: "Nestor notabilis",
    region: "NZ Alpine",
    status: "VULNERABLE",
  },
];

// Pixel-art tui. Each code = one pixel. Two rows collapse into one
// character row using `▀` (upper half block) — top pixel is the fg,
// bottom pixel is the bg.
const BIRD_PALETTE: Record<string, string | null> = {
  ".": null,            // transparent (panel bg)
  D: "#0a3329",         // dark teal outline
  T: "#2a7564",         // mid teal body
  L: "#48b08e",         // light teal highlight
  W: "#ffffff",         // white throat / eye rim
  K: "#000000",         // black: eye, beak
  Y: "#C78A3A",         // amber beak
  G: "#8a8a8a",         // gray legs
};

const BIRD_GRID = [
  "....................", // 00
  "........DDDD........", // 01
  ".....DDDTTTTDDK.....", // 02  (beak tip right)
  "....DTTTTTTTTDY.....", // 03
  "....DTTWKWTTTD......", // 04  (eye: white + black + white)
  "...DTTTTLLTTTTD.....", // 05
  "...DTTLLLLLTTTD.....", // 06
  "..DTTLLLLLLLTTTD....", // 07
  "..DTLLLLLLLLLTTTD...", // 08
  "..DTWWWLLLLLLLTTD...", // 09  (throat tuft left of body)
  "..DTWWWWLLLLLTTD....", // 10
  "...DTWWLLLLLTTD.....", // 11
  "...DTTLLLLLTTD......", // 12
  "....DDTTTTTTD.......", // 13
  ".....DDTTTT.........", // 14
  "......DDT...........", // 15  (tail end)
  "........GG..........", // 16  (legs start)
  ".......G..G.........", // 17
  "......GG..GG........", // 18  (claws splay)
  "....................", // 19
];

function BirdPortrait() {
  const rows: React.ReactNode[] = [];
  for (let r = 0; r < BIRD_GRID.length; r += 2) {
    const top = BIRD_GRID[r]!;
    const bot = BIRD_GRID[r + 1] ?? ".".repeat(top.length);
    const cells: React.ReactNode[] = [];
    for (let col = 0; col < top.length; col++) {
      const tC = BIRD_PALETTE[top[col]!];
      const bC = BIRD_PALETTE[bot[col]!];
      if (!tC && !bC) {
        cells.push(<Text key={col}> </Text>);
      } else if (tC && !bC) {
        cells.push(<Text key={col} color={tC}>▀</Text>);
      } else if (!tC && bC) {
        cells.push(<Text key={col} color={bC}>▄</Text>);
      } else {
        cells.push(<Text key={col} color={tC!} backgroundColor={bC!}>▀</Text>);
      }
    }
    rows.push(
      <Box key={r} flexDirection="row">
        {cells}
      </Box>,
    );
  }
  return <Box flexDirection="column">{rows}</Box>;
}

// Corner-bracket panel — four `┌┐└┘` marks, no rectangle sides.
function CropFrame({ children, color = c.dimmer }: { children: React.ReactNode; color?: string }) {
  return (
    <Box flexDirection="column" flex={1}>
      <Box flexDirection="row">
        <Text color={color}>┌</Text>
        <Box flex={1} />
        <Text color={color}>┐</Text>
      </Box>
      <Box flex={1} flexDirection="column" paddingX={1}>
        {children}
      </Box>
      <Box flexDirection="row">
        <Text color={color}>└</Text>
        <Box flex={1} />
        <Text color={color}>┘</Text>
      </Box>
    </Box>
  );
}

function now() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { date, time };
}

const HIGHLIGHT_W = 16; // width of the red tree-highlight block

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();

  const [tab, setTab] = useState(0);
  const [speciesIdx, setSpeciesIdx] = useState(0);
  const [obsIdx, setObsIdx] = useState(2);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(["MELIPHAGIDAE"]),
  );
  const [clock, setClock] = useState(now());
  const [flash, setFlash] = useState<string | null>(null);

  const notify = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 1400);
  };

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down")  setObsIdx(i => (i + 1) % OBSERVATIONS.length);
    else if (e.key === "k" || e.key === "up") setObsIdx(i => (i - 1 + OBSERVATIONS.length) % OBSERVATIONS.length);
    else if (e.key === "h" || e.key === "left") setTab(t => (t - 1 + TABS.length) % TABS.length);
    else if (e.key === "l" || e.key === "right") setTab(t => (t + 1) % TABS.length);
    else if (e.key === "n" || e.key === "N") setSpeciesIdx(i => (i + 1) % SPECIES.length);
    else if (e.key === "p" || e.key === "P") setSpeciesIdx(i => (i - 1 + SPECIES.length) % SPECIES.length);
    else if (e.key === "a" || e.key === "A") notify("► ENTRY ADDED");
    else if (e.key === "d" || e.key === "D") notify(`► DETAIL: ${OBSERVATIONS[obsIdx]!.id}`);
    else if (e.key === "s" || e.key === "S") notify("► SHARED TO UPLINK");
    else if (e.key === "t" || e.key === "T") setClock(now());
    else if (e.key === "space" || e.key === "return") {
      const fam = SPECIES[speciesIdx]!.family;
      setExpandedFamilies(set => {
        const n = new Set(set);
        if (n.has(fam)) n.delete(fam); else n.add(fam);
        return n;
      });
    }
  });

  const species = SPECIES[speciesIdx]!;

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Top chrome bar — angled chamfers at each end */}
      <Box flexDirection="row">
        <Text color={c.chrome}>◢</Text>
        <Box flex={1} flexDirection="row" backgroundColor={c.chrome} paddingX={1}>
          <Text color={c.fg} bold> ORNITHOLOGY LOGBOOK v2.1</Text>
          <Box flex={1} />
          <Text color={c.fg}>{clock.date} {clock.time} </Text>
        </Box>
        <Text color={c.chrome}>◣</Text>
      </Box>

      {/* Tab strip — active tab uses thin ┌─ ─┐ hook brackets */}
      <Box flexDirection="row" paddingX={2} paddingTop={1}>
        {TABS.map((t, i) => {
          const active = i === tab;
          return (
            <Box key={t} flexDirection="row" marginRight={4}>
              {active ? (
                <>
                  <Text color={c.accent}>┌─</Text>
                  <Text color={c.accent} bold>/{t}</Text>
                  <Text color={c.accent}>─┐</Text>
                </>
              ) : (
                <Text color={c.dim}>  /{t}  </Text>
              )}
            </Box>
          );
        })}
      </Box>
      <Box paddingX={2}>
        <Text color={c.dimmer}>{"─".repeat(Math.max(0, width - 4))}</Text>
      </Box>

      {/* Main row: species tree · observations · portrait */}
      <Box flex={1} flexDirection="row" paddingX={2} paddingTop={1} gap={2}>
        {/* Species tree panel */}
        <Box flexDirection="column" width={26}>
          <CropFrame>
            {SPECIES.map((sp, i) => {
              const expanded = expandedFamilies.has(sp.family);
              const active = i === speciesIdx;
              return (
                <Box key={sp.family} flexDirection="column" marginBottom={1}>
                  <Box flexDirection="row">
                    <Text color={c.dim}>[{expanded ? "−" : "+"}] </Text>
                    <Text color={c.fg}>{sp.family}</Text>
                  </Box>
                  {expanded && (
                    <>
                      <Box flexDirection="row">
                        <Text color={c.dim}>  └ </Text>
                        <Text
                          color={active ? c.accentFg : c.fg}
                          backgroundColor={active ? c.accent : undefined}
                          bold={active}
                        >
                          {` ${sp.genus.padEnd(HIGHLIGHT_W - 2)}`}
                        </Text>
                      </Box>
                      <Box flexDirection="row">
                        <Text color={c.dim}>    </Text>
                        <Text
                          color={active ? c.accentFg : c.dim}
                          backgroundColor={active ? c.accent : undefined}
                        >
                          {` (${sp.common})${" ".repeat(Math.max(0, HIGHLIGHT_W - sp.common.length - 4))}`}
                        </Text>
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </CropFrame>
        </Box>

        {/* Observations table panel */}
        <Box flex={1} flexDirection="column">
          <CropFrame>
            {/* Header bar */}
            <Box flexDirection="row" backgroundColor={c.chrome}>
              <Text color={c.fg} bold>{" ID  "}</Text>
              <Text color={c.dim}>│ </Text>
              <Text color={c.fg} bold>{"TIME  "}</Text>
              <Text color={c.dim}>│ </Text>
              <Text color={c.fg} bold>{"LOCATION         "}</Text>
              <Text color={c.dim}>│ </Text>
              <Text color={c.fg} bold>STATUS</Text>
            </Box>

            {OBSERVATIONS.map((obs, i) => {
              const active = i === obsIdx;
              const color = active ? c.accentFg : c.fg;
              const bg = active ? c.accent : undefined;
              return (
                <Box key={obs.id} flexDirection="row" backgroundColor={bg}>
                  <Text color={color}>{" " + obs.id + "  "}</Text>
                  <Text color={active ? c.accentFg : c.dim}>│ </Text>
                  <Text color={color}>{obs.time + "  "}</Text>
                  <Text color={active ? c.accentFg : c.dim}>│ </Text>
                  <Text color={color}>{obs.location.padEnd(17)}</Text>
                  <Text color={active ? c.accentFg : c.dim}>│ </Text>
                  <Text color={color}>{obs.status}</Text>
                </Box>
              );
            })}

            <Box flex={1} />
            {flash && (
              <Box paddingBottom={1}>
                <Text color={c.accent} bold>{flash}</Text>
              </Box>
            )}
          </CropFrame>
        </Box>

        {/* Portrait + metadata panel */}
        <Box flexDirection="column" width={32}>
          <CropFrame>
            <Box flexDirection="row" justifyContent="center" paddingTop={1}>
              <BirdPortrait />
            </Box>

            <Box height={1} />
            <Text color={c.fg}>{species.latin}</Text>
            <Box height={1} />
            <Text color={c.fg}>{species.region}</Text>
            <Text color={c.fg}>{species.family} Family</Text>
            <Box height={1} />
            <Box flexDirection="row">
              <Text color={c.fg}>STATUS: </Text>
              <Text color={c.accent} bold>{species.status}</Text>
            </Box>
          </CropFrame>
        </Box>
      </Box>

      {/* Command bar */}
      <Box flexDirection="row" paddingX={2} paddingTop={1} justifyContent="center">
        {[
          { k: "A", label: "ADD ENTRY" },
          { k: "D", label: "DETAILS" },
          { k: "S", label: "SHARE" },
          { k: "Q", label: "QUIT" },
        ].map(({ k, label }, i) => (
          <Box key={k} flexDirection="row" marginRight={i === 3 ? 0 : 4}>
            <Text color={c.accent} bold>[ {k} ]</Text>
            <Text color={c.fg}> {label}</Text>
          </Box>
        ))}
      </Box>

      {/* Bottom chrome strip — mirrored angled chamfers */}
      <Box flexDirection="row" marginTop={1}>
        <Text color={c.chrome}>◥</Text>
        <Box flex={1} flexDirection="row" backgroundColor={c.chrome} paddingX={1}>
          <Text color={c.dim}> © Ironwood Studios LLC, All Rights Reserved</Text>
          <Box flex={1} />
          <Text color={c.fg}>ORNITHOLOGY//LOGBOOK//TUI OBS </Text>
        </Box>
        <Text color={c.chrome}>◤</Text>
      </Box>

      <Footer
        bindings={[
          { key: "j/k", label: "obs" },
          { key: "h/l", label: `tab (${TABS[tab]})` },
          { key: "n/p", label: "species" },
          { key: "A/D/S", label: "cmd" },
          { key: "t", label: "sync clock" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
