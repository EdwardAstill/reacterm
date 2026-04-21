# Data Components

Components for displaying structured data, tables, trees, and lists.

## Data

### Table

Bordered table with headers, auto-sized columns, optional zebra striping, and row virtualization for large datasets.

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `TableColumn[]` | -- | Column definitions (required) |
| `data` | `Record<string, string \| number>[]` | -- | Row data (required) |
| `headerColor` | `string \| number` | `colors.brand.primary` | Header text color |
| `stripe` | `boolean` | `false` | Alternate row background |
| `maxVisibleRows` | `number` | `100` | Max rows before virtualization |
| `scrollOffset` | `number` | `0` | Current scroll position |
| `onScrollChange` | `(offset: number) => void` | -- | Called when scroll offset changes |
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
| `color` | `string \| number` | -- | Indicator color |

**TreeNode type:**

| Property | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | -- | Unique node identifier |
| `label` | `string` | -- | Display label |
| `children` | `TreeNode[]` | -- | Child nodes |
| `expanded` | `boolean` | -- | Whether children are visible |

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
