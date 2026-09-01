/** Verifies overlays paint on top and disappear cleanly. */
import React from "react";
import { renderToString } from "../../../src/reconciler/render-to-string.js";
import { Box, Text, Overlay } from "../../../src/components/index.js";

let pass = 0, fail = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) { pass++; }
  else { fail++; console.log(`  FAIL: ${name}${detail ? " — " + detail : ""}`); }
}

const W = 30, H = 8;

console.log(`\n  Overlay Tests — ${W}×${H}\n`);

// ── 1. Overlay appears on top of content ────────────────────────
console.log("  1. Overlay appears");
{
  const el = React.createElement(Box, { flexDirection: "column", width: W, height: H },
    React.createElement(Text, null, "BACKGROUND"),
    React.createElement(Overlay, { visible: true },
      React.createElement(Text, null, "OVERLAY"),
    ),
  );
  const r = renderToString(el, { width: W, height: H });
  check("overlay visible", r.output.includes("OVERLAY"));
  r.unmount();
}

// ── 2. Overlay disappears — background restored ─────────────────
console.log("  2. Overlay disappears");
{
  const mk = (visible: boolean) => React.createElement(Box,
    { flexDirection: "column", width: W, height: H },
    React.createElement(Text, null, "BACKGROUND CONTENT"),
    React.createElement(Text, null, "MORE BACKGROUND"),
    React.createElement(Overlay, { visible },
      React.createElement(Text, null, "OVERLAY TEXT"),
    ),
  );

  const r = renderToString(mk(true), { width: W, height: H });
  check("overlay shown", r.output.includes("OVERLAY TEXT"));

  const r2 = r.rerender(mk(false));
  check("overlay gone", !r2.output.includes("OVERLAY TEXT"),
    `stale: ${r2.lines.find(l => l.includes("OVERLAY"))}`);
  check("background restored", r2.output.includes("BACKGROUND CONTENT"));

  r.unmount();
}

// ── 3. Toggle overlay on/off/on ─────────────────────────────────
console.log("  3. Toggle on/off/on");
{
  const mk = (visible: boolean) => React.createElement(Box,
    { flexDirection: "column", width: W, height: H },
    React.createElement(Text, null, "BASE"),
    React.createElement(Overlay, { visible },
      React.createElement(Text, null, "MODAL"),
    ),
  );

  const r = renderToString(mk(true), { width: W, height: H });
  check("on: has MODAL", r.output.includes("MODAL"));

  const r2 = r.rerender(mk(false));
  check("off: no MODAL", !r2.output.includes("MODAL"));
  check("off: has BASE", r2.output.includes("BASE"));

  const r3 = r.rerender(mk(true));
  check("on again: has MODAL", r3.output.includes("MODAL"));

  r.unmount();
}

// ── 4. Overlay content changes ──────────────────────────────────
console.log("  4. Overlay content changes");
{
  const mk = (text: string) => React.createElement(Box,
    { flexDirection: "column", width: W, height: H },
    React.createElement(Text, null, "BG"),
    React.createElement(Overlay, { visible: true },
      React.createElement(Text, null, text),
    ),
  );

  const r = renderToString(mk("ALERT_A"), { width: W, height: H });
  check("shows ALERT_A", r.output.includes("ALERT_A"));

  const r2 = r.rerender(mk("ALERT_B"));
  check("shows ALERT_B", r2.output.includes("ALERT_B"));
  check("no stale ALERT_A", !r2.output.includes("ALERT_A"));

  r.unmount();
}

// ── 5. Two overlays — mount ordering ────────────────────────────
console.log("  5. Two overlays mount ordering");
{
  const mk = () => React.createElement(Box,
    { flexDirection: "column", width: W, height: H },
    React.createElement(Text, null, "BG"),
    React.createElement(Overlay, { visible: true },
      React.createElement(Text, null, "OVERLAY_A"),
    ),
    React.createElement(Overlay, { visible: true },
      React.createElement(Text, null, "OVERLAY_B"),
    ),
  );

  const r = renderToString(mk(), { width: W, height: H });
  check(
    "later-mounted overlay wins",
    r.output.includes("OVERLAY_B") && !r.output.includes("OVERLAY_A"),
    `output: ${JSON.stringify(r.output)}`,
  );

  const r2 = r.rerender(mk());
  check(
    "mount ordering survives rerender",
    r2.output.includes("OVERLAY_B") && !r2.output.includes("OVERLAY_A"),
    `output: ${JSON.stringify(r2.output)}`,
  );

  r.unmount();
}

console.log(`\n  Overlay: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
