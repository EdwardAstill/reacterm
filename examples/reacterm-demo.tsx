#!/usr/bin/env npx tsx
/**
 * reacterm demo — an interactive showcase.
 *
 * One running app, 21 sections, every reacterm feature wired up so you can
 * hit a key and *do* something instead of just looking at it.
 *
 *   1 Welcome         hero stats + getting-started
 *   2 Layout          nested Panes, ScrollView, ListView
 *   3 Forms           text/textarea inputs, switch, checkbox, radio, button → toast
 *   4 Search          SearchList over a 100-item dataset (single focus owner)
 *   5 Data            DataGrid + Tree + RichLog + Pretty + scroll-to-edit table
 *   6 Charts          Sparkline + Gauge + BarChart + LineChart + AreaChart, live
 *   7 AI              StreamingText + OperationTree + ApprovalPrompt
 *   8 Mouse           useMousePosition crosshair, click coords, hover regions
 *   9 Themes          live cycle through 11 preset themes
 *  10 Editor          Editor + Markdown + DiffView + InlineDiff + SyntaxHighlight
 *  11 Effects         Transition, AnimatePresence, Shadow, Glow, Gradient, Diagram
 *  12 Anim Lab        useTextCycler, useEasedInterval, useTick imperative
 *  13 Hooks           useUndoRedo, useWizard, usePersistentState, useConfirmAction
 *  14 Behaviors       15 headless behavior hooks
 *  15 i18n            6 locales with plural rules + RTL
 *  16 DevTools        4 panels + 3 middlewares
 *  17 Plugins         5 built-in plugins
 *  18 Personality     defaultPreset / minimalPreset / hackerPreset / playfulPreset
 *  19 A11y            useAnnounce, contrastRatio, validateContrast
 *  20 Capabilities    detectTerminal, detectImageCaps, bestColorDepth
 *  21 About           catalog rendering with DefinitionList + lists
 *
 * Globals: Tab/Shift-Tab cycle sections · ? help overlay · t cycle theme · q quit
 *
 * Usage: reacterm demo
 *    or: npx tsx examples/reacterm-demo.tsx
 */

import { pathToFileURL } from "node:url";
import React, { useEffect, useRef, useState } from "react";
import {
  // shell
  render, Box, Text, Spacer,
  // primitives
  Spinner, Badge, Divider, ProgressBar, Tag, Kbd,
  // inputs
  TextInput, TextArea, Switch, Checkbox, RadioGroup, Button,
  MaskedInput, ChatInput, Select, type SelectOption,
  // composites
  ScrollView, ListView, Modal, KeyboardHelp, Toast,
  Stepper, Heading,
  // personality
  PersonalityProvider, defaultPreset, minimalPreset, hackerPreset, playfulPreset,
  type StormPersonality,
  // search (the new one)
  SearchList,
  // data
  Tree, type TreeNode, TreeTable, type TreeTableRow, RichLog, Pretty, DefinitionList,
  OrderedList, UnorderedList,
  // charts
  Sparkline, Gauge, BarChart, LineChart, AreaChart, Heatmap, Histogram,
  // ai widgets
  OperationTree, StreamingText, ApprovalPrompt, MessageBubble,
  ShimmerText, BlinkDot, ContextWindow, CostTracker, ModelBadge,
  StatusLine, TokenStream, CommandBlock,
  type OpNode,
  // editor / docs
  Editor, Markdown, MarkdownViewer, DiffView, InlineDiff, SyntaxHighlight,
  // effects
  Transition, AnimatePresence, GlowText, GradientBorder, Gradient,
  GradientProgress, RevealTransition,
  Digits, Diagram, Canvas,
  type DiagramNode, type DiagramEdge, type CanvasNode, type CanvasEdge,
  // theming
  ThemeProvider, useTheme,
  arcticTheme, midnightTheme, emberTheme, mistTheme, voltageTheme,
  duskTheme, horizonTheme, neonTheme, calmTheme, highContrastTheme, monochromeTheme,
  validateContrast, contrastRatio,
  type StormColors,
  // i18n
  LocaleProvider, formatNumber, t as i18nT, plural,
  PLURAL_EN, PLURAL_AR, PLURAL_FR, PLURAL_RU, PLURAL_JA,
  type Locale,
  // hooks: essential + state
  useTui, useTerminal, useInput, useTick, useMousePosition, useMouseTarget,
  useUndoRedo, useHotkey, useConfirmAction, useWizard,
  usePersistentState, memoryStorage,
  useTextCycler, useEasedInterval,
  useAnnounce,
  // capabilities
  detectTerminal, detectImageCaps, bestColorDepth,
} from "../src/index.js";

// ── Themes catalog ──────────────────────────────────────────────────────
const THEMES: { name: string; colors: StormColors }[] = [
  { name: "Arctic", colors: arcticTheme },
  { name: "Midnight", colors: midnightTheme },
  { name: "Ember", colors: emberTheme },
  { name: "Mist", colors: mistTheme },
  { name: "Voltage", colors: voltageTheme },
  { name: "Dusk", colors: duskTheme },
  { name: "Horizon", colors: horizonTheme },
  { name: "Neon", colors: neonTheme },
  { name: "Calm", colors: calmTheme },
  { name: "Contrast", colors: highContrastTheme },
  { name: "Mono", colors: monochromeTheme },
];

// ── Sections ────────────────────────────────────────────────────────────
// Grouped under super-sections in the sidebar. Order is also the Tab cycle order.
const SECTIONS = [
  // Tour
  { key: "welcome", label: "Welcome", icon: "✦", group: "Tour" },
  // Build
  { key: "layout",  label: "Layout",  icon: "▤", group: "Build" },
  { key: "forms",   label: "Forms",   icon: "✎", group: "Build" },
  { key: "search",  label: "Search",  icon: "⌕", group: "Build" },
  { key: "data",    label: "Data",    icon: "▦", group: "Build" },
  // Visualize
  { key: "charts",  label: "Charts",  icon: "▁", group: "Visualize" },
  { key: "ai",      label: "AI",      icon: "◆", group: "Visualize" },
  { key: "editor",  label: "Editor",  icon: "✦", group: "Visualize" },
  { key: "effects", label: "Effects", icon: "✺", group: "Visualize" },
  // Hooks & Behaviors
  { key: "anim",    label: "Anim Lab", icon: "≋", group: "Hooks" },
  { key: "hooks",   label: "Hooks",   icon: "⚙", group: "Hooks" },
  { key: "behave",  label: "Behaviors", icon: "⌬", group: "Hooks" },
  // Internals
  { key: "i18n",    label: "i18n",    icon: "⌘", group: "Internals" },
  { key: "devtools",label: "DevTools",icon: "⚒", group: "Internals" },
  { key: "plugins", label: "Plugins", icon: "⌬", group: "Internals" },
  { key: "person",  label: "Personality", icon: "◑", group: "Internals" },
  { key: "a11y",    label: "A11y",    icon: "♿", group: "Internals" },
  { key: "caps",    label: "Capabilities", icon: "ⓘ", group: "Internals" },
  // Meta
  { key: "mouse",   label: "Mouse",   icon: "✥", group: "Meta" },
  { key: "themes",  label: "Themes",  icon: "◐", group: "Meta" },
  { key: "about",   label: "About",   icon: "?", group: "Meta" },
] as const;
type SectionKey = typeof SECTIONS[number]["key"];

// ── Clickable wrapper ───────────────────────────────────────────────────
// Tiny helper that registers a hit-zone with the focus system and fires
// `onClick` on left-mouse-press. Use anywhere in the demo to make a box,
// chip, card, or row mouse-pickable. The focus system tracks bounds from
// layout, so the click region matches the rendered cells exactly.
interface ClickableProps {
  onClick: () => void;
  /** Optional middle-click handler. */
  onAlt?: () => void;
  children: React.ReactNode;
  /** Forwarded to the underlying tui-box for layout. */
  flexDirection?: "row" | "column";
  width?: number | string;
  height?: number;
  flex?: number;
  flexShrink?: number;
  flexGrow?: number;
  paddingX?: number;
  paddingY?: number;
  marginRight?: number;
  borderStyle?: "single" | "double" | "round" | "heavy" | "ascii" | "none";
  borderColor?: string | number;
}

function Clickable(props: ClickableProps): React.ReactElement {
  const { onClick, onAlt, children, ...layout } = props;
  const target = useMouseTarget({
    onMouse: (event) => {
      if (event.action !== "press") return;
      if (event.button === "left") onClick();
      else if (event.button === "middle") onAlt?.();
    },
  });
  return React.createElement(
    "tui-box",
    { ...layout, ...target.targetProps },
    children,
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────
function pushToast(
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; msg: string; type?: "info" | "success" | "warning" | "error" }[]>>,
  msg: string,
  type: "info" | "success" | "warning" | "error" = "info",
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  setToasts((prev) => [...prev, { id, msg, type }]);
}

// ── Welcome ─────────────────────────────────────────────────────────────
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
        <Text color={theme.colors.text.dim}>21 sections · 100+ widgets · all interactive</Text>
      </Box>
    </Box>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────
function LayoutSection(): React.ReactElement {
  const theme = useTheme();
  const items = Array.from({ length: 30 }, (_, i) => ({
    id: `${i}`,
    label: `Row ${String(i + 1).padStart(2, "0")} — entry`,
  }));
  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1} height="100%">
      <Text bold color={theme.colors.brand.primary}>Layout primitives</Text>
      <Text color={theme.colors.text.dim}>
        Pure-TS flexbox + nested Panes. ScrollView windows large lists. ListView gives you arrow-key nav for free.
      </Text>

      <Box flexDirection="row" gap={2} flex={1} marginTop={1}>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>ScrollView (30 rows)</Text>
          <ScrollView height={10}>
            {items.map((it) => (
              <Box key={it.id} flexDirection="row">
                <Text color={theme.colors.text.dim}>·  </Text>
                <Text color={theme.colors.text.secondary}>{it.label}</Text>
              </Box>
            ))}
          </ScrollView>
        </Box>

        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>ListView (arrow keys)</Text>
          <ListView
            items={items.slice(0, 12).map((it) => ({ key: it.id, label: it.label }))}
            isFocused
          />
        </Box>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Badge label="flex" variant="info" />
        <Badge label="grid" variant="info" />
        <Badge label="overflow: hidden | scroll" variant="default" />
        <Badge label="absolute" variant="default" />
      </Box>
    </Box>
  );
}

