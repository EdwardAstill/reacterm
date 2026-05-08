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

function ChartsSection(): React.ReactElement {
  const theme = useTheme();
  const sparkRef = useRef<number[]>(Array.from({ length: 40 }, () => 30 + Math.random() * 50));
  const cpuRef = useRef(45);
  const memRef = useRef(62);
  const tickRef = useRef(0);
  const { requestRender } = useTui();

  useTick(120, () => {
    tickRef.current++;
    sparkRef.current = [
      ...sparkRef.current.slice(1),
      Math.max(5, Math.min(100, sparkRef.current[sparkRef.current.length - 1]! + (Math.random() - 0.5) * 18)),
    ];
    cpuRef.current = Math.max(10, Math.min(95, cpuRef.current + (Math.random() - 0.5) * 8));
    memRef.current = Math.max(20, Math.min(95, memRef.current + (Math.random() - 0.5) * 4));
    requestRender();
  });

  const cpu = Math.round(cpuRef.current);
  const mem = Math.round(memRef.current);

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Live charts</Text>
      <Text color={theme.colors.text.dim}>
        Imperative tick → ref mutation → requestRender(). No React state churn at 60fps.
      </Text>

      <Box flexDirection="column" gap={1} marginTop={1}>
        <Box flexDirection="column">
          <Text color={theme.colors.text.secondary}>Throughput (ops/s)</Text>
          <Sparkline data={sparkRef.current} width={50} height={4} color={theme.colors.info} />
        </Box>

        <Box flexDirection="row" gap={3}>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>CPU {cpu}%</Text>
            <Gauge
              value={cpu}
              width={20}
              thresholds={[
                { value: 80, color: theme.colors.error },
                { value: 60, color: theme.colors.warning },
                { value: 0,  color: theme.colors.success },
              ]}
              showValue
            />
          </Box>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>Memory {mem}%</Text>
            <Gauge
              value={mem}
              width={20}
              thresholds={[
                { value: 80, color: theme.colors.error },
                { value: 60, color: theme.colors.warning },
                { value: 0,  color: theme.colors.success },
              ]}
              showValue
            />
          </Box>
        </Box>

        <Box flexDirection="row" gap={3} marginTop={1}>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>BarChart — task durations</Text>
            <BarChart
              bars={[
                { label: "build",  value: 42 },
                { label: "test",   value: 78 },
                { label: "deploy", value: 31 },
                { label: "lint",   value: 56 },
                { label: "fmt",    value: 19 },
              ]}
              width={28}
              height={6}
              showValues
            />
          </Box>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>LineChart — multi-series</Text>
            <LineChart
              series={[
                { name: "p50", data: Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i / 2) * 10), color: theme.colors.info },
                { name: "p99", data: Array.from({ length: 20 }, (_, i) => 60 + Math.cos(i / 2) * 15), color: theme.colors.warning },
              ]}
              width={28}
              height={6}
            />
          </Box>
        </Box>

        <Box flexDirection="row" gap={3} marginTop={1}>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>AreaChart — fill</Text>
            <AreaChart
              series={[{
                name: "load",
                data: Array.from({ length: 20 }, (_, i) => 40 + Math.sin(i / 2) * 25),
                color: theme.colors.success,
              }]}
              width={28}
              height={6}
            />
          </Box>
          <Box flexDirection="column">
            <Text color={theme.colors.text.secondary}>Histogram — frequency</Text>
            <Histogram
              data={Array.from({ length: 200 }, () => Math.random() * 100 + Math.random() * 100)}
              bins={10}
              width={28}
              height={6}
            />
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color={theme.colors.text.secondary}>Heatmap — 2D matrix</Text>
          <Heatmap
            data={Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 12 }, (_, c) => Math.sin(r * 0.6) + Math.cos(c * 0.4))
            )}
            width={36}
          />
        </Box>
      </Box>
    </Box>
  );
}

