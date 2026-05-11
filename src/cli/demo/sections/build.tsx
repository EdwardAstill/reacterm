import React, { useRef, useState } from "react";
import type {
  SelectOption,
  TreeNode,
  TreeTableRow,
} from "../demo-kit.js";
import {
  Alert,
  Badge,
  Box,
  Breadcrumb,
  Button,
  Calendar,
  ChatInput,
  Checkbox,
  CommandPalette,
  ConfirmDialog,
  DatePicker,
  DefinitionList,
  Divider,
  DirectoryTree,
  EventCalendar,
  FilePicker,
  Form,
  HelpPanel,
  Kbd,
  LoadingIndicator,
  ListView,
  MaskedInput,
  Menu,
  Overlay,
  OverlayProvider,
  Paginator,
  Pretty,
  RadioGroup,
  RichLog,
  ScrollView,
  SearchList,
  SearchTable,
  Select,
  StatusMessage,
  Stepper,
  Switch,
  TabbedContent,
  Table,
  Tabs,
  Tag,
  Text,
  TextArea,
  TextInput,
  ToastContainer,
  Tooltip,
  Tree,
  TreeTable,
  VirtualList,
  Welcome,
  useEventCalendarBehavior,
  useInput,
  useMouseTarget,
  useTheme,
  useTui,
} from "../demo-kit.js";
import { Clickable } from "../shared.js";

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

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Form schema</Text>
        <Form
          fields={[
            { key: "package", label: "Package", required: true },
            { key: "risk", label: "Risk", type: "select", options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ] },
            { key: "approved", label: "Approved", type: "checkbox" },
          ]}
          initialValues={{ package: "reacterm", risk: "medium", approved: "true" }}
          submitLabel="Record"
          isFocused={false}
          onSubmit={() => toast("Form submitted", "success")}
        />
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

const TABLE_COLUMNS = [
  { key: "name", header: "Name", width: 15 },
  { key: "status", header: "Status", width: 11 },
  { key: "score", header: "Score", width: 7, align: "right" as const },
];

const TABLE_ROWS = [
  { name: "renderer", status: "green", score: 98 },
  { name: "input", status: "green", score: 94 },
  { name: "demo", status: "review", score: 86 },
  { name: "docs", status: "yellow", score: 72 },
];

const DEMO_FILES = [
  {
    name: "src",
    path: "/demo/src",
    isDirectory: true,
    children: [
      { name: "index.ts", path: "/demo/src/index.ts", isDirectory: false },
      { name: "demo.tsx", path: "/demo/src/demo.tsx", isDirectory: false },
    ],
  },
  { name: "README.md", path: "/demo/README.md", isDirectory: false },
];

function DataCoverageShowcase(): React.ReactElement {
  const theme = useTheme();
  const virtualRows = Array.from({ length: 24 }, (_, i) => `VirtualList row ${String(i + 1).padStart(2, "0")}`);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={theme.colors.brand.primary}>Data coverage matrix</Text>
      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>Table</Text>
          <Table columns={TABLE_COLUMNS} data={TABLE_ROWS} maxVisibleRows={4} isFocused={false} rowHighlight />
        </Box>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>SearchTable</Text>
          <SearchTable
            columns={TABLE_COLUMNS}
            data={TABLE_ROWS}
            placeholder="filter rows"
            maxVisibleRows={3}
            isFocused={false}
            rowHighlight
          />
        </Box>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>VirtualList</Text>
          <VirtualList
            items={virtualRows}
            height={4}
            isFocused={false}
            renderItem={(item) => <Text color={theme.colors.text.secondary}>{item}</Text>}
          />
        </Box>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>DirectoryTree</Text>
          <DirectoryTree
            rootPath="/reacterm-demo"
            isFocused={false}
            onLoadChildren={(path) => path.endsWith("reacterm-demo")
              ? [
                { name: "src", isDirectory: true },
                { name: "package.json", isDirectory: false },
                { name: "README.md", isDirectory: false },
              ]
              : [
                { name: "index.ts", isDirectory: false },
                { name: "demo.tsx", isDirectory: false },
              ]}
          />
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>FilePicker</Text>
        <FilePicker files={DEMO_FILES} maxVisible={4} isFocused={false} selectedPath="/demo/README.md" />
      </Box>
    </Box>
  );
}

