/**
 * Showcase demo picker — small Storm TUI that lists the 8 demo screens
 * and exits with a code the bash dispatcher turns into a `bun run` of
 * the actual demo file.
 *
 *   30  feature     (themed feature explorer — respects the 8-theme picker)
 *   31  logbook     (ornithology HUD — red-on-black tactical vibe)
 *   32  bios95      (90s dithered menu — FOBOS vibe)
 *   33  brutalist   (cyber orange/black chat — Shadow Drifter vibe)
 *   34  flightdeck  (NASA cockpit instrument — Ad Astra vibe)
 *   35  posting     (modern textual API client — Posting vibe)
 *   36  oxide       (dark cloud shell — Oxide vibe)
 *   37  dock        (Pyseas-Dock calc panels — strip-bordered, mock data)
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
} from "../../../src/index.js";

let chosenCode = 0;

type DemoEntry = {
  code: number;
  name: string;
  label: string;
  hint: string;
};

const DEMOS: DemoEntry[] = [
  { code: 30, name: "feature",    label: "Feature Explorer", hint: "themed tree + tabbed detail (8 themes)" },
  { code: 31, name: "logbook",    label: "Logbook",          hint: "ornithology HUD       · red-on-black"    },
  { code: 32, name: "bios95",     label: "BIOS 95",          hint: "dithered 90s menu    · FOBOS"           },
  { code: 33, name: "brutalist",  label: "Brutalist",        hint: "cyber orange chat    · Shadow Drifter"  },
  { code: 34, name: "flightdeck", label: "Flightdeck",       hint: "cockpit instrument   · Ad Astra"        },
  { code: 35, name: "posting",    label: "Posting",          hint: "modern API client    · Textual purple"  },
  { code: 36, name: "oxide",      label: "Oxide Shell",      hint: "dark cloud shell     · Oxide"           },
  { code: 37, name: "dock",       label: "Dock TUI",         hint: "Pyseas-Dock panels   · mock calcs"      },
];

function Picker() {
  const { exit } = useApp();
  const { width, height } = useTerminal();
  const [idx, setIdx] = useState(0);

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down")  setIdx(i => (i + 1) % DEMOS.length);
    else if (e.key === "k" || e.key === "up") setIdx(i => (i - 1 + DEMOS.length) % DEMOS.length);
    else if (e.key === "return" || e.key === "space") { chosenCode = DEMOS[idx]!.code; exit(); }

    const digitMap: Record<string, number> = { "1":0,"2":1,"3":2,"4":3,"5":4,"6":5,"7":6,"8":7 };
    if (e.char && digitMap[e.char] !== undefined && digitMap[e.char]! < DEMOS.length) {
      chosenCode = DEMOS[digitMap[e.char]!]!.code; exit();
    }
  });

  const bg = "#0b0b0d";
  const fg = "#f4f4f5";
  const dim = "#71717a";
  const accent = "#fab387";
  const selBg = "#2e2e32";
  const border = "#525252";

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={bg}>
      <Box borderStyle="round" borderColor={border} paddingX={1}>
        <Text bold color={accent}>UI · SHOWCASE</Text>
        <Text dim color={dim}>  ·  pick a demo screen</Text>
      </Box>

      <Box flex={1} paddingX={2} paddingY={1} flexDirection="column" gap={1}>
        <Text dim color={dim}>
          Each demo = a different inspiration style. Use this as a reference
          when designing your own TUIs.
        </Text>
        <Box height={1} />

        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={accent}
          paddingX={1}
          paddingTop={1}
          paddingBottom={1}
        >
          {DEMOS.map((d, i) => {
            const isFocused = i === idx;
            return (
              <Box key={d.code} flexDirection="row" alignItems="center" gap={1}>
                <Text
                  color={isFocused ? "#0b0b0d" : dim}
                  backgroundColor={isFocused ? selBg : undefined}
                  bold={isFocused}
                >
                  {isFocused ? " ▶ " : "   "}
                </Text>
                <Text color={isFocused ? accent : dim} bold={isFocused}>
                  [{i + 1}]
                </Text>
                <Text
                  color={isFocused ? fg : fg}
                  backgroundColor={isFocused ? selBg : undefined}
                  bold={isFocused}
                >
                  {` ${d.label.padEnd(18)} `}
                </Text>
                <Text dim color={dim}>{d.hint}</Text>
              </Box>
            );
          })}
        </Box>

        <Box height={1} />
        <Text dim color={dim}>
          Skip this menu: <Text color={accent}>ui tui showcase feature</Text>,
          {" "}<Text color={accent}>logbook</Text>,
          {" "}<Text color={accent}>bios95</Text>,
          {" "}<Text color={accent}>brutalist</Text>,
          {" "}<Text color={accent}>flightdeck</Text>,
          {" "}<Text color={accent}>posting</Text>,
          {" "}<Text color={accent}>oxide</Text>.
        </Text>
      </Box>

      <Footer
        bindings={[
          { key: "↑/↓ j/k", label: "move" },
          { key: "1–7", label: "pick" },
          { key: "Enter", label: "open" },
          { key: "q/Esc/b", label: "back" },
          { key: "^C", label: "quit" },
        ]}
      />
    </Box>
  );
}

render(<Picker />).waitUntilExit().then(() => process.exit(chosenCode));
