/**
 * Tiny chooser TUI. Run by `bin/ui` with no subcommand (or `ui tui` /
 * `ui web`); user arrows + enter to pick one of the four views, and the
 * process exits with a code the bash dispatcher reads to launch the real
 * thing:
 *
 *   10  terminal showcase
 *   11  terminal style
 *   20  web showcase
 *   21  web style
 *    1  cancel
 */

import React, { useState } from "react";
import {
  render,
  Box,
  Text,
  Footer,
  useInput,
  useApp,
  useTerminal,
} from "../../src/index.js";
import { THEMES } from "./themes";

let chosenCode = 0;

type Choice = {
  code: number;
  platform: "terminal" | "web";
  kind: "showcase" | "style";
  label: string;
  hint: string;
};

const CHOICES: Choice[] = [
  { code: 10, platform: "terminal", kind: "showcase", label: "Terminal · Showcase",  hint: "interactive TUI feature explorer" },
  { code: 11, platform: "terminal", kind: "style",    label: "Terminal · Style Guide", hint: "tokens, borders, buttons, cards" },
  { code: 20, platform: "web",      kind: "showcase", label: "Web · Showcase",       hint: "23 themed dashboard mockups"       },
  { code: 21, platform: "web",      kind: "style",    label: "Web · Style Guide",    hint: "tokens + components in browser"    },
];

function parseFilter(): "terminal" | "web" | "all" {
  const g = globalThis as any;
  const argv: string[] = g.process?.argv ?? (g.Bun?.argv ?? []);
  for (const a of argv) {
    if (a === "--filter=terminal") return "terminal";
    if (a === "--filter=web") return "web";
  }
  return "all";
}

function Menu() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const filter = parseFilter();

  const items = filter === "all"
    ? CHOICES
    : CHOICES.filter(c => c.platform === filter);

  const theme = THEMES[0]!;
  const c = theme.colors;

  const [idx, setIdx] = useState(0);

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape") { exit(); return; }
    if (e.key === "j" || e.key === "down") setIdx(i => (i + 1) % items.length);
    else if (e.key === "k" || e.key === "up") setIdx(i => (i - 1 + items.length) % items.length);
    else if (e.key === "return" || e.key === "space") {
      chosenCode = items[idx]!.code; exit();
    }
    const digitMap: Record<string, number> = { "1":0,"2":1,"3":2,"4":3 };
    if (e.char && digitMap[e.char] !== undefined && digitMap[e.char]! < items.length) {
      chosenCode = items[digitMap[e.char]!]!.code; exit();
    }
  });

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={c.bg}>
      <Box
        borderStyle={theme.borderStyle}
        borderColor={c.border}
        paddingX={1}
      >
        <Text bold color={c.accent}>UI</Text>
        <Text dim color={c.dim}>  ·  living style reference  ·  pick a view</Text>
      </Box>

      <Box flex={1} paddingX={2} paddingY={1} flexDirection="column" gap={1}>
        <Text dim color={c.dim}>
          This repo shows what your apps should look like. Pick a target:
        </Text>
        <Box height={1} />

        <Box
          flexDirection="column"
          borderStyle={theme.borderStyle}
          borderColor={c.borderFocus}
          paddingX={1}
          paddingTop={1}
          paddingBottom={1}
        >
          {items.map((it, i) => {
            const isFocused = i === idx;
            const platformTag = it.platform === "terminal" ? "TUI" : "WEB";
            return (
              <Box key={it.code} flexDirection="row" alignItems="center" gap={1}>
                <Text
                  color={isFocused ? c.selected : c.dim}
                  backgroundColor={isFocused ? c.selectedBg : undefined}
                  bold={isFocused}
                >
                  {isFocused ? " ▶ " : "   "}
                </Text>
                <Text
                  color={isFocused ? c.accent : c.dim}
                  bold={isFocused}
                >
                  [{i + 1}]
                </Text>
                <Text
                  color={isFocused ? c.selected : c.fg}
                  backgroundColor={isFocused ? c.selectedBg : undefined}
                  bold={isFocused}
                >
                  {` ${platformTag}  ${it.label.padEnd(24)} `}
                </Text>
                <Text dim color={c.dim}>{it.hint}</Text>
              </Box>
            );
          })}
        </Box>

        <Box height={1} />
        <Text dim color={c.dim}>
          Or skip this menu: <Text color={c.accent}>ui tui showcase</Text>,
          {" "}<Text color={c.accent}>ui tui style</Text>,
          {" "}<Text color={c.accent}>ui web showcase</Text>,
          {" "}<Text color={c.accent}>ui web style</Text>.
        </Text>
      </Box>

      <Footer
        bindings={[
          { key: "↑/↓ j/k", label: "move" },
          { key: "1–4", label: "pick" },
          { key: "Enter", label: "open" },
          { key: "q/Esc", label: "quit" },
        ]}
      />
    </Box>
  );
}

render(<Menu />).waitUntilExit().then(() => process.exit(chosenCode));
