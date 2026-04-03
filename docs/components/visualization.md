# Visualization Components

Charts, graphs, and data visualization widgets.

## Visualization

### LineChart

Multi-series line chart rendered with Unicode braille characters for 2x4 sub-pixel resolution. Supports auto-scaling Y-axis, axes, legends, and multiple colored series.

| Prop | Type | Default | Description |
|---|---|---|---|
| `series` | `LineChartSeries[]` | -- | Array of data series (required) |
| `width` | `number` | -- | Chart width in columns |
| `height` | `number` | -- | Chart height in rows |
| `yMin` | `number` | Auto | Y-axis minimum |
| `yMax` | `number` | Auto | Y-axis maximum |
| `showAxes` | `boolean` | `true` | Show X and Y axes |
| `showLegend` | `boolean` | Auto (true if >1 series) | Show color legend |
| `axisColor` | `string \| number` | -- | Axis line color |
| `title` | `string` | -- | Chart title |
| _Plus layout props_ | | | `color`, `margin*`, `minWidth`, `maxWidth` |

**LineChartSeries type:**

| Property | Type | Default | Description |
|---|---|---|---|
| `data` | `number[]` | -- | Y-values |
| `color` | `string \| number` | Auto from palette | Series color |
| `name` | `string` | -- | Legend label |

**Basic: Single series**

```tsx
import { LineChart } from "@orchetron/storm";

<LineChart
  series={[{ data: [10, 25, 18, 40, 35, 50, 45], name: "Requests" }]}
  width={40}
  height={10}
/>
```

**Advanced: Multi-series comparison**

```tsx
<LineChart
  series={[
    { data: latencyP50, name: "p50", color: "#34D399" },
    { data: latencyP95, name: "p95", color: "#FBBF24" },
    { data: latencyP99, name: "p99", color: "#F87171" },
  ]}
  width={60}
  height={15}
  yMin={0}
  yMax={500}
  title="Request Latency (ms)"
  axisColor="#505050"
  showLegend
  showAxes
/>
```

---

### AreaChart

Braille-based area chart that fills below each line. Supports multiple series, stacked mode, axes, and legend.

| Prop | Type | Default | Description |
|---|---|---|---|
| `series` | `ChartSeries[]` | -- | Data series to plot |
| `width` | `number` | `60` | Chart width in cells |
| `height` | `number` | `10` | Chart height in rows |
| `yMin` | `number` | auto | Minimum Y value |
| `yMax` | `number` | auto | Maximum Y value |
| `showAxes` | `boolean` | `true` | Show Y-axis labels and X-axis line |
| `showLegend` | `boolean` | auto | Show series legend (auto if >1 series) |
| `axisColor` | `string \| number` | dim | Axis color |
| `title` | `string` | -- | Chart title |
| `xLabels` | `string[]` | -- | X-axis labels |
| `fillDensity` | `"full" \| "sparse"` | `"full"` | Fill density below lines |
| `stacked` | `boolean` | `false` | Stack series cumulatively |

```tsx
<AreaChart
  series={[{ name: "Revenue", data: [10, 20, 35, 28, 42], color: "#4ade80" }]}
  width={50} height={8} title="Revenue"
/>
```

---

### BarChart

Vertical and horizontal bar charts with stacking, grouping, and interactive selection.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bars` | `BarData[]` | -- | Simple bars: `[{label, value, color?}]` |
| `stacked` | `StackedBarData[]` | -- | Stacked bars with segments |
| `grouped` | `{series, labels}` | -- | Grouped bars (side by side) |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Bar orientation |
| `showValues` | `boolean` | -- | Show value labels on bars |
| `width` | `number` | -- | Chart width |
| `height` | `number` | -- | Chart height |
| `color` | `string \| number` | -- | Default bar color |
| `barGap` | `number` | -- | Gap between bars |
| `barWidth` | `number` | -- | Bar width in characters |
| `title` | `string` | -- | Chart title |
| `showAxes` | `boolean` | -- | Show axes |
| `interactive` | `boolean` | -- | Enable arrow key selection |
| `isFocused` | `boolean` | -- | Whether chart has focus |
| `animated` | `boolean` | -- | Animate bar height transitions |

```tsx
<BarChart
  bars={[
    { label: "Mon", value: 12 },
    { label: "Tue", value: 28 },
    { label: "Wed", value: 19 },
  ]}
  width={40} height={10} showValues
