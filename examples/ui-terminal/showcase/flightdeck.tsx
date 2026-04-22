/**
 * Demo: Flightdeck — cockpit instrument menu.
 *
 * Riff on the "Ad Astra / Territory Studio" fake flight GUI: near-black
 * canvas, hair-thin white dividers, spaced lowercase-cap labels, pale
 * body text, status words in red/amber. Columns of tabular data carved
 * by single-pixel rules.
 *
 * Use this when the terminal app needs to feel instrumented, slightly
 * military, and dense with numbers: monitoring dashboards, deploy
 * consoles, anything that reassures by sheer amount of data.
 */

import React, { useState } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const ATS_STATES = ["AUTO", "MANUAL", "OFF"] as const;

const c = {
  bg: "#0a0d11",
  fg: "#D5DCE8",
  dim: "#5a6780",
  label: "#8893A8",
  line: "#2a3142",
  red: "#ff5b5b",
  amber: "#f0b04a",
  panelBg: "#0a0d11",
};

function Rule({ width }: { width: number }) {
  return <Text color={c.line}>{"─".repeat(width)}</Text>;
}

function Label({ text }: { text: string }) {
  return <Text color={c.label}>{text}</Text>;
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const [engLoad, setEngLoad] = useState(89);
  const [atsIdx, setAtsIdx] = useState(0);
  const [resOn, setResOn] = useState(true);
  const [tick, setTick] = useState(33);

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down") setEngLoad(l => Math.max(0, l - 1));
    else if (e.key === "k" || e.key === "up") setEngLoad(l => Math.min(100, l + 1));
    else if (e.key === "a") setAtsIdx(i => (i + 1) % ATS_STATES.length);
    else if (e.key === "r") setResOn(r => !r);
    else if (e.key === "t") setTick(t => (t + 1) % 86);
    else if (e.key === "0") setEngLoad(0);
    else if (e.key === "9") setEngLoad(99);
  });

  const atsLabel = ATS_STATES[atsIdx]!;
  const clock = `00:${String(tick).padStart(2, "0")} / 01:26`;

  const halfW = Math.floor(width / 2) - 2;

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Top status strip */}
      <Box flexDirection="row" paddingX={1} paddingY={1} gap={2}>
        <Label text="0301/" />
        <Label text="/" />
        <Box flex={1} />
        <Text color={c.fg} bold>BOOT MEM</Text>
        <Text color={c.fg}>ALPHA AST_F</Text>
        <Box flex={1} />
        <Text color={c.fg}>T</Text>
        <Text color={c.fg}>{clock}</Text>
        <Text color={c.fg}>+</Text>
        <Text color={resOn ? c.amber : c.dim} bold={resOn}>RES</Text>
      </Box>

      <Box flexDirection="column" paddingX={1}>
        <Rule width={width - 2} />
      </Box>

      {/* Two-column body */}
      <Box flex={1} flexDirection="row" paddingX={1} paddingTop={1}>
        {/* LEFT column */}
        <Box flexDirection="column" width={Math.floor(halfW * 0.9)} gap={1}>
          <Box flexDirection="column">
            <Label text="CONFIG MEM/SET" />
            <Text color={c.fg}>1 CONFIG   _V(0,3)</Text>
            <Text color={c.fg}>2 EOF      ---:---:---</Text>
          </Box>

          <Box height={1} />
          <Box flexDirection="column" gap={0}>
            <Label text="BOOT VECTOR  1" />
            <Text color={c.fg}>              2</Text>
            <Text color={c.fg}>              3 X</Text>
            <Text color={c.fg}>              4</Text>
            <Text color={c.fg}>              5</Text>
            <Text color={c.fg}>              6 -</Text>
          </Box>

          <Box flexDirection="row" gap={1} marginTop={1}>
            <Box borderStyle="single" borderColor={c.line} paddingX={1}>
              <Text color={c.fg}>RES</Text>
            </Box>
            <Box borderStyle="single" borderColor={c.line} paddingX={1}>
              <Text color={c.fg}>EOF</Text>
            </Box>
          </Box>

          <Box marginTop={1}>
            <Text color={c.fg}>EF 2.2</Text>
          </Box>

          <Box height={1} />
          <Box flexDirection="column">
            <Label text="IRC VECTOR   1 X" />
            <Text color={c.fg}>              A</Text>
            <Text color={c.fg}>              B -</Text>
            <Text color={c.fg}>              C</Text>
            <Text color={c.fg}>              D</Text>
            <Text color={c.fg}>              X</Text>
            <Text color={c.fg}>              F</Text>
            <Text color={c.fg}>              G -</Text>
          </Box>

          <Box marginTop={1} borderStyle="single" borderColor={c.line} paddingX={1} width={6}>
            <Text color={c.fg}>2/5</Text>
          </Box>
        </Box>

        {/* vertical divider */}
        <Box paddingX={1} flexDirection="column">
          {"┃".repeat(20).split("").map((ch, i) => (
            <Text key={i} color={c.line}>│</Text>
          ))}
        </Box>

        {/* RIGHT column */}
        <Box flex={1} flexDirection="column" gap={1}>
          {/* HEAD/WRITE */}
          <Box flexDirection="row" gap={2}>
            <Box flexDirection="column">
              <Label text="HEAD/WRITE  000" />
              <Text color={c.fg}>  ALT  203</Text>
              <Text color={c.fg}>  SET  23/13</Text>
              <Text color={c.fg}>  HSI  T/W</Text>
            </Box>
            <Box flex={1} />
            <Box flexDirection="column" alignItems="flex-end">
              <Box flexDirection="row" gap={1}>
                <Label text="ATS" />
                <Text color={atsLabel === "OFF" ? c.red : c.fg} bold>{atsLabel}</Text>
              </Box>
              <Label text="FD" />
            </Box>
          </Box>

          <Box flexDirection="row" gap={2}>
            <Label text="MEM DUMP →" />
            <Box flexDirection="column">
              <Text color={c.fg}>12</Text>
              <Text color={c.fg}>35</Text>
              <Text color={c.fg}> 6 S</Text>
            </Box>
            <Box width={4} />
            <Label text="AF LOAD  12 R" />
            <Box flexDirection="column">
              <Text color={c.fg}>35 -</Text>
              <Text color={c.fg}> X F</Text>
            </Box>
            <Box flex={1} />
            <Box flexDirection="column">
              <Label text="LOAD V.SYS" />
              <Text color={c.fg}>{engLoad}%</Text>
              <Label text="LEM" />
              <Box borderStyle="single" borderColor={c.line} paddingX={1}>
                <Text color={c.fg}>AF/R</Text>
              </Box>
            </Box>
          </Box>

          <Rule width={Math.floor(halfW * 1.15)} />

          {/* MEM RES MTRX */}
          <Box flexDirection="column">
            <Box flexDirection="row" gap={1}>
              <Text color={c.fg}>MEM RES MTRX</Text>
              <Text color={c.label}>COMPLETE</Text>
              <Box flex={1} />
              <Text color={c.red}>CNF</Text>
            </Box>
            <Box flexDirection="row" gap={2} marginTop={1}>
              <Box flexDirection="column">
                <Text color={c.fg}>MEM 1: 5, 8, 12, 15, 17</Text>
                <Text color={c.fg}>MEM 2: 1, 4, 13, 14, 20</Text>
                <Box height={1} />
                <Text color={c.fg}>MEM 3: 4, 5, 14, 17, 20</Text>
                <Text color={c.fg}>MEM 4: 6, 7, 10, 17, 18</Text>
                <Text color={c.fg}>MEM 5: 7, 10, 16, 19, 20</Text>
                <Box height={1} />
                <Text color={c.fg}>RES SET RSLT: 4, 6, 7, 9, 12   R</Text>
              </Box>
              <Box flexDirection="column" justifyContent="center">
                <Text color={c.fg}> ⎤</Text>
                <Text color={c.fg}>⎦  A</Text>
                <Box height={1} />
                <Text color={c.fg}> ⎤</Text>
                <Text color={c.fg}>⎦</Text>
                <Text color={c.fg}>⎦  B</Text>
              </Box>
              <Box flex={1} />
              <Box flexDirection="column" gap={1}>
                <Box flexDirection="row" gap={2}>
                  <Label text="A/P CONS" />
                  <Text color={c.fg}>35%</Text>
                </Box>
                <Label text="R/S" />
                <Label text="LOG" />
                <Box flexDirection="row" gap={2}>
                  <Label text="ENG 01" />
                  <Text color={c.fg}>--</Text>
                </Box>
                <Box flexDirection="row" gap={2}>
                  <Label text="ENG 02" />
                  <Text color={c.amber}>Wait...</Text>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box flex={1} />
          <Box flexDirection="row" justifyContent="flex-end">
            <Box borderStyle="single" borderColor={c.line} paddingX={1}>
              <Text color={c.fg}>LOC</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom title strip */}
      <Box flexDirection="column" paddingX={1}>
        <Rule width={width - 2} />
      </Box>
      <Box flexDirection="row" justifyContent="center" paddingY={0}>
        <Label text="ASCENT / ENTRY FLIGHT INSTRUMENT MENU" />
      </Box>

      {/* Bottom buttons */}
      <Box flexDirection="row" paddingX={1} paddingBottom={1} gap={1}>
        {["---", "UP", "COMP ATS", "HSI AMT", "UPDATING...", "ENG 01", "ENG 02"].map((lbl, i) => (
          <Box key={i} flex={1} borderStyle="single" borderColor={c.line} paddingX={1}>
            {i === 1 ? (
              <Text color={c.fg} bold>↑ {lbl}</Text>
            ) : (
              <Text color={i === 4 ? c.dim : c.fg}>{lbl}</Text>
            )}
          </Box>
        ))}
      </Box>

      <Footer
        bindings={[
          { key: "j/k 0/9", label: "V.SYS load" },
          { key: "a", label: `ATS (${atsLabel})` },
          { key: "r", label: `RES ${resOn ? "✓" : "✗"}` },
          { key: "t", label: "tick clock" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
