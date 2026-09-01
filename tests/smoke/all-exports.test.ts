/**
 * Comprehensive smoke test: renders every component, widget, and hook
 * through renderToString to verify no export crashes on basic usage.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import React from "react";
import { renderToString } from "../../src/reconciler/render-to-string.js";

// ── Components ──────────────────────────────────────────────────────────
import {
  Box, Text, Newline, Spacer, Static, Overlay,
  ScrollView, Collapsible, ContentSwitcher, TabbedContent, Accordion,
  Modal, Tooltip, Heading, Paragraph, Link, Divider, Badge, StatusMessage,
  Alert, Gradient, Digits, Avatar, Placeholder, Pretty, Breadcrumb, Tag,
  Table, DataGrid, Tree, DirectoryTree, OrderedList, UnorderedList,
  DefinitionList, ListView, RichLog, Sparkline, LineChart, Heatmap,
  Histogram, AreaChart, BarChart, ScatterPlot, Diagram,
  TextInput, ChatInput, MaskedInput, SearchInput, SelectInput, Select,
  SelectionList, Checkbox, RadioGroup, Switch, Button, Form, FilePicker,
  Calendar, ConfirmDialog, Menu, OptionList,
  Spinner, ProgressBar, Gauge, Toast, Stopwatch, Timer,
  GradientProgress, LoadingIndicator, RevealTransition,
  Tabs, Paginator, Stepper, KeyboardHelp, HelpPanel, Header, Footer,
  Image, VirtualList, Shadow, Card, GlowText, GradientBorder, Kbd,
  FocusGroup, DiffView, InlineDiff, ErrorBoundary, CommandPalette,
  TextArea, Markdown, MarkdownViewer, DatePicker, EventCalendar, Welcome,
  Transition, AnimatePresence,
} from "../../src/components/index.js";

// ── Widgets ─────────────────────────────────────────────────────────────
import {
  OperationTree, StreamingText, SyntaxHighlight, ShimmerText, BlinkDot,
  ApprovalPrompt, CommandDropdown, StatusLine, MessageBubble,
  PerformanceHUD, TokenStream, ContextWindow, CostTracker, ModelBadge,
  CommandBlock,
} from "../../src/widgets/index.js";

// ── Hooks ───────────────────────────────────────────────────────────────
import {
  useColors, useCleanup, useAsyncCleanup, useForceUpdate, useInput,
  useMouse, useTerminal, useFocus, useScroll, useMeasure, useApp,
  useStdin, useStdout, useStderr, useFocusManager, useAnimation,
  usePaste, useInterval, useTimeout, useVirtualList, useClipboard,
  useAccessibility, useReducedMotion, useAdaptive, usePluginManager,
  usePluginProps, useAnnounce, useTextCycler, useCollapsibleContent,
  useModeCycler, useGhostText, useInlinePrompt, useEasedInterval,
  useTypeahead, useSearchFilter, useMultiSelect, useUndoRedo,
  useCommandPalette, useHotkey, useTimer, useConfirmAction,
  useNotification, useWizard, useStreamConsumer, useBatchAction,
  useKeyChord, useSortable, useHistory, useAsyncLoader,
  usePersistentState, useContextMenu, useDragReorder,
  useInfiniteScroll, useCopyPasteBuffer, useLocale,
  useTransition, useStyleSheet, useBuffer,
  useTick, usePhaseTimer, useProfiler, useImperativeAnimation,
  useEventCalendarBehavior,
} from "../../src/hooks/index.js";

// ── Headless hooks ──────────────────────────────────────────────────────
import {
  useSelectBehavior, useListBehavior, useMenuBehavior, useTreeBehavior,
  useTabsBehavior, useAccordionBehavior, usePaginatorBehavior,
  useStepperBehavior, useDataGridBehavior, useTableBehavior,
  useVirtualListBehavior, useDialogBehavior, useToastBehavior,
  useFormBehavior, useCalendarBehavior, useCollapsibleBehavior,
  useTextInputBehavior, useChatInputBehavior, useTextAreaBehavior,
} from "../../src/hooks/headless/index.js";

// ── Test runner ─────────────────────────────────────────────────────────

const W = 40;
const H = 5;
let styleFixturePath: string;
let styleFixtureDirectory: string;
let imageFixturePath: string;

function smoke(name: string, fn: () => void): void {
  it(name, () => {
    expect(fn).not.toThrow();
  });
}

function renderEl(el: React.ReactElement): void {
  const r = renderToString(el, { width: W, height: H });
  r.unmount();
}

/** Helper: wraps a hook-calling component in Box so TUI context is available */
function renderHook(name: string, hookFn: () => void): void {
  smoke(name, () => {
    function HookTest(): React.ReactElement {
      hookFn();
      return React.createElement(Text, null, "ok");
    }
    renderEl(React.createElement(Box, null, React.createElement(HookTest)));
  });
}