/>
```

---

### ScatterPlot

Braille-based scatter plot with multiple series, trend lines, and interactive zoom/pan.

| Prop | Type | Default | Description |
|---|---|---|---|
| `series` | `ScatterPlotSeries[]` | -- | Data series (`{ data: [x,y][], name?, color? }`) |
| `width` | `number` | `60` | Chart width in columns |
| `height` | `number` | `10` | Chart height in rows |
| `xMin` / `xMax` | `number` | auto | X-axis range overrides |
| `yMin` / `yMax` | `number` | auto | Y-axis range overrides |
| `showAxes` | `boolean` | `true` | Show axis labels |
| `showLegend` | `boolean` | auto | Show series legend |
| `title` | `string` | -- | Chart title |
| `dotSize` | `1 \| 2` | `1` | Dot size (1=single, 2=2x2 cluster) |
| `showTrend` | `boolean` | `false` | Show linear regression trend line with R-squared |
| `interactive` | `boolean` | `false` | Enable interactive mode |
| `isFocused` | `boolean` | `false` | Whether chart is focused |
| `zoomable` | `boolean` | `false` | Enable zoom (+/-) and pan (arrows) |
| `renderTooltip` | `(point, seriesIndex) => ReactNode` | -- | Custom tooltip renderer |

```tsx
<ScatterPlot
  series={[{ data: [[1,2],[3,5],[5,4],[7,8]], name: "Samples" }]}
  width={40}
  height={10}
  showTrend
/>
```

---

### Heatmap

Colored grid for 2D data visualization with interpolated background colors. Supports interactive cell cursor and tooltips.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `number[][]` | -- | 2D data: `data[row][col]` |
| `rowLabels` | `string[]` | -- | Row labels (left side) |
| `colLabels` | `string[]` | -- | Column labels (bottom) |
| `colorStops` | `string[]` | -- | Multi-stop color gradient |
| `colors` | `[string, string]` | -- | (deprecated) Two-color ramp |
| `showValues` | `boolean` | -- | Show numeric values in cells |
| `cellWidth` | `number` | `3` | Cell width in characters |
| `title` | `string` | -- | Chart title |
| `interactive` | `boolean` | -- | Enable arrow key cursor |
| `isFocused` | `boolean` | -- | Whether chart has focus |

```tsx
<Heatmap
  data={[[1, 3, 5], [2, 4, 6], [7, 8, 9]]}
  rowLabels={["A", "B", "C"]}
  colorStops={["#1a1a2e", "#82AAFF", "#4ade80"]}
  showValues
/>
```

---

### Histogram

Distribution visualization from raw data. Automatically bins and renders as vertical bar chart with optional mean/median markers.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `number[]` | -- | Raw data values to bin |
| `bins` | `number` | auto | Number of bins |
| `color` | `string \| number` | -- | Bar color |
| `showCounts` | `boolean` | -- | Show bin count above each bar |
| `title` | `string` | -- | Chart title |
| `width` | `number` | -- | Chart width |
| `height` | `number` | -- | Chart height |
| `showMean` | `boolean` | -- | Show vertical mean line |
| `showMedian` | `boolean` | -- | Show vertical median line |
| `cumulative` | `boolean` | -- | Cumulative distribution mode |

```tsx
<Histogram data={[1, 2, 2, 3, 3, 3, 4, 5]} bins={5} width={40} height={8} showMean />
```

---

### Sparkline

Inline data visualization using Unicode block characters. Supports single-row or multi-row modes with optional labels.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `readonly number[]` | -- | Numeric data points (required) |
| `width` | `number` | `data.length` | Chart width in columns (max 80) |
| `height` | `number` | `1` | Chart height in rows (max 4) |
| `min` | `number` | Auto | Y-axis minimum |
| `max` | `number` | Auto | Y-axis maximum |
| `color` | `string \| number` | `colors.brand.primary` | Bar color |
| `fillColor` | `string \| number` | -- | Empty space color in multi-row mode |
| `label` | `string` | -- | Label text centered below chart |
| _Plus layout props_ | | | `margin*`, `minWidth`, `maxWidth` |

**Basic: Inline sparkline**

```tsx
import { Sparkline } from "@orchetron/storm";

