# Data Components

Components for displaying structured data, tables, trees, and lists.

## Data

### Table

Bordered table with headers, auto-sized columns, optional zebra striping, and row virtualization for large datasets.

Auto-sized columns now fit the available table width by default. If the table has an explicit `width` or lives inside a constrained layout pane, wide columns shrink with ellipsis instead of pushing the whole table wider. Use `visibleWidth` when you want a custom horizontal scroll window.

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `TableColumn[]` | -- | Column definitions (required) |
| `data` | `Record<string, string \| number>[]` | -- | Row data (required) |
| `headerColor` | `string \| number` | `colors.brand.primary` | Header text color |
| `stripe` | `boolean` | `false` | Alternate row background |
| `maxVisibleRows` | `number` | `100` | Max rows before virtualization |
| `scrollOffset` | `number` | `0` | Current scroll position |
| `onScrollChange` | `(offset: number) => void` | -- | Called when scroll offset changes |
| `visibleWidth` | `number` | Auto | Override the visible width used for horizontal scrolling |
| _Plus container props_ | | | `borderStyle`, `borderColor`, `padding*`, `width`, `margin*` |

**TableColumn type:**

| Property | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | -- | Data field key |
| `header` | `string` | -- | Column header text |
| `width` | `number` | Auto | Fixed column width |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Cell alignment |

**Basic: Simple data table**

```tsx
import { Table } from "reacterm";

<Table
  columns={[
    { key: "name", header: "Name", width: 20 },
    { key: "status", header: "Status", width: 10, align: "center" },
    { key: "count", header: "Count", width: 8, align: "right" },
  ]}
  data={[
    { name: "Alpha", status: "Active", count: 42 },
    { name: "Beta", status: "Paused", count: 7 },
  ]}
/>
```

**Advanced: Striped table with custom styling**

```tsx
<Table
  columns={[
    { key: "id", header: "ID", width: 6, align: "right" },
    { key: "endpoint", header: "Endpoint", width: 30 },
    { key: "method", header: "Method", width: 8 },
    { key: "latency", header: "Latency", width: 10, align: "right" },
    { key: "status", header: "Status", width: 8, align: "center" },
  ]}
  data={apiRequests}
  stripe
  headerColor="#82AAFF"
  borderStyle="round"
  borderColor="#505050"
  maxVisibleRows={20}
  scrollOffset={scrollPos}
  onScrollChange={setScrollPos}
/>
```

**Pattern: Table inside a narrow pane**

```tsx
<Table
  width={40}
  borderStyle="none"
  columns={[
    { key: "field", header: "Field" },
    { key: "value", header: "Value", align: "right" },
    { key: "unit", header: "Unit" },
    { key: "format", header: "Format" },
  ]}
  data={[
    { field: "Live load element factor", value: 4, unit: "-", format: "0.00" },
  ]}
/>
```

The first column truncates with an ellipsis so the other columns stay visible in the pane.

---

### DataGrid

Interactive data grid with keyboard navigation, sorting, row selection, and virtualization. Up/Down navigate rows, Left/Right navigate columns, Enter on header sorts, Enter on row selects.

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `DataGridColumn[]` | -- | Column definitions (required) |
| `rows` | `Array<Record<string, string \| number>>` | -- | Row data (required) |
| `selectedRow` | `number` | -- | Index of selected row |
| `onSelect` | `(rowIndex: number) => void` | -- | Called on row selection |
| `sortColumn` | `string` | -- | Currently sorted column key |
| `sortDirection` | `"asc" \| "desc"` | -- | Current sort direction |
| `onSort` | `(column: string) => void` | -- | Called when header is activated |
| `isFocused` | `boolean` | `true` | Whether grid captures input |
| `headerColor` | `string \| number` | `colors.brand.primary` | Header text color |
| `selectedColor` | `string \| number` | `colors.brand.light` | Selected row color |
| `maxVisibleRows` | `number` | `100` | Max rows before virtualization |
| `onScrollChange` | `(offset: number) => void` | -- | Called when scroll offset changes |
| `aria-label` | `string` | -- | Accessibility label |
| _Plus container props_ | | | `borderStyle`, `borderColor`, `padding*`, `width`, `margin*` |

