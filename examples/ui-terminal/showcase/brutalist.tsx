/**
 * Demo: Brutalist — cyber-terminal chat console.
 *
 * Riff on the "CHAT (BOT) ANALOG" design: pure black canvas with a
 * vertical orange ledge accent down the left side of each message card,
 * giant mono caps, asymmetric filled ledge tabs, minimal punctuation.
 *
 * Use this when the project wants to feel uncompromising and operator-y:
 * chatbot consoles, dispatch panels, anything that looks built by
 * someone who thinks "friendly UI" is suspicious.
 */

import React, { useState } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const FOLLOWUP_LINES = [
  "DEEP SCAN INITIATED .......... :)",
  "ANOMALY LOG: 2 TRACES NORMALIZED.",
  "PACKET BURST: 4.7MB UPSTREAM.",
  "REMOTE HANDSHAKE ACK'D.",
  "QUANTUM UPLINK STABLE.",
];

const c = {
  bg: "#0a0a0a",
  fg: "#EDE2C7",
  dim: "#7a6a52",
  accent: "#FF6A3D",
  accentDim: "#9E4226",
  line: "#2a2a2a",
  card: "#0a0a0a",
  cardBorder: "#1a1a1a",
};

type Conversation = {
  tag: string;
  slug: string;
  prompt: string;
  date: string;
  dial: string;
};

const CONVS: Conversation[] = [
  { tag: "1A", slug: "HOS", prompt: "SEND (MAI) A MESSAGE ...",     date: "214?.08.17", dial: "CN1" },
  { tag: "2B", slug: "HRT", prompt: "SEND (BRANDON) A MESSAGE ...", date: "214?.08.17", dial: "AF2" },
];

const LOG_ENTRY = {
  userId: "SHADOW_DRIFTER_92",
  date: "214?-08-17",
  time: "23:47 CST",
  text: [
    "GOOD EVENING, DRIFTER. YOUR CYBER-TRACE IS CLEAN, AND YOUR FIREWALL INTEGRITY",
    "    IS AT 98.6%. SHALL",
    "",
    "        I RUN A DEEP SCAN FOR ANOMALIES?........ :)",
  ].join("\n"),
};

function Ledge({ label, rightLedge = false }: { label: string; rightLedge?: boolean }) {
  return (
    <Box flexDirection="row">
      {!rightLedge && (
        <Text color={c.bg} backgroundColor={c.accent} bold>{` ${label} `}</Text>
      )}
      {rightLedge && (
        <Text color={c.bg} backgroundColor={c.accent} bold>{` ${label} ▶ `}</Text>
      )}
    </Box>
  );
}

