/**
 * Demo: Posting — modern textual-style API client.
 *
 * Riff on darrenburns/posting: Catppuccin-ish dark canvas, soft purple
 * highlights, rounded panels, collection tree on the left, request
 * headers + body on the right, JSON response bottom-right.
 *
 * Use this when the app is *developer tooling* and wants to feel like
 * a polished textual TUI: git clients, API explorers, log viewers,
 * anything where readability > drama.
 */

import React, { useState } from "react";
import {
  render, Box, Text, Footer, useInput, useApp, useTerminal,
} from "../../../src/index.js";

let chosenCode = 0;

const TABS = ["Headers", "Body", "Parameters", "Auth", "Metadata", "Options"] as const;
const METHODS = ["GET", "POST", "PUT", "DEL", "PATCH"] as const;

const c = {
  bg: "#1E1E2E",
  panel: "#181825",
  fg: "#CDD6F4",
  dim: "#7F849C",
  accent: "#CBA6F7",
  accentBar: "#B4BEFE",
  selBg: "#45475A",
  border: "#45475A",
  borderFocus: "#CBA6F7",
  green: "#A6E3A1",
  red: "#F38BA8",
  yellow: "#F9E2AF",
  blue: "#89B4FA",
};

type CollectionNode = {
  label: string;
  method?: string;
  children?: CollectionNode[];
  expanded?: boolean;
};

const TREE: CollectionNode[] = [
  { label: "Collection", expanded: true, children: [
    { label: "get random user", method: "GET" },
    { label: "something",        method: "POS" },
    { label: "echo post",        method: "POS" },
    { label: "echo",             method: "GET" },
    { label: "jsonplaceholder/", expanded: true, children: [
      { label: "posts/", expanded: true, children: [
        { label: "get one",           method: "GET" },
        { label: "create",            method: "POS" },
        { label: "get all",           method: "GET" },
        { label: "delete a post",     method: "DEL" },
        { label: "comments/", expanded: true, children: [
          { label: "get comments",         method: "GET" },
          { label: "get comments (via param)", method: "GET" },
          { label: "edit a comment",       method: "PUT" },
        ]},
      ]},
      { label: "users/", expanded: true, children: [
        { label: "get a user",    method: "GET", },
        { label: "create a user", method: "POS" },
        { label: "get all users", method: "GET" },
        { label: "update a user", method: "PUT" },
      ]},
    ]},
  ]},
];

const HEADERS = [
  { key: "Content-Type",    value: "application/json",    active: true  },
  { key: "Referer",         value: "https://example.com/", active: true  },
  { key: "Accept-Encoding", value: "gzip",                 active: true  },
  { key: "Cache-Control",   value: "no-cache",             active: true  },
];

const JSON_BODY = [
  `{`,
  `  "id": 5,`,
  `  "name": "Chelsey Dietrich",`,
  `  "username": "Kamren",`,
  `  "email": "Lucio_Hettinger@annie.ca",`,
  `  "address": {`,
  `    "street": "Skiles Walks",`,
];

function methodColor(m: string) {
  if (m === "GET") return c.green;
  if (m === "POS") return c.yellow;
  if (m === "PUT") return c.blue;
  if (m === "DEL") return c.red;
  return c.fg;
}