**Basic: Sortable grid**

```tsx
import { DataGrid } from "reacterm";

<DataGrid
  columns={[
    { key: "name", label: "Name", width: 20 },
    { key: "size", label: "Size", width: 10, align: "right" },
  ]}
  rows={files}
  sortColumn={sortCol}
  sortDirection={sortDir}
  onSort={handleSort}
/>
```

**Advanced: Interactive file browser**

```tsx
<DataGrid
  columns={[
    { key: "icon", label: "", width: 2 },
    { key: "name", label: "Name", width: 30 },
    { key: "size", label: "Size", width: 12, align: "right" },
    { key: "modified", label: "Modified", width: 20 },
    { key: "perms", label: "Permissions", width: 12, align: "center" },
  ]}
  rows={directoryContents}
  selectedRow={selectedIdx}
  onSelect={(idx) => openFile(directoryContents[idx])}
  sortColumn={sortCol}
  sortDirection={sortDir}
  onSort={toggleSort}
  headerColor="#82AAFF"
  selectedColor="#22D3EE"
  borderStyle="single"
  borderColor="#505050"
  maxVisibleRows={25}
/>
```

---

### Tree

Hierarchical tree with expand/collapse indicators. Renders nodes with indentation and triangular markers.

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `TreeNode[]` | -- | Tree node array (required) |
| `onToggle` | `(key: string) => void` | -- | Called when a node is toggled |
| `onSelect` | `(key: string, node: TreeNode) => void` | -- | Called when a node row is selected by click or Enter |
| `selectedKey` | `string` | -- | Controlled selected node key |
| `onHighlightChange` | `(key: string, node: TreeNode) => void` | -- | Called when keyboard/mouse navigation changes the highlighted row |
| `color` | `string \| number` | -- | Indicator color |
| `isFocused` | `boolean` | `false` | Enables keyboard navigation styling and input |
| `maxVisible` | `number` | -- | Maximum visible nodes before virtual scrolling |
| `renderNode` | `(node, state) => ReactNode` | -- | Custom row renderer |

**renderNode state:**

| Field | Type | Description |
|---|---|---|
| `isExpanded` | `boolean` | Whether the node is currently expanded |
| `isHighlighted` | `boolean` | Whether the row is the active keyboard/mouse highlight |
| `isSelected` | `boolean` | Whether the row matches `selectedKey` |
| `depth` | `number` | Visible nesting depth |

**TreeNode type:**

| Property | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | -- | Unique node identifier |
| `label` | `string` | -- | Display label |
| `children` | `TreeNode[]` | -- | Child nodes |
| `expanded` | `boolean` | -- | Whether children are visible |
| `icon` | `string` | -- | Optional icon before the label |

Keyboard:
- `Up` / `Down` move highlight
- `Left` / `Right` collapse and expand
- `Enter` / `Space` toggles by default, or selects when `onSelect` is provided

Mouse:
- click row selects it
- click disclosure marker toggles expand/collapse

**Basic: Simple tree**

```tsx
import { Tree } from "reacterm";

<Tree
  nodes={[
    { key: "src", label: "src/", expanded: true, children: [
      { key: "index", label: "index.ts" },
      { key: "utils", label: "utils.ts" },
    ]},
    { key: "pkg", label: "package.json" },
  ]}
  onToggle={handleToggle}
/>
```

**Advanced: Dynamic tree with toggle state**

```tsx
function FileTree({ rootNodes }: { rootNodes: TreeNode[] }) {
  const [nodes, setNodes] = useState(rootNodes);

  const handleToggle = (key: string) => {
    setNodes(toggleNode(nodes, key)); // Your toggle helper
  };

  return (
    <Box borderStyle="single" borderColor="#505050" padding={1}>
      <Tree nodes={nodes} onToggle={handleToggle} color="#82AAFF" />
    </Box>
  );
}
```