// ── Forms ───────────────────────────────────────────────────────────────
const FORM_FIELDS = ["name", "phone", "bio", "chat", "subscribe", "agree", "role", "tier", "submit"] as const;
type FormField = typeof FORM_FIELDS[number];

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Admin",     value: "admin"     },
  { label: "Editor",    value: "editor"    },
  { label: "Viewer",    value: "viewer"    },
  { label: "Owner",     value: "owner"     },
  { label: "Guest",     value: "guest"     },
];

// `FormRow` lives at module scope on purpose. Defining it inside
// `FormsSection` would create a new function reference per render, which
// React treats as a new component type — and remounts the entire input
// subtree (TextInput, MaskedInput, TextArea, ChatInput…) on every parent
// re-render. That re-mount thrashes focus.register/focus.focus calls,
// triggering the "[storm] Multiple elements have isFocused={true}" warning
// every time you tab/click a field.
interface FormRowProps {
  label: string;
  children: React.ReactNode;
  focused: boolean;
  fieldKey: FormField;
  onSelect: (key: FormField) => void;
}
function FormRow(props: FormRowProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Clickable onClick={() => props.onSelect(props.fieldKey)} flexDirection="row">
      <Text color={props.focused ? theme.colors.brand.primary : theme.colors.text.dim} bold={props.focused}>
        {props.focused ? "▶ " : "  "}
      </Text>
      <Box width={12}><Text color={theme.colors.text.secondary}>{props.label}</Text></Box>
      <Box flex={1}>{props.children}</Box>
    </Clickable>
  );
}

function FormsSection({ pushToast: toast }: { pushToast: (msg: string, type?: "info" | "success" | "warning" | "error") => void }): React.ReactElement {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [chat, setChat] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [agree, setAgree] = useState(false);
  const [role, setRole] = useState("editor");
  const [tier, setTier] = useState("free");
  const [field, setField] = useState<FormField>("name");

  const stepLookup: Record<FormField, number> = {
    name: 0, phone: 0, bio: 1, chat: 1, subscribe: 2, agree: 2, role: 2, tier: 2, submit: 3,
  };
  const wizardStep = stepLookup[field];
  const theme = useTheme();

  // Shift-Right / Shift-Left cycles fields. Plain Tab is owned by the global
  // app handler for section navigation, so we use a modifier here.
  useInput((e) => {
    if (e.key === "right" && e.shift) {
      e.consumed = true;
      const idx = FORM_FIELDS.indexOf(field);
      setField(FORM_FIELDS[(idx + 1) % FORM_FIELDS.length]!);
    } else if (e.key === "left" && e.shift) {
      e.consumed = true;
      const idx = FORM_FIELDS.indexOf(field);
      setField(FORM_FIELDS[(idx - 1 + FORM_FIELDS.length) % FORM_FIELDS.length]!);
    }
  });

  const submit = () => {
    if (!name) { toast("Name is required", "warning"); return; }
    if (!agree) { toast("You must agree to the terms", "error"); return; }
    toast(`Welcome, ${name} — ${role} on ${tier} tier`, "success");
    setName(""); setPhone(""); setBio(""); setChat(""); setAgree(false);
    setRole("editor"); setTier("free"); setSubscribe(true);
    setField("name");
  };

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Form controls</Text>
      <Text color={theme.colors.text.dim}>
        Shift-Right / Shift-Left moves between fields, or click a row.
        Each control responds when it owns focus.
      </Text>

      <Box marginTop={1}>
        <Stepper
          steps={[
            { label: "Identity" },
            { label: "Profile" },
            { label: "Settings" },
            { label: "Submit" },
          ]}
          activeStep={wizardStep}
          orientation="horizontal"
        />
      </Box>

      <Box flexDirection="column" gap={0} marginTop={1}>
        <FormRow onSelect={setField} label="Name" fieldKey="name" focused={field === "name"}>
          <TextInput value={name} onChange={setName} placeholder="your name" isFocused={field === "name"} />
        </FormRow>
        <FormRow onSelect={setField} label="Phone" fieldKey="phone" focused={field === "phone"}>
          <MaskedInput
            value={phone}
            onChange={setPhone}
            mask="(###) ###-####"
            isFocused={field === "phone"}
          />
        </FormRow>
        <FormRow onSelect={setField} label="Bio" fieldKey="bio" focused={field === "bio"}>
          <TextArea value={bio} onChange={setBio} height={3} isFocused={field === "bio"} />
        </FormRow>
        <FormRow onSelect={setField} label="Chat" fieldKey="chat" focused={field === "chat"}>
          <ChatInput
            value={chat}
            onChange={setChat}
            placeholder="message…"
            isFocused={field === "chat"}
            onSubmit={(msg) => { toast(`Sent: ${msg}`, "info"); setChat(""); }}
          />
        </FormRow>
        <FormRow onSelect={setField} label="Subscribe" fieldKey="subscribe" focused={field === "subscribe"}>
          <Switch checked={subscribe} onChange={setSubscribe} isFocused={field === "subscribe"} />
        </FormRow>
        <FormRow onSelect={setField} label="Agree" fieldKey="agree" focused={field === "agree"}>
          <Checkbox checked={agree} onChange={setAgree} label="I accept the terms" isFocused={field === "agree"} />
        </FormRow>
        <FormRow onSelect={setField} label="Role" fieldKey="role" focused={field === "role"}>
          <Select
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            isFocused={field === "role"}
            placeholder="pick a role"
          />
        </FormRow>
        <FormRow onSelect={setField} label="Tier" fieldKey="tier" focused={field === "tier"}>
          <RadioGroup
            options={[
              { value: "free", label: "Free" },
              { value: "pro",  label: "Pro" },
              { value: "team", label: "Team" },
            ]}
            value={tier}
            onChange={setTier}
            isFocused={field === "tier"}
            direction="row"
          />
        </FormRow>
        <FormRow onSelect={setField} label="" fieldKey="submit" focused={field === "submit"}>
          <Button label="Submit" onPress={submit} isFocused={field === "submit"} variant="primary" />
        </FormRow>
      </Box>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Tag label="phone-mask" />
        <Tag label="schema" />
        <Tag label="async-validate" />
        <Kbd>Shift+→</Kbd>
      </Box>
    </Box>
  );
}

// ── Search ──────────────────────────────────────────────────────────────
const SEARCH_DATA = (() => {
  const verbs = ["build", "deploy", "lint", "test", "format", "release", "ship", "plan", "review", "merge", "rollback", "publish", "audit", "pin", "scaffold", "index", "snapshot", "trace"];
  const nouns = ["repo", "service", "project", "dashboard", "config", "schema", "fixture", "agent", "binary", "channel", "release", "preview", "session", "module", "namespace"];
  const out: { value: string; label: string; searchableText: string }[] = [];
  let n = 0;
  for (const v of verbs) {
    for (const w of nouns) {
      if (n++ >= 100) break;
      out.push({ value: `${v}-${w}`, label: `${v} ${w}`, searchableText: `${v} ${w}` });
    }
  }
  return out;
})();

function SearchSection({ pushToast: toast }: { pushToast: (msg: string, type?: "info" | "success" | "warning" | "error") => void }): React.ReactElement {
  const theme = useTheme();
  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>SearchList</Text>
      <Text color={theme.colors.text.dim}>
        Single-focus-owner compound: typing filters, arrows navigate, Enter selects, Esc clears.
      </Text>
      <Box marginTop={1}>
        <SearchList
          items={SEARCH_DATA}
          placeholder="Type to filter 100 commands…"
          maxVisible={10}
          onSelect={(_v, item) => toast(`Ran: ${item.label}`, "success")}
        />
      </Box>
    </Box>
  );
}

// ── Data ────────────────────────────────────────────────────────────────
const TREE_DATA: TreeNode[] = [
  {
    key: "src", label: "src", icon: "📁", expanded: true,
    children: [
      { key: "core", label: "core", icon: "📁", children: [
        { key: "buffer", label: "buffer.ts" },
        { key: "diff",   label: "diff.ts" },
        { key: "screen", label: "screen.ts" },
      ]},
      { key: "components", label: "components", icon: "📁", expanded: true, children: [
        { key: "Box", label: "Box.tsx" },
        { key: "Text", label: "Text.tsx" },
        { key: "ScrollView", label: "ScrollView.tsx" },
      ]},
      { key: "hooks", label: "hooks", icon: "📁", children: [
        { key: "useInput", label: "useInput.ts" },
        { key: "useMouse", label: "useMouse.ts" },
        { key: "useFocus", label: "useFocus.ts" },
      ]},
    ],
  },
  { key: "package.json", label: "package.json", icon: "📦" },
  { key: "README.md",    label: "README.md",   icon: "📖" },
];