const noop = () => {};

describe("all public exports", () => {
  beforeAll(() => {
    styleFixtureDirectory = mkdtempSync(join(tmpdir(), "reacterm-style-"));
    styleFixturePath = join(styleFixtureDirectory, "fixture.css");
    imageFixturePath = join(styleFixtureDirectory, "fixture.png");
    writeFileSync(styleFixturePath, "");
    writeFileSync(
      imageFixturePath,
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC", "base64"),
    );
  });

  afterAll(() => {
    rmSync(styleFixtureDirectory, { recursive: true, force: true });
  });

// ════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════════════════════════════════════════
console.log("\n=== COMPONENTS ===\n");

// ── Core ────────────────────────────────────────────────────────────────
smoke("Box", () => renderEl(React.createElement(Box, null, React.createElement(Text, null, "hi"))));
smoke("Text", () => renderEl(React.createElement(Text, null, "hello")));
smoke("Newline", () => renderEl(React.createElement(Newline)));
smoke("Spacer", () => renderEl(React.createElement(Box, null, React.createElement(Spacer))));
smoke("Static", () => renderEl(React.createElement(Static, { items: ["a", "b"], children: (item, i) => React.createElement(Text, { key: i }, String(item)) })));
smoke("Overlay", () => renderEl(React.createElement(Box, null, React.createElement(Overlay, { visible: true }, React.createElement(Text, null, "over")))));
smoke("ScrollView", () => renderEl(React.createElement(ScrollView, { height: 3 }, React.createElement(Text, null, "scroll"))));
smoke("Modal", () => renderEl(React.createElement(Box, null, React.createElement(Modal, { visible: true, children: React.createElement(Text, null, "modal") }))));
smoke("Divider", () => renderEl(React.createElement(Divider)));
smoke("TextInput", () => renderEl(React.createElement(TextInput, { value: "hi", onChange: noop, isFocused: false })));
smoke("SelectInput", () => renderEl(React.createElement(SelectInput, { items: [{ label: "A", value: "a" }], onSelect: noop, isFocused: false })));
smoke("Select", () => renderEl(React.createElement(Select, { options: [{ label: "A", value: "a" }], isFocused: false })));
smoke("Checkbox", () => renderEl(React.createElement(Checkbox, { checked: false, isFocused: false })));
smoke("RadioGroup", () => renderEl(React.createElement(RadioGroup, { options: [{ label: "A", value: "a" }], value: "a", isFocused: false })));
smoke("Switch", () => renderEl(React.createElement(Switch, { checked: false, isFocused: false })));
smoke("Button", () => renderEl(React.createElement(Button, { label: "Click", isFocused: false })));
smoke("Spinner", () => renderEl(React.createElement(Spinner)));
smoke("ProgressBar", () => renderEl(React.createElement(ProgressBar, { value: 50, width: 20 })));
smoke("Tabs", () => renderEl(React.createElement(Tabs, { tabs: [{ key: "a", label: "A" }], activeKey: "a", isFocused: false })));
smoke("ListView", () => renderEl(React.createElement(ListView, { items: [{ key: "a", label: "Item" }], isFocused: false })));
smoke("VirtualList", () => renderEl(React.createElement(VirtualList, { items: ["a", "b", "c", "d", "e"], itemHeight: 1, height: 3, renderItem: (item, i) => React.createElement(Text, { key: i }, String(item)), isFocused: false })));
smoke("TextArea", () => renderEl(React.createElement(TextArea, { value: "hello", onChange: noop, isFocused: false })));
smoke("FocusGroup", () => renderEl(React.createElement(FocusGroup, null, React.createElement(Text, null, "focus"))));
smoke("ErrorBoundary", () => renderEl(React.createElement(ErrorBoundary, null, React.createElement(Text, null, "safe"))));

// ── Extras ──────────────────────────────────────────────────────────────
smoke("Collapsible", () => renderEl(React.createElement(Collapsible, { title: "Section" }, React.createElement(Text, null, "body"))));
smoke("ContentSwitcher", () => renderEl(React.createElement(ContentSwitcher, { activeIndex: 0, children: [React.createElement(Text, { key: "tab0" }, "tab0"), React.createElement(Text, { key: "tab1" }, "tab1")] })));
smoke("TabbedContent", () => renderEl(React.createElement(TabbedContent, { tabs: [{ label: "T1", key: "t1" }], activeKey: "t1", isFocused: false, children: React.createElement(Text, null, "panel") })));
smoke("Accordion", () => renderEl(React.createElement(Accordion, { sections: [{ key: "s1", title: "S1", content: React.createElement(Text, null, "body") }], isFocused: false })));
smoke("Tooltip", () => renderEl(React.createElement(Tooltip, { content: "tip", children: React.createElement(Text, null, "hover") })));
smoke("Heading", () => renderEl(React.createElement(Heading, null, "Title")));
smoke("Paragraph", () => renderEl(React.createElement(Paragraph, null, "Text body")));
smoke("Link", () => renderEl(React.createElement(Link, { url: "https://example.com", children: "click" })));
smoke("Badge", () => renderEl(React.createElement(Badge, { label: "NEW" })));
smoke("StatusMessage", () => renderEl(React.createElement(StatusMessage, { message: "OK", type: "success" })));
smoke("Alert", () => renderEl(React.createElement(Alert, { type: "info", children: React.createElement(Text, null, "alert") })));
smoke("Avatar", () => renderEl(React.createElement(Avatar, { name: "John Doe" })));
smoke("Placeholder", () => renderEl(React.createElement(Placeholder, { width: 10, height: 2 })));
smoke("Pretty", () => renderEl(React.createElement(Pretty, { data: { key: "value" } })));
smoke("Breadcrumb", () => renderEl(React.createElement(Breadcrumb, { items: ["Home", "Page"] })));
smoke("Tag", () => renderEl(React.createElement(Tag, { label: "tag" })));
smoke("Collapsible", () => renderEl(React.createElement(Collapsible, { title: "X" })));
smoke("Toast", () => renderEl(React.createElement(Toast, { message: "Hello", visible: true })));
smoke("Stopwatch", () => renderEl(React.createElement(Stopwatch)));
smoke("Timer", () => renderEl(React.createElement(Timer)));
smoke("LoadingIndicator", () => renderEl(React.createElement(LoadingIndicator)));
smoke("RevealTransition", () => renderEl(React.createElement(RevealTransition, { visible: true, children: React.createElement(Text, null, "hi") })));
smoke("Paginator", () => renderEl(React.createElement(Paginator, { total: 5, current: 0 })));
smoke("Stepper", () => renderEl(React.createElement(Stepper, { steps: [{ label: "Step 1" }, { label: "Step 2" }], activeStep: 0 })));
smoke("KeyboardHelp", () => renderEl(React.createElement(KeyboardHelp, { bindings: [{ key: "q", label: "Quit" }] })));
smoke("HelpPanel", () => renderEl(React.createElement(HelpPanel, { bindings: [{ keys: "q", description: "Quit" }] })));
smoke("Header", () => renderEl(React.createElement(Header, { title: "Header" })));
smoke("Footer", () => renderEl(React.createElement(Footer)));
smoke("Card", () => renderEl(React.createElement(Card, { title: "Card", children: React.createElement(Text, null, "body") })));
smoke("Kbd", () => renderEl(React.createElement(Kbd, null, "Ctrl+C")));
smoke("ChatInput", () => renderEl(React.createElement(ChatInput, { value: "", onChange: noop, isFocused: false })));
smoke("MaskedInput", () => renderEl(React.createElement(MaskedInput, { value: "", onChange: noop, mask: "***", isFocused: false })));
smoke("SearchInput", () => renderEl(React.createElement(SearchInput, { value: "", onChange: noop, isFocused: false })));
smoke("SelectionList", () => renderEl(React.createElement(SelectionList, { items: [{ label: "A", value: "a" }], selectedValues: [], isFocused: false })));
smoke("Form", () => renderEl(React.createElement(Form, { fields: [{ key: "name", label: "Name" }], isFocused: false })));
smoke("FilePicker", () => renderEl(React.createElement(FilePicker, { files: [{ name: "a.txt", path: "/tmp/a.txt", isDirectory: false }], isFocused: false })));
smoke("Calendar", () => renderEl(React.createElement(Calendar, { year: 2024, month: 1, isFocused: false })));
smoke("ConfirmDialog", () => renderEl(React.createElement(ConfirmDialog, { visible: true, message: "Sure?" })));
smoke("Menu", () => renderEl(React.createElement(Menu, { items: [{ label: "Open", value: "open" }], isFocused: false })));
smoke("OptionList", () => renderEl(React.createElement(OptionList, { items: [{ label: "Opt", value: "o" }], isFocused: false })));
smoke("CommandPalette", () => renderEl(React.createElement(CommandPalette, { commands: [{ id: "c", name: "Cmd", description: "Smoke command" }], onExecute: noop, isOpen: true, isActive: false })));
smoke("DiffView", () => renderEl(React.createElement(DiffView, { diff: "--- a\n+++ b\n@@ -1 +1 @@\n-old\n+new" })));
smoke("InlineDiff", () => renderEl(React.createElement(InlineDiff, { before: "hello", after: "world" })));
smoke("Markdown", () => renderEl(React.createElement(Markdown, { content: "# Hello\n\nWorld" })));
smoke("MarkdownViewer", () => renderEl(React.createElement(MarkdownViewer, { content: "# Test\n\nBody", isFocused: false })));
smoke("DatePicker", () => renderEl(React.createElement(DatePicker, { isFocused: false })));
smoke("EventCalendar", () => renderEl(React.createElement(EventCalendar, { events: [], isFocused: false })));
smoke("Welcome", () => renderEl(React.createElement(Welcome, { title: "App" })));
smoke("Transition", () => renderEl(React.createElement(Transition, { show: true, children: React.createElement(Text, null, "hi") })));
smoke("AnimatePresence", () => renderEl(React.createElement(AnimatePresence, null, React.createElement(Text, { key: "a" }, "hi"))));

// ── Data / Charts ───────────────────────────────────────────────────────
smoke("Table", () => renderEl(React.createElement(Table, { columns: [{ key: "n", header: "Name", width: 10 }], data: [{ n: "A" }] })));
smoke("DataGrid", () => renderEl(React.createElement(DataGrid, { columns: [{ key: "n", label: "Name", width: 10 }], rows: [{ n: "A" }], isFocused: false })));
smoke("Tree", () => renderEl(React.createElement(Tree, { nodes: [{ key: "r", label: "Root" }], isFocused: false })));
smoke("DirectoryTree", () => renderEl(React.createElement(DirectoryTree, { rootPath: "/tmp", isFocused: false })));
smoke("OrderedList", () => renderEl(React.createElement(OrderedList, { items: ["One", "Two"] })));
smoke("UnorderedList", () => renderEl(React.createElement(UnorderedList, { items: ["A", "B"] })));
smoke("DefinitionList", () => renderEl(React.createElement(DefinitionList, { items: [{ term: "Key", definition: "Val" }] })));
smoke("RichLog", () => renderEl(React.createElement(RichLog, { entries: [{ text: "Log line", level: "info" }] })));
smoke("Sparkline", () => renderEl(React.createElement(Sparkline, { data: [1, 3, 2, 5, 4], width: 10 })));
smoke("LineChart", () => renderEl(React.createElement(LineChart, { series: [{ name: "S", data: [1, 2, 3] }], width: 20, height: 5 })));
smoke("Heatmap", () => renderEl(React.createElement(Heatmap, { data: [[1, 2], [3, 4]] })));
smoke("Histogram", () => renderEl(React.createElement(Histogram, { data: [1, 2, 2, 3, 3, 3], width: 20, height: 5 })));
smoke("AreaChart", () => renderEl(React.createElement(AreaChart, { series: [{ name: "A", data: [1, 2, 3] }], width: 20, height: 5 })));
smoke("BarChart", () => renderEl(React.createElement(BarChart, { bars: [{ label: "A", value: 5 }, { label: "B", value: 3 }] })));
smoke("ScatterPlot", () => renderEl(React.createElement(ScatterPlot, { series: [{ data: [[1, 2], [3, 4]] as [number, number][], name: "S" }], width: 20, height: 5 })));
smoke("Diagram", () => renderEl(React.createElement(Diagram, { nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }], edges: [{ from: "a", to: "b" }] })));
smoke("Gauge", () => renderEl(React.createElement(Gauge, { value: 60 })));