**Pattern: Controlled selection in a sidebar**

```tsx
<Tree
  nodes={nodes}
  selectedKey={selectedKey}
  isFocused
  onToggle={toggleNode}
  onHighlightChange={(key) => setSelectedKey(key)}
  onSelect={(key, node) => {
    setSelectedKey(key);
    if (!node.children?.length) openDocument(key);
  }}
/>
```

This is the right shape for a dock/sidebar sections panel: `Tree` handles hierarchy, selection, and click/keyboard navigation. Your app code decides what selection means.

#### Reorder

`Tree` supports user-driven reordering through an imperative controller. The consuming app owns the keybindings — Tree ships no default reorder keys, so you wire `useInput` (or any other input source) to controller methods.

Two modes are supported:

- **live** — a single grabbed node; the tree restructures as the user moves it (up/down between siblings, indent into previous sibling, outdent to grandparent).
- **stash** — mark any non-contiguous set of nodes, then splice them as a group at the cursor on commit (yazi-style lift + paste).

**New props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `reorderable` | `boolean` | `false` | Enables the reorder state machine and controller wiring |
| `canMove` | `(ctx: MoveContext) => boolean` | -- | Consulted per motion step; returning `false` makes the step a no-op. Not re-checked at commit |
| `onReorder` | `(change: ReorderChange) => void` | -- | Fires exactly once per commit with the full reordered tree |
| `onStateChange` | `(state: ReorderState) => void` | -- | Push notifications for status-bar UI (`idle` / `marking` / `grabbed`) |
| `controller` | `{ current: TreeController \| null }` | -- | Ref-holding prop Tree assigns the imperative handle into |

`controller` is a ref-holding prop, not React's `ref` keyword — pass a `useRef<TreeController>(null)` directly.

**`TreeController` (summary):**

- Marking: `toggleMark(key)`, `clearMarks()`, `getMarked()`
- Grab lifecycle: `grabLive(key?)`, `grabStash()`, `commit()`, `cancel()`
- Motion (valid only while grabbed): `moveUp()`, `moveDown()`, `indent()`, `outdent()`
- Inspection: `getCursorKey()`

Full signatures and payload shapes (`MoveContext`, `ReorderChange`, `ReorderState`) live in [`src/components/data/Tree.types.ts`](../../src/components/data/Tree.types.ts).

**Consumer wiring:**

```tsx
import { Tree } from "reacterm";
import type { TreeController } from "reacterm";

const ctrl = useRef<TreeController>(null);
const [sections, setSections] = useState(SECTIONS);
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

useInput((e) => {
  if (e.char === "m") ctrl.current?.toggleMark(focusedKey);
  else if (e.char === "g") ctrl.current?.grabLive();
  else if (e.char === "G") ctrl.current?.grabStash();
  else if (e.key === "return") ctrl.current?.commit();
  else if (e.key === "escape") ctrl.current?.cancel();
  else if (e.char === "K") ctrl.current?.moveUp();
  else if (e.char === "J") ctrl.current?.moveDown();
  else if (e.char === ">") ctrl.current?.indent();
  else if (e.char === "<") ctrl.current?.outdent();
});

<Tree
  nodes={sections}
  controller={ctrl}
  reorderable
  canMove={(ctx) => true /* domain rule */}
  onReorder={(change) => {
    setSections(change.nextNodes);
    if (change.expandedKeys.length) {
      setExpandedIds((prev) => new Set([...prev, ...change.expandedKeys]));
    }
  }}
  onStateChange={(s) => setStatus(s)}
/>
```

**Behavioral notes:**

