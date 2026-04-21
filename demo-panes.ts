import React from "react";
import { renderToString } from "./src/reconciler/render-to-string.js";
import { Panes, Pane } from "./src/components/core/Panes.js";
import { Box } from "./src/components/core/Box.js";

const Text = (p: { children: string }) =>
  React.createElement("tui-text", null, p.children);

// ── Row layout: 3 side-by-side panes ────────────────────────────────────────
const rowDemo = React.createElement(
  Panes,
  { direction: "row", borderStyle: "single", width: 60, height: 10 },
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Left"),
  ),
  React.createElement(Pane, { flex: 2 },
    React.createElement(Text, null, "Middle"),
  ),
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Right"),
  ),
);

// ── Column layout: stacked panes ────────────────────────────────────────────
const colDemo = React.createElement(
  Panes,
  { direction: "column", borderStyle: "single", width: 30, height: 12 },
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Top"),
  ),
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Middle"),
  ),
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Bottom"),
  ),
);

// ── Mixed borders: per-pane override ────────────────────────────────────────
const mixedDemo = React.createElement(
  Panes,
  { direction: "row", borderStyle: "single", borderColor: "gray", width: 50, height: 8 },
  React.createElement(Pane, { flex: 1, borderStyle: "double" },
    React.createElement(Text, null, "Double"),
  ),
  React.createElement(Pane, { flex: 1 },
    React.createElement(Text, null, "Single"),
  ),
  React.createElement(Pane, { flex: 1, borderStyle: "heavy" },
    React.createElement(Text, null, "Heavy"),
  ),
);

const r = renderToString(rowDemo, { width: 60, height: 10 });
const c = renderToString(colDemo, { width: 30, height: 12 });
const m = renderToString(mixedDemo, { width: 50, height: 8 });

console.log("── Row (3 panes) ──────────────────────────────────────");
console.log(r.output);
console.log("── Column (3 panes) ───────────────────────────────────");
console.log(c.output);
console.log("── Mixed border styles ────────────────────────────────");
console.log(m.output);