// ── Effects ─────────────────────────────────────────────────────────────
smoke("Gradient", () => renderEl(React.createElement(Gradient, { colors: ["#ff0000", "#0000ff"], children: "gradient" })));
smoke("Digits", () => renderEl(React.createElement(Digits, { value: "42" })));
smoke("GlowText", () => renderEl(React.createElement(GlowText, null, "glow")));
smoke("GradientBorder", () => renderEl(React.createElement(GradientBorder, null, React.createElement(Text, null, "bordered"))));
smoke("GradientProgress", () => renderEl(React.createElement(GradientProgress, { value: 0.5, width: 20 })));
smoke("Shadow", () => renderEl(React.createElement(Shadow, null, React.createElement(Text, null, "shadow"))));
it("Image decodes the managed PNG fixture", () => {
  const result = renderToString(
    React.createElement(Image, {
      src: imageFixturePath,
      alt: "image fixture",
      width: 1,
      height: 1,
      protocol: "block",
    }),
    { width: W, height: H },
  );

  expect(result.output).not.toContain("image fixture");
  result.unmount();
});

// ════════════════════════════════════════════════════════════════════════
// WIDGETS
// ════════════════════════════════════════════════════════════════════════
console.log("\n=== WIDGETS ===\n");

smoke("OperationTree", () => renderEl(React.createElement(OperationTree, { nodes: [{ id: "1", label: "Op1", status: "completed" }] })));
smoke("StreamingText", () => renderEl(React.createElement(StreamingText, { text: "hello world" })));
smoke("SyntaxHighlight", () => renderEl(React.createElement(SyntaxHighlight, { code: "const x = 1;", language: "typescript" })));
smoke("ShimmerText", () => renderEl(React.createElement(ShimmerText, { text: "loading..." })));
smoke("BlinkDot", () => renderEl(React.createElement(BlinkDot, { state: "pending" })));
smoke("ApprovalPrompt", () => renderEl(React.createElement(ApprovalPrompt, { tool: "exec", onSelect: noop, visible: false })));
smoke("CommandDropdown", () => renderEl(React.createElement(CommandDropdown, { items: [{ name: "Cmd", description: "Smoke command" }], isFocused: false })));
smoke("StatusLine", () => renderEl(React.createElement(StatusLine, { left: "Left", right: "Right" })));
smoke("MessageBubble", () => renderEl(React.createElement(MessageBubble, { role: "user", children: "Hello" })));
smoke("PerformanceHUD", () => renderEl(React.createElement(PerformanceHUD, { visible: true, fps: 60, renderTimeMs: 2 })));
smoke("TokenStream", () => renderEl(React.createElement(TokenStream, { tokens: 1000 })));
smoke("ContextWindow", () => renderEl(React.createElement(ContextWindow, { used: 5000, limit: 128000 })));
smoke("CostTracker", () => renderEl(React.createElement(CostTracker, { inputTokens: 1000, outputTokens: 500 })));
smoke("ModelBadge", () => renderEl(React.createElement(ModelBadge, { model: "claude-3.5-sonnet" })));
smoke("CommandBlock", () => renderEl(React.createElement(CommandBlock, { command: "ls -la" })));

