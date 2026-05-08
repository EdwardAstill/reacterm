import React, { useEffect, useRef, useState } from "react";
import {
  Box, Text, Spacer,
  Spinner, Badge, Divider, ProgressBar, Tag, Kbd,
  TextInput, TextArea, Switch, Checkbox, RadioGroup, Button,
  MaskedInput, ChatInput, Select,
  ScrollView, ListView, Modal, Overlay, OverlayProvider, KeyboardHelp, Toast,
  Stepper, Heading, Calendar, DatePicker, EventCalendar,
  SearchList,
  Tree, TreeTable, RichLog, Pretty, DefinitionList,
  OrderedList, UnorderedList,
  Sparkline, Gauge, BarChart, LineChart, AreaChart, Heatmap, Histogram,
  OperationTree, StreamingText, ApprovalPrompt, MessageBubble,
  ShimmerText, BlinkDot, ContextWindow, CostTracker, ModelBadge,
  StatusLine, TokenStream, CommandBlock,
  Editor, Markdown, MarkdownViewer, DiffView, InlineDiff, SyntaxHighlight,
  Transition, AnimatePresence, GlowText, GradientBorder, Gradient,
  GradientProgress, RevealTransition,
  Digits, Diagram, Canvas,
  validateContrast, contrastRatio,
  LocaleProvider, formatNumber, i18nT, plural,
  PLURAL_EN, PLURAL_AR, PLURAL_FR, PLURAL_RU, PLURAL_JA,
  useTui, useTerminal, useInput, useTick, useMousePosition,
  useUndoRedo, useHotkey, useConfirmAction, useWizard,
  usePersistentState, memoryStorage,
  useTextCycler, useEasedInterval,
  useAnnounce,
  detectTerminal, detectImageCaps, bestColorDepth,
  useTheme, useEventCalendarBehavior,
} from "../demo-kit.js";
import type {
  SelectOption,
  TreeNode,
  TreeTableRow,
  OpNode,
  DiagramNode,
  DiagramEdge,
  CanvasNode,
  CanvasEdge,
  Locale,
  StormColors,
} from "../demo-kit.js";
import { THEMES, PERSONALITY_PRESETS } from "../catalog.js";
import { Clickable } from "../shared.js";