const GRID_ROWS = [
  { id: 1, name: "diff.ts",      lines: 691, owner: "core",    coverage: 94 },
  { id: 2, name: "renderer.ts",  lines: 1466, owner: "core",   coverage: 87 },
  { id: 3, name: "engine.ts",    lines: 1584, owner: "layout", coverage: 91 },
  { id: 4, name: "manager.ts",   lines: 344, owner: "input",   coverage: 96 },
  { id: 5, name: "Form.tsx",     lines: 718, owner: "extras",  coverage: 82 },
  { id: 6, name: "DiffView.tsx", lines: 759, owner: "extras",  coverage: 79 },
];

type GridRow = typeof GRID_ROWS[number];
type SortKey = "id" | "name" | "owner" | "lines" | "coverage";

interface GridColumn {
  key: SortKey;
  label: string;
  width: number;
  align?: "left" | "right";
}

const GRID_COLUMNS: GridColumn[] = [
  { key: "id",       label: "#",      width: 3,  align: "right" },
  { key: "name",     label: "File",   width: 16 },
  { key: "owner",    label: "Module", width: 10 },
  { key: "lines",    label: "Lines",  width: 8,  align: "right" },
  { key: "coverage", label: "Cov",    width: 5,  align: "right" },
];

function sortRows(rows: GridRow[], col: SortKey, dir: "asc" | "desc"): GridRow[] {
  return [...rows].sort((a, b) => {
    const av = a[col];
    const bv = b[col];
    if (av === bv) return 0;
    const sign = dir === "asc" ? 1 : -1;
    return av < bv ? -sign : sign;
  });
}

// ── FileTreePane: tree state + native click-to-toggle (Tree.tsx wires its own mouse) ──
function FileTreePane({ focused, height }: { focused: boolean; height?: number }): React.ReactElement {
  const theme = useTheme();
  const [tree, setTree] = useState(TREE_DATA);

  const toggleKey = (nodes: TreeNode[], key: string): TreeNode[] =>
    nodes.map((n) => {
      if (n.key === key) return { ...n, expanded: !n.expanded };
      if (n.children) return { ...n, children: toggleKey(n.children, key) };
      return n;
    });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.colors.brand.primary : theme.colors.divider}
      paddingX={1}
      {...(height !== undefined ? { height } : {})}
    >
      <Text bold color={theme.colors.text.primary}>File tree</Text>
      <Tree
        nodes={tree}
        isFocused={focused}
        onToggle={(key) => setTree((prev) => toggleKey(prev, key))}
      />
    </Box>
  );
}

// ── FileGridPane: mouse-aware sortable grid ───────────────────────────
// Built inline because DataGrid has no native click-to-sort or
// click-to-select wiring. Each column header is a Clickable (cycles
// sort direction, switches sort column on first click). Each body row
// is a Clickable that selects that row.
function FileGridPane({ focused, height }: { focused: boolean; height?: number }): React.ReactElement {
  const theme = useTheme();
  const [sortCol, setSortCol] = useState<SortKey>("lines");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const sorted = sortRows(GRID_ROWS, sortCol, sortDir);

  // Keyboard sort/select support (when focused).
  useInput((e) => {
    if (!focused) return;
    if (e.key === "up")   { e.consumed = true; setSelectedRow((i) => Math.max(0, i - 1)); return; }
    if (e.key === "down") { e.consumed = true; setSelectedRow((i) => Math.min(sorted.length - 1, i + 1)); return; }
    if (e.char === "s")   {
      e.consumed = true;
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
  });

  const handleSort = (col: SortKey) => {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sortIndicator = (col: SortKey) => {
    if (col !== sortCol) return " ";
    return sortDir === "asc" ? "▲" : "▼";
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.colors.brand.primary : theme.colors.divider}
      paddingX={1}
      {...(height !== undefined ? { height } : {})}
    >
      <Text bold color={theme.colors.text.primary}>DataGrid (click to sort, click row to select)</Text>

      {/* Header row — each column header is a Clickable that toggles sort */}
      <Box flexDirection="row" height={1}>
        {GRID_COLUMNS.map((c) => {
          const active = c.key === sortCol;
          const label = `${c.label}${sortIndicator(c.key)}`;
          const padded = c.align === "right"
            ? label.padStart(c.width)
            : label.padEnd(c.width);
          return (
            <Clickable key={c.key} onClick={() => handleSort(c.key)} width={c.width + 1}>
              <Text bold color={active ? theme.colors.brand.primary : theme.colors.text.dim}>
                {padded}
              </Text>
            </Clickable>
          );
        })}
      </Box>

      {/* Body rows — Clickable to select. NO zebra striping (it conflicted
          with the selection bar visually). Selected row uses the brand
          highlight, hovered row uses a subtle dim background. */}
      {sorted.map((row, idx) => {
        const isSelected = idx === selectedRow;
        const isHovered = idx === hoverRow;
        const rowColor = isSelected
          ? theme.colors.brand.primary
          : isHovered
            ? theme.colors.text.primary
            : theme.colors.text.secondary;
        return (
          <Clickable
            key={row.id}
            onClick={() => { setSelectedRow(idx); setHoverRow(idx); }}
            flexDirection="row"
            height={1}
          >
            {GRID_COLUMNS.map((c) => {
              const v = String(row[c.key]);
              const padded = c.align === "right"
                ? v.padStart(c.width)
                : v.padEnd(c.width);
              return (
                <Box key={c.key} width={c.width + 1}>
                  <Text color={rowColor} bold={isSelected}>
                    {isSelected && c === GRID_COLUMNS[0] ? "▶" : " "}{padded.slice(c === GRID_COLUMNS[0] ? 1 : 0)}
                  </Text>
                </Box>
              );
            })}
          </Clickable>
        );
      })}
    </Box>
  );
}

// ── ServiceLogPane: fixed log entries, nothing interactive ───────────
function ServiceLogPane({ height }: { height?: number }): React.ReactElement {
  const theme = useTheme();
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.colors.divider}
      paddingX={1}
      {...(height !== undefined ? { height } : {})}
    >
      <Text bold color={theme.colors.text.primary}>RichLog (live append)</Text>
      <RichLog
        entries={[
          { timestamp: "09:45:12", level: "info",  text: "service started on :8080" },
          { timestamp: "09:45:13", level: "debug", text: "loaded 42 routes" },
          { timestamp: "09:45:14", level: "warn",  text: "config key 'foo' deprecated" },
          { timestamp: "09:45:15", level: "info",  text: "GET /v1/health → 200" },
          { timestamp: "09:45:16", level: "error", text: "GET /v1/db → 500: timeout" },
          { timestamp: "09:45:17", level: "info",  text: "retry 1/3 succeeded" },
        ]}
        maxVisible={6}
        showTimestamp
      />
    </Box>
  );
}

// ── ConfigPretty: fixed JSON-like data ────────────────────────────────
function ConfigPretty({ height }: { height?: number }): React.ReactElement {
  const theme = useTheme();
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.colors.divider}
      paddingX={1}
      {...(height !== undefined ? { height } : {})}
    >
      <Text bold color={theme.colors.text.primary}>Pretty (JSON-like)</Text>
      <Pretty data={{
        name: "reacterm",
        version: "0.1.0",
        features: ["cell-diff", "WASM", "themes"],
        theme: { primary: "#82AAFF", contrast: 7.2 },
        active: true,
      }} />
    </Box>
  );
}

function DataSection({ focused }: { focused: "tree" | "grid" }): React.ReactElement {
  const theme = useTheme();
  return (
    <ScrollView flex={1} scrollSpeed={4} scrollbarGutter={0}>
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Data widgets</Text>

      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Kbd>f</Kbd>
          <Text color={theme.colors.text.dim}>focus tree ·</Text>
          <Kbd>g</Kbd>
          <Text color={theme.colors.text.dim}>focus grid</Text>
        </Box>
        <Box flexDirection="row" gap={1}>
          <Kbd>click</Kbd>
          <Text color={theme.colors.text.dim}>everywhere ·</Text>
          <Kbd>wheel</Kbd>
          <Text color={theme.colors.text.dim}>scroll page</Text>
        </Box>
        <Box flexDirection="row" gap={1}>
          <Text color={theme.colors.text.dim}>Tree:</Text>
          <Kbd>↑↓/←→</Kbd>
          <Text color={theme.colors.text.dim}>nav ·</Text>
          <Kbd>Enter</Kbd>
          <Text color={theme.colors.text.dim}>or click folder to expand</Text>
        </Box>
        <Box flexDirection="row" gap={1}>
          <Text color={theme.colors.text.dim}>Grid: click any header to sort, click row to select</Text>
        </Box>
      </Box>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flex={1}>
          <FileTreePane focused={focused === "tree"} height={9} />
        </Box>
        <Box flex={2}>
          <FileGridPane focused={focused === "grid"} height={9} />
        </Box>
      </Box>

      <Box flexDirection="column" gap={1}>
        <ServiceLogPane height={9} />
        <ConfigPretty height={14} />
      </Box>

      <ScrollEditTable />

      <TreeTablePane />
    </Box>
    </ScrollView>
  );
}