function ConvCard({ conv, focused }: { conv: Conversation; focused: boolean }) {
  return (
    <Box flexDirection="row">
      {/* Vertical ledge tag with big number */}
      <Box flexDirection="column" width={4}>
        <Text color={c.bg} backgroundColor={c.accent} bold>{` ${conv.tag} `}</Text>
        <Box height={1} />
        <Text dim color={c.dim}>▼</Text>
        <Text dim color={c.dim}>DIAL</Text>
        <Text dim color={c.dim}>PS</Text>
        <Box height={1} />
        <Text color={c.fg} bold>{conv.slug}</Text>
      </Box>

      {/* Card body */}
      <Box
        flex={1}
        flexDirection="column"
        borderStyle="single"
        borderColor={focused ? c.accent : c.cardBorder}
        paddingX={1}
        paddingTop={1}
        marginLeft={1}
      >
        {/* Header row */}
        <Box flexDirection="row" alignItems="center">
          <Text bold color={c.fg}>{conv.prompt}</Text>
          <Box flex={1} />
          <Ledge label="CLOSE TAB" rightLedge />
        </Box>
        <Text dim color={c.dim}>DATE {conv.date}</Text>

        <Box height={1} />

        {/* Body area (empty canvas) */}
        <Box height={3} />

        {/* Footer row */}
        <Box flexDirection="row" alignItems="center">
          <Text color={c.bg} backgroundColor={c.accent} bold>{` OPEN SECT `}</Text>
          <Text color={c.accent}>{" ● "}</Text>
          <Box flex={1} />
          <Text color={c.fg} bold>{conv.tag}</Text>
          <Text dim color={c.dim}>{"  "}</Text>
          <Text color={c.accent} bold>{conv.dial}</Text>
          <Text dim color={c.dim}> ▶ DIAL UP</Text>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const [focusIdx, setFocusIdx] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [dialing, setDialing] = useState<string | null>(null);

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down") setFocusIdx(i => (i + 1) % CONVS.length);
    else if (e.key === "k" || e.key === "up") setFocusIdx(i => (i - 1 + CONVS.length) % CONVS.length);
    else if (e.key === "return" || e.key === "space") {
      const c2 = CONVS[focusIdx]!;
      setDialing(`▶ DIALING ${c2.dial} ...`);
      setTimeout(() => setDialing(null), 1400);
    } else if (e.key === "n") {
      setLogLines(l => {
        const next = FOLLOWUP_LINES[l.length % FOLLOWUP_LINES.length]!;
        return [...l, next].slice(-4);
      });
    } else if (e.key === "x") {
      setLogLines([]);
    }
  });

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Top bar */}
      <Box flexDirection="row" paddingX={1} alignItems="center">
        <Text color={c.accent} bold>⌿</Text>
        <Text color={c.dim}> </Text>
        <Text color={c.accent}>◎</Text>
        <Box flex={1} />
        <Text color={c.bg} backgroundColor={c.accent} bold>{"   ✕   "}</Text>
      </Box>

      {/* Title */}
      <Box flexDirection="column" paddingX={2} marginTop={1}>
        <Text dim color={c.dim}>35  ONLINE ●</Text>
        <Box flexDirection="row" alignItems="center">
          <Text color={c.accent} bold>▶ </Text>
          <Text bold color={c.fg}>CHAT (BOT) ANALOG</Text>
        </Box>
      </Box>

      <Box flex={1} paddingX={2} paddingTop={1} flexDirection="column" gap={1}>
        {CONVS.map((cv, i) => (
          <ConvCard key={cv.tag} conv={cv} focused={i === focusIdx} />
        ))}

        {/* Bottom chat log */}
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor={c.accent}
          paddingX={1}
          paddingTop={1}
          marginTop={1}
        >
          <Box flexDirection="row" alignItems="center">
            <Text color={c.accent} bold>CHAT LOG — QUANTUM UPLINK TERMINAL</Text>
            <Box flex={1} />
            <Text color={c.accent}>⌿</Text>
          </Box>
          <Text dim color={c.dim}>USER ID: <Text color={c.fg}>{LOG_ENTRY.userId}</Text></Text>
          <Text dim color={c.dim}>{`{ }`}</Text>
          <Box height={1} />
          <Text color={c.fg}>DATE: {LOG_ENTRY.date}</Text>
          <Text color={c.fg}>TIME: {LOG_ENTRY.time}</Text>
          <Text color={c.fg}>{LOG_ENTRY.text}</Text>
          {logLines.length > 0 && <Box height={1} />}
          {logLines.map((line, i) => (
            <Text key={i} color={c.accent} bold>{"> "}{line}</Text>
          ))}
          {dialing && <Text color={c.accent} backgroundColor={c.accentDim} bold>{dialing}</Text>}
        </Box>

        {/* Orange footer bar */}
        <Box flexDirection="column" marginTop={1}>
          <Text color={c.accent} backgroundColor={c.accent}>{" ".repeat(Math.max(0, width - 4))}</Text>
          <Box height={1} />
          <Text color={c.accent} backgroundColor={c.accent}>{" ".repeat(Math.max(0, Math.floor((width - 4) / 2)))}</Text>
        </Box>
      </Box>

      <Footer
        bindings={[
          { key: "j/k", label: "card" },
          { key: "Enter", label: "dial" },
          { key: "n", label: "new line" },
          { key: "x", label: "clear log" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