- `commit` fires `onReorder(change)` **once**. `change.nextNodes` is the full reordered tree — apply it as your new source of truth. `change.expandedKeys` lists folders that Tree ephemerally auto-expanded during `indent` motions so the grabbed node could be dropped inside; persist these alongside the reorder in a single state update.
- `cancel` discards any scratch state (including ephemeral expansions) and fires no `onReorder`.
- `canMove` is consulted per motion step, not at commit. If it rejects every step in one direction, the grab stays open — the user resolves by either finding an allowed path or cancelling.
- In stash mode, marks are snapshot at `grabStash()`. `toggleMark` during `grabbed:*` is ignored — edit marks before grabbing.
- Stash commit drops the lifted group as **siblings after the cursor row**, at the cursor's parent + depth. Tree never auto-enters a collapsed folder; to drop inside a folder, expand it manually and place the cursor inside before committing.
- `indent` / `outdent` are no-ops in stash mode (drop depth = cursor depth).

Full design rationale, state-machine diagram, and edge cases: [`docs/specs/2026-04-24-tree-reorder-design.md`](../specs/2026-04-24-tree-reorder-design.md).

---

### TreeTable

Hierarchical rows with shared columns. Combines `Table`'s column model with `Tree`'s expand/collapse hierarchy. Reach for `TreeTable` when each row has tabular metadata (priority, owner, status, …) **and** rows can own children that share the same columns — task lists with subtasks, schema browsers, financial reports with subtotals.

The component does not own hierarchy state. Pass each row's `expanded` flag in; flip it in your own state in response to `onToggle`. Sort follows the same contract as `Table`: `onSort` is a notification, not a mutation — re-sort the data yourself. Sort siblings recursively; do not flatten across parent boundaries unless that is the intended UX.

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `TableColumn[]` | -- | Column definitions (required) |
| `data` | `TreeTableRow[]` | -- | Hierarchical row data (required) |
| `treeColumnKey` | `string` | `columns[0].key` | Which column gets the indent + ▾/▸ marker |
| `onToggle` | `(key, row) => void` | -- | Flip the row's `expanded` flag in your state |
| `onRowSelect` | `(key, row) => void` | -- | Enter on a body row |
| `onRowPress` | `(key, row) => void` | -- | Mouse click on a body row |
| `onSort` | `(key, dir) => void` | -- | Sort cycled via header `Enter` or `s` key |
| `onHeaderPress` | `(key) => void` | -- | Mouse click on a header cell |
| `isFocused` | `boolean` | `false` | Enables keyboard input |
| `rowHighlight` | `boolean` | `false` | Highlight the cursor row |
| `sortable` | `boolean` | `false` | Enable header-row navigation + sort cycle |
| `stripe` | `boolean` | `false` | Zebra-striped body rows |
| `maxVisibleRows` | `number` | `100` | Virtualize the flat-visible list past this count |
| `renderTreeCell` | `(value, row, depth, state) => ReactNode` | -- | Replace tree-column cell content |
| `renderCell` | `(value, col, row, state) => ReactNode` | -- | Replace non-tree-column cells |
| `renderHeader` | `(col) => ReactNode` | -- | Replace the default header cell |

**TreeTableRow type:**

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Stable row identifier |
| `values` | `Record<string, string \| number>` | One entry per column key |
| `children` | `TreeTableRow[]` | Optional child rows |
| `expanded` | `boolean` | Whether children are visible |
| `icon` | `string` | Optional icon in the tree column |

Keyboard:
- `↑` / `↓` move cursor; from row 0 with `sortable`, `↑` enters the header row.
- `←` collapses the cursor row if expanded; otherwise moves the column cursor left.
- `→` expands the cursor row if it has hidden children; otherwise moves the column cursor right.
- `Enter` selects on body row, cycles sort on header row.
- `s` cycles sort on the cursor column (when `sortable`).

Mouse:
- Click a ▸/▾ marker → `onToggle`.
- Click any other body cell → `onRowPress`.
- Click a header cell → `onHeaderPress` (and sort cycle if `sortable`).

**Basic: Tasks with subtasks**