function DataSection({ focused }: { focused: "tree" | "grid" }): React.ReactElement {
  const theme = useTheme();
  return (
    <ScrollView flex={1} scrollSpeed={4}>
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

      <DataCoverageShowcase />
    </Box>
    </ScrollView>
  );
}

let nextSpawnId = 1;

function NavigationFeedbackShowcase(): React.ReactElement {
  const theme = useTheme();
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<"summary" | "welcome" | "palette" | "confirm">("summary");

  const paletteCommands = [
    { id: "open", name: "Open demo coverage", description: "Jump to the coverage matrix", category: "Demo", shortcut: "g d" },
    { id: "theme", name: "Cycle theme", description: "Preview the next theme preset", category: "Meta", shortcut: "t" },
    { id: "verify", name: "Run tests", description: "Execute the focused demo suite", category: "Dev", shortcut: "v" },
  ];

  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      <Text bold color={theme.colors.brand.primary}>Navigation and feedback coverage</Text>
      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>Tabs / TabbedContent</Text>
          <Tabs
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "logs", label: "Logs" },
              { key: "settings", label: "Settings", disabled: true },
            ]}
            activeKey={tab}
            onChange={setTab}
            isFocused={false}
            variant="pill"
          />
          <TabbedContent
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "logs", label: "Logs" },
            ]}
            activeKey={tab === "logs" ? "logs" : "overview"}
            onTabChange={setTab}
            isFocused={false}
          >
            <Text color={theme.colors.text.secondary}>Demo surface is audited.</Text>
            <Text color={theme.colors.text.secondary}>Focused tests cover drift.</Text>
          </TabbedContent>
          <Paginator total={4} current={page} onPageChange={setPage} isFocused={false} style="numbers" />
        </Box>

        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>Breadcrumb / Menu / HelpPanel</Text>
          <Breadcrumb items={["reacterm", "demo", "coverage", "feedback"]} maxItems={3} isFocused={false} />
          <Menu
            items={[
              { label: "Open command palette", value: "palette", shortcut: "/" },
              { label: "Show help", value: "help", shortcut: "?" },
              { label: "Disabled action", value: "disabled", disabled: true },
            ]}
            isFocused={false}
            maxVisible={3}
          />
          <HelpPanel
            bindings={[
              { keys: "/", description: "CommandPalette", category: "Navigation" },
              { keys: "Esc", description: "Dismiss overlay", category: "Feedback" },
            ]}
            mode="inline"
            visible
            title="HelpPanel"
            columns={1}
          />
        </Box>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>Alert / Tooltip / StatusMessage / LoadingIndicator</Text>
          <Alert type="warning" title="Alert" isFocused={false}>
            Coverage matrix has no missing public components.
          </Alert>
          <Tooltip content="Tooltip content is visible in this demo" visible position="right" arrow>
            <Text color={theme.colors.text.secondary}>Hover target</Text>
          </Tooltip>
          <StatusMessage type="success" title="StatusMessage" message="Demo status is explicit." />
          <LoadingIndicator style="bar" progress={0.72} message="LoadingIndicator" active={false} />
        </Box>

        <Box flexDirection="column" flex={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Text bold color={theme.colors.text.primary}>CommandPalette / ConfirmDialog / ToastContainer / Welcome</Text>
          <Box flexDirection="row" gap={1}>
            <Button label="Summary" size="sm" variant={preview === "summary" ? "primary" : "ghost"} onPress={() => setPreview("summary")} />
            <Button label="Welcome" size="sm" variant={preview === "welcome" ? "primary" : "ghost"} onPress={() => setPreview("welcome")} />
            <Button label="Palette" size="sm" variant={preview === "palette" ? "primary" : "ghost"} onPress={() => setPreview("palette")} />
            <Button label="Confirm" size="sm" variant={preview === "confirm" ? "primary" : "ghost"} onPress={() => setPreview("confirm")} />
          </Box>
          {preview === "palette" ? (
            <CommandPalette
              commands={paletteCommands}
              onExecute={() => setPreview("summary")}
              isActive={preview === "palette"}
              isOpen
              onOpenChange={(open) => {
                if (!open) setPreview("summary");
              }}
              maxVisible={3}
              overlayWidth={48}
              placeholder="CommandPalette"
            />
          ) : null}
          <ConfirmDialog
            visible={preview === "confirm"}
            type="warning"
            message="ConfirmDialog preview"
            confirmLabel="Rectify"
            cancelLabel="Cancel"
            onConfirm={() => setPreview("summary")}
            onCancel={() => setPreview("summary")}
          />
          <ToastContainer
            toasts={[
              { id: "coverage", message: "ToastContainer: runtime-demo", type: "success", durationMs: 0 },
            ]}
            maxVisible={1}
          />
          {preview === "summary" ? (
            <DefinitionList
              items={[
                { term: "Palette", definition: "Open on demand" },
                { term: "Confirm", definition: "Open on demand" },
                { term: "Welcome", definition: "Open on demand" },
              ]}
            />
          ) : null}
          {preview === "welcome" ? (
            <Welcome
              title="Welcome"
              version="demo"
              description="Splash primitive preview"
              visible
              actions={[{ id: "coverage", label: "Open coverage matrix" }]}
              shortcuts={[{ key: "?", label: "Help" }]}
              prompt="Runtime demo"
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function OverlaysSection(): React.ReactElement {
  const theme = useTheme();
  const [overlayMode, setOverlayMode] = useState<"both" | "move" | "resize">("both");
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [spawned, setSpawned] = useState<{ id: string; n: number; top: number; left: number }[]>([]);

  const spawn = (): void => {
    const n = nextSpawnId++;
    // Cascade each spawned overlay down-and-right so they don't all stack on the same coords.
    const top = 6 + ((n - 1) % 6) * 2;
    const left = 8 + ((n - 1) % 6) * 4;
    setSpawned((prev) => [...prev, { id: `spawn-${n}`, n, top, left }]);
  };

  const close = (id: string): void => {
    setSpawned((prev) => prev.filter((s) => s.id !== id));
  };

  const overlayTitle = overlayMode === "both"
    ? "Demo overlay - movable + resizable"
    : overlayMode === "move"
      ? "Demo overlay - movable"
      : "Demo overlay - resizable";

  return (
    <OverlayProvider>
      <Box flexDirection="column" padding={1} gap={1}>
        <Text bold color={theme.colors.text.primary}>Movable / resizable overlays</Text>
        <Text color={theme.colors.text.dim}>
          Use one live overlay at a time. Switch the interaction mode, spawn extras only when you want to stress stacking.
        </Text>
        <Box flexDirection="row" gap={1}>
          <Button label="Move + resize" size="sm" variant={overlayMode === "both" ? "primary" : "ghost"} onPress={() => setOverlayMode("both")} />
          <Button label="Move only" size="sm" variant={overlayMode === "move" ? "primary" : "ghost"} onPress={() => setOverlayMode("move")} />
          <Button label="Resize only" size="sm" variant={overlayMode === "resize" ? "primary" : "ghost"} onPress={() => setOverlayMode("resize")} />
        </Box>
        <Box flexDirection="row" gap={1}>
          <Button label={showWorkbench ? "Hide overlay" : "Show overlay"} onPress={() => setShowWorkbench((visible) => !visible)} />
          <Button label="Spawn overlay" onPress={spawn} />
          <Text color={theme.colors.text.dim}>  Spawned: {spawned.length}</Text>
        </Box>

        <NavigationFeedbackShowcase />

        {showWorkbench ? (
          <Overlay
            id="overlay-workbench"
            title={overlayTitle}
            movable={overlayMode === "both" || overlayMode === "move"}
            resizable={overlayMode === "both" || overlayMode === "resize"}
            defaultTop={6}
            defaultLeft={46}
            defaultWidth={38}
            defaultHeight={9}
            borderStyle="single"
            borderColor={theme.colors.brand?.primary ?? theme.colors.text.primary}
          >
            <Box flexDirection="column" padding={1}>
              <Text>{overlayTitle}</Text>
              <Text color={theme.colors.text.dim}>
                {overlayMode === "resize" ? "Position is locked." : "Drag the title to move it."}
              </Text>
              <Text color={theme.colors.text.dim}>
                {overlayMode === "move" ? "Size is locked." : "Drag the \\ corner to resize."}
              </Text>
            </Box>
          </Overlay>
        ) : null}

        {spawned.map((s) => (
          <Overlay
            key={s.id}
            id={s.id}
            title={`Spawned #${s.n}`}
            movable
            resizable
            onClose={() => close(s.id)}
            defaultTop={s.top}
            defaultLeft={s.left}
            defaultWidth={32}
            defaultHeight={8}
            borderStyle="single"
            borderColor={theme.colors.brand?.primary ?? theme.colors.text.primary}
          >
            <Box flexDirection="column" padding={1}>
              <Text bold>Spawned overlay #{s.n}</Text>
              <Text color={theme.colors.text.dim}>Click [×] (top-right) or press Esc to close.</Text>
              <Text color={theme.colors.text.dim}>Drag the title to move. Drag the \ corner to resize.</Text>
            </Box>
          </Overlay>
        ))}
      </Box>
    </OverlayProvider>
  );
}

// ── Calendar ────────────────────────────────────────────────────────────
function CalendarSection(): React.ReactElement {
  const theme = useTheme();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth() + 1);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);

  const rangeStart = new Date(today.getFullYear(), today.getMonth(), 10);
  const rangeEnd = new Date(today.getFullYear(), today.getMonth(), 16);
  const minDate = new Date(today.getFullYear(), today.getMonth(), 3);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 12);
  const eventAnchorDate = new Date(today.getFullYear(), today.getMonth(), 8);

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
  const [selectedEventId, setSelectedEventId] = useState<string>(demoEvents[0]!.id);
  const selectedEvent = demoEvents.find((event) => event.id === selectedEventId) ?? demoEvents[0]!;
  const eventCalendar = useEventCalendarBehavior({
    events: demoEvents,
    defaultAnchorDate: eventAnchorDate,
    defaultView: "week",
    weekStartsOn,
    agendaDays: 7,
  });

  const disabledDates = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth - 1, day));
  };

  const handleMonthChange = (year: number, month: number) => {
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

  return (
    <ScrollView flex={1} scrollSpeed={4}>
      <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
        <Text bold color={theme.colors.brand.primary}>Calendar primitives</Text>
        <Text color={theme.colors.text.dim}>
          Reacterm now has two calendar lanes: picker primitives for choosing dates, and an event calendar for actual scheduling blocks.
        </Text>

        <Box flexDirection="row" gap={1}>
          <Kbd>←↑↓→</Kbd>
          <Text color={theme.colors.text.dim}>move day cursor ·</Text>
          <Kbd>PgUp/PgDn</Kbd>
          <Text color={theme.colors.text.dim}>change month ·</Text>
          <Kbd>Tab</Kbd>
          <Text color={theme.colors.text.dim}>leave section</Text>
        </Box>

        <Box flexDirection="row" gap={2} marginTop={1}>
          <Box
            flexDirection="column"
            gap={1}
            flex={1}
            borderStyle="round"
            borderColor={theme.colors.divider}
            paddingX={1}
            paddingY={1}
          >
            <Text bold color={theme.colors.text.primary}>Calendar</Text>
            <Calendar
              year={viewYear}
              month={viewMonth}
              selectedDay={selectedDate.getDate()}
              onSelect={handleSelectDay}
              onMonthChange={handleMonthChange}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              disabledDates={disabledDates}
              weekStartsOn={weekStartsOn}
            />
            <Divider />
            <Text color={theme.colors.text.secondary}>Selected: {monthLabel}</Text>
            <Text color={theme.colors.text.dim}>Picker calendar: range highlight plus disabled weekends.</Text>
          </Box>

          <Box
            flexDirection="column"
            gap={1}
            flex={1}
            borderStyle="round"
            borderColor={theme.colors.divider}
            paddingX={1}
            paddingY={1}
          >
            <Text bold color={theme.colors.text.primary}>DatePicker</Text>
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setViewYear(date.getFullYear());
                setViewMonth(date.getMonth() + 1);
              }}
              minDate={minDate}
              maxDate={maxDate}
              weekStartsOn={weekStartsOn}
            />
            <Text color={theme.colors.text.dim}>Open it and choose a bounded date. The calendar view stays in sync.</Text>

            <Divider />

            <Text bold color={theme.colors.text.primary}>Configuration</Text>
            <Box flexDirection="row" gap={1}>
              <Button
                label={weekStartsOn === 1 ? "Week starts Monday" : "Switch to Monday"}
                size="sm"
                variant={weekStartsOn === 1 ? "primary" : "ghost"}
                onPress={() => setWeekStartsOn(1)}
              />
              <Button
                label={weekStartsOn === 0 ? "Week starts Sunday" : "Switch to Sunday"}
                size="sm"
                variant={weekStartsOn === 0 ? "primary" : "ghost"}
                onPress={() => setWeekStartsOn(0)}
              />
            </Box>

            <DefinitionList
              items={[
                { term: "Selected", definition: monthLabel },
                { term: "Disabled", definition: "Weekends" },
                { term: "Bounds", definition: `${minDate.toLocaleDateString("en-US")} → ${maxDate.toLocaleDateString("en-US")}` },
                { term: "Week start", definition: weekStartsOn === 1 ? "Monday" : "Sunday" },
              ]}
            />
          </Box>
        </Box>

        <Box
          flexDirection="column"
          gap={1}
          marginTop={1}
          borderStyle="round"
          borderColor={theme.colors.divider}
          paddingX={1}
          paddingY={1}
        >
          <Text bold color={theme.colors.text.primary}>EventCalendar</Text>
          <Text color={theme.colors.text.dim}>
            {eventCalendar.view === "month"
              ? "Month view stays summary-first so the full grid fits in the demo pane."
              : "Same event model, four views. Click any event to select it, use PgUp/PgDn or ←/→ to move, and press 1/2/3/4 to switch month/week/day/agenda."}
          </Text>
          <EventCalendar
            events={demoEvents}
            controller={eventCalendar}
            selectedEventId={selectedEventId}
            onSelectEvent={(event) => setSelectedEventId(event.id)}
          />
          {eventCalendar.view === "month"
            ? null
            : (
              <>
                <Divider />
                <DefinitionList
                  items={[
                    { term: "Selected event", definition: selectedEvent.title },
                    { term: "When", definition: selectedEvent.allDay ? "All day" : `${selectedEvent.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} → ${selectedEvent.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` },
                    { term: "Location", definition: selectedEvent.location ?? "None" },
                    { term: "Same-day stack", definition: `${eventAnchorDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} has 2 events` },
                  ]}
                />
              </>
            )}
        </Box>
      </Box>
    </ScrollView>
  );
}
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

export {
  CalendarSection,
  DataSection,
  FormsSection,
  LayoutSection,
  OverlaysSection,
  SearchSection,
};
