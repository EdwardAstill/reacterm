import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * reacterm demo — an interactive showcase.
 *
 * One running app, 22 sections, every reacterm feature wired up so you can
 * hit a key and *do* something instead of just looking at it.
 *
 *   1 Welcome         hero stats + getting-started
 *   2 Layout          nested Panes, ScrollView, ListView
 *   3 Forms           text/textarea inputs, switch, checkbox, radio, button → toast
 *   4 Search          SearchList over a 100-item dataset (single focus owner)
 *   5 Data            DataGrid + Tree + RichLog + Pretty + scroll-to-edit table
 *   6 Calendar        Calendar + DatePicker + disabled-date rules
 *   7 Charts          Sparkline + Gauge + BarChart + LineChart + AreaChart, live
 *   8 AI              StreamingText + OperationTree + ApprovalPrompt
 *   9 Mouse           useMousePosition crosshair, click coords, hover regions
 *  10 Themes          live cycle through 11 preset themes
 *  11 Editor          Editor + Markdown + DiffView + InlineDiff + SyntaxHighlight
 *  12 Effects         Transition, AnimatePresence, Shadow, Glow, Gradient, Diagram
 *  13 Anim Lab        useTextCycler, useEasedInterval, useTick imperative
 *  14 Hooks           useUndoRedo, useWizard, usePersistentState, useConfirmAction
 *  15 Behaviors       15 headless behavior hooks
 *  16 i18n            6 locales with plural rules + RTL
 *  17 DevTools        4 panels + 3 middlewares
 *  18 Plugins         5 built-in plugins
 *  19 Personality     defaultPreset / minimalPreset / hackerPreset / playfulPreset
 *  20 A11y            useAnnounce, contrastRatio, validateContrast
 *  21 Capabilities    detectTerminal, detectImageCaps, bestColorDepth
 *  22 About           catalog rendering with DefinitionList + lists
 *
 * Globals: Tab/Shift-Tab cycle sections · ? help overlay · t cycle theme · q quit
 *
 * Usage: reacterm demo
 *    or: npx tsx examples/reacterm-demo.tsx
 */