// ── AI ──────────────────────────────────────────────────────────────────
function AiSection({ pushToast: toast }: { pushToast: (msg: string, type?: "info" | "success" | "warning" | "error") => void }): React.ReactElement {
  const theme = useTheme();
  const { width } = useTerminal();
  const [running, setRunning] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const startRef = useRef(0);
  const tick = useTick(100, () => {}, { active: running });
  const t = running ? tick - startRef.current : 0;
  const contentWidth = Math.max(40, width - 24);
  const wide = contentWidth >= 92;
  const contextUsed = Math.min(190_000, t * 1500 + 8_000);
  const inputTokens = Math.min(8_000, t * 80);
  const outputTokens = Math.min(2_400, t * 24);
  const totalTokens = Math.min(10_400, t * 104);

  const startSession = () => {
    if (running) return;
    setRunning(true);
    startRef.current = tick;
    setShowApproval(false);
  };

  useInput((e) => {
    if (e.key === "r" && !running) {
      e.consumed = true;
      startSession();
    }
  });

  useEffect(() => {
    if (running && t > 32 && !showApproval) {
      setShowApproval(true);
    }
  }, [running, showApproval, t]);

  const statusFor = (start: number, done: number): OpNode["status"] => {
    if (!running) return "pending";
    if (t >= done) return "completed";
    if (t >= start) return "running";
    return "pending";
  };

  const ops: OpNode[] = [
    { id: "1", label: "Read auth.ts", status: statusFor(0, 4), ...(running && t >= 4 ? { durationMs: 340 } : {}) },
    { id: "2", label: "Static analysis", status: statusFor(4, 15), ...(running && t >= 15 ? { durationMs: 1500 } : {}) },
    { id: "3", label: "Generate patch", status: statusFor(15, 28), ...(running && t >= 28 ? { durationMs: 1300 } : {}) },
    { id: "4", label: "Wait for approval", status: running && t > 32 ? "running" : "pending" },
  ];

  const text = "Found a clock-skew bug in token refresh. Adding a 30s safety buffer and retry-with-backoff. Need approval to write the patch.";

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} flex={1} overflow="hidden">
      <Box flexDirection="row" alignItems="center">
        <Text bold color={theme.colors.brand.primary}>AI agent flow</Text>
        <Text color={theme.colors.text.dim}>  </Text>
        <Badge label={running ? "running" : "idle"} variant={running ? "success" : "outline"} />
      </Box>
      <Text color={theme.colors.text.dim}>
        Press <Text bold color={theme.colors.brand.primary}>r</Text> or click Run. Approval accepts <Text bold>y</Text>/<Text bold>n</Text>/<Text bold>a</Text>.
      </Text>

      <ScrollView flex={1} scrollSpeed={3} scrollbarGutter={0}>
        <Box flexDirection="column" gap={1} paddingRight={1}>
          <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
            <Box flexDirection="row" gap={2}>
              <ModelBadge model="claude-opus-4-7" provider="anthropic" />
              <TokenStream
                tokens={totalTokens}
                inputTokens={inputTokens}
                outputTokens={outputTokens}
                tokensPerSecond={running ? 24 : 0}
                streaming={running}
              />
            </Box>
            <Box flexDirection="row" gap={2}>
              <Text color={theme.colors.text.secondary}>Context</Text>
              <ContextWindow used={contextUsed} limit={200_000} barWidth={wide ? 22 : 14} compact />
            </Box>
            <Box flexDirection="row" gap={2}>
              <Text color={theme.colors.text.secondary}>Cost</Text>
              <CostTracker
                inputTokens={inputTokens}
                outputTokens={outputTokens}
                renderCost={(cost, currency) => (
                  <Text bold color={cost > 0.1 ? theme.colors.warning : theme.colors.success}>
                    {currency}{cost.toFixed(4)}
                  </Text>
                )}
              />
              <Text color={theme.colors.text.dim}>input {inputTokens} · output {outputTokens}</Text>
            </Box>
          </Box>

          <Box flexDirection={wide ? "row" : "column"} gap={1}>
            <Box flexDirection="column" flex={1} borderStyle="round" borderColor={running ? theme.colors.brand.primary : theme.colors.divider} paddingX={1}>
              <Text bold color={theme.colors.text.primary}>Conversation</Text>
              {!running ? (
                <Box flexDirection="column" gap={1}>
                  <Text color={theme.colors.text.dim}>Ready. Streams reply, runs tests, awaits approval.</Text>
                  <Box flexDirection="row" gap={2}>
                    <Clickable onClick={startSession}
                      borderStyle="round" borderColor={theme.colors.brand.primary} paddingX={1}>
                      <Text bold color={theme.colors.brand.primary}>▶ Run agent</Text>
                    </Clickable>
                    <Box flexDirection="row" alignItems="center">
                      <Text color={theme.colors.text.secondary}>key </Text>
                      <Kbd>r</Kbd>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box flexDirection="column" gap={1}>
                  <MessageBubble role="user">Fix the bug in auth.ts</MessageBubble>
                  <MessageBubble role="assistant">
                    <StreamingText text={text} streaming={t < 20} animate speed={3} />
                  </MessageBubble>
                  {t > 18 && (
                    <CommandBlock
                      command="$ bun test src/auth.test.ts"
                      exitCode={0}
                      duration={2700}
                      output={
                        <Text color={theme.colors.success}>
                          ✓ 12 passed · 0 failed · 2.7s
                        </Text>
                      }
                    />
                  )}
                  {showApproval && (
                    <ApprovalPrompt
                      width={Math.max(32, contentWidth - 8)}
                      tool="writeFile"
                      risk="medium"
                      params={{ path: "src/auth.ts", lines: "+9 / -2" }}
                      onSelect={(k) => {
                        toast(
                          k === "y" ? "Approved — patch applied" :
                          k === "a" ? "Auto-approve enabled" :
                          "Denied",
                          k === "n" ? "warning" : "success",
                        );
                        setRunning(false);
                        setShowApproval(false);
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            <Box
              flexDirection="column"
              {...(wide ? { width: 36 } : {})}
              borderStyle="round"
              borderColor={theme.colors.divider}
              paddingX={1}
            >
              <Text bold color={theme.colors.text.primary}>Workflow</Text>
              <OperationTree nodes={ops} showDuration />
              {!running && (
                <Box marginTop={1}>
                  <Text color={theme.colors.text.dim}>No active run.</Text>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </ScrollView>

      <Box marginTop={1} flexShrink={0}>
        <StatusLine
          model="claude-opus-4-7"
          tokens={totalTokens}
          turns={t > 0 ? 1 : 0}
          extra={{ session: "explorer" }}
        />
      </Box>
    </Box>
  );
}
const SAMPLE_CODE = `function fizzbuzz(n: number): string {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0)  return "Fizz";
  if (n % 5 === 0)  return "Buzz";
  return String(n);
}`;

const SAMPLE_DIFF = `--- a/auth.ts
+++ b/auth.ts
@@ -3,6 +3,9 @@
 export async function refresh(token: Token) {
-  if (Date.now() < token.expiresAt) {
-    return token;
-  }
+  const BUFFER = 30_000;
+  if (Date.now() < token.expiresAt - BUFFER) {
+    return token;
+  }
+  for (let i = 0; i < 3; i++) {
+    try { return await fetchNew(); }
+    catch { await sleep(1000 * (i + 1)); }
+  }
 }`;

const SAMPLE_MD = `# reacterm

> Compositor-based terminal UI framework for React.

## Features

- **Cell-level diff** — only changed cells are written.
- **Dual-speed rendering** — React for structure, \`requestRender()\` for 60fps.
- **Typed-array buffers** — zero GC pressure.

\`\`\`tsx
render(<App />).waitUntilExit();
\`\`\`
`;

type EditorMode = "edit" | "diff" | "inline" | "syntax";

interface EditorSectionProps {
  inputFocused: boolean;
  setInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

function EditorSection(props: EditorSectionProps): React.ReactElement {
  const theme = useTheme();
  const [code, setCode] = useState(SAMPLE_CODE);
  const [mode, setMode] = useState<EditorMode>("edit");
  const editorFocused = props.inputFocused;
  const setEditorFocused = props.setInputFocused;
  const before = "the quick brown fox jumps over the lazy dog";
  const after  = "the quick brown cat leaps over the sleepy dog";

  const selectMode = (nextMode: EditorMode) => {
    setMode(nextMode);
    setEditorFocused(nextMode === "edit");
  };

  useInput((e) => {
    if (mode === "edit" && editorFocused) {
      if (e.key === "escape") {
        e.consumed = true;
        setEditorFocused(false);
      }
      return;
    }

    if (e.char === "e") { e.consumed = true; selectMode("edit"); }
    else if (e.char === "1") { e.consumed = true; selectMode("edit"); }
    else if (e.char === "2") { e.consumed = true; selectMode("diff"); }
    else if (e.char === "3") { e.consumed = true; selectMode("inline"); }
    else if (e.char === "4") { e.consumed = true; selectMode("syntax"); }
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Editor & docs</Text>
      <Text color={theme.colors.text.dim}>
        1 Editor · 2 DiffView · 3 InlineDiff · 4 SyntaxHighlight
      </Text>

      <Box flexDirection="row" gap={2}>
        {(["edit", "diff", "inline", "syntax"] as const).map((m, i) => {
          const active = m === mode;
          return (
            <Clickable
              key={m}
              onClick={() => selectMode(m)}
              borderStyle={active ? "double" : "round"}
              borderColor={active ? theme.colors.brand.primary : theme.colors.divider}
              paddingX={1}
            >
              <Text bold={active} color={active ? theme.colors.brand.primary : theme.colors.text.secondary}>
                {`${i + 1} ${m}`}
              </Text>
            </Clickable>
          );
        })}
      </Box>

      {mode === "edit" && (
        <Box flexDirection="row" gap={2}>
          <Box flexDirection="column" flex={1}>
            <Editor
              title="fizzbuzz.ts"
              language="typescript"
              value={code}
              onChange={setCode}
              rows={10}
              isFocused={mode === "edit" && editorFocused}
              footer={editorFocused
                ? "live edit • Esc releases • Tab indents"
                : "paused • e focuses editor • 1-4 switch views"}
            />
          </Box>
          <Box flexDirection="column" flex={1}>
            <Text bold color={theme.colors.text.primary}>MarkdownViewer (TOC + scroll)</Text>
            <MarkdownViewer content={SAMPLE_MD} showToc={false} />
            <Box height={1} />
            <Text bold color={theme.colors.text.primary}>Markdown (inline)</Text>
            <Markdown content="**bold** _italic_ `code` [link](#)" />
          </Box>
        </Box>
      )}

      {mode === "diff" && (
        <Box flexDirection="column">
          <Text color={theme.colors.text.dim}>Unified diff with line numbers</Text>
          <DiffView diff={SAMPLE_DIFF} filePath="src/auth.ts" />
        </Box>
      )}

      {mode === "inline" && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.colors.text.dim}>Word-level inline diff</Text>
          <InlineDiff before={before} after={after} />
          <Box height={1} />
          <Text color={theme.colors.text.secondary}>before:</Text>
          <Text color={theme.colors.text.dim}>{before}</Text>
          <Text color={theme.colors.text.secondary}>after:</Text>
          <Text color={theme.colors.text.dim}>{after}</Text>
        </Box>
      )}

      {mode === "syntax" && (
        <Box flexDirection="column">
          <Text color={theme.colors.text.dim}>SyntaxHighlight component</Text>
          <SyntaxHighlight code={code} language="typescript" />
        </Box>
      )}
    </Box>
  );
}

// ── Effects ─────────────────────────────────────────────────────────────
function EffectsSection(): React.ReactElement {
  const theme = useTheme();
  const [showT, setShowT] = useState(true);
  const [count, setCount] = useState(3);
  const tick = useTick(1000, () => {});
  useInput((e) => {
    if (e.char === "x") { e.consumed = true; setShowT((v) => !v); }
    if (e.char === "+") { e.consumed = true; setCount((c) => Math.min(5, c + 1)); }
    if (e.char === "-") { e.consumed = true; setCount((c) => Math.max(1, c - 1)); }
  });

  const diagramNodes: DiagramNode[] = [
    { id: "react", label: "React", width: 10 },
    { id: "layout", label: "Layout", width: 10 },
    { id: "diff", label: "Diff", width: 10 },
  ];
  const diagramEdges: DiagramEdge[] = [
    { from: "react", to: "layout" },
    { from: "layout", to: "diff" },
  ];
  const canvasNodes: CanvasNode[] = [
    {
      id: "canvas-root",
      type: "container",
      label: "Canvas",
      status: "running",
      direction: "horizontal",
      gap: 3,
      children: [
        { id: "paint", type: "badge", label: "paint", status: "info" },
        { id: "cell-diff", type: "badge", label: "diff", status: "success" },
      ],
    },
  ];
  const canvasEdges: CanvasEdge[] = [
    { from: "paint", to: "cell-diff", style: "dashed", label: "cells" },
  ];
  const progressValue = 48 + ((tick * 9) % 37);
  const label = (name: string) => (
    <Text bold color={theme.colors.text.secondary}>{name}</Text>
  );

  return (
    <ScrollView flex={1} scrollSpeed={3} scrollbarGutter={0}>
      <Box flexDirection="column" gap={1} paddingX={1} paddingY={1}>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <Text bold color={theme.colors.brand.primary}>Visual effects</Text>
          <Badge label={showT ? "visible" : "hidden"} variant={showT ? "success" : "outline"} />
          <Spacer />
          <Kbd>x</Kbd>
          <Text color={theme.colors.text.dim}>toggle transition</Text>
          <Kbd>+/-</Kbd>
          <Text color={theme.colors.text.dim}>presence count</Text>
        </Box>

        <Box flexDirection="column" gap={1} marginTop={1}>
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={theme.colors.brand.primary}
            paddingX={1}
          >
            <Text bold color={theme.colors.brand.primary}>Paint</Text>

            {label("Gradient")}
            <Gradient colors={["#82AAFF", "#F7768E", "#FBBF24"]}>REACTERM</Gradient>

            {label("GradientBorder")}
            <GradientBorder colors={["#82AAFF", "#F7768E"]} width={20}>
              <Text color={theme.colors.text.primary}>multi-color</Text>
            </GradientBorder>

            {label("GradientProgress")}
            <GradientProgress
              value={progressValue}
              width={16}
              colors={["#82AAFF", "#BB9AF7", "#9ECE6A"]}
              showPercentage
            />

            {label("GlowText")}
            <GlowText animate intensity="high">Glowing text</GlowText>
          </Box>

          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={theme.colors.success}
            paddingX={1}
          >
            <Text bold color={theme.colors.success}>Motion</Text>

            {label("Transition")}
            <Transition show={showT} type="slide-right">
              <Box borderStyle="round" borderColor={theme.colors.success} paddingX={1}>
                <Text color={theme.colors.success}>sliding panel</Text>
              </Box>
            </Transition>

            {label("RevealTransition")}
            <RevealTransition visible={showT} type="charge">
              <Box paddingX={1}>
                <Text color={theme.colors.brand.primary}>charged reveal</Text>
              </Box>
            </RevealTransition>

            {label(`AnimatePresence ${count}`)}
            <AnimatePresence>
              {Array.from({ length: count }).map((_, i) => (
                <Box key={i} flexDirection="row" gap={1}>
                  <Text color={theme.colors.info}>·</Text>
                  <Text color={theme.colors.text.primary}>item {i + 1}</Text>
                </Box>
              ))}
            </AnimatePresence>
          </Box>

          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={theme.colors.info}
            paddingX={1}
          >
            <Text bold color={theme.colors.info}>Readouts</Text>

            {label("Digits")}
            <Digits value={new Date().toTimeString().slice(0, 5)} />

            {label("Canvas")}
            <Canvas
              nodes={canvasNodes}
              edges={canvasEdges}
              direction="vertical"
              borderStyle="round"
              padding={1}
            />

            {label("Diagram")}
            <Diagram
              nodes={diagramNodes}
              edges={diagramEdges}
              direction="horizontal"
              nodeStyle="round"
              gapX={3}
            />
          </Box>
        </Box>
      </Box>
    </ScrollView>
  );
}

export { ChartsSection, AiSection, EditorSection, EffectsSection };