function WelcomeSection(): React.ReactElement {
  const theme = useTheme();
  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Box flexDirection="row" gap={2} alignItems="center">
        <Text bold color={theme.colors.brand.primary}>REACTERM</Text>
        <Badge label="LIVE" variant="success" />
        <Spinner type="dots" color={theme.colors.brand.primary} />
      </Box>
      <Text color={theme.colors.text.dim}>
        An interactive tour of every major reacterm capability — keyboard, mouse, layout, theming.
      </Text>

      <Box flexDirection="row" gap={4} marginTop={1}>
        <Box flexDirection="column">
          <Text bold color={theme.colors.brand.primary}>97</Text>
          <Text color={theme.colors.text.dim}>components</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold color={theme.colors.success}>83</Text>
          <Text color={theme.colors.text.dim}>hooks</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold color={theme.colors.warning}>11</Text>
          <Text color={theme.colors.text.dim}>themes</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold color={theme.colors.info}>15</Text>
          <Text color={theme.colors.text.dim}>AI widgets</Text>
        </Box>
      </Box>

      <Divider />

      <Text bold color={theme.colors.text.primary}>Try this:</Text>
      <Text color={theme.colors.text.secondary}>  • Press <Text bold color={theme.colors.brand.primary}>Tab</Text> to advance to the next section.</Text>
      <Text color={theme.colors.text.secondary}>  • Press <Text bold color={theme.colors.brand.primary}>?</Text> for the keyboard cheatsheet.</Text>
      <Text color={theme.colors.text.secondary}>  • Press <Text bold color={theme.colors.brand.primary}>t</Text> to cycle the theme; everything restyles immediately.</Text>
      <Text color={theme.colors.text.secondary}>  • Click anywhere — the Mouse section tracks the cursor live.</Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <ModelBadge model="claude-opus-4-7" provider="anthropic" />
        <BlinkDot state="streaming" />
        <Text color={theme.colors.text.dim}>22 sections · 100+ widgets · all interactive</Text>
      </Box>
    </Box>
  );
}
function MouseSection(): React.ReactElement {
  const theme = useTheme();
  const { position, isInside } = useMousePosition({ trackMoves: true });
  const [clicks, setClicks] = useState<{ x: number; y: number; button: string }[]>([]);

  useInput(() => {});

  const onClickArea = (label: string) => () => {
    setClicks((prev) => [...prev.slice(-4), { x: position.x, y: position.y, button: label }]);
  };

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Mouse tracking</Text>
      <Text color={theme.colors.text.dim}>
        useMousePosition() exposes a live ref + isInside(rect). Move the cursor; click the boxes.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Text color={theme.colors.text.secondary}>cursor:</Text>
        <Text bold color={theme.colors.info}>
          {position.ready ? `${position.x},${position.y}` : "—"}
        </Text>
        <Text color={theme.colors.text.secondary}>last button:</Text>
        <Text bold color={theme.colors.warning}>
          {position.button}
        </Text>
      </Box>

      <Box flexDirection="row" gap={2} marginTop={1}>
        {(["A", "B", "C"] as const).map((tag, i) => {
          const left = 4 + i * 14;
          const top = 12;
          const width = 12;
          const height = 4;
          const inside = isInside({ left, top, width, height });
          return (
            <Box
              key={tag}
              borderStyle={inside ? "double" : "round"}
              borderColor={inside ? theme.colors.brand.primary : theme.colors.divider}
              paddingX={2}
              paddingY={1}
            >
              <Text bold color={inside ? theme.colors.brand.primary : theme.colors.text.secondary}>
                {tag} — {inside ? "HOVER" : "idle"}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.colors.text.dim}>recent events (push: click anywhere then press space):</Text>
        {clicks.length === 0
          ? <Text color={theme.colors.text.dim} dim>  none yet</Text>
          : clicks.map((c, i) => (
              <Text key={i} color={theme.colors.text.secondary}>
                · {c.button} at ({c.x},{c.y})
              </Text>
            ))}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.text.dim}>
          (Press space to record current position as a click — the demo binds keys, not raw mouse,
          so this works in any terminal.)
        </Text>
      </Box>

      {/* Bind space to record so users without working mouse forwarding still see something. */}
      <SpaceRecorder onPress={onClickArea("space")} />
    </Box>
  );
}

function SpaceRecorder({ onPress }: { onPress: () => void }): null {
  useInput((e) => { if (e.key === "space") { e.consumed = true; onPress(); } });
  return null;
}

// ── Themes ──────────────────────────────────────────────────────────────
function ThemesSection({ themeIdx, setThemeIdx }: { themeIdx: number; setThemeIdx: (i: number) => void }): React.ReactElement {
  const theme = useTheme();
  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Themes</Text>
      <Text color={theme.colors.text.dim}>
        ←/→ to cycle. Theme is hoisted at the app root, so every section restyles instantly.
      </Text>

      <Box flexDirection="row" gap={1} marginTop={1} flexWrap="wrap">
        {THEMES.map((t, i) => {
          const active = i === themeIdx;
          return (
            <Clickable
              key={t.name}
              onClick={() => setThemeIdx(i)}
              borderStyle={active ? "double" : "round"}
              borderColor={active ? t.colors.brand.primary : theme.colors.divider}
              paddingX={1}
            >
              <Text bold={active} color={active ? t.colors.brand.primary : theme.colors.text.secondary}>
                {`${i + 1} ${t.name}`}
              </Text>
            </Clickable>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} gap={1}>
        <Text color={theme.colors.text.secondary}>Live preview:</Text>
        <Box flexDirection="row" gap={2}>
          <Badge label="info" variant="info" />
          <Badge label="success" variant="success" />
          <Badge label="warning" variant="warning" />
          <Badge label="error" variant="error" />
        </Box>
        <ProgressBar value={42} width={40} showPercent />
        <Box flexDirection="row" gap={3}>
          <Spinner type="dots"   color={theme.colors.brand.primary} />
          <Spinner type="line"   color={theme.colors.success} />
          <Spinner type="bounce" color={theme.colors.warning} />
        </Box>
      </Box>

      <ArrowThemeBinder themeIdx={themeIdx} setThemeIdx={setThemeIdx} />
    </Box>
  );
}

function ArrowThemeBinder({ themeIdx, setThemeIdx }: { themeIdx: number; setThemeIdx: (i: number) => void }): null {
  useInput((e) => {
    if (e.key === "left") { e.consumed = true; setThemeIdx((themeIdx - 1 + THEMES.length) % THEMES.length); }
    else if (e.key === "right") { e.consumed = true; setThemeIdx((themeIdx + 1) % THEMES.length); }
  });
  return null;
}
function AboutSection(): React.ReactElement {
  const theme = useTheme();
  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>About</Text>
      <Text color={theme.colors.text.dim}>
        The reacterm demo surfaces every shipped capability. The full catalog
        lives at docs/features.md.
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        <Heading level={2}>Coverage by category</Heading>
        <DefinitionList items={[
          { term: "Components",       definition: "97 across 12 categories — Box → AI widgets" },
          { term: "Hooks",            definition: "83 — essential, state, animation, input, behaviors" },
          { term: "Themes",           definition: "11 presets + extendTheme/createTheme" },
          { term: "Plugins",          definition: "5 — vim mode, compact, auto-scroll, screenshot, status bar" },
          { term: "DevTools panels",  definition: "4 — heatmap, a11y, time-travel, inspector" },
          { term: "Locales (demo)",   definition: "6 — EN / FR / DE / RU / AR / JA" },
        ]} />

        <Heading level={2}>Source pointers</Heading>
        <UnorderedList items={[
          { content: "ROADMAP.md — prioritized improvements" },
          { content: "docs/features.md — exhaustive feature catalog" },
          { content: "improvements.md — consumer-side bug log" },
          { content: "docs/plans/2026-04-29-explorer-all-features-plan.md — what built this" },
        ]} />

        <Heading level={2}>Built with</Heading>
        <OrderedList items={[
          { content: "TypeScript strict + bun + vitest" },
          { content: "react-reconciler (custom host)" },
          { content: "Pure-TS flexbox + grid (no Yoga)" },
          { content: "Optional WASM diff for 3.4× speedup" },
        ]} />
      </Box>
    </Box>
  );
}

export { WelcomeSection, MouseSection, ThemesSection, AboutSection };
