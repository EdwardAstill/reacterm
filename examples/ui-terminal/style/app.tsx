/**
 * Terminal STYLE GUIDE — token + component reference.
 *
 * Use this when you're building a TUI and need to copy the look: which
 * glyphs we use for borders, which button variants exist, the palette,
 * typography, input affordances, cards, and alerts.
 *
 * For the interactive feature explorer, see `../showcase/app.tsx`.
 */

import React, { useState } from "react";
import {
  render,
  Box,
  Text,
  Footer,
  ScrollView,
  useInput,
  useApp,
  useTerminal,
} from "../../../src/index.js";
import { THEMES, renderButton, type TuiTheme, type ButtonStyle } from "../themes";

let chosenCode = 0;

function ThemeSidebar({
  themes,
  activeId,
  focused,
  focusIdx,
  theme,
}: {
  themes: TuiTheme[];
  activeId: string;
  focused: boolean;
  focusIdx: number;
  theme: TuiTheme;
}) {
  return (
    <Box
      flexDirection="column"
      width={22}
      borderStyle={theme.borderStyle}
      borderColor={focused ? theme.colors.borderFocus : theme.colors.border}
      paddingX={1}
      paddingTop={1}
    >
      <Text bold color={theme.colors.accent}>UI TUI</Text>
      <Text dim color={theme.colors.dim}>{themes.length} themes</Text>
      <Box height={1} />
      <ScrollView flex={1}>
        {themes.map((t, i) => {
          const isActive = t.id === activeId;
          const isFocused = focused && i === focusIdx;
          return (
            <Box key={t.id} flexDirection="row" alignItems="center">
              <Text
                color={isActive ? theme.colors.selected : theme.colors.fg}
                backgroundColor={
                  isActive ? theme.colors.selectedBg :
                  isFocused ? theme.colors.border : undefined
                }
                bold={isActive || isFocused}
              >
                {" "}{t.emoji} {t.name.padEnd(14)}
              </Text>
            </Box>
          );
        })}
      </ScrollView>
    </Box>
  );
}

function StyleSection({
  title,
  theme,
  children,
}: {
  title: string;
  theme: TuiTheme;
  children: React.ReactNode;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle={theme.borderStyle}
      borderColor={theme.colors.border}
      paddingX={1}
      paddingTop={1}
      paddingBottom={1}
    >
      <Text bold color={theme.colors.accent}>{title}</Text>
      <Box height={1} />
      {children}
    </Box>
  );
}

function Swatch({ label, color, theme }: { label: string; color: string; theme: TuiTheme }) {
  return (
    <Box flexDirection="column" marginRight={2}>
      <Text color={theme.colors.bg} backgroundColor={color} bold>
        {"       "}
      </Text>
      <Text color={theme.colors.bg} backgroundColor={color}>
        {"       "}
      </Text>
      <Text color={theme.colors.fg}>{label.padEnd(9)}</Text>
      <Text dim color={theme.colors.dim}>{color}</Text>
    </Box>
  );
}