// ════════════════════════════════════════════════════════════════════════
// HOOKS (regular)
// ════════════════════════════════════════════════════════════════════════
console.log("\n=== HOOKS ===\n");

// Simple hooks that need no args or minimal args
renderHook("useColors", () => { useColors(); });
renderHook("useCleanup", () => { useCleanup(noop); });
renderHook("useAsyncCleanup", () => { useAsyncCleanup(async () => {}); });
renderHook("useForceUpdate", () => { useForceUpdate(); });
renderHook("useInput", () => { useInput(noop, { isActive: false }); });
renderHook("useMouse", () => { useMouse(noop, { isActive: false }); });
renderHook("useTerminal", () => { useTerminal(); });
renderHook("useFocus", () => { useFocus({ autoFocus: false }); });
renderHook("useScroll", () => { useScroll({ contentHeight: 10, viewportHeight: 5 }); });
renderHook("useMeasure", () => { useMeasure("smoke"); });
renderHook("useApp", () => { useApp(); });
renderHook("useStdin", () => { useStdin(); });
renderHook("useStdout", () => { useStdout(); });
renderHook("useStderr", () => { useStderr(); });
renderHook("useFocusManager", () => { useFocusManager(); });
renderHook("useAnimation", () => { useAnimation({ active: false }); });
renderHook("usePaste", () => { usePaste(noop); });
renderHook("useInterval", () => { useInterval(noop, 1, { active: false }); });
renderHook("useTimeout", () => { useTimeout(noop, 1); });
renderHook("useVirtualList", () => { useVirtualList({ items: ["a", "b", "c"], itemHeight: 1, viewportHeight: 5 }); });
renderHook("useClipboard", () => { useClipboard(); });
renderHook("useAccessibility", () => { useAccessibility(); });
renderHook("useReducedMotion", () => { useReducedMotion(); });
renderHook("useAdaptive", () => { useAdaptive(); });
renderHook("usePluginManager", () => { usePluginManager(); });
renderHook("usePluginProps", () => { usePluginProps("Test", {}); });
renderHook("useAnnounce", () => { useAnnounce(); });
renderHook("useTextCycler", () => { useTextCycler({ texts: ["a", "b"], intervalMs: 1000, active: false }); });
renderHook("useCollapsibleContent", () => { useCollapsibleContent({ content: "Hello world\nline two\nline three", maxLines: 2 }); });
renderHook("useModeCycler", () => { useModeCycler({ modes: ["a", "b"], cycleKey: { key: "m" }, isActive: false }); });
renderHook("useGhostText", () => { useGhostText({ value: "", cursor: 0, suggest: ["hello"] }); });
renderHook("useInlinePrompt", () => { useInlinePrompt({ choices: { y: "yes" }, isActive: false }); });
renderHook("useEasedInterval", () => { useEasedInterval({ durations: [100, 200], onTick: noop, active: false }); });
renderHook("useTypeahead", () => { useTypeahead({ items: ["apple", "banana"], onMatch: noop, isActive: false }); });
renderHook("useSearchFilter", () => { useSearchFilter({ items: ["a", "b"], getLabel: (item) => item, isActive: false }); });
renderHook("useMultiSelect", () => { useMultiSelect({ itemCount: 2, isActive: false }); });
renderHook("useUndoRedo", () => { useUndoRedo({ initial: "init" }); });
renderHook("useCommandPalette", () => { useCommandPalette({ commands: [{ name: "C", description: "Smoke command" }], onExecute: noop, isActive: false }); });
renderHook("useHotkey", () => { useHotkey({ hotkeys: [], isActive: false }); });
renderHook("useTimer", () => { useTimer({ mode: "stopwatch", autoStart: false }); });
renderHook("useConfirmAction", () => { useConfirmAction({ isActive: false }); });
renderHook("useNotification", () => { useNotification({}); });
renderHook("useWizard", () => { useWizard({ steps: [{ key: "s1", label: "Step 1" }] }); });
renderHook("useStreamConsumer", () => { useStreamConsumer({}); });
renderHook("useBatchAction", () => { useBatchAction({ itemCount: 2, isActive: false }); });
renderHook("useKeyChord", () => { useKeyChord({ chords: [] }); });
renderHook("useSortable", () => { useSortable({ columns: ["name"], isActive: false }); });
renderHook("useHistory", () => { useHistory({ initial: "initial" }); });
renderHook("useAsyncLoader", () => { useAsyncLoader({ load: async () => "done", autoLoad: false }); });
renderHook("usePersistentState", () => { usePersistentState({ key: "test", initial: "" }); });
renderHook("useContextMenu", () => { useContextMenu({ items: [] }); });
renderHook("useDragReorder", () => { useDragReorder({ items: ["a", "b"], onReorder: noop, isActive: false }); });
renderHook("useInfiniteScroll", () => { useInfiniteScroll({ onLoadMore: async () => {}, hasMore: false, isActive: false }); });
renderHook("useCopyPasteBuffer", () => { useCopyPasteBuffer({}); });
renderHook("useLocale", () => { useLocale(); });
renderHook("useTransition", () => { useTransition({ from: 0, to: 1, duration: 100 }); });
renderHook("useStyleSheet", () => { useStyleSheet({ path: styleFixturePath, watch: false }); });
renderHook("useBuffer", () => { useBuffer(); });
renderHook("useTick", () => { useTick(1, noop, { active: false }); });
renderHook("usePhaseTimer", () => { usePhaseTimer([{ phase: "start", at: 0 }], { autoStart: false }); });
renderHook("useProfiler", () => { useProfiler(); });
renderHook("useImperativeAnimation", () => { useImperativeAnimation({ intervalMs: 1, onTick: noop, active: false }); });
renderHook("useEventCalendarBehavior", () => { useEventCalendarBehavior({ events: [] }); });