// ── TreeTable demo: tasks with subtasks ─────────────────────────────────
const TREE_TABLE_INITIAL: TreeTableRow[] = [
  {
    key: "auth", icon: "🔐", expanded: true,
    values: { name: "Auth flow", owner: "Edward", priority: "P0", status: "in-progress" },
    children: [
      { key: "auth-jwt", values: { name: "JWT refresh", owner: "Edward", priority: "P0", status: "todo" } },
      { key: "auth-mfa", values: { name: "MFA prompt", owner: "Sara", priority: "P1", status: "review" } },
    ],
  },
  {
    key: "dash", icon: "📊",
    values: { name: "Dashboard", owner: "Maya", priority: "P1", status: "review" },
    children: [
      { key: "dash-charts", values: { name: "Live charts", owner: "Maya", priority: "P1", status: "review" } },
    ],
  },
];

const TREE_TABLE_COLUMNS = [
  { key: "name", header: "Task" },
  { key: "owner", header: "Owner", width: 8 },
  { key: "priority", header: "Pri", width: 4, align: "center" as const },
  { key: "status", header: "Status", width: 13 },
];

function toggleTreeTableRow(rows: TreeTableRow[], key: string): TreeTableRow[] {
  return rows.map((row) => {
    if (row.key === key) return { ...row, expanded: !row.expanded };
    if (row.children) return { ...row, children: toggleTreeTableRow(row.children, key) };
    return row;
  });
}

function TreeTablePane(): React.ReactElement {
  const theme = useTheme();
  const [data, setData] = useState(TREE_TABLE_INITIAL);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={theme.colors.brand.primary}>TreeTable — tasks with subtasks</Text>
      <Box flexDirection="row" gap={1}>
        <Text color={theme.colors.text.dim}>↑↓/←→ navigate · Enter select · marker click toggles ·</Text>
        <Text color={theme.colors.text.dim}>selected:</Text>
        <Text>{selectedKey ?? "(none)"}</Text>
      </Box>
      <TreeTable
        columns={TREE_TABLE_COLUMNS}
        data={data}
        rowHighlight
        sortable
        onToggle={(key) => setData((prev) => toggleTreeTableRow(prev, key))}
        onRowSelect={(key) => setSelectedKey(key)}
      />
    </Box>
  );
}

// ── Scroll-to-edit table ────────────────────────────────────────────────
// Click a numeric cell to select it, then scroll-wheel over that selected
// cell to bump the value. Shift-click resets to baseline.
//
// Highlight precedence (top → bottom):
//   1. Mouse hover (brand color, bold)
//   2. Selected/keyboard cursor (warning color, bold)
//   3. Delta-vs-baseline tint (green if higher, red if lower)
//   4. Plain text color
//
// Phantom-cursor regression: keyboard cursor is null until the user
// presses an arrow key, so on first render no cell appears selected.

interface ScrollRow {
  id: string;
  label: string;
  values: number[];
}

const SCROLL_COL_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const SCROLL_LABEL_WIDTH = 10;
const SCROLL_VALUE_WIDTH = 9; // 8 digits + 1 space for ↑/↓ arrow
const SCROLL_INITIAL: ScrollRow[] = [
  { id: "rev", label: "Revenue",  values: [120, 145, 168, 192] },
  { id: "exp", label: "Expenses", values: [85,  92,  101, 113] },
  { id: "hc",  label: "Headcount",values: [12,  14,  18,  22] },
  { id: "lat", label: "p99 (ms)", values: [240, 210, 195, 180] },
];

