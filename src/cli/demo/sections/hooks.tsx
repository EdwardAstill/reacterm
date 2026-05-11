import React, { useRef, useState } from "react";
import {
  BlinkDot,
  Box,
  memoryStorage,
  ShimmerText,
  Sparkline,
  Text,
  useConfirmAction,
  useEasedInterval,
  useHotkey,
  useInput,
  usePersistentState,
  useTextCycler,
  useTheme,
  useTick,
  useUndoRedo,
  useWizard,
} from "../demo-kit.js";
import { DEMO_COVERAGE } from "../coverage.js";

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

      <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Public hook coverage cards</Text>
        <Text color={theme.colors.text.dim}>
          Runtime demo, docs-only, test-only, and edge-case status are explicit in src/cli/demo/coverage.ts.
        </Text>
        {DEMO_COVERAGE
          .filter((entry) => entry.kind === "hook")
          .map((entry) => (
            <Box key={entry.name} flexDirection="row" gap={1}>
              <Text color={entry.status === "edge-case" ? theme.colors.warning : theme.colors.success}>
                {entry.status}
              </Text>
              <Text color={theme.colors.text.primary}>{entry.name}</Text>
              <Text color={theme.colors.text.dim}>— {entry.note}</Text>
            </Box>
          ))}
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

export { AnimLabSection, BehaviorsSection, HooksSection };