// ════════════════════════════════════════════════════════════════════════
// HEADLESS HOOKS
// ════════════════════════════════════════════════════════════════════════
console.log("\n=== HEADLESS HOOKS ===\n");

renderHook("useSelectBehavior", () => { useSelectBehavior({ options: [{ label: "A", value: "a" }] }); });
renderHook("useListBehavior", () => { useListBehavior({ items: [{ key: "1", label: "A" }], isActive: false }); });
renderHook("useMenuBehavior", () => { useMenuBehavior({ items: [{ label: "A", value: "a" }], isActive: false }); });
renderHook("useTreeBehavior", () => { useTreeBehavior({ nodes: [{ key: "1", label: "A" }], isActive: false }); });
renderHook("useTabsBehavior", () => { useTabsBehavior({ tabs: [{ key: "a", label: "A" }], activeKey: "a", isActive: false }); });
renderHook("useAccordionBehavior", () => { useAccordionBehavior({ sections: [{ key: "s", title: "S" }] }); });
renderHook("usePaginatorBehavior", () => { usePaginatorBehavior({ total: 5, current: 0, isActive: false }); });
renderHook("useStepperBehavior", () => { useStepperBehavior({ steps: [{ label: "S1" }], activeStep: 0 }); });
renderHook("useDataGridBehavior", () => { useDataGridBehavior({ columns: [{ key: "n", label: "N" }], rows: [{ n: "A" }] }); });
renderHook("useTableBehavior", () => { useTableBehavior({ columns: [{ key: "n", header: "N" }], data: [{ n: "A" }] }); });
renderHook("useVirtualListBehavior", () => { useVirtualListBehavior({ items: ["a", "b", "c"], viewportHeight: 5, itemHeight: 1 }); });
renderHook("useDialogBehavior", () => { useDialogBehavior({}); });
renderHook("useToastBehavior", () => { useToastBehavior({}); });
renderHook("useFormBehavior", () => { useFormBehavior({ fields: [{ key: "name", label: "Name" }] }); });
renderHook("useCalendarBehavior", () => { useCalendarBehavior({ year: 2024, month: 1 }); });
renderHook("useCollapsibleBehavior", () => { useCollapsibleBehavior({}); });
renderHook("useTextInputBehavior", () => { useTextInputBehavior({ value: "", onChange: noop }); });
renderHook("useChatInputBehavior", () => { useChatInputBehavior({ value: "", onChange: noop }); });
renderHook("useTextAreaBehavior", () => { useTextAreaBehavior({ value: "", onChange: noop }); });

});