function StyleGuideView({ theme }: { theme: TuiTheme }) {
  const c = theme.colors;
  const allButtonStyles: ButtonStyle[] = ["plain", "bracket", "brace", "angle", "fill", "shaded", "double"];
  const allBorders: { name: string; style: "round" | "single" | "double" | "heavy" | "ascii" | "storm" }[] = [
    { name: "round", style: "round" },
    { name: "single", style: "single" },
    { name: "double", style: "double" },
    { name: "heavy", style: "heavy" },
    { name: "ascii", style: "ascii" },
    { name: "storm", style: "storm" },
  ];

  return (
    <ScrollView flex={1}>
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          <Text bold color={c.accent}>◇ STYLE GUIDE · {theme.name.toUpperCase()}</Text>
          <Text dim color={c.dim}>{theme.description}</Text>
          <Text dim color={c.dim}>
            border: {theme.borderStyle}  ·  button: {theme.buttonStyle}  ·  corners: {theme.cornerLabel}
          </Text>
        </Box>

        <StyleSection title="COLOUR TOKENS" theme={theme}>
          <Box flexDirection="row" flexWrap="wrap">
            <Swatch label="bg"       color={c.bg}          theme={theme} />
            <Swatch label="fg"       color={c.fg}          theme={theme} />
            <Swatch label="accent"   color={c.accent}      theme={theme} />
            <Swatch label="accentAlt" color={c.accentAlt}  theme={theme} />
            <Swatch label="border"   color={c.border}      theme={theme} />
            <Swatch label="focus"    color={c.borderFocus} theme={theme} />
            <Swatch label="selected" color={c.selectedBg}  theme={theme} />
            <Swatch label="dim"      color={c.dim}         theme={theme} />
            <Swatch label="success"  color={c.success}     theme={theme} />
            <Swatch label="warning"  color={c.warning}     theme={theme} />
            <Swatch label="error"    color={c.error}       theme={theme} />
          </Box>
        </StyleSection>

        <StyleSection title="TYPOGRAPHY" theme={theme}>
          <Text bold color={c.fg}>Bold heading</Text>
          <Text color={c.fg}>Regular body text — the quick brown fox jumps over the lazy dog.</Text>
          <Text dim color={c.dim}>Dim helper text — use for secondary info.</Text>
          <Text color={c.accent}>Accent label — highlights.</Text>
          <Text color={c.fg} backgroundColor={c.selectedBg} bold>Highlighted / selected</Text>
          <Box flexDirection="row" gap={2}>
            <Text color={c.success}>✓ success</Text>
            <Text color={c.warning}>⚠ warning</Text>
            <Text color={c.error}>✕ error</Text>
          </Box>
        </StyleSection>

        <StyleSection title="BUTTONS  (★ = active theme style)" theme={theme}>
          <Box flexDirection="column" gap={1}>
            {allButtonStyles.map((bs) => {
              const isActive = bs === theme.buttonStyle;
              const normal = renderButton("Button", bs);
              const label = `${bs.padEnd(8)} ${isActive ? "★" : " "}  `;
              return (
                <Box key={bs} flexDirection="row" gap={1} alignItems="center">
                  <Text dim={!isActive} bold={isActive} color={isActive ? c.accent : c.dim}>
                    {label}
                  </Text>
                  <Text color={c.selected} backgroundColor={c.accent} bold>{normal}</Text>
                  <Text color={c.fg} backgroundColor={c.border}>{normal}</Text>
                  <Text color={c.fg}>{normal}</Text>
                  <Text dim color={c.dim}>{normal}</Text>
                </Box>
              );
            })}
            <Box height={1} />
            <Text dim color={c.dim}>
              columns: primary · secondary · ghost · disabled
            </Text>
          </Box>
        </StyleSection>

        <StyleSection title="BORDERS & BOXES  (★ = active)" theme={theme}>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {allBorders.map(({ name, style }) => {
              const isActive = style === theme.borderStyle;
              return (
                <Box
                  key={name}
                  flexDirection="column"
                  borderStyle={style}
                  borderColor={isActive ? c.borderFocus : c.border}
                  paddingX={1}
                  marginRight={1}
                  marginBottom={1}
                >
                  <Text bold={isActive} color={isActive ? c.accent : c.fg}>
                    {name}{isActive ? " ★" : ""}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </StyleSection>

        <StyleSection title="INPUTS & FIELDS" theme={theme}>
          <Box flexDirection="column" gap={1}>
            <Box flexDirection="row" gap={2}>
              <Text dim color={c.dim}>Search </Text>
              <Box borderStyle={theme.borderStyle} borderColor={c.border} paddingX={1}>
                <Text color={c.fg}>/ search invoices…</Text>
              </Box>
            </Box>
            <Box flexDirection="row" gap={2}>
              <Text dim color={c.dim}>Filled </Text>
              <Box borderStyle={theme.borderStyle} borderColor={c.borderFocus} paddingX={1}>
                <Text color={c.fg}>Invoice #12345_</Text>
              </Box>
            </Box>
            <Box flexDirection="row" gap={2}>
              <Text dim color={c.dim}>Error  </Text>
              <Box borderStyle={theme.borderStyle} borderColor={c.error} paddingX={1}>
                <Text color={c.error}>field required</Text>
              </Box>
            </Box>
            <Box flexDirection="row" gap={2}>
              <Text color={c.accent}>[x]</Text><Text color={c.fg}> Enable grid</Text>
              <Text color={c.dim}>[ ]</Text><Text color={c.dim}> Optional</Text>
              <Text color={c.accent}>(●)</Text><Text color={c.fg}> Selected</Text>
              <Text color={c.dim}>( )</Text><Text color={c.dim}> Unselected</Text>
            </Box>
          </Box>
        </StyleSection>

        <StyleSection title="CARDS" theme={theme}>
          <Box flexDirection="row" gap={1}>
            <Box
              flexDirection="column"
              borderStyle={theme.borderStyle}
              borderColor={c.border}
              paddingX={1}
              paddingTop={1}
              width={26}
            >
              <Text bold color={c.fg}>Content card</Text>
              <Text dim color={c.dim}>Lorem ipsum dolor sit amet.</Text>
              <Box height={1} />
              <Box flexDirection="row" gap={1}>
                <Text dim color={c.dim}>status:</Text>
                <Text color={c.accent}>active</Text>
              </Box>
            </Box>
            <Box
              flexDirection="column"
              borderStyle={theme.borderStyle}
              borderColor={c.borderFocus}
              paddingX={1}
              paddingTop={1}
              width={30}
            >
              <Box flexDirection="row" justifyContent="space-between">
                <Text bold color={c.fg}>Interactive</Text>
                <Text color={c.accent}>●</Text>
              </Box>
              <Text dim color={c.dim}>Click effects, actions.</Text>
              <Box height={1} />
              <Box flexDirection="row" gap={1}>
                <Text color={c.fg}>{renderButton("Cancel", theme.buttonStyle)}</Text>
                <Text color={c.selected} backgroundColor={c.accent} bold>
                  {renderButton("Confirm", theme.buttonStyle)}
                </Text>
              </Box>
            </Box>
            <Box
              flexDirection="column"
              borderStyle={theme.borderStyle}
              borderColor={c.border}
              paddingX={1}
              paddingTop={1}
              width={22}
            >
              <Text dim color={c.dim}>revenue</Text>
              <Text bold color={c.fg}>$56,000</Text>
              <Text color={c.success}>+12.8%</Text>
            </Box>
          </Box>
        </StyleSection>

        <StyleSection title="ALERTS" theme={theme}>
          <Box flexDirection="column" gap={0}>
            <Text color={c.success}>✓ Success — your changes have been saved.</Text>
            <Text color={c.accent}>ⓘ Info — new updates available.</Text>
            <Text color={c.warning}>⚠ Warning — this cannot be undone.</Text>
            <Text color={c.error}>✕ Error — could not reach the server.</Text>
          </Box>
        </StyleSection>
      </Box>
    </ScrollView>
  );
}

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();

  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx]!;

  useInput((e) => {
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "escape" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "j" || e.key === "down") setThemeIdx(i => (i + 1) % THEMES.length);
    else if (e.key === "k" || e.key === "up") setThemeIdx(i => (i - 1 + THEMES.length) % THEMES.length);
    const digitMap: Record<string, number> = { "1":0,"2":1,"3":2,"4":3,"5":4,"6":5,"7":6,"8":7 };
    if (e.char && digitMap[e.char] !== undefined && digitMap[e.char]! < THEMES.length) {
      setThemeIdx(digitMap[e.char]!);
    }
  });

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={theme.colors.bg}>
      <Box
        borderStyle={theme.borderStyle}
        borderColor={theme.colors.border}
        paddingX={1}
      >
        <Text bold color={theme.colors.accent}>STORM</Text>
        <Text dim color={theme.colors.dim}>  ·  Style Guide  ·  </Text>
        <Text color={theme.colors.fg}>{theme.name}</Text>
        <Text dim color={theme.colors.dim}>  ({theme.id})</Text>
      </Box>

      <Box flex={1} flexDirection="row">
        <ThemeSidebar
          themes={THEMES}
          activeId={theme.id}
          focused={true}
          focusIdx={themeIdx}
          theme={theme}
        />
        <Box flex={1}>
          <StyleGuideView theme={theme} />
        </Box>
      </Box>

      <Footer
        bindings={[
          { key: "j/k", label: "theme" },
          { key: "1–8", label: "jump" },
          { key: "q/Esc/b", label: "back" },
          { key: "^C", label: "quit" },
        ]}
      />
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