function flatten(nodes: CollectionNode[], level = 0, out: {n: CollectionNode; level: number}[] = []) {
  for (const n of nodes) {
    out.push({ n, level });
    if (n.expanded && n.children) flatten(n.children, level + 1, out);
  }
  return out;
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const flat = flatten(TREE);
  const [idx, setIdx] = useState(flat.findIndex(f => f.n.label === "get a user"));
  const [tab, setTab] = useState<typeof TABS[number]>("Headers");
  const [bodyTab, setBodyTab] = useState<"Body" | "Headers" | "Cookies" | "Trace">("Body");
  const [methodIdx, setMethodIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("200 OK");

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down") setIdx(i => Math.min(flat.length - 1, i + 1));
    else if (e.key === "k" || e.key === "up") setIdx(i => Math.max(0, i - 1));
    else if (e.key === "h" || e.key === "left") {
      const i = TABS.indexOf(tab); setTab(TABS[(i - 1 + TABS.length) % TABS.length]!);
    } else if (e.key === "l" || e.key === "right") {
      const i = TABS.indexOf(tab); setTab(TABS[(i + 1) % TABS.length]!);
    } else if (e.key === "m") {
      setMethodIdx(i => (i + 1) % METHODS.length);
    } else if (e.key === "s" || e.key === "return") {
      setSending(true);
      setStatus("... sending");
      setTimeout(() => {
        setSending(false);
        setStatus(Math.random() > 0.15 ? "200 OK" : "500 ERR");
      }, 600);
    }
    const digitMap: Record<string, number> = { "1":0,"2":1,"3":2,"4":3,"5":4,"6":5 };
    if (e.char && digitMap[e.char] !== undefined) setTab(TABS[digitMap[e.char]!]!);
  });

  const method = METHODS[methodIdx]!;
  const statusOK = status.startsWith("2");

  const selected = flat[idx]?.n;

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      {/* Title row */}
      <Box flexDirection="row" paddingX={1} paddingTop={1} alignItems="center">
        <Text color={c.accent} bold>Posting 1.0.0b41</Text>
        <Box flex={1} />
        <Text dim color={c.dim}>darrenburns@hydaelyn.local</Text>
      </Box>

      {/* URL bar */}
      <Box flexDirection="row" paddingX={1} paddingY={1} alignItems="center" gap={1}>
        <Box backgroundColor={c.accent} paddingX={1}>
          <Text color={c.panel} bold>{method} ▾</Text>
        </Box>
        <Box
          flex={1}
          borderStyle="round"
          borderColor={c.border}
          paddingX={1}
        >
          <Text color={c.fg}>https://jsonplaceholder.typicode.com/users/</Text>
          <Text color={c.accent} bold>$USER_ID</Text>
        </Box>
        <Text color={c.green}>{"▮▮▮▮▮▮▮"}</Text>
        <Box backgroundColor={sending ? c.yellow : c.accent} paddingX={1}>
          <Text color={c.panel} bold>{sending ? "..." : "Send"}</Text>
        </Box>
      </Box>

      {/* Main split */}
      <Box flex={1} flexDirection="row" paddingX={1} gap={1}>
        {/* Collection tree */}
        <Box
          flexDirection="column"
          width={32}
          borderStyle="round"
          borderColor={c.border}
          paddingX={1}
          paddingTop={1}
        >
          {flat.map(({ n, level }, i) => {
            const focused = i === idx;
            const indent = "  ".repeat(level);
            const chevron = n.children ? (n.expanded ? "▾" : "▸") : " ";
            return (
              <Box key={i} flexDirection="row">
                {n.method ? (
                  <Text color={methodColor(n.method)} bold>{indent}{n.method}{" "}</Text>
                ) : (
                  <Text color={c.dim}>{indent}{chevron}{" "}</Text>
                )}
                <Text
                  color={focused ? c.fg : c.fg}
                  backgroundColor={focused ? c.selBg : undefined}
                  bold={focused}
                >
                  {n.label}
                </Text>
              </Box>
            );
          })}
          <Box flex={1} />
          <Box height={1} />
          <Text dim color={c.dim}>
            {selected?.method && (
              <Text color={methodColor(selected.method)} bold>{selected.method + " "}</Text>
            )}
            {selected?.label}
          </Text>
          <Text dim color={c.dim}>sample-collections</Text>
        </Box>

        {/* Right column */}
        <Box flex={1} flexDirection="column" gap={1}>
          {/* Request */}
          <Box
            flexDirection="column"
            flex={1}
            borderStyle="round"
            borderColor={c.border}
            paddingX={1}
            paddingTop={1}
          >
            <Box flexDirection="row" alignItems="center" gap={1}>
              {(["Headers", "Body", "Parameters", "Auth", "Metadata", "Options"] as const).map(t => (
                <Text
                  key={t}
                  color={t === tab ? c.accent : c.dim}
                  bold={t === tab}
                >
                  {t}{t === tab ? "•" : ""}
                </Text>
              ))}
              <Box flex={1} />
              <Text color={c.dim}>Request</Text>
            </Box>
            <Box height={1} />
            {/* Header rows */}
            {HEADERS.map((h, i) => (
              <Box key={i} flexDirection="row" gap={2}>
                <Box backgroundColor={c.selBg} paddingX={1} width={18}>
                  <Text color={c.accent} bold>{h.key}</Text>
                </Box>
                <Text color={c.fg}>{h.value}</Text>
              </Box>
            ))}
            <Box height={1} />
            <Box flexDirection="row" gap={2}>
              <Box
                flex={1}
                borderStyle="round"
                borderColor={c.border}
                paddingX={1}
              >
                <Text color={c.accent} bold>range</Text>
                <Text color={c.fg}>|</Text>
              </Box>
              <Box
                flex={1}
                borderStyle="round"
                borderColor={c.border}
                paddingX={1}
              >
                <Text dim color={c.dim}>Value</Text>
              </Box>
              <Box backgroundColor={c.accent} paddingX={1}>
                <Text color={c.panel} bold>Add header</Text>
              </Box>
            </Box>
          </Box>

          {/* Response */}
          <Box
            flexDirection="column"
            flex={1}
            borderStyle="round"
            borderColor={c.border}
            paddingX={1}
            paddingTop={1}
          >
            <Box flexDirection="row" alignItems="center" gap={1}>
              {(["Body", "Headers", "Cookies", "Trace"] as const).map(t => (
                <Text
                  key={t}
                  color={t === bodyTab ? c.accent : c.dim}
                  bold={t === bodyTab}
                >
                  {t}
                </Text>
              ))}
              <Box flex={1} />
              <Text color={c.dim}>Response</Text>
              <Box backgroundColor={statusOK ? c.green : c.red} paddingX={1}>
                <Text color={c.panel} bold>{status}</Text>
              </Box>
            </Box>
            <Box height={1} />
            {JSON_BODY.map((line, i) => (
              <Box key={i} flexDirection="row" gap={1}>
                <Text dim color={c.dim}>{String(i + 1).padStart(2, " ")}</Text>
                <Text color={c.fg}>{line}</Text>
              </Box>
            ))}
            <Box flex={1} />
            <Box flexDirection="row" alignItems="center" gap={1}>
              <Box backgroundColor={c.accent} paddingX={1}>
                <Text color={c.panel} bold>Visual</Text>
              </Box>
              <Box flex={1} />
              <Text dim color={c.dim}>4:24 read-only</Text>
              <Text color={c.accent}>JSON ▾</Text>
              <Text dim color={c.dim}>Wrap</Text>
              <Box backgroundColor={c.red} paddingX={1}>
                <Text color={c.panel} bold>X</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom status strip */}
      <Box flexDirection="row" paddingX={1} gap={2} alignItems="center">
        <Text color={c.accent}>↑ Focus previous</Text>
        <Text color={c.accent}>^j</Text><Text color={c.fg}>Send</Text>
        <Text color={c.accent}>^t</Text><Text color={c.fg}>Method</Text>
        <Text color={c.accent}>^s</Text><Text color={c.fg}>Save</Text>
        <Text color={c.accent}>^n</Text><Text color={c.fg}>New</Text>
        <Text color={c.accent}>^p</Text><Text color={c.fg}>Commands</Text>
        <Text color={c.accent}>^o</Text><Text color={c.fg}>Jump</Text>
      </Box>

      <Footer
        bindings={[
          { key: "j/k", label: "endpoint" },
          { key: "h/l 1–6", label: `tab (${tab})` },
          { key: "m", label: `method (${method})` },
          { key: "s/Enter", label: "send" },
          { key: "q/Esc", label: "back" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