```tsx
import { TreeTable, type TreeTableRow } from "reacterm";

const tasks: TreeTableRow[] = [
  {
    key: "a", icon: "📁", expanded: true,
    values: { name: "Auth flow", owner: "Edward", priority: "P0" },
    children: [
      { key: "a1", values: { name: "JWT refresh", owner: "Edward", priority: "P0" } },
      { key: "a2", values: { name: "MFA", owner: "Sara", priority: "P1" } },
    ],
  },
  { key: "b", values: { name: "Docs", owner: "Maya", priority: "P2" } },
];

<TreeTable
  columns={[
    { key: "name", header: "Task" },
    { key: "owner", header: "Owner", width: 10 },
    { key: "priority", header: "Pri", width: 5, align: "center" },
  ]}
  data={tasks}
  isFocused
  rowHighlight
  onToggle={(key) => setTasks((prev) => toggleExpanded(prev, key))}
/>
```

See [`docs/recipes.md`](../recipes.md) for the `toggleExpanded` and `sortRecursive` helpers, and the full "Task list with subtasks" recipe.

---

### DirectoryTree

Filesystem tree browser with expand/collapse, tree connectors, and keyboard navigation.

| Prop | Type | Default | Description |
|---|---|---|---|
| `rootPath` | `string` | -- | Root directory path |
| `onSelect` | `(path: string) => void` | -- | File/dir selection callback |
| `showHidden` | `boolean` | -- | Show hidden files (dotfiles) |
| `showFiles` | `boolean` | -- | Show files (not just directories) |
| `fileColor` | `string \| number` | -- | File name color |
| `dirColor` | `string \| number` | -- | Directory name color |
| `isFocused` | `boolean` | -- | Enable keyboard navigation |
| `renderEntry` | `(entry, state) => ReactNode` | -- | Custom entry renderer |

```tsx
<DirectoryTree rootPath="/src" onSelect={openFile} showFiles isFocused />
```

---

### ListView

Scrollable list with highlight cursor, selectable items, virtual scrolling, and overflow indicators.

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `readonly ListViewItem[]` | -- | List items (required) |
| `selectedKey` | `string` | -- | Currently selected item key |
| `onSelect` | `(key: string) => void` | -- | Called on Enter |
| `onHighlight` | `(key: string) => void` | -- | Called when highlight moves |
| `maxVisible` | `number` | `10` | Max visible items before scrolling |
| `highlightColor` | `string \| number` | `colors.brand.primary` | Highlight indicator color |
| `isFocused` | `boolean` | `true` | Whether list captures input |
| `emptyMessage` | `string` | `"No items"` | Text shown when items is empty |
| _Plus container props_ | | | `borderStyle`, `borderColor`, `padding*`, `width`, `margin*` |

**ListViewItem type:**

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Unique identifier |
| `label` | `string` | Display text |
| `description` | `string` | Optional secondary text |
| `icon` | `string` | Optional icon prefix |

**Basic: Simple selectable list**

```tsx
import { ListView } from "reacterm";

<ListView
  items={[
    { key: "1", label: "Create new project" },
    { key: "2", label: "Open existing project" },
    { key: "3", label: "Import from Git" },
  ]}
  onSelect={handleAction}
/>
```

**Advanced: List with descriptions and icons**

```tsx
<ListView
  items={[
    { key: "ts", label: "TypeScript", description: "Strict typed JavaScript", icon: "TS" },
    { key: "rs", label: "Rust", description: "Systems programming", icon: "RS" },
    { key: "py", label: "Python", description: "General purpose scripting", icon: "PY" },
    { key: "go", label: "Go", description: "Concurrent systems language", icon: "GO" },
  ]}
  selectedKey={selected}
  onSelect={setSelected}
  onHighlight={(key) => showPreview(key)}
  maxVisible={8}
  highlightColor="#82AAFF"
  borderStyle="round"
  borderColor="#505050"
/>
```

---

### VirtualList

Efficiently renders large lists by only materializing visible items plus an overscan buffer. Supports keyboard and mouse scroll navigation.

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `readonly T[]` | -- | All list items |
| `renderItem` | `(item: T, index: number) => ReactNode` | -- | Render function per item |
| `itemHeight` | `number` | `1` | Row height per item |
| `height` | `number` | -- | Viewport height in rows |
| `width` | `number \| string` | -- | Viewport width |
| `keyExtractor` | `(item, index) => string` | -- | Unique key function |
| `onSelect` | `(item, index) => void` | -- | Called on Enter |
| `isFocused` | `boolean` | `true` | Enable keyboard/mouse input |
| `selectedIndex` | `number` | -- | Controlled selected index |
| `emptyMessage` | `string` | `"No items"` | Text shown when list is empty |