function ScrollEditTable(): React.ReactElement {
  const theme = useTheme();
  const { requestRender } = useTui();
  const [, forceTableRender] = useState(0);

  const refreshTable = () => {
    forceTableRender((n) => n + 1);
    requestRender();
  };

  // Mutable rows live in a ref so scroll bursts don't churn React state.
  const rowsRef = useRef<ScrollRow[]>(JSON.parse(JSON.stringify(SCROLL_INITIAL)));
  const baselineRef = useRef<ScrollRow[]>(JSON.parse(JSON.stringify(SCROLL_INITIAL)));
  // Mouse hover cell — null when not over a numeric cell.
  const hoverRef = useRef<{ row: number; col: number } | null>(null);
  // Selected/keyboard cursor — null until the user clicks a cell or presses
  // an arrow key. Fixes the phantom "Revenue · Q1 looks selected" issue from
  // the prior version.
  const kbRef = useRef<{ row: number; col: number } | null>(null);
  // Header offset: 1 row for column headings before the data rows.
  const HEADER_ROWS = 1;

  const sameCell = (
    a: { row: number; col: number } | null,
    b: { row: number; col: number } | null,
  ): boolean => a?.row === b?.row && a?.col === b?.col;

  const cellAt = (localX: number, localY: number): { row: number; col: number } | null => {
    const dataRow = localY - HEADER_ROWS;
    if (dataRow < 0 || dataRow >= rowsRef.current.length) return null;
    if (localX < SCROLL_LABEL_WIDTH) return null;
    const col = Math.floor((localX - SCROLL_LABEL_WIDTH) / SCROLL_VALUE_WIDTH);
    if (col < 0 || col >= SCROLL_COL_LABELS.length) return null;
    return { row: dataRow, col };
  };

  const target = useMouseTarget({
    onMouse: (event, localX, localY) => {
      const cell = cellAt(localX, localY);

      // Track hover on every event so the highlight follows the cursor.
      const prev = hoverRef.current;
      const hoverChanged = (prev?.row !== cell?.row) || (prev?.col !== cell?.col);
      if (hoverChanged) {
        hoverRef.current = cell;
        refreshTable();
      }

      if (!cell) return;

      // Wheel edits only after the user explicitly selects this value. When
      // the hovered value is not selected, leave the event unconsumed so the
      // surrounding ScrollView can keep scrolling the page.
      if (event.button === "scroll-up" || event.button === "scroll-down") {
        if (!sameCell(kbRef.current, cell)) return;
        event.consumed = true;
        const dir = event.button === "scroll-up" ? 1 : -1;
        const step = event.shift ? 10 : 1;
        const row = rowsRef.current[cell.row];
        if (!row) return;
        row.values[cell.col] = (row.values[cell.col] ?? 0) + dir * step;
        refreshTable();
        return;
      }

      if (event.button === "left" && event.action === "press") {
        const row = rowsRef.current[cell.row];
        const base = baselineRef.current[cell.row];
        if (!row || !base) return;
        if (event.shift || event.ctrl || event.meta) {
          // Shift-click resets the cell to its baseline value.
          row.values[cell.col] = base.values[cell.col] ?? 0;
        } else {
          // Plain click selects the cell for wheel and +/- editing. Reset is
          // reserved for shift-click.
          kbRef.current = { ...cell };
        }
        refreshTable();
        return;
      }

      // Middle click also resets to baseline (alt path).
      if (event.button === "middle" && event.action === "press") {
        const row = rowsRef.current[cell.row];
        const base = baselineRef.current[cell.row];
        if (!row || !base) return;
        row.values[cell.col] = base.values[cell.col] ?? 0;
        refreshTable();
      }
    },
  });

  useInput((e) => {
    // Lazy-init kb cursor on first arrow press — no phantom selection.
    const initIfNull = () => {
      if (kbRef.current === null) kbRef.current = { row: 0, col: 0 };
    };
    if (e.key === "up") {
      e.consumed = true; initIfNull();
      kbRef.current!.row = Math.max(0, kbRef.current!.row - 1);
      refreshTable(); return;
    }
    if (e.key === "down") {
      e.consumed = true; initIfNull();
      kbRef.current!.row = Math.min(rowsRef.current.length - 1, kbRef.current!.row + 1);
      refreshTable(); return;
    }
    if (e.key === "left") {
      e.consumed = true; initIfNull();
      kbRef.current!.col = Math.max(0, kbRef.current!.col - 1);
      refreshTable(); return;
    }
    if (e.key === "right") {
      e.consumed = true; initIfNull();
      kbRef.current!.col = Math.min(SCROLL_COL_LABELS.length - 1, kbRef.current!.col + 1);
      refreshTable(); return;
    }
    if (e.char === "+" || e.char === "=") {
      e.consumed = true;
      const cur = kbRef.current; if (!cur) return;
      const row = rowsRef.current[cur.row];
      if (row) { row.values[cur.col] = (row.values[cur.col] ?? 0) + (e.shift ? 10 : 1); refreshTable(); }
      return;
    }
    if (e.char === "-" || e.char === "_") {
      e.consumed = true;
      const cur = kbRef.current; if (!cur) return;
      const row = rowsRef.current[cur.row];
      if (row) { row.values[cur.col] = (row.values[cur.col] ?? 0) - (e.shift ? 10 : 1); refreshTable(); }
      return;
    }
    if (e.char === "0") {
      e.consumed = true;
      // Reset all values to baseline.
      rowsRef.current = JSON.parse(JSON.stringify(baselineRef.current));
      refreshTable();
      return;
    }
    if (e.key === "escape") {
      // Escape clears the kb cursor (returns to "no selection" state).
      e.consumed = true;
      if (kbRef.current !== null) { kbRef.current = null; refreshTable(); }
      return;
    }
  });

  const hover = hoverRef.current;
  const kb = kbRef.current;

  // Status line: prefer the mouse-hover cell over the kb cursor for
  // status display (matches the visible highlight precedence).
  const focusedCell = hover ?? kb;
  let status: string;
  if (!focusedCell) {
    status = "Click a value to select · wheel edits selected value · Shift-wheel ×10 · Shift-click resets · arrows + ±";
  } else {
    const row = rowsRef.current[focusedCell.row];
    const baseRow = baselineRef.current[focusedCell.row];
    if (!row || !baseRow) {
      status = "—";
    } else {
      const v = row.values[focusedCell.col] ?? 0;
      const baseline = baseRow.values[focusedCell.col] ?? 0;
      const delta = v - baseline;
      const deltaStr = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} vs ${baseline}`;
      const colLabel = SCROLL_COL_LABELS[focusedCell.col];
      const source = sameCell(kb, focusedCell) ? "selected" : "click to select";
      status = `${row.label} · ${colLabel} = ${v} (${deltaStr}) [${source}]`;
    }
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
      <Text bold color={theme.colors.text.primary}>Scroll-to-edit table</Text>

      {React.createElement(
        "tui-box",
        { flexDirection: "column", ...target.targetProps },
        // Header row
        <Box key="hdr" flexDirection="row" height={1}>
          <Box width={SCROLL_LABEL_WIDTH}>
            <Text bold color={theme.colors.text.dim}>metric</Text>
          </Box>
          {SCROLL_COL_LABELS.map((label) => (
            <Box key={label} width={SCROLL_VALUE_WIDTH}>
              <Text bold color={theme.colors.text.dim}>{label.padStart(SCROLL_VALUE_WIDTH - 1)}</Text>
            </Box>
          ))}
        </Box>,
        // Data rows
        ...rowsRef.current.map((row, rIdx) => (
          <Box key={row.id} flexDirection="row" height={1}>
            <Box width={SCROLL_LABEL_WIDTH}>
              <Text color={theme.colors.text.secondary}>{row.label}</Text>
            </Box>
            {row.values.map((v, cIdx) => {
              const isHover = !!(hover && hover.row === rIdx && hover.col === cIdx);
              // Suppress the kb visual when the mouse is hovering the same
              // cell — explicit precedence per C2 in the refactor plan.
              const isKb = !isHover && !!(kb && kb.row === rIdx && kb.col === cIdx);
              const baseline = baselineRef.current[rIdx]?.values[cIdx] ?? v;
              const delta = v - baseline;
              let color: string | number = theme.colors.text.primary;
              if (isHover)        color = theme.colors.brand.primary;
              else if (isKb)      color = theme.colors.warning;
              else if (delta > 0) color = theme.colors.success;
              else if (delta < 0) color = theme.colors.error;
              const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : " ";
              const display = `${arrow}${String(v).padStart(SCROLL_VALUE_WIDTH - 2)}`;
              return (
                <Box key={cIdx} width={SCROLL_VALUE_WIDTH}>
                  <Text color={color} bold={isHover || isKb}>
                    {display}
                  </Text>
                </Box>
              );
            })}
          </Box>
        ))
      )}

      <Box marginTop={1}>
        <Text color={theme.colors.text.dim}>{status}</Text>
      </Box>
    </Box>
  );
}

// ── Charts ──────────────────────────────────────────────────────────────
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

            <Box flexDirection="column" width={wide ? 36 : undefined} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
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

// ── Mouse ───────────────────────────────────────────────────────────────
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

// ── Editor & docs ───────────────────────────────────────────────────────
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

// ── Animation lab ───────────────────────────────────────────────────────
const CYCLER_TEXTS = [
  "Cell-level diff",
  "Dual-speed rendering",
  "Typed-array buffers",
  "Pure-TS flexbox",
  "Optional WASM",
];

function AnimLabSection(): React.ReactElement {
  const theme = useTheme();
  const cycler = useTextCycler({ texts: CYCLER_TEXTS, intervalMs: 1500, order: "sequential" });
  const easedFrameRef = useRef(0);
  const eased = useEasedInterval({
    durations: [80, 120, 200, 350, 600, 350, 200, 120],
    onTick: (frame) => { easedFrameRef.current = frame; },
  });

  const sparkRef = useRef<number[]>(Array.from({ length: 30 }, (_, i) => 50 + Math.sin(i / 3) * 30));
  const tick = useTick(80, () => {
    sparkRef.current = [
      ...sparkRef.current.slice(1),
      Math.max(0, Math.min(100, sparkRef.current[sparkRef.current.length - 1]! + (Math.random() - 0.5) * 12)),
    ];
  }, { reactive: false });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Animation lab</Text>
      <Text color={theme.colors.text.dim}>
        Five distinct timing primitives, all running in parallel on one frame budget.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useTextCycler</Text>
          <Text color={theme.colors.text.dim}>cycles a list every 1.5s</Text>
          <Text color={theme.colors.brand.primary}>{cycler.text}</Text>
          <Text color={theme.colors.text.dim}>frame {cycler.index}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useEasedInterval</Text>
          <Text color={theme.colors.text.dim}>variable-ms per frame</Text>
          <Text color={theme.colors.warning}>frame {eased.frame}</Text>
          <Box flexDirection="row" gap={1}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Text key={i} color={i === eased.frame % 8 ? theme.colors.brand.primary : theme.colors.text.dim}>●</Text>
            ))}
          </Box>
        </Box>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useTick imperative</Text>
          <Text color={theme.colors.text.dim}>80ms, no React state</Text>
          <Sparkline data={sparkRef.current} width={28} height={3} color={theme.colors.success} />
          <Text color={theme.colors.text.dim}>tick {tick}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>ShimmerText</Text>
          <Text color={theme.colors.text.dim}>thinking-state shimmer</Text>
          <ShimmerText text="Thinking through it…" />
          <BlinkDot state="streaming" />
        </Box>
      </Box>
    </Box>
  );
}

// ── Hooks playground ────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { key: "name",  label: "Pick a name" },
  { key: "tier",  label: "Select tier"  },
  { key: "review",label: "Review"       },
  { key: "done",  label: "Confirm"      },
];

function HooksSection({ pushToast: toast }: { pushToast: (msg: string, type?: "info" | "success" | "warning" | "error") => void }): React.ReactElement {
  const theme = useTheme();

  const undo = useUndoRedo<string>({ initial: "" });
  const persist = usePersistentState<number>({
    key: "explorer-counter",
    initial: 0,
    storage: memoryStorage(),
  });
  const wiz = useWizard({ steps: WIZARD_STEPS });
  const confirmDelete = useConfirmAction({ timeoutMs: 1500 });

  useHotkey({
    hotkeys: [
      { key: "u", label: "undo",   action: () => { undo.undo(); } },
      { key: "r", label: "redo",   action: () => { undo.redo(); } },
      { key: "+", label: "++ counter", action: () => persist.set(persist.value + 1) },
      { key: "-", label: "-- counter", action: () => persist.set(Math.max(0, persist.value - 1)) },
      { key: "n", label: "wizard next", action: () => { wiz.next(); } },
      { key: "p", label: "wizard prev", action: () => { wiz.prev(); } },
      { key: "d", label: "delete (confirm)", action: () => {
        if (confirmDelete.isPending) {
          confirmDelete.confirm();
          toast("Deleted!", "warning");
        } else {
          confirmDelete.requestConfirm().then((ok) => { if (!ok) { /* timed out */ } });
        }
      } },
      { key: "i", label: "type a char into undo buffer", action: () => undo.set(undo.value + "i") },
    ],
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Hooks playground</Text>
      <Text color={theme.colors.text.dim}>
        u undo · r redo · i append · +/- counter · n/p wizard · d delete (press twice to confirm)
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useUndoRedo</Text>
          <Text color={theme.colors.text.dim}>
            stack: {undo.canUndo ? "undo ✓" : "undo —"} · {undo.canRedo ? "redo ✓" : "redo —"}
          </Text>
          <Text color={theme.colors.brand.primary}>{undo.value || <Text color={theme.colors.text.dim}>(empty)</Text>}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>usePersistentState</Text>
          <Text color={theme.colors.text.dim}>survives section change</Text>
          <Text color={theme.colors.warning}>counter = {persist.value}</Text>
        </Box>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useWizard</Text>
          <Text color={theme.colors.text.dim}>step {wiz.currentStep + 1} of {WIZARD_STEPS.length}</Text>
          <Text color={theme.colors.success}>{WIZARD_STEPS[wiz.currentStep]?.label ?? "—"}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>useConfirmAction</Text>
          <Text color={theme.colors.text.dim}>press d, then d again</Text>
          <Text color={confirmDelete.isPending ? theme.colors.error : theme.colors.text.secondary}>
            {confirmDelete.isPending
              ? `ARMED — ${confirmDelete.countdown ?? "?"}s`
              : "idle"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

// ── Behaviors ───────────────────────────────────────────────────────────
// Headless behavior hooks back the high-level components in §3-§8.
// We list them all here so users know they exist; the highlighted one
// drives a custom-rendered widget.
const HEADLESS_HOOKS = [
  "useSelectBehavior", "useListBehavior", "useMenuBehavior",
  "useTreeBehavior", "useTabsBehavior", "useAccordionBehavior",
  "usePaginatorBehavior", "useStepperBehavior", "useTableBehavior",
  "useVirtualListBehavior", "useDialogBehavior", "useToastBehavior",
  "useFormBehavior", "useCalendarBehavior", "useCollapsibleBehavior",
];

function BehaviorsSection(): React.ReactElement {
  const theme = useTheme();
  const [highlight, setHighlight] = useState(0);
  useInput((e) => {
    if (e.key === "down") { e.consumed = true; setHighlight((h) => (h + 1) % HEADLESS_HOOKS.length); }
    else if (e.key === "up") { e.consumed = true; setHighlight((h) => (h - 1 + HEADLESS_HOOKS.length) % HEADLESS_HOOKS.length); }
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Headless behaviors</Text>
      <Text color={theme.colors.text.dim}>
        15 keyboard-only state machines that back the high-level components.
        Build your own widget; keep the keyboard model. ↑↓ to scan.
      </Text>

      <Box flexDirection="column" marginTop={1} flexWrap="wrap">
        {HEADLESS_HOOKS.map((name, i) => {
          const active = i === highlight;
          return (
            <Box key={name} flexDirection="row" gap={1}>
              <Text color={active ? theme.colors.brand.primary : theme.colors.text.dim} bold={active}>
                {active ? "▶" : " "}
              </Text>
              <Text color={active ? theme.colors.brand.primary : theme.colors.text.secondary}>
                {name}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Why this matters</Text>
        <Text color={theme.colors.text.secondary}>
          The "behavior" is a hook — it owns the keyboard model and active-index state.
          The "component" is the visual default. Skip the component, keep the hook,
          render however you want. That's how you ship a custom date picker, table, or
          tree without rewriting accessibility from scratch.
        </Text>
      </Box>
    </Box>
  );
}

// ── i18n ────────────────────────────────────────────────────────────────
const LOCALES_DEMO: Record<string, Locale> = {
  en: { code: "en", direction: "ltr", pluralRule: PLURAL_EN,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdaysShort: ["S","M","T","W","T","F","S"],
    strings: {
      "items.one": "{count} item",
      "items.other": "{count} items",
      "greeting": "Hello, {name}!",
    },
  },
  fr: { code: "fr", direction: "ltr", pluralRule: PLURAL_FR,
    numbers: { decimal: ",", thousands: " ", grouping: 3 },
    months: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
    monthsShort: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
    weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    weekdaysShort: ["D","L","M","M","J","V","S"],
    strings: {
      "items.one": "{count} élément",
      "items.other": "{count} éléments",
      "greeting": "Bonjour, {name} !",
    },
  },
  de: { code: "de", direction: "ltr",
    numbers: { decimal: ",", thousands: ".", grouping: 3 },
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    weekdaysShort: ["S","M","D","M","D","F","S"],
    strings: {
      "items.one": "{count} Element",
      "items.other": "{count} Elemente",
      "greeting": "Hallo, {name}!",
    },
  },
  ru: { code: "ru", direction: "ltr", pluralRule: PLURAL_RU,
    numbers: { decimal: ",", thousands: " ", grouping: 3 },
    months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    monthsShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    weekdaysShort: ["В","П","В","С","Ч","П","С"],
    strings: {
      "items.one":   "{count} элемент",
      "items.few":   "{count} элемента",
      "items.many":  "{count} элементов",
      "items.other": "{count} элементов",
      "greeting":    "Привет, {name}!",
    },
  },
  ar: { code: "ar", direction: "rtl", pluralRule: PLURAL_AR,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"],
    monthsShort: ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"],
    weekdays: ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"],
    weekdaysShort: ["أ","ا","ث","أ","خ","ج","س"],
    strings: {
      "items.zero":  "لا عناصر",
      "items.one":   "عنصر واحد",
      "items.two":   "عنصران",
      "items.few":   "{count} عناصر",
      "items.many":  "{count} عنصرًا",
      "items.other": "{count} عنصر",
      "greeting":    "مرحبا، {name}!",
    },
  },
  ja: { code: "ja", direction: "ltr", pluralRule: PLURAL_JA,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    monthsShort: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    weekdays: ["日","月","火","水","木","金","土"],
    weekdaysShort: ["日","月","火","水","木","金","土"],
    strings: {
      "items.other": "{count} 個",
      "greeting":    "こんにちは、{name}さん！",
    },
  },
};

function I18nSection(): React.ReactElement {
  const theme = useTheme();
  const [code, setCode] = useState<string>("en");
  const [count, setCount] = useState(2);

  useInput((e) => {
    if (e.key === "left") { e.consumed = true; setCount((c) => Math.max(0, c - 1)); }
    else if (e.key === "right") { e.consumed = true; setCount((c) => c + 1); }
  });

  const codes = Object.keys(LOCALES_DEMO);
  useInput((e) => {
    const idx = codes.indexOf(code);
    if (e.char === "n") { e.consumed = true; setCode(codes[(idx + 1) % codes.length]!); }
    if (e.char === "p") { e.consumed = true; setCode(codes[(idx - 1 + codes.length) % codes.length]!); }
  });

  const locale = LOCALES_DEMO[code]!;
  const num = formatNumber(1234567.89, locale);
  const greet = i18nT("greeting", locale, { name: "World" });
  const items = plural("items", count, locale);

  return (
    <LocaleProvider locale={locale}>
      <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
        <Text bold color={theme.colors.brand.primary}>i18n</Text>
        <Text color={theme.colors.text.dim}>
          n/p locale (or click a chip) · ←/→ count · 6 locales with plural rules + RTL.
        </Text>

        <Box flexDirection="row" gap={1} marginTop={1}>
          {codes.map((c) => {
            const active = c === code;
            return (
              <Clickable key={c} onClick={() => setCode(c)}
                borderStyle={active ? "double" : "round"}
                borderColor={active ? theme.colors.brand.primary : theme.colors.divider} paddingX={1}>
                <Text bold={active} color={active ? theme.colors.brand.primary : theme.colors.text.secondary}>
                  {c.toUpperCase()}
                </Text>
              </Clickable>
            );
          })}
        </Box>

        <Box flexDirection="column" marginTop={1} gap={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>direction:</Text>
            <Text bold color={theme.colors.brand.primary}>{locale.direction}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>formatNumber(1234567.89):</Text>
            <Text bold color={theme.colors.warning}>{num}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>t("greeting"):</Text>
            <Text bold color={theme.colors.success}>{greet}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>plural("items", {count}):</Text>
            <Text bold color={theme.colors.info}>{items}</Text>
          </Box>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Text color={theme.colors.text.secondary}>weekdays:</Text>
            {locale.weekdays.map((w, i) => (
              <Text key={i} color={theme.colors.text.dim}>{w}</Text>
            ))}
          </Box>
        </Box>
      </Box>
    </LocaleProvider>
  );
}

// ── DevTools ────────────────────────────────────────────────────────────
const DEVTOOL_PANELS = [
  { key: "1", name: "Render heatmap",  desc: "Color each cell by write frequency" },
  { key: "2", name: "Accessibility audit", desc: "Live WCAG 4.5:1 contrast check" },
  { key: "3", name: "Time-travel",     desc: "Freeze + scrub last 120 frames" },
  { key: "4", name: "Inspector",       desc: "Component tree, computed styles, FPS" },
];

function DevToolsSection(): React.ReactElement {
  const theme = useTheme();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useInput((e) => {
    if (e.char === "1" || e.char === "2" || e.char === "3" || e.char === "4") {
      e.consumed = true;
      setEnabled((prev) => ({ ...prev, [e.char]: !prev[e.char] }));
    }
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>DevTools</Text>
      <Text color={theme.colors.text.dim}>
        Toggle 1/2/3/4 — or click a panel. In a real app, `enableDevTools(app)` wires all four at once.
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {DEVTOOL_PANELS.map((p) => {
          const on = enabled[p.key] ?? false;
          const toggle = () => setEnabled((prev) => ({ ...prev, [p.key]: !prev[p.key] }));
          return (
            <Clickable key={p.key} onClick={toggle} flexDirection="row">
              <Box borderStyle={on ? "double" : "round"}
                borderColor={on ? theme.colors.success : theme.colors.divider} paddingX={1}>
                <Text bold color={on ? theme.colors.success : theme.colors.text.secondary}>
                  {p.key} {on ? "ON " : "OFF"}
                </Text>
              </Box>
              <Box flexDirection="column" marginLeft={1}>
                <Text bold color={theme.colors.text.primary}>{p.name}</Text>
                <Text color={theme.colors.text.dim}>{p.desc}</Text>
              </Box>
            </Clickable>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Middleware</Text>
        <Text color={theme.colors.text.secondary}>
          Three built-in middlewares run as render-pipeline passes:
        </Text>
        <Text color={theme.colors.text.dim}>
          · scanlineMiddleware — CRT-style overlay
        </Text>
        <Text color={theme.colors.text.dim}>
          · fpsCounterMiddleware — corner FPS readout
        </Text>
        <Text color={theme.colors.text.dim}>
          · debugBorderMiddleware — color every box border
        </Text>
        <Text color={theme.colors.text.dim}>
          Apply via `app.middleware.use(scanlineMiddleware)`.
        </Text>
      </Box>
    </Box>
  );
}

// ── Plugins ─────────────────────────────────────────────────────────────
const PLUGIN_LIST = [
  { key: "vimModePlugin",     desc: "hjkl + visual mode for ScrollView/lists" },
  { key: "compactModePlugin", desc: "Strip padding for high-density UIs" },
  { key: "autoScrollPlugin",  desc: "Keep ScrollView pinned to bottom" },
  { key: "screenshotPlugin",  desc: "Capture buffer to a file" },
  { key: "statusBarPlugin",   desc: "Inject a persistent status bar" },
];

function PluginsSection(): React.ReactElement {
  const theme = useTheme();
  const [active] = useState<Record<string, boolean>>({});

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Plugins</Text>
      <Text color={theme.colors.text.dim}>
        Plugins extend the renderer. They're activated at `render()` time —
        this section is informational. See README.md for live wiring.
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {PLUGIN_LIST.map((p) => {
          const on = active[p.key] ?? false;
          return (
            <Box key={p.key} flexDirection="row" gap={2}>
              <Box width={26}>
                <Text bold color={theme.colors.brand.primary}>{p.key}</Text>
              </Box>
              <Text color={on ? theme.colors.success : theme.colors.text.secondary}>{p.desc}</Text>
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Plugin contract</Text>
        <Text color={theme.colors.text.secondary}>
          A plugin implements StormPlugin: name, optional onMount, beforeRender,
          onComponentMount, getCustomElementHandlers. PluginManager fires hooks
          at every lifecycle stage — your plugin gets a turn before the renderer.
        </Text>
      </Box>
    </Box>
  );
}

// ── Personality ─────────────────────────────────────────────────────────
const PERSONALITY_PRESETS: { name: string; preset: StormPersonality }[] = [
  { name: "Default", preset: defaultPreset },
  { name: "Minimal", preset: minimalPreset },
  { name: "Hacker",  preset: hackerPreset },
  { name: "Playful", preset: playfulPreset },
];

function PersonalitySection({ presetIdx, setPresetIdx }: { presetIdx: number; setPresetIdx: (i: number) => void }): React.ReactElement {
  const theme = useTheme();
  useInput((e) => {
    if (e.key === "left")  { e.consumed = true; setPresetIdx((presetIdx - 1 + PERSONALITY_PRESETS.length) % PERSONALITY_PRESETS.length); }
    if (e.key === "right") { e.consumed = true; setPresetIdx((presetIdx + 1) % PERSONALITY_PRESETS.length); }
  });

  const active = PERSONALITY_PRESETS[presetIdx]!;

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Personality</Text>
      <Text color={theme.colors.text.dim}>
        ←/→ to cycle preset, or click a card. Personality changes icons, prompts, animation style — applied at the app root.
      </Text>

      <Box flexDirection="row" gap={1} marginTop={1}>
        {PERSONALITY_PRESETS.map((p, i) => {
          const isActive = i === presetIdx;
          return (
            <Clickable key={p.name} onClick={() => setPresetIdx(i)}
              borderStyle={isActive ? "double" : "round"}
              borderColor={isActive ? theme.colors.brand.primary : theme.colors.divider} paddingX={1}>
              <Text bold={isActive} color={isActive ? theme.colors.brand.primary : theme.colors.text.secondary}>
                {p.name}
              </Text>
            </Clickable>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1} gap={1}>
        <Text bold color={theme.colors.text.primary}>Active: {active.name}</Text>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>prompt char: </Text>
          <Text bold color={theme.colors.brand.primary}>{active.preset.interaction.promptChar}</Text>
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>selection char: </Text>
          <Text bold color={theme.colors.brand.primary}>{active.preset.interaction.selectionChar}</Text>
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>spinner: </Text>
          <Spinner type={active.preset.animation.spinnerType as "dots"} color={theme.colors.brand.primary} />
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>borders: </Text>
          <Text bold color={theme.colors.warning}>{active.preset.borders.default}</Text>
        </Box>
      </Box>
    </Box>
  );
}

// ── Accessibility ───────────────────────────────────────────────────────
function A11ySection(): React.ReactElement {
  const theme = useTheme();
  const announcer = useAnnounce();
  const [log, setLog] = useState<string[]>([]);

  useInput((e) => {
    if (e.char === "a") {
      e.consumed = true;
      const msg = `Polite announcement at ${new Date().toLocaleTimeString()}`;
      announcer.announce(msg);
      setLog((prev) => [...prev.slice(-5), `· ${msg}`]);
    }
    if (e.char === "A") {
      e.consumed = true;
      const msg = `URGENT announcement at ${new Date().toLocaleTimeString()}`;
      announcer.announceUrgent(msg);
      setLog((prev) => [...prev.slice(-5), `! ${msg}`]);
    }
  });

  // contrastRatio between current theme's text.primary and surface.base
  const fg = theme.colors.text.primary;
  const bg = theme.colors.surface.base;
  const ratio = contrastRatio(fg, bg);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  // Theme-wide validation
  const validation = validateContrast(theme.colors as StormColors);

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Accessibility</Text>
      <Text color={theme.colors.text.dim}>
        a → polite announce · A → urgent announce.
        Live WCAG audit of the current theme.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>contrastRatio()</Text>
          <Text color={theme.colors.text.dim}>text.primary vs surface.base</Text>
          <Text color={passesAA ? theme.colors.success : theme.colors.error}>
            {ratio.toFixed(2)} : 1
          </Text>
          <Box flexDirection="row" gap={1}>
            <Badge label={passesAA ? "AA ✓" : "AA ✗"} variant={passesAA ? "success" : "error"} />
            <Badge label={passesAAA ? "AAA ✓" : "AAA ✗"} variant={passesAAA ? "success" : "warning"} />
          </Box>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>validateContrast(theme)</Text>
          <Text color={theme.colors.text.dim}>scans every text role</Text>
          <Text color={validation.errors.length === 0 ? theme.colors.success : theme.colors.error}>
            {validation.errors.length} error{validation.errors.length === 1 ? "" : "s"}
          </Text>
          <Text color={validation.warnings.length === 0 ? theme.colors.success : theme.colors.warning}>
            {validation.warnings.length} warning{validation.warnings.length === 1 ? "" : "s"}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>useAnnounce log</Text>
        {log.length === 0
          ? <Text color={theme.colors.text.dim} dim>(press a or A to announce)</Text>
          : log.map((line, i) => (
              <Text key={i} color={line.startsWith("!") ? theme.colors.warning : theme.colors.text.secondary}>
                {line}
              </Text>
            ))}
      </Box>
    </Box>
  );
}

// ── Capabilities ────────────────────────────────────────────────────────
function CapabilitiesSection(): React.ReactElement {
  const theme = useTheme();
  const [info] = useState(() => detectTerminal());
  const [imgCaps] = useState(() => detectImageCaps());
  const [colorDepth] = useState(() => bestColorDepth(info));

  const Row = ({ k, v, color }: { k: string; v: string | number | boolean; color?: string | number }) => (
    <Box flexDirection="row" gap={2}>
      <Box width={22}>
        <Text color={theme.colors.text.dim}>{k}</Text>
      </Box>
      <Text bold color={color ?? theme.colors.brand.primary}>{String(v)}</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Terminal capabilities</Text>
      <Text color={theme.colors.text.dim}>
        What did reacterm detect about THIS terminal? Read-only.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>detectTerminal()</Text>
          <Row k="name"           v={info.name} />
          <Row k="kittyKeyboard"  v={info.kittyKeyboard} color={info.kittyKeyboard ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="syncOutput"     v={info.syncOutput} color={info.syncOutput ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="trueColor"      v={info.trueColor} color={info.trueColor ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="hyperlinks"     v={info.hyperlinks} color={info.hyperlinks ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="mouse"          v={info.mouse} color={info.mouse ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="bracketedPaste" v={info.bracketedPaste} color={info.bracketedPaste ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="size"           v={`${info.columns}×${info.rows}`} />
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>detectImageCaps()</Text>
          <Row k="bestProtocol" v={imgCaps.bestProtocol} />
          <Row k="kitty graphics" v={imgCaps.supportsKittyGraphics} color={imgCaps.supportsKittyGraphics ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="iterm2" v={imgCaps.supportsITerm2} color={imgCaps.supportsITerm2 ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="sextant" v={imgCaps.supportsSextant} color={imgCaps.supportsSextant ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="colored underline" v={imgCaps.supportsColoredUnderline} />
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>bestColorDepth()</Text>
        <Row k="depth" v={colorDepth} color={theme.colors.warning} />
      </Box>
    </Box>
  );
}

// ── About ───────────────────────────────────────────────────────────────
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

// ── App shell ───────────────────────────────────────────────────────────
interface GlobalShortcutsProps {
  section: SectionKey;
  showHelp: boolean;
  editorInputFocused: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  setSection: React.Dispatch<React.SetStateAction<SectionKey>>;
  themeIdx: number;
  setThemeIdx: React.Dispatch<React.SetStateAction<number>>;
  setDataFocus: React.Dispatch<React.SetStateAction<"tree" | "grid">>;
  toast: (msg: string, type?: "info" | "success" | "warning" | "error") => void;
}

function GlobalShortcuts(props: GlobalShortcutsProps): null {
  const { exit } = useTui();
  const activeSectionOwnsLetters =
    props.section === "layout"
    || props.section === "forms"
    || props.section === "search"
    || props.section === "editor";

  // Keep this as one stable listener. `useCleanup` is app-exit cleanup, not a
  // React unmount hook, so remounting a shortcut component leaks stale handlers.
  useInput((e) => {
    if (props.showHelp) {
      if (e.key === "escape" || e.char === "?" || e.char === "q") {
        e.consumed = true;
        props.setShowHelp(false);
      }
      return;
    }

    if (e.key === "c" && e.ctrl) {
      e.consumed = true;
      exit();
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "q") {
      e.consumed = true;
      exit();
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "?") {
      e.consumed = true;
      props.setShowHelp(true);
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "t") {
      e.consumed = true;
      props.setThemeIdx((i) => (i + 1) % THEMES.length);
      props.toast(`Theme: ${THEMES[(props.themeIdx + 1) % THEMES.length]!.name}`);
      return;
    }
    if (e.key === "tab") {
      if (props.section === "editor" && props.editorInputFocused) return;
      e.consumed = true;
      const idx = SECTIONS.findIndex((s) => s.key === props.section);
      const dir = e.shift ? -1 : 1;
      const next = SECTIONS[(idx + dir + SECTIONS.length) % SECTIONS.length]!;
      props.setSection(next.key);
      return;
    }
    if (props.section === "data") {
      if (e.char === "f") { e.consumed = true; props.setDataFocus("tree"); return; }
      if (e.char === "g") { e.consumed = true; props.setDataFocus("grid"); return; }
    }
  });

  return null;
}

export function App(): React.ReactElement {
  const { width, height } = useTerminal();
  const [section, setSection] = useState<SectionKey>("welcome");
  const [themeIdx, setThemeIdx] = useState(0);
  const [presetIdx, setPresetIdx] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [dataFocus, setDataFocus] = useState<"tree" | "grid">("tree");
  const [editorInputFocused, setEditorInputFocused] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: "info" | "success" | "warning" | "error" }[]>([]);

  const toast = (msg: string, type: "info" | "success" | "warning" | "error" = "info") =>
    pushToast(setToasts, msg, type);

  const section_content = (() => {
    switch (section) {
      case "welcome":  return <WelcomeSection />;
      case "layout":   return <LayoutSection />;
      case "forms":    return <FormsSection pushToast={toast} />;
      case "search":   return <SearchSection pushToast={toast} />;
      case "data":     return <DataSection focused={dataFocus} />;
      case "charts":   return <ChartsSection />;
      case "ai":       return <AiSection pushToast={toast} />;
      case "editor":   return <EditorSection inputFocused={editorInputFocused} setInputFocused={setEditorInputFocused} />;
      case "effects":  return <EffectsSection />;
      case "anim":     return <AnimLabSection />;
      case "hooks":    return <HooksSection pushToast={toast} />;
      case "behave":   return <BehaviorsSection />;
      case "i18n":     return <I18nSection />;
      case "devtools": return <DevToolsSection />;
      case "plugins":  return <PluginsSection />;
      case "person":   return <PersonalitySection presetIdx={presetIdx} setPresetIdx={setPresetIdx} />;
      case "a11y":     return <A11ySection />;
      case "caps":     return <CapabilitiesSection />;
      case "mouse":    return <MouseSection />;
      case "themes":   return <ThemesSection themeIdx={themeIdx} setThemeIdx={setThemeIdx} />;
      case "about":    return <AboutSection />;
    }
  })();

  const personality = PERSONALITY_PRESETS[presetIdx]!.preset;

  return (
    <PersonalityProvider personality={personality}>
      <ThemeProvider theme={THEMES[themeIdx]!.colors}>
        <Shell
          width={width}
          height={height}
          section={section}
          onSelectSection={setSection}
          themeName={THEMES[themeIdx]!.name}
          personalityName={PERSONALITY_PRESETS[presetIdx]!.name}
          toasts={toasts}
          showHelp={showHelp}
          onToggleHelp={() => setShowHelp((v) => !v)}
          onCycleTheme={() => {
            setThemeIdx((i) => (i + 1) % THEMES.length);
            toast(`Theme: ${THEMES[(themeIdx + 1) % THEMES.length]!.name}`);
          }}
          onDismissToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        >
          {section_content}
        </Shell>
        <GlobalShortcuts
          section={section}
          showHelp={showHelp}
          editorInputFocused={editorInputFocused}
          setShowHelp={setShowHelp}
          setSection={setSection}
          themeIdx={themeIdx}
          setThemeIdx={setThemeIdx}
          setDataFocus={setDataFocus}
          toast={toast}
        />
      </ThemeProvider>
    </PersonalityProvider>
  );
}

interface ShellProps {
  width: number;
  height: number;
  section: SectionKey;
  onSelectSection: (key: SectionKey) => void;
  themeName: string;
  personalityName: string;
  toasts: { id: string; msg: string; type?: "info" | "success" | "warning" | "error" }[];
  showHelp: boolean;
  onToggleHelp: () => void;
  onCycleTheme: () => void;
  onDismissToast: (id: string) => void;
  children: React.ReactNode;
}

function Shell(props: ShellProps): React.ReactElement {
  const theme = useTheme();
  const sectionLabel = SECTIONS.find((s) => s.key === props.section)?.label ?? "?";

  return (
    <Box flexDirection="column" width={props.width} height={props.height}>
      {/* Header — theme + help-toggle are clickable */}
      <Box flexDirection="row" paddingX={2} height={1} flexShrink={0}>
        <Text bold color={theme.colors.brand.primary}>◆ reacterm</Text>
        <Text color={theme.colors.text.dim}>  ·  </Text>
        <Text color={theme.colors.text.secondary}>demo</Text>
        <Spacer />
        <Clickable onClick={props.onCycleTheme} flexDirection="row">
          <Text color={theme.colors.text.dim}>theme: </Text>
          <Text bold color={theme.colors.brand.primary}>{props.themeName}</Text>
        </Clickable>
        <Text color={theme.colors.text.dim}>  ·  preset: </Text>
        <Text bold color={theme.colors.warning}>{props.personalityName}</Text>
        <Text color={theme.colors.text.dim}>  ·  </Text>
        <Text bold color={theme.colors.info}>{sectionLabel}</Text>
        <Text color={theme.colors.text.dim}>  </Text>
        <Clickable onClick={props.onToggleHelp} paddingX={1}
          borderStyle="round" borderColor={theme.colors.divider}>
          <Text bold color={theme.colors.text.secondary}>?</Text>
        </Clickable>
      </Box>
      <Divider />

      {/* Body: sidebar + content */}
      <Box flexDirection="row" flex={1}>
        {/* Sidebar — sections grouped under super-headings */}
        <Box flexDirection="column" width={20} flexShrink={0} paddingX={1} paddingY={0} borderRight borderStyle="single" borderColor={theme.colors.divider}>
          <ScrollView height={props.height - 4}>
            {(() => {
              const grouped = SECTIONS.reduce<Record<string, typeof SECTIONS[number][]>>((acc, s) => {
                (acc[s.group] = acc[s.group] ?? []).push(s);
                return acc;
              }, {});
              const groupOrder = ["Tour", "Build", "Visualize", "Hooks", "Internals", "Meta"];
              return groupOrder.flatMap((g) => [
                <Text key={`g-${g}`} bold color={theme.colors.text.dim}>{g.toUpperCase()}</Text>,
                ...(grouped[g] ?? []).map((s) => {
                  const active = s.key === props.section;
                  return (
                    <Clickable key={s.key} flexDirection="row" onClick={() => props.onSelectSection(s.key)}>
                      <Text color={active ? theme.colors.brand.primary : theme.colors.text.dim} bold={active}>
                        {active ? "▶ " : "  "}
                      </Text>
                      <Text color={active ? theme.colors.text.primary : theme.colors.text.secondary} bold={active}>
                        {s.icon} {s.label}
                      </Text>
                    </Clickable>
                  );
                }),
                <Box key={`s-${g}`} height={1} />,
              ]);
            })()}
          </ScrollView>
        </Box>

        {/* Content */}
        <Box flex={1} flexDirection="column" overflow="hidden">
          {props.children}
        </Box>
      </Box>

      {/* Toasts: stack at bottom-right */}
      {props.toasts.length > 0 && (
        <Box flexDirection="column" paddingX={2}>
          {props.toasts.slice(-3).map((t) => (
            <Toast
              key={t.id}
              message={t.msg}
              type={t.type ?? "info"}
              visible
              durationMs={2200}
              animated
              onDismiss={() => props.onDismissToast(t.id)}
            />
          ))}
        </Box>
      )}

      {/* Footer */}
      <Divider />
      <Box flexDirection="row" paddingX={2} height={1} flexShrink={0}>
        <KeyboardHelp
          bindings={[
            { key: "Tab",       label: "next section" },
            { key: "?",         label: "help" },
            { key: "t",         label: "theme" },
            { key: "q",         label: "quit" },
          ]}
        />
      </Box>

      {/* Help modal */}
      <Modal visible={props.showHelp} title="Keyboard cheatsheet" size="md" onClose={() => {}}>
        <Box flexDirection="column" gap={1}>
          <Text bold color={theme.colors.brand.primary}>Globals</Text>
          <KeyboardHelp
            columns={2}
            bindings={[
              { key: "Tab",        label: "next section" },
              { key: "Shift-Tab",  label: "prev section" },
              { key: "?",          label: "this overlay" },
              { key: "t",          label: "cycle theme" },
              { key: "q / Ctrl-C", label: "quit" },
            ]}
          />
          <Text bold color={theme.colors.brand.primary}>Section-local</Text>
          <KeyboardHelp
            columns={2}
            bindings={[
              { key: "Forms",         label: "Shift-←/→ next field" },
              { key: "Search",        label: "type / arrows / Enter" },
              { key: "Data",          label: "f tree, g grid; ↑↓ + s sort" },
              { key: "AI",            label: "r run, y/n/a approve" },
              { key: "Mouse",         label: "move + space" },
              { key: "Themes",        label: "←/→ cycle" },
            ]}
          />
          <Text color={theme.colors.text.dim}>Press any key to close.</Text>
        </Box>
      </Modal>
    </Box>
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  render(<App />).waitUntilExit();
}