<Sparkline data={[4, 8, 15, 16, 23, 42, 38, 30, 25, 20]} color="#82AAFF" />
```

**Advanced: Multi-row sparkline with label**

```tsx
<Box flexDirection="row" gap={4}>
  <Box flexDirection="column">
    <Text bold>CPU Usage</Text>
    <Sparkline data={cpuHistory} width={30} height={3} color="#34D399" label="Last 30s" />
  </Box>
  <Box flexDirection="column">
    <Text bold>Memory</Text>
    <Sparkline data={memHistory} width={30} height={3} color="#FBBF24" min={0} max={100} label="% used" />
  </Box>
</Box>
```

---

### Gauge

Visual gauge display using graduated block characters (bar mode) or braille semi-circular arc (arc mode). Supports thresholds.

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | -- | Gauge value (0-100) |
| `label` | `string` | -- | Label text |
| `color` | `string \| number` | -- | Bar/arc color |
| `width` | `number` | -- | Gauge width |
| `thresholds` | `GaugeThreshold[]` | -- | Color breakpoints `[{value, color}]` |
| `showValue` | `boolean` | -- | Show numeric percentage |
| `variant` | `"bar" \| "arc"` | `"bar"` | Display variant |
| `renderValue` | `(value, label?) => ReactNode` | -- | Custom value renderer |

```tsx
<Gauge value={72} label="CPU" width={30} showValue thresholds={[{ value: 80, color: "red" }]} />
```

---

### Diagram

Renders flowcharts and architecture diagrams using box-drawing characters and ANSI colors. Supports DAGs with fan-out and merge.

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `DiagramNode[]` | -- | Nodes with id, label, optional sublabel/color/width |
| `edges` | `DiagramEdge[]` | -- | Edges with from/to ids and optional label |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Flow direction |
| `nodeStyle` | `"round" \| "single" \| "double" \| "heavy"` | -- | Node border style |
| `arrowChar` | `string` | auto | Arrow character |
| `gapX` | `number` | `4` | Horizontal gap between nodes |
| `gapY` | `number` | `2` | Vertical gap between rows |
| `color` | `string \| number` | -- | Default node color |
| `edgeColor` | `string \| number` | -- | Arrow/line color |

```tsx
<Diagram
  nodes={[
    { id: "a", label: "Start" },
    { id: "b", label: "Process" },
    { id: "c", label: "End" },
  ]}
  edges={[{ from: "a", to: "b" }, { from: "b", to: "c" }]}
/>
```

---

### Canvas

Declarative visualization component for AI-generated diagrams. Takes a JSON-serializable tree of nodes and edges.

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `CanvasNode[]` | -- | Tree of nodes to render |
| `edges` | `CanvasEdge[]` | `[]` | Connections between nodes |
| `title` | `string` | -- | Canvas title |
| `direction` | `"horizontal" \| "vertical"` | `"vertical"` | Layout direction |
| `width` | `number` | -- | Canvas width |
| `borderStyle` | `"round" \| "single" \| "double" \| "heavy" \| "none"` | -- | Outer border style |
| `borderColor` | `string \| number` | -- | Outer border color |
| `padding` | `number` | -- | Inner padding |

```tsx
<Canvas
  title="Architecture"
  nodes={[
    { id: "api", type: "box", label: "API Gateway" },
    { id: "svc", type: "box", label: "Service" },
  ]}
  edges={[{ from: "api", to: "svc" }]}
/>
```

---

### GradientProgress

Progress bar with multi-stop color gradient on the filled portion and soft falloff edge.

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | -- | Progress value (0-100) |
| `width` | `number` | -- | Bar width |
| `colors` | `string[]` | violet to mint | Multi-stop gradient colors |
| `fromColor` | `string` | -- | (deprecated) Start color |
| `toColor` | `string` | -- | (deprecated) End color |
| `showPercentage` | `boolean` | -- | Show percentage label |
| `label` | `string` | -- | Label text |

```tsx
<GradientProgress value={65} width={40} colors={["#9B7DFF", "#6DFFC1"]} showPercentage />
```


---
[Back to Components](README.md)