Compound API: `VirtualList.Root`, `VirtualList.Item`.

```tsx
<VirtualList
  items={Array.from({ length: 10000 }, (_, i) => `Item ${i}`)}
  renderItem={(item) => <Text>{item}</Text>}
  height={20}
  onSelect={(item) => console.log(item)}
/>
```

---

### DiffView

Inline unified diff viewer with colored lines, gutter line numbers, hunk navigation (n/N), word-level highlighting, and collapsible context.

| Prop | Type | Default | Description |
|---|---|---|---|
| `diff` | `string` | -- | Raw unified diff string |
| `lines` | `DiffLine[]` | -- | Pre-parsed diff lines |
| `showLineNumbers` | `boolean` | `true` | Show gutter line numbers |
| `contextLines` | `number` | all | Lines of context around changes |
| `addedColor` | `string` | green | Color for added lines |
| `removedColor` | `string` | red | Color for removed lines |
| `isFocused` | `boolean` | `false` | Enable keyboard navigation |
| `filePath` | `string` | -- | File path header |
| `wordDiff` | `boolean` | `false` | Word-level diff highlighting |

```tsx
<DiffView diff={gitDiffOutput} isFocused wordDiff contextLines={3} />
```

---

### InlineDiff

Side-by-side single-line diff display. Shows removed characters in red strikethrough and added characters in green bold.

| Prop | Type | Default | Description |
|---|---|---|---|
| `before` | `string` | -- | Original text |
| `after` | `string` | -- | Changed text |
| `color` | `string` | -- | Base text color |

```tsx
<InlineDiff before="hello world" after="hello there" />
```

---

### Calendar

Month calendar view with keyboard navigation, date range highlighting, and disabled dates.

| Prop | Type | Default | Description |
|---|---|---|---|
| `year` | `number` | -- | Year to display |
| `month` | `number` | -- | Month (1-12) |
| `selectedDay` | `number` | -- | Currently selected day |
| `onSelect` | `(day: number) => void` | -- | Day selection callback |
| `onMonthChange` | `(year, month) => void` | -- | Month navigation callback |
| `selectedColor` | `string \| number` | brand primary | Selected day color |
| `today` | `Date` | auto | Override today highlight |
| `isFocused` | `boolean` | `true` | Enable keyboard navigation |
| `rangeStart` | `Date` | -- | Start of highlight range |
| `rangeEnd` | `Date` | -- | End of highlight range |
| `disabledDates` | `(date: Date) => boolean` | -- | Predicate for disabled dates |
| `weekStartsOn` | `0 \| 1` | `0` | Week start: 0=Sunday, 1=Monday |

```tsx
<Calendar year={2026} month={3} selectedDay={15} onSelect={setDay} />
```

---

### Pretty

JSON/object pretty-printer with syntax coloring and collapsible nodes.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `unknown` | -- | Data to display |
| `indent` | `number` | `2` | Indentation width |
| `color` | `boolean` | `true` | Enable syntax coloring |
| `maxDepth` | `number` | `5` | Maximum nesting depth |
| `interactive` | `boolean` | `false` | Enable collapse/expand with Enter/Space |
| `isFocused` | `boolean` | `false` | Whether focused for keyboard navigation |
| `searchQuery` | `string` | -- | Highlight matching text (case-insensitive) |
| `renderValue` | `(value, path, depth) => ReactNode \| null` | -- | Custom value renderer |

Compound API: `Pretty.Root`, `Pretty.Node`.

```tsx
<Pretty data={{ name: "Storm", version: 1, features: ["fast", "reactive"] }} interactive isFocused />
```


---
[Back to Components](README.md)