import React, { useEffect, useRef, useState } from "react";
import { 
// shell
Box, Text, Spacer, 
// primitives
Spinner, Badge, Divider, ProgressBar, Tag, Kbd, 
// inputs
TextInput, TextArea, Switch, Checkbox, RadioGroup, Button, MaskedInput, ChatInput, Select, 
// composites
ScrollView, ListView, Modal, KeyboardHelp, Toast, Stepper, Heading, Calendar, DatePicker, EventCalendar, 
// personality
PersonalityProvider, defaultPreset, minimalPreset, hackerPreset, playfulPreset, 
// search (the new one)
SearchList, 
// data
Tree, TreeTable, RichLog, Pretty, DefinitionList, OrderedList, UnorderedList, 
// charts
Sparkline, Gauge, BarChart, LineChart, AreaChart, Heatmap, Histogram, 
// ai widgets
OperationTree, StreamingText, ApprovalPrompt, MessageBubble, ShimmerText, BlinkDot, ContextWindow, CostTracker, ModelBadge, StatusLine, TokenStream, CommandBlock, 
// editor / docs
Editor, Markdown, MarkdownViewer, DiffView, InlineDiff, SyntaxHighlight, 
// effects
Transition, AnimatePresence, GlowText, GradientBorder, Gradient, GradientProgress, RevealTransition, Digits, Diagram, Canvas, 
// theming
ThemeProvider, useTheme, arcticTheme, midnightTheme, emberTheme, mistTheme, voltageTheme, duskTheme, horizonTheme, neonTheme, calmTheme, highContrastTheme, monochromeTheme, validateContrast, contrastRatio, 
// i18n
LocaleProvider, formatNumber, t as i18nT, plural, PLURAL_EN, PLURAL_AR, PLURAL_FR, PLURAL_RU, PLURAL_JA, 
// hooks: essential + state
useTui, useTerminal, useInput, useTick, useMousePosition, useMouseTarget, useUndoRedo, useHotkey, useConfirmAction, useWizard, usePersistentState, memoryStorage, useTextCycler, useEasedInterval, useAnnounce, 
// capabilities
detectTerminal, detectImageCaps, bestColorDepth, } from "../../index.js";
import { useEventCalendarBehavior } from "../../hooks/index.js";
// ── Themes catalog ──────────────────────────────────────────────────────
const THEMES = [
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
    { key: "layout", label: "Layout", icon: "▤", group: "Build" },
    { key: "forms", label: "Forms", icon: "✎", group: "Build" },
    { key: "search", label: "Search", icon: "⌕", group: "Build" },
    { key: "data", label: "Data", icon: "▦", group: "Build" },
    { key: "calendar", label: "Calendar", icon: "▣", group: "Build" },
    // Visualize
    { key: "charts", label: "Charts", icon: "▁", group: "Visualize" },
    { key: "ai", label: "AI", icon: "◆", group: "Visualize" },
    { key: "editor", label: "Editor", icon: "✦", group: "Visualize" },
    { key: "effects", label: "Effects", icon: "✺", group: "Visualize" },
    // Hooks & Behaviors
    { key: "anim", label: "Anim Lab", icon: "≋", group: "Hooks" },
    { key: "hooks", label: "Hooks", icon: "⚙", group: "Hooks" },
    { key: "behave", label: "Behaviors", icon: "⌬", group: "Hooks" },
    // Internals
    { key: "i18n", label: "i18n", icon: "⌘", group: "Internals" },
    { key: "devtools", label: "DevTools", icon: "⚒", group: "Internals" },
    { key: "plugins", label: "Plugins", icon: "⌬", group: "Internals" },
    { key: "person", label: "Personality", icon: "◑", group: "Internals" },
    { key: "a11y", label: "A11y", icon: "♿", group: "Internals" },
    { key: "caps", label: "Capabilities", icon: "ⓘ", group: "Internals" },
    // Meta
    { key: "mouse", label: "Mouse", icon: "✥", group: "Meta" },
    { key: "themes", label: "Themes", icon: "◐", group: "Meta" },
    { key: "about", label: "About", icon: "?", group: "Meta" },
];
function Clickable(props) {
    const { onClick, onAlt, children, ...layout } = props;
    const target = useMouseTarget({
        onMouse: (event) => {
            if (event.action !== "press")
                return;
            if (event.button === "left")
                onClick();
            else if (event.button === "middle")
                onAlt?.();
        },
    });
    return React.createElement("tui-box", { ...layout, ...target.targetProps }, children);
}
// ── Helpers ─────────────────────────────────────────────────────────────
function pushToast(setToasts, msg, type = "info") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
}
// ── Welcome ─────────────────────────────────────────────────────────────
function WelcomeSection() {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "REACTERM" }), _jsx(Badge, { label: "LIVE", variant: "success" }), _jsx(Spinner, { type: "dots", color: theme.colors.brand.primary })] }), _jsx(Text, { color: theme.colors.text.dim, children: "An interactive tour of every major reacterm capability \u2014 keyboard, mouse, layout, theming." }), _jsxs(Box, { flexDirection: "row", gap: 4, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "97" }), _jsx(Text, { color: theme.colors.text.dim, children: "components" })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.colors.success, children: "83" }), _jsx(Text, { color: theme.colors.text.dim, children: "hooks" })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.colors.warning, children: "11" }), _jsx(Text, { color: theme.colors.text.dim, children: "themes" })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.colors.info, children: "15" }), _jsx(Text, { color: theme.colors.text.dim, children: "AI widgets" })] })] }), _jsx(Divider, {}), _jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Try this:" }), _jsxs(Text, { color: theme.colors.text.secondary, children: ["  \u2022 Press ", _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Tab" }), " to advance to the next section."] }), _jsxs(Text, { color: theme.colors.text.secondary, children: ["  \u2022 Press ", _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "?" }), " for the keyboard cheatsheet."] }), _jsxs(Text, { color: theme.colors.text.secondary, children: ["  \u2022 Press ", _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "t" }), " to cycle the theme; everything restyles immediately."] }), _jsx(Text, { color: theme.colors.text.secondary, children: "  \u2022 Click anywhere \u2014 the Mouse section tracks the cursor live." }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsx(ModelBadge, { model: "claude-opus-4-7", provider: "anthropic" }), _jsx(BlinkDot, { state: "streaming" }), _jsx(Text, { color: theme.colors.text.dim, children: "22 sections \u00B7 100+ widgets \u00B7 all interactive" })] })] }));
}
// ── Layout ──────────────────────────────────────────────────────────────
function LayoutSection() {
    const theme = useTheme();
    const items = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        label: `Row ${String(i + 1).padStart(2, "0")} — entry`,
    }));
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, height: "100%", children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Layout primitives" }), _jsx(Text, { color: theme.colors.text.dim, children: "Pure-TS flexbox + nested Panes. ScrollView windows large lists. ListView gives you arrow-key nav for free." }), _jsxs(Box, { flexDirection: "row", gap: 2, flex: 1, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", flex: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "ScrollView (30 rows)" }), _jsx(ScrollView, { height: 10, children: items.map((it) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.colors.text.dim, children: "\u00B7  " }), _jsx(Text, { color: theme.colors.text.secondary, children: it.label })] }, it.id))) })] }), _jsxs(Box, { flexDirection: "column", flex: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "ListView (arrow keys)" }), _jsx(ListView, { items: items.slice(0, 12).map((it) => ({ key: it.id, label: it.label })), isFocused: true })] })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Badge, { label: "flex", variant: "info" }), _jsx(Badge, { label: "grid", variant: "info" }), _jsx(Badge, { label: "overflow: hidden | scroll", variant: "default" }), _jsx(Badge, { label: "absolute", variant: "default" })] })] }));
}
// ── Forms ───────────────────────────────────────────────────────────────
const FORM_FIELDS = ["name", "phone", "bio", "chat", "subscribe", "agree", "role", "tier", "submit"];
const ROLE_OPTIONS = [
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Viewer", value: "viewer" },
    { label: "Owner", value: "owner" },
    { label: "Guest", value: "guest" },
];
function FormRow(props) {
    const theme = useTheme();
    return (_jsxs(Clickable, { onClick: () => props.onSelect(props.fieldKey), flexDirection: "row", children: [_jsx(Text, { color: props.focused ? theme.colors.brand.primary : theme.colors.text.dim, bold: props.focused, children: props.focused ? "▶ " : "  " }), _jsx(Box, { width: 12, children: _jsx(Text, { color: theme.colors.text.secondary, children: props.label }) }), _jsx(Box, { flex: 1, children: props.children })] }));
}
function FormsSection({ pushToast: toast }) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [chat, setChat] = useState("");
    const [subscribe, setSubscribe] = useState(true);
    const [agree, setAgree] = useState(false);
    const [role, setRole] = useState("editor");
    const [tier, setTier] = useState("free");
    const [field, setField] = useState("name");
    const stepLookup = {
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
            setField(FORM_FIELDS[(idx + 1) % FORM_FIELDS.length]);
        }
        else if (e.key === "left" && e.shift) {
            e.consumed = true;
            const idx = FORM_FIELDS.indexOf(field);
            setField(FORM_FIELDS[(idx - 1 + FORM_FIELDS.length) % FORM_FIELDS.length]);
        }
    });
    const submit = () => {
        if (!name) {
            toast("Name is required", "warning");
            return;
        }
        if (!agree) {
            toast("You must agree to the terms", "error");
            return;
        }
        toast(`Welcome, ${name} — ${role} on ${tier} tier`, "success");
        setName("");
        setPhone("");
        setBio("");
        setChat("");
        setAgree(false);
        setRole("editor");
        setTier("free");
        setSubscribe(true);
        setField("name");
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Form controls" }), _jsx(Text, { color: theme.colors.text.dim, children: "Shift-Right / Shift-Left moves between fields, or click a row. Each control responds when it owns focus." }), _jsx(Box, { marginTop: 1, children: _jsx(Stepper, { steps: [
                        { label: "Identity" },
                        { label: "Profile" },
                        { label: "Settings" },
                        { label: "Submit" },
                    ], activeStep: wizardStep, orientation: "horizontal" }) }), _jsxs(Box, { flexDirection: "column", gap: 0, marginTop: 1, children: [_jsx(FormRow, { onSelect: setField, label: "Name", fieldKey: "name", focused: field === "name", children: _jsx(TextInput, { value: name, onChange: setName, placeholder: "your name", isFocused: field === "name" }) }), _jsx(FormRow, { onSelect: setField, label: "Phone", fieldKey: "phone", focused: field === "phone", children: _jsx(MaskedInput, { value: phone, onChange: setPhone, mask: "(###) ###-####", isFocused: field === "phone" }) }), _jsx(FormRow, { onSelect: setField, label: "Bio", fieldKey: "bio", focused: field === "bio", children: _jsx(TextArea, { value: bio, onChange: setBio, height: 3, isFocused: field === "bio" }) }), _jsx(FormRow, { onSelect: setField, label: "Chat", fieldKey: "chat", focused: field === "chat", children: _jsx(ChatInput, { value: chat, onChange: setChat, placeholder: "message\u2026", isFocused: field === "chat", onSubmit: (msg) => { toast(`Sent: ${msg}`, "info"); setChat(""); } }) }), _jsx(FormRow, { onSelect: setField, label: "Subscribe", fieldKey: "subscribe", focused: field === "subscribe", children: _jsx(Switch, { checked: subscribe, onChange: setSubscribe, isFocused: field === "subscribe" }) }), _jsx(FormRow, { onSelect: setField, label: "Agree", fieldKey: "agree", focused: field === "agree", children: _jsx(Checkbox, { checked: agree, onChange: setAgree, label: "I accept the terms", isFocused: field === "agree" }) }), _jsx(FormRow, { onSelect: setField, label: "Role", fieldKey: "role", focused: field === "role", children: _jsx(Select, { options: ROLE_OPTIONS, value: role, onChange: setRole, isFocused: field === "role", placeholder: "pick a role" }) }), _jsx(FormRow, { onSelect: setField, label: "Tier", fieldKey: "tier", focused: field === "tier", children: _jsx(RadioGroup, { options: [
                                { value: "free", label: "Free" },
                                { value: "pro", label: "Pro" },
                                { value: "team", label: "Team" },
                            ], value: tier, onChange: setTier, isFocused: field === "tier", direction: "row" }) }), _jsx(FormRow, { onSelect: setField, label: "", fieldKey: "submit", focused: field === "submit", children: _jsx(Button, { label: "Submit", onPress: submit, isFocused: field === "submit", variant: "primary" }) })] }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsx(Tag, { label: "phone-mask" }), _jsx(Tag, { label: "schema" }), _jsx(Tag, { label: "async-validate" }), _jsx(Kbd, { children: "Shift+\u2192" })] })] }));
}
// ── Search ──────────────────────────────────────────────────────────────
const SEARCH_DATA = (() => {
    const verbs = ["build", "deploy", "lint", "test", "format", "release", "ship", "plan", "review", "merge", "rollback", "publish", "audit", "pin", "scaffold", "index", "snapshot", "trace"];
    const nouns = ["repo", "service", "project", "dashboard", "config", "schema", "fixture", "agent", "binary", "channel", "release", "preview", "session", "module", "namespace"];
    const out = [];
    let n = 0;
    for (const v of verbs) {
        for (const w of nouns) {
            if (n++ >= 100)
                break;
            out.push({ value: `${v}-${w}`, label: `${v} ${w}`, searchableText: `${v} ${w}` });
        }
    }
    return out;
})();
function SearchSection({ pushToast: toast }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "SearchList" }), _jsx(Text, { color: theme.colors.text.dim, children: "Single-focus-owner compound: typing filters, arrows navigate, Enter selects, Esc clears." }), _jsx(Box, { marginTop: 1, children: _jsx(SearchList, { items: SEARCH_DATA, placeholder: "Type to filter 100 commands\u2026", maxVisible: 10, onSelect: (_v, item) => toast(`Ran: ${item.label}`, "success") }) })] }));
}
// ── Data ────────────────────────────────────────────────────────────────
const TREE_DATA = [
    {
        key: "src", label: "src", icon: "📁", expanded: true,
        children: [
            { key: "core", label: "core", icon: "📁", children: [
                    { key: "buffer", label: "buffer.ts" },
                    { key: "diff", label: "diff.ts" },
                    { key: "screen", label: "screen.ts" },
                ] },
            { key: "components", label: "components", icon: "📁", expanded: true, children: [
                    { key: "Box", label: "Box.tsx" },
                    { key: "Text", label: "Text.tsx" },
                    { key: "ScrollView", label: "ScrollView.tsx" },
                ] },
            { key: "hooks", label: "hooks", icon: "📁", children: [
                    { key: "useInput", label: "useInput.ts" },
                    { key: "useMouse", label: "useMouse.ts" },
                    { key: "useFocus", label: "useFocus.ts" },
                ] },
        ],
    },
    { key: "package.json", label: "package.json", icon: "📦" },
    { key: "README.md", label: "README.md", icon: "📖" },
];
const GRID_ROWS = [
    { id: 1, name: "diff.ts", lines: 691, owner: "core", coverage: 94 },
    { id: 2, name: "renderer.ts", lines: 1466, owner: "core", coverage: 87 },
    { id: 3, name: "engine.ts", lines: 1584, owner: "layout", coverage: 91 },
    { id: 4, name: "manager.ts", lines: 344, owner: "input", coverage: 96 },
    { id: 5, name: "Form.tsx", lines: 718, owner: "extras", coverage: 82 },
    { id: 6, name: "DiffView.tsx", lines: 759, owner: "extras", coverage: 79 },
];
const GRID_COLUMNS = [
    { key: "id", label: "#", width: 3, align: "right" },
    { key: "name", label: "File", width: 16 },
    { key: "owner", label: "Module", width: 10 },
    { key: "lines", label: "Lines", width: 8, align: "right" },
    { key: "coverage", label: "Cov", width: 5, align: "right" },
];
function sortRows(rows, col, dir) {
    return [...rows].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av === bv)
            return 0;
        const sign = dir === "asc" ? 1 : -1;
        return av < bv ? -sign : sign;
    });
}
// ── FileTreePane: tree state + native click-to-toggle (Tree.tsx wires its own mouse) ──
function FileTreePane({ focused, height }) {
    const theme = useTheme();
    const [tree, setTree] = useState(TREE_DATA);
    const toggleKey = (nodes, key) => nodes.map((n) => {
        if (n.key === key)
            return { ...n, expanded: !n.expanded };
        if (n.children)
            return { ...n, children: toggleKey(n.children, key) };
        return n;
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: focused ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, ...(height !== undefined ? { height } : {}), children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "File tree" }), _jsx(Tree, { nodes: tree, isFocused: focused, onToggle: (key) => setTree((prev) => toggleKey(prev, key)) })] }));
}
// ── FileGridPane: mouse-aware sortable grid ───────────────────────────
// Built inline because DataGrid has no native click-to-sort or
// click-to-select wiring. Each column header is a Clickable (cycles
// sort direction, switches sort column on first click). Each body row
// is a Clickable that selects that row.
function FileGridPane({ focused, height }) {
    const theme = useTheme();
    const [sortCol, setSortCol] = useState("lines");
    const [sortDir, setSortDir] = useState("desc");
    const [selectedRow, setSelectedRow] = useState(0);
    const [hoverRow, setHoverRow] = useState(null);
    const sorted = sortRows(GRID_ROWS, sortCol, sortDir);
    // Keyboard sort/select support (when focused).
    useInput((e) => {
        if (!focused)
            return;
        if (e.key === "up") {
            e.consumed = true;
            setSelectedRow((i) => Math.max(0, i - 1));
            return;
        }
        if (e.key === "down") {
            e.consumed = true;
            setSelectedRow((i) => Math.min(sorted.length - 1, i + 1));
            return;
        }
        if (e.char === "s") {
            e.consumed = true;
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            return;
        }
    });
    const handleSort = (col) => {
        if (col === sortCol)
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortCol(col);
            setSortDir("desc");
        }
    };
    const sortIndicator = (col) => {
        if (col !== sortCol)
            return " ";
        return sortDir === "asc" ? "▲" : "▼";
    };
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: focused ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, ...(height !== undefined ? { height } : {}), children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "DataGrid (click to sort, click row to select)" }), _jsx(Box, { flexDirection: "row", height: 1, children: GRID_COLUMNS.map((c) => {
                    const active = c.key === sortCol;
                    const label = `${c.label}${sortIndicator(c.key)}`;
                    const padded = c.align === "right"
                        ? label.padStart(c.width)
                        : label.padEnd(c.width);
                    return (_jsx(Clickable, { onClick: () => handleSort(c.key), width: c.width + 1, children: _jsx(Text, { bold: true, color: active ? theme.colors.brand.primary : theme.colors.text.dim, children: padded }) }, c.key));
                }) }), sorted.map((row, idx) => {
                const isSelected = idx === selectedRow;
                const isHovered = idx === hoverRow;
                const rowColor = isSelected
                    ? theme.colors.brand.primary
                    : isHovered
                        ? theme.colors.text.primary
                        : theme.colors.text.secondary;
                return (_jsx(Clickable, { onClick: () => { setSelectedRow(idx); setHoverRow(idx); }, flexDirection: "row", height: 1, children: GRID_COLUMNS.map((c) => {
                        const v = String(row[c.key]);
                        const padded = c.align === "right"
                            ? v.padStart(c.width)
                            : v.padEnd(c.width);
                        return (_jsx(Box, { width: c.width + 1, children: _jsxs(Text, { color: rowColor, bold: isSelected, children: [isSelected && c === GRID_COLUMNS[0] ? "▶" : " ", padded.slice(c === GRID_COLUMNS[0] ? 1 : 0)] }) }, c.key));
                    }) }, row.id));
            })] }));
}
// ── ServiceLogPane: fixed log entries, nothing interactive ───────────
function ServiceLogPane({ height }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, ...(height !== undefined ? { height } : {}), children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "RichLog (live append)" }), _jsx(RichLog, { entries: [
                    { timestamp: "09:45:12", level: "info", text: "service started on :8080" },
                    { timestamp: "09:45:13", level: "debug", text: "loaded 42 routes" },
                    { timestamp: "09:45:14", level: "warn", text: "config key 'foo' deprecated" },
                    { timestamp: "09:45:15", level: "info", text: "GET /v1/health → 200" },
                    { timestamp: "09:45:16", level: "error", text: "GET /v1/db → 500: timeout" },
                    { timestamp: "09:45:17", level: "info", text: "retry 1/3 succeeded" },
                ], maxVisible: 6, showTimestamp: true })] }));
}
// ── ConfigPretty: fixed JSON-like data ────────────────────────────────
function ConfigPretty({ height }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, ...(height !== undefined ? { height } : {}), children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Pretty (JSON-like)" }), _jsx(Pretty, { data: {
                    name: "reacterm",
                    version: "0.1.0",
                    features: ["cell-diff", "WASM", "themes"],
                    theme: { primary: "#82AAFF", contrast: 7.2 },
                    active: true,
                } })] }));
}
function DataSection({ focused }) {
    const theme = useTheme();
    return (_jsx(ScrollView, { flex: 1, scrollSpeed: 4, children: _jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Data widgets" }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Kbd, { children: "f" }), _jsx(Text, { color: theme.colors.text.dim, children: "focus tree \u00B7" }), _jsx(Kbd, { children: "g" }), _jsx(Text, { color: theme.colors.text.dim, children: "focus grid" })] }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Kbd, { children: "click" }), _jsx(Text, { color: theme.colors.text.dim, children: "everywhere \u00B7" }), _jsx(Kbd, { children: "wheel" }), _jsx(Text, { color: theme.colors.text.dim, children: "scroll page" })] }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: theme.colors.text.dim, children: "Tree:" }), _jsx(Kbd, { children: "\u2191\u2193/\u2190\u2192" }), _jsx(Text, { color: theme.colors.text.dim, children: "nav \u00B7" }), _jsx(Kbd, { children: "Enter" }), _jsx(Text, { color: theme.colors.text.dim, children: "or click folder to expand" })] }), _jsx(Box, { flexDirection: "row", gap: 1, children: _jsx(Text, { color: theme.colors.text.dim, children: "Grid: click any header to sort, click row to select" }) })] }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsx(Box, { flex: 1, children: _jsx(FileTreePane, { focused: focused === "tree", height: 9 }) }), _jsx(Box, { flex: 2, children: _jsx(FileGridPane, { focused: focused === "grid", height: 9 }) })] }), _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(ServiceLogPane, { height: 9 }), _jsx(ConfigPretty, { height: 14 })] }), _jsx(ScrollEditTable, {}), _jsx(TreeTablePane, {})] }) }));
}
// ── Calendar ────────────────────────────────────────────────────────────
function CalendarSection() {
    const theme = useTheme();
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth() + 1);
    const [weekStartsOn, setWeekStartsOn] = useState(1);
    const rangeStart = new Date(today.getFullYear(), today.getMonth(), 10);
    const rangeEnd = new Date(today.getFullYear(), today.getMonth(), 16);
    const minDate = new Date(today.getFullYear(), today.getMonth(), 3);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 12);
    const eventAnchorDate = new Date(today.getFullYear(), today.getMonth(), Math.max(8, today.getDate()));
    const demoEvents = [
        {
            id: "roadmap",
            title: "Roadmap review",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate(), 9, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate(), 10, 30),
            color: theme.colors.brand.primary,
            location: "North room",
        },
        {
            id: "handoff",
            title: "Customer handoff",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate(), 11, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate(), 11, 45),
            color: theme.colors.warning,
            location: "Zoom",
        },
        {
            id: "standup",
            title: "Design standup",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 1, 10, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 1, 10, 30),
            color: theme.colors.success,
        },
        {
            id: "offsite",
            title: "Team offsite",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 2, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 2, 23, 59),
            allDay: true,
            color: theme.colors.warning,
            location: "Fremantle",
        },
        {
            id: "ship",
            title: "Ship review",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 3, 14, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 3, 15, 0),
            color: theme.colors.info,
        },
        {
            id: "retro",
            title: "Sprint retro",
            start: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 4, 16, 0),
            end: new Date(today.getFullYear(), today.getMonth(), eventAnchorDate.getDate() + 4, 17, 30),
            color: theme.colors.error,
        },
    ];
    const [selectedEventId, setSelectedEventId] = useState(demoEvents[0].id);
    const selectedEvent = demoEvents.find((event) => event.id === selectedEventId) ?? demoEvents[0];
    const eventCalendar = useEventCalendarBehavior({
        events: demoEvents,
        defaultAnchorDate: eventAnchorDate,
        defaultView: "week",
        weekStartsOn,
        agendaDays: 7,
    });
    const disabledDates = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };
    const handleSelectDay = (day) => {
        setSelectedDate(new Date(viewYear, viewMonth - 1, day));
    };
    const handleMonthChange = (year, month) => {
        setViewYear(year);
        setViewMonth(month);
        const currentDay = selectedDate.getDate();
        setSelectedDate(new Date(year, month - 1, currentDay));
    };
    const monthLabel = selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    return (_jsx(ScrollView, { flex: 1, scrollSpeed: 4, children: _jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Calendar primitives" }), _jsx(Text, { color: theme.colors.text.dim, children: "Reacterm now has two calendar lanes: picker primitives for choosing dates, and an event calendar for actual scheduling blocks." }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Kbd, { children: "\u2190\u2191\u2193\u2192" }), _jsx(Text, { color: theme.colors.text.dim, children: "move day cursor \u00B7" }), _jsx(Kbd, { children: "PgUp/PgDn" }), _jsx(Text, { color: theme.colors.text.dim, children: "change month \u00B7" }), _jsx(Kbd, { children: "Tab" }), _jsx(Text, { color: theme.colors.text.dim, children: "leave section" })] }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", gap: 1, flex: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Calendar" }), _jsx(Calendar, { year: viewYear, month: viewMonth, selectedDay: selectedDate.getDate(), onSelect: handleSelectDay, onMonthChange: handleMonthChange, rangeStart: rangeStart, rangeEnd: rangeEnd, disabledDates: disabledDates, weekStartsOn: weekStartsOn }), _jsx(Divider, {}), _jsxs(Text, { color: theme.colors.text.secondary, children: ["Selected: ", monthLabel] }), _jsx(Text, { color: theme.colors.text.dim, children: "Picker calendar: range highlight plus disabled weekends." })] }), _jsxs(Box, { flexDirection: "column", gap: 1, flex: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "DatePicker" }), _jsx(DatePicker, { value: selectedDate, onChange: (date) => {
                                        setSelectedDate(date);
                                        setViewYear(date.getFullYear());
                                        setViewMonth(date.getMonth() + 1);
                                    }, minDate: minDate, maxDate: maxDate, weekStartsOn: weekStartsOn }), _jsx(Text, { color: theme.colors.text.dim, children: "Open it and choose a bounded date. The calendar view stays in sync." }), _jsx(Divider, {}), _jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Configuration" }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Button, { label: weekStartsOn === 1 ? "Week starts Monday" : "Switch to Monday", size: "sm", variant: weekStartsOn === 1 ? "primary" : "ghost", onPress: () => setWeekStartsOn(1) }), _jsx(Button, { label: weekStartsOn === 0 ? "Week starts Sunday" : "Switch to Sunday", size: "sm", variant: weekStartsOn === 0 ? "primary" : "ghost", onPress: () => setWeekStartsOn(0) })] }), _jsx(DefinitionList, { items: [
                                        { term: "Selected", definition: monthLabel },
                                        { term: "Disabled", definition: "Weekends" },
                                        { term: "Bounds", definition: `${minDate.toLocaleDateString("en-US")} → ${maxDate.toLocaleDateString("en-US")}` },
                                        { term: "Week start", definition: weekStartsOn === 1 ? "Monday" : "Sunday" },
                                    ] })] })] }), _jsxs(Box, { flexDirection: "column", gap: 1, marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "EventCalendar" }), _jsx(Text, { color: theme.colors.text.dim, children: eventCalendar.view === "month"
                                ? "Month view stays summary-first so the full grid fits in the demo pane."
                                : "Same event model, four views. Click any event to select it, use PgUp/PgDn or ←/→ to move, and press 1/2/3/4 to switch month/week/day/agenda." }), _jsx(EventCalendar, { events: demoEvents, controller: eventCalendar, selectedEventId: selectedEventId, onSelectEvent: (event) => setSelectedEventId(event.id) }), eventCalendar.view === "month"
                            ? null
                            : (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsx(DefinitionList, { items: [
                                            { term: "Selected event", definition: selectedEvent.title },
                                            { term: "When", definition: selectedEvent.allDay ? "All day" : `${selectedEvent.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} → ${selectedEvent.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` },
                                            { term: "Location", definition: selectedEvent.location ?? "None" },
                                            { term: "Same-day stack", definition: `${eventAnchorDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} has 2 events` },
                                        ] })] }))] })] }) }));
}
// ── TreeTable demo: tasks with subtasks ─────────────────────────────────
const TREE_TABLE_INITIAL = [
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
    { key: "priority", header: "Pri", width: 4, align: "center" },
    { key: "status", header: "Status", width: 13 },
];
function toggleTreeTableRow(rows, key) {
    return rows.map((row) => {
        if (row.key === key)
            return { ...row, expanded: !row.expanded };
        if (row.children)
            return { ...row, children: toggleTreeTableRow(row.children, key) };
        return row;
    });
}
function TreeTablePane() {
    const theme = useTheme();
    const [data, setData] = useState(TREE_TABLE_INITIAL);
    const [selectedKey, setSelectedKey] = useState(null);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "TreeTable \u2014 tasks with subtasks" }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: theme.colors.text.dim, children: "\u2191\u2193/\u2190\u2192 navigate \u00B7 Enter select \u00B7 marker click toggles \u00B7" }), _jsx(Text, { color: theme.colors.text.dim, children: "selected:" }), _jsx(Text, { children: selectedKey ?? "(none)" })] }), _jsx(TreeTable, { columns: TREE_TABLE_COLUMNS, data: data, rowHighlight: true, sortable: true, onToggle: (key) => setData((prev) => toggleTreeTableRow(prev, key)), onRowSelect: (key) => setSelectedKey(key) })] }));
}
const SCROLL_COL_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const SCROLL_LABEL_WIDTH = 10;
const SCROLL_VALUE_WIDTH = 9; // 8 digits + 1 space for ↑/↓ arrow
const SCROLL_INITIAL = [
    { id: "rev", label: "Revenue", values: [120, 145, 168, 192] },
    { id: "exp", label: "Expenses", values: [85, 92, 101, 113] },
    { id: "hc", label: "Headcount", values: [12, 14, 18, 22] },
    { id: "lat", label: "p99 (ms)", values: [240, 210, 195, 180] },
];
function ScrollEditTable() {
    const theme = useTheme();
    const { requestRender } = useTui();
    const [, forceTableRender] = useState(0);
    const refreshTable = () => {
        forceTableRender((n) => n + 1);
        requestRender();
    };
    // Mutable rows live in a ref so scroll bursts don't churn React state.
    const rowsRef = useRef(JSON.parse(JSON.stringify(SCROLL_INITIAL)));
    const baselineRef = useRef(JSON.parse(JSON.stringify(SCROLL_INITIAL)));
    // Mouse hover cell — null when not over a numeric cell.
    const hoverRef = useRef(null);
    // Selected/keyboard cursor — null until the user clicks a cell or presses
    // an arrow key. Fixes the phantom "Revenue · Q1 looks selected" issue from
    // the prior version.
    const kbRef = useRef(null);
    // Header offset: 1 row for column headings before the data rows.
    const HEADER_ROWS = 1;
    const sameCell = (a, b) => a?.row === b?.row && a?.col === b?.col;
    const cellAt = (localX, localY) => {
        const dataRow = localY - HEADER_ROWS;
        if (dataRow < 0 || dataRow >= rowsRef.current.length)
            return null;
        if (localX < SCROLL_LABEL_WIDTH)
            return null;
        const col = Math.floor((localX - SCROLL_LABEL_WIDTH) / SCROLL_VALUE_WIDTH);
        if (col < 0 || col >= SCROLL_COL_LABELS.length)
            return null;
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
            if (!cell)
                return;
            // Wheel edits only after the user explicitly selects this value. When
            // the hovered value is not selected, leave the event unconsumed so the
            // surrounding ScrollView can keep scrolling the page.
            if (event.button === "scroll-up" || event.button === "scroll-down") {
                if (!sameCell(kbRef.current, cell))
                    return;
                event.consumed = true;
                const dir = event.button === "scroll-up" ? 1 : -1;
                const step = event.shift ? 10 : 1;
                const row = rowsRef.current[cell.row];
                if (!row)
                    return;
                row.values[cell.col] = (row.values[cell.col] ?? 0) + dir * step;
                refreshTable();
                return;
            }
            if (event.button === "left" && event.action === "press") {
                const row = rowsRef.current[cell.row];
                const base = baselineRef.current[cell.row];
                if (!row || !base)
                    return;
                if (event.shift || event.ctrl || event.meta) {
                    // Shift-click resets the cell to its baseline value.
                    row.values[cell.col] = base.values[cell.col] ?? 0;
                }
                else {
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
                if (!row || !base)
                    return;
                row.values[cell.col] = base.values[cell.col] ?? 0;
                refreshTable();
            }
        },
    });
    useInput((e) => {
        // Lazy-init kb cursor on first arrow press — no phantom selection.
        const initIfNull = () => {
            if (kbRef.current === null)
                kbRef.current = { row: 0, col: 0 };
        };
        if (e.key === "up") {
            e.consumed = true;
            initIfNull();
            kbRef.current.row = Math.max(0, kbRef.current.row - 1);
            refreshTable();
            return;
        }
        if (e.key === "down") {
            e.consumed = true;
            initIfNull();
            kbRef.current.row = Math.min(rowsRef.current.length - 1, kbRef.current.row + 1);
            refreshTable();
            return;
        }
        if (e.key === "left") {
            e.consumed = true;
            initIfNull();
            kbRef.current.col = Math.max(0, kbRef.current.col - 1);
            refreshTable();
            return;
        }
        if (e.key === "right") {
            e.consumed = true;
            initIfNull();
            kbRef.current.col = Math.min(SCROLL_COL_LABELS.length - 1, kbRef.current.col + 1);
            refreshTable();
            return;
        }
        if (e.char === "+" || e.char === "=") {
            e.consumed = true;
            const cur = kbRef.current;
            if (!cur)
                return;
            const row = rowsRef.current[cur.row];
            if (row) {
                row.values[cur.col] = (row.values[cur.col] ?? 0) + (e.shift ? 10 : 1);
                refreshTable();
            }
            return;
        }
        if (e.char === "-" || e.char === "_") {
            e.consumed = true;
            const cur = kbRef.current;
            if (!cur)
                return;
            const row = rowsRef.current[cur.row];
            if (row) {
                row.values[cur.col] = (row.values[cur.col] ?? 0) - (e.shift ? 10 : 1);
                refreshTable();
            }
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
            if (kbRef.current !== null) {
                kbRef.current = null;
                refreshTable();
            }
            return;
        }
    });
    const hover = hoverRef.current;
    const kb = kbRef.current;
    // Status line: prefer the mouse-hover cell over the kb cursor for
    // status display (matches the visible highlight precedence).
    const focusedCell = hover ?? kb;
    let status;
    if (!focusedCell) {
        status = "Click a value to select · wheel edits selected value · Shift-wheel ×10 · Shift-click resets · arrows + ±";
    }
    else {
        const row = rowsRef.current[focusedCell.row];
        const baseRow = baselineRef.current[focusedCell.row];
        if (!row || !baseRow) {
            status = "—";
        }
        else {
            const v = row.values[focusedCell.col] ?? 0;
            const baseline = baseRow.values[focusedCell.col] ?? 0;
            const delta = v - baseline;
            const deltaStr = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} vs ${baseline}`;
            const colLabel = SCROLL_COL_LABELS[focusedCell.col];
            const source = sameCell(kb, focusedCell) ? "selected" : "click to select";
            status = `${row.label} · ${colLabel} = ${v} (${deltaStr}) [${source}]`;
        }
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Scroll-to-edit table" }), React.createElement("tui-box", { flexDirection: "column", ...target.targetProps }, 
            // Header row
            _jsxs(Box, { flexDirection: "row", height: 1, children: [_jsx(Box, { width: SCROLL_LABEL_WIDTH, children: _jsx(Text, { bold: true, color: theme.colors.text.dim, children: "metric" }) }), SCROLL_COL_LABELS.map((label) => (_jsx(Box, { width: SCROLL_VALUE_WIDTH, children: _jsx(Text, { bold: true, color: theme.colors.text.dim, children: label.padStart(SCROLL_VALUE_WIDTH - 1) }) }, label)))] }, "hdr"), 
            // Data rows
            ...rowsRef.current.map((row, rIdx) => (_jsxs(Box, { flexDirection: "row", height: 1, children: [_jsx(Box, { width: SCROLL_LABEL_WIDTH, children: _jsx(Text, { color: theme.colors.text.secondary, children: row.label }) }), row.values.map((v, cIdx) => {
                        const isHover = !!(hover && hover.row === rIdx && hover.col === cIdx);
                        // Suppress the kb visual when the mouse is hovering the same
                        // cell — explicit precedence per C2 in the refactor plan.
                        const isKb = !isHover && !!(kb && kb.row === rIdx && kb.col === cIdx);
                        const baseline = baselineRef.current[rIdx]?.values[cIdx] ?? v;
                        const delta = v - baseline;
                        let color = theme.colors.text.primary;
                        if (isHover)
                            color = theme.colors.brand.primary;
                        else if (isKb)
                            color = theme.colors.warning;
                        else if (delta > 0)
                            color = theme.colors.success;
                        else if (delta < 0)
                            color = theme.colors.error;
                        const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : " ";
                        const display = `${arrow}${String(v).padStart(SCROLL_VALUE_WIDTH - 2)}`;
                        return (_jsx(Box, { width: SCROLL_VALUE_WIDTH, children: _jsx(Text, { color: color, bold: isHover || isKb, children: display }) }, cIdx));
                    })] }, row.id)))), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.colors.text.dim, children: status }) })] }));
}
// ── Charts ──────────────────────────────────────────────────────────────
function ChartsSection() {
    const theme = useTheme();
    const sparkRef = useRef(Array.from({ length: 40 }, () => 30 + Math.random() * 50));
    const cpuRef = useRef(45);
    const memRef = useRef(62);
    const tickRef = useRef(0);
    const { requestRender } = useTui();
    useTick(120, () => {
        tickRef.current++;
        sparkRef.current = [
            ...sparkRef.current.slice(1),
            Math.max(5, Math.min(100, sparkRef.current[sparkRef.current.length - 1] + (Math.random() - 0.5) * 18)),
        ];
        cpuRef.current = Math.max(10, Math.min(95, cpuRef.current + (Math.random() - 0.5) * 8));
        memRef.current = Math.max(20, Math.min(95, memRef.current + (Math.random() - 0.5) * 4));
        requestRender();
    });
    const cpu = Math.round(cpuRef.current);
    const mem = Math.round(memRef.current);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Live charts" }), _jsx(Text, { color: theme.colors.text.dim, children: "Imperative tick \u2192 ref mutation \u2192 requestRender(). No React state churn at 60fps." }), _jsxs(Box, { flexDirection: "column", gap: 1, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Throughput (ops/s)" }), _jsx(Sparkline, { data: sparkRef.current, width: 50, height: 4, color: theme.colors.info })] }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.colors.text.secondary, children: ["CPU ", cpu, "%"] }), _jsx(Gauge, { value: cpu, width: 20, thresholds: [
                                            { value: 80, color: theme.colors.error },
                                            { value: 60, color: theme.colors.warning },
                                            { value: 0, color: theme.colors.success },
                                        ], showValue: true })] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.colors.text.secondary, children: ["Memory ", mem, "%"] }), _jsx(Gauge, { value: mem, width: 20, thresholds: [
                                            { value: 80, color: theme.colors.error },
                                            { value: 60, color: theme.colors.warning },
                                            { value: 0, color: theme.colors.success },
                                        ], showValue: true })] })] }), _jsxs(Box, { flexDirection: "row", gap: 3, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "BarChart \u2014 task durations" }), _jsx(BarChart, { bars: [
                                            { label: "build", value: 42 },
                                            { label: "test", value: 78 },
                                            { label: "deploy", value: 31 },
                                            { label: "lint", value: 56 },
                                            { label: "fmt", value: 19 },
                                        ], width: 28, height: 6, showValues: true })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "LineChart \u2014 multi-series" }), _jsx(LineChart, { series: [
                                            { name: "p50", data: Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i / 2) * 10), color: theme.colors.info },
                                            { name: "p99", data: Array.from({ length: 20 }, (_, i) => 60 + Math.cos(i / 2) * 15), color: theme.colors.warning },
                                        ], width: 28, height: 6 })] })] }), _jsxs(Box, { flexDirection: "row", gap: 3, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "AreaChart \u2014 fill" }), _jsx(AreaChart, { series: [{
                                                name: "load",
                                                data: Array.from({ length: 20 }, (_, i) => 40 + Math.sin(i / 2) * 25),
                                                color: theme.colors.success,
                                            }], width: 28, height: 6 })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Histogram \u2014 frequency" }), _jsx(Histogram, { data: Array.from({ length: 200 }, () => Math.random() * 100 + Math.random() * 100), bins: 10, width: 28, height: 6 })] })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Heatmap \u2014 2D matrix" }), _jsx(Heatmap, { data: Array.from({ length: 6 }, (_, r) => Array.from({ length: 12 }, (_, c) => Math.sin(r * 0.6) + Math.cos(c * 0.4))), width: 36 })] })] })] }));
}
// ── AI ──────────────────────────────────────────────────────────────────
function AiSection({ pushToast: toast }) {
    const theme = useTheme();
    const { width } = useTerminal();
    const [running, setRunning] = useState(false);
    const [showApproval, setShowApproval] = useState(false);
    const startRef = useRef(0);
    const tick = useTick(100, () => { }, { active: running });
    const t = running ? tick - startRef.current : 0;
    const contentWidth = Math.max(40, width - 24);
    const wide = contentWidth >= 92;
    const contextUsed = Math.min(190_000, t * 1500 + 8_000);
    const inputTokens = Math.min(8_000, t * 80);
    const outputTokens = Math.min(2_400, t * 24);
    const totalTokens = Math.min(10_400, t * 104);
    const startSession = () => {
        if (running)
            return;
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
    const statusFor = (start, done) => {
        if (!running)
            return "pending";
        if (t >= done)
            return "completed";
        if (t >= start)
            return "running";
        return "pending";
    };
    const ops = [
        { id: "1", label: "Read auth.ts", status: statusFor(0, 4), ...(running && t >= 4 ? { durationMs: 340 } : {}) },
        { id: "2", label: "Static analysis", status: statusFor(4, 15), ...(running && t >= 15 ? { durationMs: 1500 } : {}) },
        { id: "3", label: "Generate patch", status: statusFor(15, 28), ...(running && t >= 28 ? { durationMs: 1300 } : {}) },
        { id: "4", label: "Wait for approval", status: running && t > 32 ? "running" : "pending" },
    ];
    const text = "Found a clock-skew bug in token refresh. Adding a 30s safety buffer and retry-with-backoff. Need approval to write the patch.";
    return (_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, flex: 1, overflow: "hidden", children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "AI agent flow" }), _jsx(Text, { color: theme.colors.text.dim, children: "  " }), _jsx(Badge, { label: running ? "running" : "idle", variant: running ? "success" : "outline" })] }), _jsxs(Text, { color: theme.colors.text.dim, children: ["Press ", _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "r" }), " or click Run. Approval accepts ", _jsx(Text, { bold: true, children: "y" }), "/", _jsx(Text, { bold: true, children: "n" }), "/", _jsx(Text, { bold: true, children: "a" }), "."] }), _jsx(ScrollView, { flex: 1, scrollSpeed: 3, scrollbarGutter: 0, children: _jsxs(Box, { flexDirection: "column", gap: 1, paddingRight: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(ModelBadge, { model: "claude-opus-4-7", provider: "anthropic" }), _jsx(TokenStream, { tokens: totalTokens, inputTokens: inputTokens, outputTokens: outputTokens, tokensPerSecond: running ? 24 : 0, streaming: running })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Context" }), _jsx(ContextWindow, { used: contextUsed, limit: 200_000, barWidth: wide ? 22 : 14, compact: true })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Cost" }), _jsx(CostTracker, { inputTokens: inputTokens, outputTokens: outputTokens, renderCost: (cost, currency) => (_jsxs(Text, { bold: true, color: cost > 0.1 ? theme.colors.warning : theme.colors.success, children: [currency, cost.toFixed(4)] })) }), _jsxs(Text, { color: theme.colors.text.dim, children: ["input ", inputTokens, " \u00B7 output ", outputTokens] })] })] }), _jsxs(Box, { flexDirection: wide ? "row" : "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", flex: 1, borderStyle: "round", borderColor: running ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Conversation" }), !running ? (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.colors.text.dim, children: "Ready. Streams reply, runs tests, awaits approval." }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Clickable, { onClick: startSession, borderStyle: "round", borderColor: theme.colors.brand.primary, paddingX: 1, children: _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "\u25B6 Run agent" }) }), _jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "key " }), _jsx(Kbd, { children: "r" })] })] })] })) : (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(MessageBubble, { role: "user", children: "Fix the bug in auth.ts" }), _jsx(MessageBubble, { role: "assistant", children: _jsx(StreamingText, { text: text, streaming: t < 20, animate: true, speed: 3 }) }), t > 18 && (_jsx(CommandBlock, { command: "$ bun test src/auth.test.ts", exitCode: 0, duration: 2700, output: _jsx(Text, { color: theme.colors.success, children: "\u2713 12 passed \u00B7 0 failed \u00B7 2.7s" }) })), showApproval && (_jsx(ApprovalPrompt, { width: Math.max(32, contentWidth - 8), tool: "writeFile", risk: "medium", params: { path: "src/auth.ts", lines: "+9 / -2" }, onSelect: (k) => {
                                                        toast(k === "y" ? "Approved — patch applied" :
                                                            k === "a" ? "Auto-approve enabled" :
                                                                "Denied", k === "n" ? "warning" : "success");
                                                        setRunning(false);
                                                        setShowApproval(false);
                                                    } }))] }))] }), _jsxs(Box, { flexDirection: "column", ...(wide ? { width: 36 } : {}), borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Workflow" }), _jsx(OperationTree, { nodes: ops, showDuration: true }), !running && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.colors.text.dim, children: "No active run." }) }))] })] })] }) }), _jsx(Box, { marginTop: 1, flexShrink: 0, children: _jsx(StatusLine, { model: "claude-opus-4-7", tokens: totalTokens, turns: t > 0 ? 1 : 0, extra: { session: "explorer" } }) })] }));
}
// ── Mouse ───────────────────────────────────────────────────────────────
function MouseSection() {
    const theme = useTheme();
    const { position, isInside } = useMousePosition({ trackMoves: true });
    const [clicks, setClicks] = useState([]);
    useInput(() => { });
    const onClickArea = (label) => () => {
        setClicks((prev) => [...prev.slice(-4), { x: position.x, y: position.y, button: label }]);
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Mouse tracking" }), _jsx(Text, { color: theme.colors.text.dim, children: "useMousePosition() exposes a live ref + isInside(rect). Move the cursor; click the boxes." }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "cursor:" }), _jsx(Text, { bold: true, color: theme.colors.info, children: position.ready ? `${position.x},${position.y}` : "—" }), _jsx(Text, { color: theme.colors.text.secondary, children: "last button:" }), _jsx(Text, { bold: true, color: theme.colors.warning, children: position.button })] }), _jsx(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: ["A", "B", "C"].map((tag, i) => {
                    const left = 4 + i * 14;
                    const top = 12;
                    const width = 12;
                    const height = 4;
                    const inside = isInside({ left, top, width, height });
                    return (_jsx(Box, { borderStyle: inside ? "double" : "round", borderColor: inside ? theme.colors.brand.primary : theme.colors.divider, paddingX: 2, paddingY: 1, children: _jsxs(Text, { bold: true, color: inside ? theme.colors.brand.primary : theme.colors.text.secondary, children: [tag, " \u2014 ", inside ? "HOVER" : "idle"] }) }, tag));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.colors.text.dim, children: "recent events (push: click anywhere then press space):" }), clicks.length === 0
                        ? _jsx(Text, { color: theme.colors.text.dim, dim: true, children: "  none yet" })
                        : clicks.map((c, i) => (_jsxs(Text, { color: theme.colors.text.secondary, children: ["\u00B7 ", c.button, " at (", c.x, ",", c.y, ")"] }, i)))] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.colors.text.dim, children: "(Press space to record current position as a click \u2014 the demo binds keys, not raw mouse, so this works in any terminal.)" }) }), _jsx(SpaceRecorder, { onPress: onClickArea("space") })] }));
}
function SpaceRecorder({ onPress }) {
    useInput((e) => { if (e.key === "space") {
        e.consumed = true;
        onPress();
    } });
    return null;
}
// ── Themes ──────────────────────────────────────────────────────────────
function ThemesSection({ themeIdx, setThemeIdx }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Themes" }), _jsx(Text, { color: theme.colors.text.dim, children: "\u2190/\u2192 to cycle. Theme is hoisted at the app root, so every section restyles instantly." }), _jsx(Box, { flexDirection: "row", gap: 1, marginTop: 1, flexWrap: "wrap", children: THEMES.map((t, i) => {
                    const active = i === themeIdx;
                    return (_jsx(Clickable, { onClick: () => setThemeIdx(i), borderStyle: active ? "double" : "round", borderColor: active ? t.colors.brand.primary : theme.colors.divider, paddingX: 1, children: _jsx(Text, { bold: active, color: active ? t.colors.brand.primary : theme.colors.text.secondary, children: `${i + 1} ${t.name}` }) }, t.name));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, gap: 1, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "Live preview:" }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Badge, { label: "info", variant: "info" }), _jsx(Badge, { label: "success", variant: "success" }), _jsx(Badge, { label: "warning", variant: "warning" }), _jsx(Badge, { label: "error", variant: "error" })] }), _jsx(ProgressBar, { value: 42, width: 40, showPercent: true }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsx(Spinner, { type: "dots", color: theme.colors.brand.primary }), _jsx(Spinner, { type: "line", color: theme.colors.success }), _jsx(Spinner, { type: "bounce", color: theme.colors.warning })] })] }), _jsx(ArrowThemeBinder, { themeIdx: themeIdx, setThemeIdx: setThemeIdx })] }));
}
function ArrowThemeBinder({ themeIdx, setThemeIdx }) {
    useInput((e) => {
        if (e.key === "left") {
            e.consumed = true;
            setThemeIdx((themeIdx - 1 + THEMES.length) % THEMES.length);
        }
        else if (e.key === "right") {
            e.consumed = true;
            setThemeIdx((themeIdx + 1) % THEMES.length);
        }
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
function EditorSection(props) {
    const theme = useTheme();
    const [code, setCode] = useState(SAMPLE_CODE);
    const [mode, setMode] = useState("edit");
    const editorFocused = props.inputFocused;
    const setEditorFocused = props.setInputFocused;
    const before = "the quick brown fox jumps over the lazy dog";
    const after = "the quick brown cat leaps over the sleepy dog";
    const selectMode = (nextMode) => {
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
        if (e.char === "e") {
            e.consumed = true;
            selectMode("edit");
        }
        else if (e.char === "1") {
            e.consumed = true;
            selectMode("edit");
        }
        else if (e.char === "2") {
            e.consumed = true;
            selectMode("diff");
        }
        else if (e.char === "3") {
            e.consumed = true;
            selectMode("inline");
        }
        else if (e.char === "4") {
            e.consumed = true;
            selectMode("syntax");
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Editor & docs" }), _jsx(Text, { color: theme.colors.text.dim, children: "1 Editor \u00B7 2 DiffView \u00B7 3 InlineDiff \u00B7 4 SyntaxHighlight" }), _jsx(Box, { flexDirection: "row", gap: 2, children: ["edit", "diff", "inline", "syntax"].map((m, i) => {
                    const active = m === mode;
                    return (_jsx(Clickable, { onClick: () => selectMode(m), borderStyle: active ? "double" : "round", borderColor: active ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, children: _jsx(Text, { bold: active, color: active ? theme.colors.brand.primary : theme.colors.text.secondary, children: `${i + 1} ${m}` }) }, m));
                }) }), mode === "edit" && (_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Box, { flexDirection: "column", flex: 1, children: _jsx(Editor, { title: "fizzbuzz.ts", language: "typescript", value: code, onChange: setCode, rows: 10, isFocused: mode === "edit" && editorFocused, footer: editorFocused
                                ? "live edit • Esc releases • Tab indents"
                                : "paused • e focuses editor • 1-4 switch views" }) }), _jsxs(Box, { flexDirection: "column", flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "MarkdownViewer (TOC + scroll)" }), _jsx(MarkdownViewer, { content: SAMPLE_MD, showToc: false }), _jsx(Box, { height: 1 }), _jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Markdown (inline)" }), _jsx(Markdown, { content: "**bold** _italic_ `code` [link](#)" })] })] })), mode === "diff" && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.dim, children: "Unified diff with line numbers" }), _jsx(DiffView, { diff: SAMPLE_DIFF, filePath: "src/auth.ts" })] })), mode === "inline" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.colors.text.dim, children: "Word-level inline diff" }), _jsx(InlineDiff, { before: before, after: after }), _jsx(Box, { height: 1 }), _jsx(Text, { color: theme.colors.text.secondary, children: "before:" }), _jsx(Text, { color: theme.colors.text.dim, children: before }), _jsx(Text, { color: theme.colors.text.secondary, children: "after:" }), _jsx(Text, { color: theme.colors.text.dim, children: after })] })), mode === "syntax" && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text.dim, children: "SyntaxHighlight component" }), _jsx(SyntaxHighlight, { code: code, language: "typescript" })] }))] }));
}
// ── Effects ─────────────────────────────────────────────────────────────
function EffectsSection() {
    const theme = useTheme();
    const [showT, setShowT] = useState(true);
    const [count, setCount] = useState(3);
    const tick = useTick(1000, () => { });
    useInput((e) => {
        if (e.char === "x") {
            e.consumed = true;
            setShowT((v) => !v);
        }
        if (e.char === "+") {
            e.consumed = true;
            setCount((c) => Math.min(5, c + 1));
        }
        if (e.char === "-") {
            e.consumed = true;
            setCount((c) => Math.max(1, c - 1));
        }
    });
    const diagramNodes = [
        { id: "react", label: "React", width: 10 },
        { id: "layout", label: "Layout", width: 10 },
        { id: "diff", label: "Diff", width: 10 },
    ];
    const diagramEdges = [
        { from: "react", to: "layout" },
        { from: "layout", to: "diff" },
    ];
    const canvasNodes = [
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
    const canvasEdges = [
        { from: "paint", to: "cell-diff", style: "dashed", label: "cells" },
    ];
    const progressValue = 48 + ((tick * 9) % 37);
    const label = (name) => (_jsx(Text, { bold: true, color: theme.colors.text.secondary, children: name }));
    return (_jsx(ScrollView, { flex: 1, scrollSpeed: 3, scrollbarGutter: 0, children: _jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 1, paddingY: 1, children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", gap: 2, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Visual effects" }), _jsx(Badge, { label: showT ? "visible" : "hidden", variant: showT ? "success" : "outline" }), _jsx(Spacer, {}), _jsx(Kbd, { children: "x" }), _jsx(Text, { color: theme.colors.text.dim, children: "toggle transition" }), _jsx(Kbd, { children: "+/-" }), _jsx(Text, { color: theme.colors.text.dim, children: "presence count" })] }), _jsxs(Box, { flexDirection: "column", gap: 1, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.brand.primary, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Paint" }), label("Gradient"), _jsx(Gradient, { colors: ["#82AAFF", "#F7768E", "#FBBF24"], children: "REACTERM" }), label("GradientBorder"), _jsx(GradientBorder, { colors: ["#82AAFF", "#F7768E"], width: 20, children: _jsx(Text, { color: theme.colors.text.primary, children: "multi-color" }) }), label("GradientProgress"), _jsx(GradientProgress, { value: progressValue, width: 16, colors: ["#82AAFF", "#BB9AF7", "#9ECE6A"], showPercentage: true }), label("GlowText"), _jsx(GlowText, { animate: true, intensity: "high", children: "Glowing text" })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.success, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.success, children: "Motion" }), label("Transition"), _jsx(Transition, { show: showT, type: "slide-right", children: _jsx(Box, { borderStyle: "round", borderColor: theme.colors.success, paddingX: 1, children: _jsx(Text, { color: theme.colors.success, children: "sliding panel" }) }) }), label("RevealTransition"), _jsx(RevealTransition, { visible: showT, type: "charge", children: _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.colors.brand.primary, children: "charged reveal" }) }) }), label(`AnimatePresence ${count}`), _jsx(AnimatePresence, { children: Array.from({ length: count }).map((_, i) => (_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: theme.colors.info, children: "\u00B7" }), _jsxs(Text, { color: theme.colors.text.primary, children: ["item ", i + 1] })] }, i))) })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.info, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.info, children: "Readouts" }), label("Digits"), _jsx(Digits, { value: new Date().toTimeString().slice(0, 5) }), label("Canvas"), _jsx(Canvas, { nodes: canvasNodes, edges: canvasEdges, direction: "vertical", borderStyle: "round", padding: 1 }), label("Diagram"), _jsx(Diagram, { nodes: diagramNodes, edges: diagramEdges, direction: "horizontal", nodeStyle: "round", gapX: 3 })] })] })] }) }));
}
// ── Animation lab ───────────────────────────────────────────────────────
const CYCLER_TEXTS = [
    "Cell-level diff",
    "Dual-speed rendering",
    "Typed-array buffers",
    "Pure-TS flexbox",
    "Optional WASM",
];
function AnimLabSection() {
    const theme = useTheme();
    const cycler = useTextCycler({ texts: CYCLER_TEXTS, intervalMs: 1500, order: "sequential" });
    const easedFrameRef = useRef(0);
    const eased = useEasedInterval({
        durations: [80, 120, 200, 350, 600, 350, 200, 120],
        onTick: (frame) => { easedFrameRef.current = frame; },
    });
    const sparkRef = useRef(Array.from({ length: 30 }, (_, i) => 50 + Math.sin(i / 3) * 30));
    const tick = useTick(80, () => {
        sparkRef.current = [
            ...sparkRef.current.slice(1),
            Math.max(0, Math.min(100, sparkRef.current[sparkRef.current.length - 1] + (Math.random() - 0.5) * 12)),
        ];
    }, { reactive: false });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Animation lab" }), _jsx(Text, { color: theme.colors.text.dim, children: "Five distinct timing primitives, all running in parallel on one frame budget." }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useTextCycler" }), _jsx(Text, { color: theme.colors.text.dim, children: "cycles a list every 1.5s" }), _jsx(Text, { color: theme.colors.brand.primary, children: cycler.text }), _jsxs(Text, { color: theme.colors.text.dim, children: ["frame ", cycler.index] })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useEasedInterval" }), _jsx(Text, { color: theme.colors.text.dim, children: "variable-ms per frame" }), _jsxs(Text, { color: theme.colors.warning, children: ["frame ", eased.frame] }), _jsx(Box, { flexDirection: "row", gap: 1, children: Array.from({ length: 8 }).map((_, i) => (_jsx(Text, { color: i === eased.frame % 8 ? theme.colors.brand.primary : theme.colors.text.dim, children: "\u25CF" }, i))) })] })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useTick imperative" }), _jsx(Text, { color: theme.colors.text.dim, children: "80ms, no React state" }), _jsx(Sparkline, { data: sparkRef.current, width: 28, height: 3, color: theme.colors.success }), _jsxs(Text, { color: theme.colors.text.dim, children: ["tick ", tick] })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "ShimmerText" }), _jsx(Text, { color: theme.colors.text.dim, children: "thinking-state shimmer" }), _jsx(ShimmerText, { text: "Thinking through it\u2026" }), _jsx(BlinkDot, { state: "streaming" })] })] })] }));
}
// ── Hooks playground ────────────────────────────────────────────────────
const WIZARD_STEPS = [
    { key: "name", label: "Pick a name" },
    { key: "tier", label: "Select tier" },
    { key: "review", label: "Review" },
    { key: "done", label: "Confirm" },
];
function HooksSection({ pushToast: toast }) {
    const theme = useTheme();
    const undo = useUndoRedo({ initial: "" });
    const persist = usePersistentState({
        key: "explorer-counter",
        initial: 0,
        storage: memoryStorage(),
    });
    const wiz = useWizard({ steps: WIZARD_STEPS });
    const confirmDelete = useConfirmAction({ timeoutMs: 1500 });
    useHotkey({
        hotkeys: [
            { key: "u", label: "undo", action: () => { undo.undo(); } },
            { key: "r", label: "redo", action: () => { undo.redo(); } },
            { key: "+", label: "++ counter", action: () => persist.set(persist.value + 1) },
            { key: "-", label: "-- counter", action: () => persist.set(Math.max(0, persist.value - 1)) },
            { key: "n", label: "wizard next", action: () => { wiz.next(); } },
            { key: "p", label: "wizard prev", action: () => { wiz.prev(); } },
            { key: "d", label: "delete (confirm)", action: () => {
                    if (confirmDelete.isPending) {
                        confirmDelete.confirm();
                        toast("Deleted!", "warning");
                    }
                    else {
                        confirmDelete.requestConfirm().then((ok) => { if (!ok) { /* timed out */ } });
                    }
                } },
            { key: "i", label: "type a char into undo buffer", action: () => undo.set(undo.value + "i") },
        ],
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Hooks playground" }), _jsx(Text, { color: theme.colors.text.dim, children: "u undo \u00B7 r redo \u00B7 i append \u00B7 +/- counter \u00B7 n/p wizard \u00B7 d delete (press twice to confirm)" }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useUndoRedo" }), _jsxs(Text, { color: theme.colors.text.dim, children: ["stack: ", undo.canUndo ? "undo ✓" : "undo —", " \u00B7 ", undo.canRedo ? "redo ✓" : "redo —"] }), _jsx(Text, { color: theme.colors.brand.primary, children: undo.value || _jsx(Text, { color: theme.colors.text.dim, children: "(empty)" }) })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "usePersistentState" }), _jsx(Text, { color: theme.colors.text.dim, children: "survives section change" }), _jsxs(Text, { color: theme.colors.warning, children: ["counter = ", persist.value] })] })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useWizard" }), _jsxs(Text, { color: theme.colors.text.dim, children: ["step ", wiz.currentStep + 1, " of ", WIZARD_STEPS.length] }), _jsx(Text, { color: theme.colors.success, children: WIZARD_STEPS[wiz.currentStep]?.label ?? "—" })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useConfirmAction" }), _jsx(Text, { color: theme.colors.text.dim, children: "press d, then d again" }), _jsx(Text, { color: confirmDelete.isPending ? theme.colors.error : theme.colors.text.secondary, children: confirmDelete.isPending
                                    ? `ARMED — ${confirmDelete.countdown ?? "?"}s`
                                    : "idle" })] })] })] }));
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
function BehaviorsSection() {
    const theme = useTheme();
    const [highlight, setHighlight] = useState(0);
    useInput((e) => {
        if (e.key === "down") {
            e.consumed = true;
            setHighlight((h) => (h + 1) % HEADLESS_HOOKS.length);
        }
        else if (e.key === "up") {
            e.consumed = true;
            setHighlight((h) => (h - 1 + HEADLESS_HOOKS.length) % HEADLESS_HOOKS.length);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Headless behaviors" }), _jsx(Text, { color: theme.colors.text.dim, children: "15 keyboard-only state machines that back the high-level components. Build your own widget; keep the keyboard model. \u2191\u2193 to scan." }), _jsx(Box, { flexDirection: "column", marginTop: 1, flexWrap: "wrap", children: HEADLESS_HOOKS.map((name, i) => {
                    const active = i === highlight;
                    return (_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: active ? theme.colors.brand.primary : theme.colors.text.dim, bold: active, children: active ? "▶" : " " }), _jsx(Text, { color: active ? theme.colors.brand.primary : theme.colors.text.secondary, children: name })] }, name));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Why this matters" }), _jsx(Text, { color: theme.colors.text.secondary, children: "The \"behavior\" is a hook \u2014 it owns the keyboard model and active-index state. The \"component\" is the visual default. Skip the component, keep the hook, render however you want. That's how you ship a custom date picker, table, or tree without rewriting accessibility from scratch." })] })] }));
}
// ── i18n ────────────────────────────────────────────────────────────────
const LOCALES_DEMO = {
    en: { code: "en", direction: "ltr", pluralRule: PLURAL_EN,
        numbers: { decimal: ".", thousands: ",", grouping: 3 },
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        weekdaysShort: ["S", "M", "T", "W", "T", "F", "S"],
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
        weekdaysShort: ["D", "L", "M", "M", "J", "V", "S"],
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
        weekdaysShort: ["S", "M", "D", "M", "D", "F", "S"],
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
        weekdaysShort: ["В", "П", "В", "С", "Ч", "П", "С"],
        strings: {
            "items.one": "{count} элемент",
            "items.few": "{count} элемента",
            "items.many": "{count} элементов",
            "items.other": "{count} элементов",
            "greeting": "Привет, {name}!",
        },
    },
    ar: { code: "ar", direction: "rtl", pluralRule: PLURAL_AR,
        numbers: { decimal: ".", thousands: ",", grouping: 3 },
        months: ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"],
        monthsShort: ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"],
        weekdays: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
        weekdaysShort: ["أ", "ا", "ث", "أ", "خ", "ج", "س"],
        strings: {
            "items.zero": "لا عناصر",
            "items.one": "عنصر واحد",
            "items.two": "عنصران",
            "items.few": "{count} عناصر",
            "items.many": "{count} عنصرًا",
            "items.other": "{count} عنصر",
            "greeting": "مرحبا، {name}!",
        },
    },
    ja: { code: "ja", direction: "ltr", pluralRule: PLURAL_JA,
        numbers: { decimal: ".", thousands: ",", grouping: 3 },
        months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        weekdays: ["日", "月", "火", "水", "木", "金", "土"],
        weekdaysShort: ["日", "月", "火", "水", "木", "金", "土"],
        strings: {
            "items.other": "{count} 個",
            "greeting": "こんにちは、{name}さん！",
        },
    },
};
function I18nSection() {
    const theme = useTheme();
    const [code, setCode] = useState("en");
    const [count, setCount] = useState(2);
    useInput((e) => {
        if (e.key === "left") {
            e.consumed = true;
            setCount((c) => Math.max(0, c - 1));
        }
        else if (e.key === "right") {
            e.consumed = true;
            setCount((c) => c + 1);
        }
    });
    const codes = Object.keys(LOCALES_DEMO);
    useInput((e) => {
        const idx = codes.indexOf(code);
        if (e.char === "n") {
            e.consumed = true;
            setCode(codes[(idx + 1) % codes.length]);
        }
        if (e.char === "p") {
            e.consumed = true;
            setCode(codes[(idx - 1 + codes.length) % codes.length]);
        }
    });
    const locale = LOCALES_DEMO[code];
    const num = formatNumber(1234567.89, locale);
    const greet = i18nT("greeting", locale, { name: "World" });
    const items = plural("items", count, locale);
    return (_jsx(LocaleProvider, { locale: locale, children: _jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "i18n" }), _jsx(Text, { color: theme.colors.text.dim, children: "n/p locale (or click a chip) \u00B7 \u2190/\u2192 count \u00B7 6 locales with plural rules + RTL." }), _jsx(Box, { flexDirection: "row", gap: 1, marginTop: 1, children: codes.map((c) => {
                        const active = c === code;
                        return (_jsx(Clickable, { onClick: () => setCode(c), borderStyle: active ? "double" : "round", borderColor: active ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, children: _jsx(Text, { bold: active, color: active ? theme.colors.brand.primary : theme.colors.text.secondary, children: c.toUpperCase() }) }, c));
                    }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, gap: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "direction:" }), _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: locale.direction })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "formatNumber(1234567.89):" }), _jsx(Text, { bold: true, color: theme.colors.warning, children: num })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "t(\"greeting\"):" }), _jsx(Text, { bold: true, color: theme.colors.success, children: greet })] }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsxs(Text, { color: theme.colors.text.secondary, children: ["plural(\"items\", ", count, "):"] }), _jsx(Text, { bold: true, color: theme.colors.info, children: items })] }), _jsxs(Box, { flexDirection: "row", gap: 1, flexWrap: "wrap", children: [_jsx(Text, { color: theme.colors.text.secondary, children: "weekdays:" }), locale.weekdays.map((w, i) => (_jsx(Text, { color: theme.colors.text.dim, children: w }, i)))] })] })] }) }));
}
// ── DevTools ────────────────────────────────────────────────────────────
const DEVTOOL_PANELS = [
    { key: "1", name: "Render heatmap", desc: "Color each cell by write frequency" },
    { key: "2", name: "Accessibility audit", desc: "Live WCAG 4.5:1 contrast check" },
    { key: "3", name: "Time-travel", desc: "Freeze + scrub last 120 frames" },
    { key: "4", name: "Inspector", desc: "Component tree, computed styles, FPS" },
];
function DevToolsSection() {
    const theme = useTheme();
    const [enabled, setEnabled] = useState({});
    useInput((e) => {
        if (e.char === "1" || e.char === "2" || e.char === "3" || e.char === "4") {
            e.consumed = true;
            setEnabled((prev) => ({ ...prev, [e.char]: !prev[e.char] }));
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "DevTools" }), _jsx(Text, { color: theme.colors.text.dim, children: "Toggle 1/2/3/4 \u2014 or click a panel. In a real app, `enableDevTools(app)` wires all four at once." }), _jsx(Box, { flexDirection: "column", marginTop: 1, gap: 1, children: DEVTOOL_PANELS.map((p) => {
                    const on = enabled[p.key] ?? false;
                    const toggle = () => setEnabled((prev) => ({ ...prev, [p.key]: !prev[p.key] }));
                    return (_jsxs(Clickable, { onClick: toggle, flexDirection: "row", children: [_jsx(Box, { borderStyle: on ? "double" : "round", borderColor: on ? theme.colors.success : theme.colors.divider, paddingX: 1, children: _jsxs(Text, { bold: true, color: on ? theme.colors.success : theme.colors.text.secondary, children: [p.key, " ", on ? "ON " : "OFF"] }) }), _jsxs(Box, { flexDirection: "column", marginLeft: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: p.name }), _jsx(Text, { color: theme.colors.text.dim, children: p.desc })] })] }, p.key));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Middleware" }), _jsx(Text, { color: theme.colors.text.secondary, children: "Three built-in middlewares run as render-pipeline passes:" }), _jsx(Text, { color: theme.colors.text.dim, children: "\u00B7 scanlineMiddleware \u2014 CRT-style overlay" }), _jsx(Text, { color: theme.colors.text.dim, children: "\u00B7 fpsCounterMiddleware \u2014 corner FPS readout" }), _jsx(Text, { color: theme.colors.text.dim, children: "\u00B7 debugBorderMiddleware \u2014 color every box border" }), _jsx(Text, { color: theme.colors.text.dim, children: "Apply via `app.middleware.use(scanlineMiddleware)`." })] })] }));
}
// ── Plugins ─────────────────────────────────────────────────────────────
const PLUGIN_LIST = [
    { key: "vimModePlugin", desc: "hjkl + visual mode for ScrollView/lists" },
    { key: "compactModePlugin", desc: "Strip padding for high-density UIs" },
    { key: "autoScrollPlugin", desc: "Keep ScrollView pinned to bottom" },
    { key: "screenshotPlugin", desc: "Capture buffer to a file" },
    { key: "statusBarPlugin", desc: "Inject a persistent status bar" },
];
function PluginsSection() {
    const theme = useTheme();
    const [active] = useState({});
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Plugins" }), _jsx(Text, { color: theme.colors.text.dim, children: "Plugins extend the renderer. They're activated at `render()` time \u2014 this section is informational. See README.md for live wiring." }), _jsx(Box, { flexDirection: "column", marginTop: 1, gap: 1, children: PLUGIN_LIST.map((p) => {
                    const on = active[p.key] ?? false;
                    return (_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Box, { width: 26, children: _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: p.key }) }), _jsx(Text, { color: on ? theme.colors.success : theme.colors.text.secondary, children: p.desc })] }, p.key));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "Plugin contract" }), _jsx(Text, { color: theme.colors.text.secondary, children: "A plugin implements StormPlugin: name, optional onMount, beforeRender, onComponentMount, getCustomElementHandlers. PluginManager fires hooks at every lifecycle stage \u2014 your plugin gets a turn before the renderer." })] })] }));
}
// ── Personality ─────────────────────────────────────────────────────────
const PERSONALITY_PRESETS = [
    { name: "Default", preset: defaultPreset },
    { name: "Minimal", preset: minimalPreset },
    { name: "Hacker", preset: hackerPreset },
    { name: "Playful", preset: playfulPreset },
];
function PersonalitySection({ presetIdx, setPresetIdx }) {
    const theme = useTheme();
    useInput((e) => {
        if (e.key === "left") {
            e.consumed = true;
            setPresetIdx((presetIdx - 1 + PERSONALITY_PRESETS.length) % PERSONALITY_PRESETS.length);
        }
        if (e.key === "right") {
            e.consumed = true;
            setPresetIdx((presetIdx + 1) % PERSONALITY_PRESETS.length);
        }
    });
    const active = PERSONALITY_PRESETS[presetIdx];
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Personality" }), _jsx(Text, { color: theme.colors.text.dim, children: "\u2190/\u2192 to cycle preset, or click a card. Personality changes icons, prompts, animation style \u2014 applied at the app root." }), _jsx(Box, { flexDirection: "row", gap: 1, marginTop: 1, children: PERSONALITY_PRESETS.map((p, i) => {
                    const isActive = i === presetIdx;
                    return (_jsx(Clickable, { onClick: () => setPresetIdx(i), borderStyle: isActive ? "double" : "round", borderColor: isActive ? theme.colors.brand.primary : theme.colors.divider, paddingX: 1, children: _jsx(Text, { bold: isActive, color: isActive ? theme.colors.brand.primary : theme.colors.text.secondary, children: p.name }) }, p.name));
                }) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, gap: 1, children: [_jsxs(Text, { bold: true, color: theme.colors.text.primary, children: ["Active: ", active.name] }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "prompt char: " }), _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: active.preset.interaction.promptChar })] }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "selection char: " }), _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: active.preset.interaction.selectionChar })] }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "spinner: " }), _jsx(Spinner, { type: active.preset.animation.spinnerType, color: theme.colors.brand.primary })] }), _jsxs(Box, { flexDirection: "row", gap: 3, children: [_jsx(Text, { color: theme.colors.text.secondary, children: "borders: " }), _jsx(Text, { bold: true, color: theme.colors.warning, children: active.preset.borders.default })] })] })] }));
}
// ── Accessibility ───────────────────────────────────────────────────────
function A11ySection() {
    const theme = useTheme();
    const announcer = useAnnounce();
    const [log, setLog] = useState([]);
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
    const validation = validateContrast(theme.colors);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Accessibility" }), _jsx(Text, { color: theme.colors.text.dim, children: "a \u2192 polite announce \u00B7 A \u2192 urgent announce. Live WCAG audit of the current theme." }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "contrastRatio()" }), _jsx(Text, { color: theme.colors.text.dim, children: "text.primary vs surface.base" }), _jsxs(Text, { color: passesAA ? theme.colors.success : theme.colors.error, children: [ratio.toFixed(2), " : 1"] }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Badge, { label: passesAA ? "AA ✓" : "AA ✗", variant: passesAA ? "success" : "error" }), _jsx(Badge, { label: passesAAA ? "AAA ✓" : "AAA ✗", variant: passesAAA ? "success" : "warning" })] })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "validateContrast(theme)" }), _jsx(Text, { color: theme.colors.text.dim, children: "scans every text role" }), _jsxs(Text, { color: validation.errors.length === 0 ? theme.colors.success : theme.colors.error, children: [validation.errors.length, " error", validation.errors.length === 1 ? "" : "s"] }), _jsxs(Text, { color: validation.warnings.length === 0 ? theme.colors.success : theme.colors.warning, children: [validation.warnings.length, " warning", validation.warnings.length === 1 ? "" : "s"] })] })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "useAnnounce log" }), log.length === 0
                        ? _jsx(Text, { color: theme.colors.text.dim, dim: true, children: "(press a or A to announce)" })
                        : log.map((line, i) => (_jsx(Text, { color: line.startsWith("!") ? theme.colors.warning : theme.colors.text.secondary, children: line }, i)))] })] }));
}
// ── Capabilities ────────────────────────────────────────────────────────
function CapabilitiesSection() {
    const theme = useTheme();
    const [info] = useState(() => detectTerminal());
    const [imgCaps] = useState(() => detectImageCaps());
    const [colorDepth] = useState(() => bestColorDepth(info));
    const Row = ({ k, v, color }) => (_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Box, { width: 22, children: _jsx(Text, { color: theme.colors.text.dim, children: k }) }), _jsx(Text, { bold: true, color: color ?? theme.colors.brand.primary, children: String(v) })] }));
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Terminal capabilities" }), _jsx(Text, { color: theme.colors.text.dim, children: "What did reacterm detect about THIS terminal? Read-only." }), _jsxs(Box, { flexDirection: "row", gap: 2, marginTop: 1, children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "detectTerminal()" }), _jsx(Row, { k: "name", v: info.name }), _jsx(Row, { k: "kittyKeyboard", v: info.kittyKeyboard, color: info.kittyKeyboard ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "syncOutput", v: info.syncOutput, color: info.syncOutput ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "trueColor", v: info.trueColor, color: info.trueColor ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "hyperlinks", v: info.hyperlinks, color: info.hyperlinks ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "mouse", v: info.mouse, color: info.mouse ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "bracketedPaste", v: info.bracketedPaste, color: info.bracketedPaste ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "size", v: `${info.columns}×${info.rows}` })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, flex: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "detectImageCaps()" }), _jsx(Row, { k: "bestProtocol", v: imgCaps.bestProtocol }), _jsx(Row, { k: "kitty graphics", v: imgCaps.supportsKittyGraphics, color: imgCaps.supportsKittyGraphics ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "iterm2", v: imgCaps.supportsITerm2, color: imgCaps.supportsITerm2 ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "sextant", v: imgCaps.supportsSextant, color: imgCaps.supportsSextant ? theme.colors.success : theme.colors.text.secondary }), _jsx(Row, { k: "colored underline", v: imgCaps.supportsColoredUnderline })] })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.colors.divider, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.colors.text.primary, children: "bestColorDepth()" }), _jsx(Row, { k: "depth", v: colorDepth, color: theme.colors.warning })] })] }));
}
// ── About ───────────────────────────────────────────────────────────────
function AboutSection() {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "About" }), _jsx(Text, { color: theme.colors.text.dim, children: "The reacterm demo surfaces every shipped capability. The full catalog lives at docs/features.md." }), _jsxs(Box, { flexDirection: "column", marginTop: 1, gap: 1, children: [_jsx(Heading, { level: 2, children: "Coverage by category" }), _jsx(DefinitionList, { items: [
                            { term: "Components", definition: "97 across 12 categories — Box → AI widgets" },
                            { term: "Hooks", definition: "83 — essential, state, animation, input, behaviors" },
                            { term: "Themes", definition: "11 presets + extendTheme/createTheme" },
                            { term: "Plugins", definition: "5 — vim mode, compact, auto-scroll, screenshot, status bar" },
                            { term: "DevTools panels", definition: "4 — heatmap, a11y, time-travel, inspector" },
                            { term: "Locales (demo)", definition: "6 — EN / FR / DE / RU / AR / JA" },
                        ] }), _jsx(Heading, { level: 2, children: "Source pointers" }), _jsx(UnorderedList, { items: [
                            { content: "ROADMAP.md — prioritized improvements" },
                            { content: "docs/features.md — exhaustive feature catalog" },
                            { content: "improvements.md — consumer-side bug log" },
                            { content: "docs/plans/2026-04-29-explorer-all-features-plan.md — what built this" },
                        ] }), _jsx(Heading, { level: 2, children: "Built with" }), _jsx(OrderedList, { items: [
                            { content: "TypeScript strict + bun + vitest" },
                            { content: "react-reconciler (custom host)" },
                            { content: "Pure-TS flexbox + grid (no Yoga)" },
                            { content: "Optional WASM diff for 3.4× speedup" },
                        ] })] })] }));
}
function GlobalShortcuts(props) {
    const { exit } = useTui();
    const activeSectionOwnsLetters = props.section === "layout"
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
            props.toast(`Theme: ${THEMES[(props.themeIdx + 1) % THEMES.length].name}`);
            return;
        }
        if (e.key === "tab") {
            if (props.section === "editor" && props.editorInputFocused)
                return;
            e.consumed = true;
            const idx = SECTIONS.findIndex((s) => s.key === props.section);
            const dir = e.shift ? -1 : 1;
            const next = SECTIONS[(idx + dir + SECTIONS.length) % SECTIONS.length];
            props.setSection(next.key);
            return;
        }
        if (props.section === "data") {
            if (e.char === "f") {
                e.consumed = true;
                props.setDataFocus("tree");
                return;
            }
            if (e.char === "g") {
                e.consumed = true;
                props.setDataFocus("grid");
                return;
            }
        }
    });
    return null;
}
export function App() {
    const { width, height } = useTerminal();
    const [section, setSection] = useState("welcome");
    const [themeIdx, setThemeIdx] = useState(0);
    const [presetIdx, setPresetIdx] = useState(0);
    const [showHelp, setShowHelp] = useState(false);
    const [dataFocus, setDataFocus] = useState("tree");
    const [editorInputFocused, setEditorInputFocused] = useState(true);
    const [toasts, setToasts] = useState([]);
    const toast = (msg, type = "info") => pushToast(setToasts, msg, type);
    const section_content = (() => {
        switch (section) {
            case "welcome": return _jsx(WelcomeSection, {});
            case "layout": return _jsx(LayoutSection, {});
            case "forms": return _jsx(FormsSection, { pushToast: toast });
            case "search": return _jsx(SearchSection, { pushToast: toast });
            case "data": return _jsx(DataSection, { focused: dataFocus });
            case "calendar": return _jsx(CalendarSection, {});
            case "charts": return _jsx(ChartsSection, {});
            case "ai": return _jsx(AiSection, { pushToast: toast });
            case "editor": return _jsx(EditorSection, { inputFocused: editorInputFocused, setInputFocused: setEditorInputFocused });
            case "effects": return _jsx(EffectsSection, {});
            case "anim": return _jsx(AnimLabSection, {});
            case "hooks": return _jsx(HooksSection, { pushToast: toast });
            case "behave": return _jsx(BehaviorsSection, {});
            case "i18n": return _jsx(I18nSection, {});
            case "devtools": return _jsx(DevToolsSection, {});
            case "plugins": return _jsx(PluginsSection, {});
            case "person": return _jsx(PersonalitySection, { presetIdx: presetIdx, setPresetIdx: setPresetIdx });
            case "a11y": return _jsx(A11ySection, {});
            case "caps": return _jsx(CapabilitiesSection, {});
            case "mouse": return _jsx(MouseSection, {});
            case "themes": return _jsx(ThemesSection, { themeIdx: themeIdx, setThemeIdx: setThemeIdx });
            case "about": return _jsx(AboutSection, {});
        }
    })();
    const personality = PERSONALITY_PRESETS[presetIdx].preset;
    return (_jsx(PersonalityProvider, { personality: personality, children: _jsxs(ThemeProvider, { theme: THEMES[themeIdx].colors, children: [_jsx(Shell, { width: width, height: height, section: section, onSelectSection: setSection, themeName: THEMES[themeIdx].name, personalityName: PERSONALITY_PRESETS[presetIdx].name, toasts: toasts, showHelp: showHelp, onToggleHelp: () => setShowHelp((v) => !v), onCycleTheme: () => {
                        setThemeIdx((i) => (i + 1) % THEMES.length);
                        toast(`Theme: ${THEMES[(themeIdx + 1) % THEMES.length].name}`);
                    }, onDismissToast: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)), children: section_content }), _jsx(GlobalShortcuts, { section: section, showHelp: showHelp, editorInputFocused: editorInputFocused, setShowHelp: setShowHelp, setSection: setSection, themeIdx: themeIdx, setThemeIdx: setThemeIdx, setDataFocus: setDataFocus, toast: toast })] }) }));
}
function Shell(props) {
    const theme = useTheme();
    const sectionLabel = SECTIONS.find((s) => s.key === props.section)?.label ?? "?";
    return (_jsxs(Box, { flexDirection: "column", width: props.width, height: props.height, children: [_jsxs(Box, { flexDirection: "row", paddingX: 2, height: 1, flexShrink: 0, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "\u25C6 reacterm" }), _jsx(Text, { color: theme.colors.text.dim, children: "  \u00B7  " }), _jsx(Text, { color: theme.colors.text.secondary, children: "demo" }), _jsx(Spacer, {}), _jsxs(Clickable, { onClick: props.onCycleTheme, flexDirection: "row", children: [_jsx(Text, { color: theme.colors.text.dim, children: "theme: " }), _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: props.themeName })] }), _jsx(Text, { color: theme.colors.text.dim, children: "  \u00B7  preset: " }), _jsx(Text, { bold: true, color: theme.colors.warning, children: props.personalityName }), _jsx(Text, { color: theme.colors.text.dim, children: "  \u00B7  " }), _jsx(Text, { bold: true, color: theme.colors.info, children: sectionLabel }), _jsx(Text, { color: theme.colors.text.dim, children: "  " }), _jsx(Clickable, { onClick: props.onToggleHelp, paddingX: 1, borderStyle: "round", borderColor: theme.colors.divider, children: _jsx(Text, { bold: true, color: theme.colors.text.secondary, children: "?" }) })] }), _jsx(Divider, {}), _jsxs(Box, { flexDirection: "row", flex: 1, children: [_jsx(Box, { flexDirection: "column", width: 20, flexShrink: 0, paddingX: 1, paddingY: 0, borderRight: true, borderStyle: "single", borderColor: theme.colors.divider, children: _jsx(ScrollView, { height: props.height - 4, children: (() => {
                                const grouped = SECTIONS.reduce((acc, s) => {
                                    (acc[s.group] = acc[s.group] ?? []).push(s);
                                    return acc;
                                }, {});
                                const groupOrder = ["Tour", "Build", "Visualize", "Hooks", "Internals", "Meta"];
                                return groupOrder.flatMap((g) => [
                                    _jsx(Text, { bold: true, color: theme.colors.text.dim, children: g.toUpperCase() }, `g-${g}`),
                                    ...(grouped[g] ?? []).map((s) => {
                                        const active = s.key === props.section;
                                        return (_jsxs(Clickable, { flexDirection: "row", onClick: () => props.onSelectSection(s.key), children: [_jsx(Text, { color: active ? theme.colors.brand.primary : theme.colors.text.dim, bold: active, children: active ? "▶ " : "  " }), _jsxs(Text, { color: active ? theme.colors.text.primary : theme.colors.text.secondary, bold: active, children: [s.icon, " ", s.label] })] }, s.key));
                                    }),
                                    _jsx(Box, { height: 1 }, `s-${g}`),
                                ]);
                            })() }) }), _jsx(Box, { flex: 1, flexDirection: "column", overflow: "hidden", children: props.children })] }), props.toasts.length > 0 && (_jsx(Box, { flexDirection: "column", paddingX: 2, children: props.toasts.slice(-3).map((t) => (_jsx(Toast, { message: t.msg, type: t.type ?? "info", visible: true, durationMs: 2200, animated: true, onDismiss: () => props.onDismissToast(t.id) }, t.id))) })), _jsx(Divider, {}), _jsx(Box, { flexDirection: "row", paddingX: 2, height: 1, flexShrink: 0, children: _jsx(KeyboardHelp, { bindings: [
                        { key: "Tab", label: "next section" },
                        { key: "?", label: "help" },
                        { key: "t", label: "theme" },
                        { key: "q", label: "quit" },
                    ] }) }), _jsx(Modal, { visible: props.showHelp, title: "Keyboard cheatsheet", size: "md", onClose: () => { }, children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Globals" }), _jsx(KeyboardHelp, { columns: 2, bindings: [
                                { key: "Tab", label: "next section" },
                                { key: "Shift-Tab", label: "prev section" },
                                { key: "?", label: "this overlay" },
                                { key: "t", label: "cycle theme" },
                                { key: "q / Ctrl-C", label: "quit" },
                            ] }), _jsx(Text, { bold: true, color: theme.colors.brand.primary, children: "Section-local" }), _jsx(KeyboardHelp, { columns: 2, bindings: [
                                { key: "Forms", label: "Shift-←/→ next field" },
                                { key: "Search", label: "type / arrows / Enter" },
                                { key: "Data", label: "f tree, g grid; ↑↓ + s sort" },
                                { key: "AI", label: "r run, y/n/a approve" },
                                { key: "Mouse", label: "move + space" },
                                { key: "Themes", label: "←/→ cycle" },
                            ] }), _jsx(Text, { color: theme.colors.text.dim, children: "Press any key to close." })] }) })] }));
}
//# sourceMappingURL=App.js.map