/**
 * Dock TUI — Pyseas-Dock inspired showcase.
 *
 * Left column: sections tree + calculations list (stacked).
 * Right column: detail pane with I/O / JSON / Guide / Script sub-tabs.
 * Mock data only — no backend. Interactive: pane cycle, edit I/O values
 * with block cursor, working modal overlays (new/open/add), help.
 *
 * Visual style: Pyseas-Dock — no box borders on panes, colored 1-char-wide
 * left strip marks the focused pane, divider strips separate stacked regions,
 * single-line borders only on floating modals + inline text inputs.
 */

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  render,
  Box,
  Text,
  Divider,
  Editor,
  Footer,
  Kbd,
  Modal,
  OptionList,
  ScrollView,
  SearchInput,
  Table,
  Tabs,
  Tree,
  Panes,
  Pane,
  useInput,
  useApp,
  useTerminal,
  type TreeController,
} from "../../../src/index.js";

let chosenCode = 0;

// --------------------------- Theme ---------------------------
const C = {
  bg: "#0B0B0D",
  fg: "#E4E4E7",
  border: "#52525B",
  borderFocused: "#FAFAFA",
  dim: "#71717A",
  muted: "#52525B",
  selectedBg: "#27272A",
  accent: "#22C55E",
  error: "#EF4444",
  warn: "#F59E0B",
  tabActive: "#FAFAFA",
  headerBg: "#18181B",
};

// --------------------------- Mock data ---------------------------
type Section = {
  id: string;
  label: string;
  kind: "folder" | "file";
  children?: Section[];
  calcRef?: string;
};

const SECTIONS: Section[] = [
  {
    id: "root-loads", label: "Loads", kind: "folder", children: [
      { id: "wind",    label: "Wind Loads",    kind: "file", calcRef: "wind-pressure" },
      { id: "seismic", label: "Seismic",       kind: "file", calcRef: "seismic-base-shear" },
      { id: "dead",    label: "Dead Loads",    kind: "file", calcRef: "dead-load-sum" },
      { id: "live",    label: "Live Loads",    kind: "file", calcRef: "live-load-area" },
    ],
  },
  {
    id: "root-structure", label: "Structure", kind: "folder", children: [
      { id: "beam",   label: "Beam Sizing",    kind: "file", calcRef: "beam-flexure" },
      { id: "column", label: "Column Design",  kind: "file", calcRef: "column-axial" },
      { id: "conn",   label: "Connections",    kind: "file", calcRef: "bolt-group" },
    ],
  },
  {
    id: "root-geotech", label: "Geotechnical", kind: "folder", children: [
      { id: "bear",   label: "Bearing Capacity", kind: "file", calcRef: "terzaghi-bearing" },
      { id: "settle", label: "Settlement",       kind: "file", calcRef: "consolidation" },
    ],
  },
];

type MockCalc = {
  calc_name: string;
  display_name: string;
  category: string;
  description: string;
  inputs: Record<string, { value: number; units: string; label: string; format?: string }>;
  outputs: Record<string, { value: number; units: string; label: string; format?: string }>;
  guide: string;
  script: string;
};

const DEFAULT_FORMAT = "0.00";

const CALCS: MockCalc[] = [
  {
    calc_name: "wind-pressure",
    display_name: "Wind Pressure (ASCE 7)",
    category: "Wind",
    description: "Design wind pressure on low-rise enclosed building.",
    inputs: {
      V:   { value: 115,  units: "mph",   label: "Basic wind speed" },
      Kz:  { value: 0.85, units: "-",     label: "Velocity pressure coeff" },
      Kzt: { value: 1.0,  units: "-",     label: "Topographic factor" },
      Kd:  { value: 0.85, units: "-",     label: "Directionality factor" },
      Ke:  { value: 1.0,  units: "-",     label: "Elevation factor" },
    },
    outputs: {
      qz:  { value: 23.8, units: "psf",   label: "Velocity pressure" },
      p:   { value: 19.1, units: "psf",   label: "Design pressure" },
    },
    guide: "ASCE 7-22 Chapter 26 procedure for Main Wind Force Resisting System.\nApply pressure to enclosed building envelope.",
    script: "// Typst calculation template\n#let V = input.V\n#let qz = 0.00256 * Kz * Kzt * Kd * Ke * V*V\n#let p  = qz * GCp",
  },
  {
    calc_name: "seismic-base-shear",
    display_name: "Seismic Base Shear",
    category: "Seismic",
    description: "ELF procedure base shear V = Cs * W.",
    inputs: {
      SDS: { value: 0.45, units: "g",    label: "Design short-period accel" },
      SD1: { value: 0.20, units: "g",    label: "Design 1-sec accel" },
      R:   { value: 6.0,  units: "-",    label: "Response modification" },
      Ie:  { value: 1.0,  units: "-",    label: "Importance factor" },
      W:   { value: 2400, units: "kip",  label: "Effective seismic weight" },
    },
    outputs: {
      Cs:  { value: 0.075, units: "-",   label: "Seismic response coeff" },
      V:   { value: 180,   units: "kip", label: "Base shear" },
    },
    guide: "ASCE 7 §12.8 Equivalent Lateral Force procedure.",
    script: "#let Cs = min(SDS / (R / Ie), SD1 / (T * R / Ie))\n#let V  = Cs * W",
  },
  {
    calc_name: "dead-load-sum",
    display_name: "Dead Load Summation",
    category: "Gravity",
    description: "Sum of self-weight for floor assembly.",
    inputs: {
      slab:  { value: 75,  units: "psf", label: "Concrete slab" },
      steel: { value: 12,  units: "psf", label: "Steel framing" },
      mech:  { value: 8,   units: "psf", label: "Mech/Electrical" },
      ceil:  { value: 3,   units: "psf", label: "Ceiling" },
    },
    outputs: {
      DL:    { value: 98,  units: "psf", label: "Total dead load" },
    },
    guide: "Per ASCE 7 Table C3.1-1a for typical assemblies.",
    script: "#let DL = slab + steel + mech + ceil",
  },
  {
    calc_name: "live-load-area",
    display_name: "Live Load Reduction",
    category: "Gravity",
    description: "Area-based reduction per ASCE 7 §4.7.",
    inputs: {
      Lo: { value: 50,  units: "psf",  label: "Unreduced live load" },
      AT: { value: 800, units: "ft²",  label: "Tributary area" },
      KLL:{ value: 4,   units: "-",    label: "Live load element factor" },
    },
    outputs: {
      L:  { value: 30.2, units: "psf", label: "Reduced live load" },
    },
    guide: "L = Lo · (0.25 + 15/sqrt(KLL·AT)), not less than 0.5·Lo.",
    script: "#let L = max(Lo * (0.25 + 15/sqrt(KLL*AT)), 0.5 * Lo)",
  },
  {
    calc_name: "beam-flexure",
    display_name: "Beam Flexural Capacity",
    category: "Steel",
    description: "W-shape nominal moment Mn = Fy·Zx (compact LTB OK).",
    inputs: {
      Fy: { value: 50,   units: "ksi",  label: "Yield stress" },
      Zx: { value: 66.5, units: "in³",  label: "Plastic section modulus" },
    },
    outputs: {
      Mn: { value: 277,  units: "kip·ft", label: "Nominal moment" },
      phiMn: { value: 249, units: "kip·ft", label: "Design moment" },
    },
    guide: "AISC F2 compact section, unbraced length within Lp.",
    script: "#let Mn = Fy * Zx / 12\n#let phiMn = 0.9 * Mn",
  },
  {
    calc_name: "column-axial",
    display_name: "Column Axial Capacity",
    category: "Steel",
    description: "Compression capacity AISC E3.",
    inputs: {
      Fy: { value: 50,   units: "ksi", label: "Yield stress" },
      Ag: { value: 14.7, units: "in²", label: "Gross area" },
      KL: { value: 144,  units: "in",  label: "Effective length" },
      r:  { value: 3.72, units: "in",  label: "Radius of gyration" },
    },
    outputs: {
      Pn:    { value: 655, units: "kip", label: "Nominal compression" },
      phiPn: { value: 590, units: "kip", label: "Design compression" },
    },
    guide: "AISC E3 flexural buckling, KL/r governs.",
    script: "#let lambda = KL / r\n#let Fcr = (lambda <= 4.71*sqrt(29000/Fy)) ? ...",
  },
  {
    calc_name: "bolt-group",
    display_name: "Bolt Group Shear",
    category: "Connections",
    description: "Eccentrically loaded bolt group IC method (approx).",
    inputs: {
      n:  { value: 6,   units: "-",   label: "Number of bolts" },
      Fv: { value: 54,  units: "ksi", label: "Bolt shear strength" },
      Ab: { value: 0.44, units: "in²", label: "Bolt area" },
    },
    outputs: {
      Rn: { value: 142.6, units: "kip", label: "Nominal shear" },
    },
    guide: "AISC J3 high-strength bolts, threads excluded.",
    script: "#let Rn = n * Fv * Ab",
  },
  {
    calc_name: "terzaghi-bearing",
    display_name: "Terzaghi Bearing Capacity",
    category: "Soil",
    description: "Ultimate bearing capacity continuous footing.",
    inputs: {
      c:     { value: 150, units: "psf",  label: "Cohesion" },
      gamma: { value: 120, units: "pcf",  label: "Unit weight" },
      B:     { value: 4,   units: "ft",   label: "Footing width" },
      Nc:    { value: 17.7, units: "-",   label: "Bearing factor Nc" },
      Ngam:  { value: 5.0,  units: "-",   label: "Bearing factor Nγ" },
    },
    outputs: {
      qult: { value: 3855, units: "psf", label: "Ultimate capacity" },
      qall: { value: 1285, units: "psf", label: "Allowable (FS=3)" },
    },
    guide: "qult = c·Nc + 0.5·γ·B·Nγ (continuous, no surcharge).",
    script: "#let qult = c*Nc + 0.5*gamma*B*Ngam\n#let qall = qult / 3",
  },
  {
    calc_name: "consolidation",
    display_name: "Primary Consolidation",
    category: "Soil",
    description: "1-D consolidation settlement of clay layer.",
    inputs: {
      Cc: { value: 0.25, units: "-",   label: "Compression index" },
      e0: { value: 0.85, units: "-",   label: "Initial void ratio" },
      H:  { value: 12,   units: "ft",  label: "Layer thickness" },
      p0: { value: 1800, units: "psf", label: "Initial effective stress" },
      dp: { value: 1200, units: "psf", label: "Stress increase" },
    },
    outputs: {
      S:  { value: 2.1,  units: "in",  label: "Settlement" },
    },
    guide: "Terzaghi 1-D primary consolidation for NC clay.",
    script: "#let S = (Cc * H / (1+e0)) * log10((p0+dp)/p0)",
  },
];

const LIBRARY_CALCS = [
  { id: "wind-pressure",     name: "Wind Pressure",       category: "Wind",        description: "ASCE 7 wind on MWFRS envelope" },
  { id: "seismic-base-shear",name: "Seismic Base Shear",  category: "Seismic",     description: "ELF procedure V = Cs·W" },
  { id: "beam-flexure",      name: "Beam Flexural",       category: "Steel",       description: "AISC F2 Mn = Fy·Zx" },
  { id: "column-axial",      name: "Column Axial",        category: "Steel",       description: "AISC E3 compression" },
  { id: "bolt-group",        name: "Bolt Group",          category: "Connections", description: "IC method eccentric shear" },
  { id: "terzaghi-bearing",  name: "Terzaghi Bearing",    category: "Soil",        description: "Ultimate footing capacity" },
  { id: "consolidation",     name: "Consolidation",       category: "Soil",        description: "1-D primary settlement" },
  { id: "rebar-dev",         name: "Rebar Development",   category: "Concrete",    description: "ACI 318 ld for tension bars" },
  { id: "shear-friction",    name: "Shear Friction",      category: "Concrete",    description: "ACI 318 Vn interface shear" },
];

const RECENT_PROJECTS = [
  { path: "/projects/tower-404",      name: "Tower 404 Frame",     last: "2 hours ago" },
  { path: "/projects/bridge-eastside", name: "Eastside Pedestrian", last: "yesterday" },
  { path: "/projects/retail-shell",    name: "Retail Shell Expansion", last: "3 days ago" },
  { path: "/projects/datacenter-b",    name: "Datacenter B Podium",    last: "last week" },
];

const MOCK_FILES = [
  { filename: "soil-report-2024.pdf",  size_kb: 428.3 },
  { filename: "geotech-memo.docx",     size_kb: 38.1 },
  { filename: "reference-plans.dwg",   size_kb: 1204.7 },
];

const MOCK_IMAGES = [
  { filename: "site-plan.png",       size_kb: 89.2 },
  { filename: "detail-a.png",        size_kb: 41.8 },
  { filename: "load-diagram.svg",    size_kb: 12.4 },
  { filename: "elevation-north.png", size_kb: 134.6 },
];

// --------------------------- Helpers ---------------------------
type FlatItem = { node: Section; level: number };

function flattenVisible(nodes: Section[], expandedIds: Set<string>, level = 0): FlatItem[] {
  const out: FlatItem[] = [];
  for (const node of nodes) {
    const expanded = expandedIds.has(node.id);
    out.push({ node, level });
    if (expanded && node.children) out.push(...flattenVisible(node.children, expandedIds, level + 1));
  }
  return out;
}

// Block cursor: render the char at `cursorIdx` with inverted colors (bg = fg).
// At end-of-string, render a space with inverted colors. No blink.
function EditableText({ value, cursorIdx, focused }: {
  value: string;
  cursorIdx: number;
  focused: boolean;
}) {
  if (!focused) return <Text color={C.fg}>{value}</Text>;
  const before = value.slice(0, cursorIdx);
  const atCursor = value[cursorIdx] ?? " ";
  const after = value.slice(cursorIdx + 1);
  return (
    <Box flexDirection="row">
      <Text color={C.fg}>{before}</Text>
      <Text color={C.bg} backgroundColor={C.fg}>{atCursor}</Text>
      <Text color={C.fg}>{after}</Text>
    </Box>
  );
}

// --------------------------- App ---------------------------
type MainTab = "calculation" | "files" | "images";
type SubTab = "io" | "json" | "guide" | "script";
type Pane = "tree" | "calcs" | "detail";
type ModalMode = "none" | "new-project" | "open-project" | "add-calc" | "name-calc";

const CUSTOM_FOLDER_ID = "root-custom";

const PANE_CYCLE: Pane[] = ["tree", "calcs", "detail"];

function App() {
  const { exit } = useApp();
  const { width, height } = useTerminal();

  const [activePane, setActivePane] = useState<Pane>("tree");
  const [mainTab, setMainTab] = useState<MainTab>("calculation");
  const [subTab, setSubTab] = useState<SubTab>("io");
  const [showHelp, setShowHelp] = useState(false);
  const [treeWidth, setTreeWidth] = useState(() => Math.max(26, Math.floor(width * 0.26)));
  const [treeSplit, setTreeSplit] = useState(() => Math.max(1, Math.floor((height - 6) * 0.46)));
  const [resizing, setResizing] = useState(false);
  const resizingRef = useRef(false);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["root-loads", "root-structure"]));
  const [focusedSectionId, setFocusedSectionId] = useState("wind");
  const treeCtrl = useRef<TreeController | null>(null);
  const [reorderPhase, setReorderPhase] = useState<"idle" | "marking" | "grabbed">("idle");

  const [focusedCalcIdx, setFocusedCalcIdx] = useState(0);

  // I/O editing
  const [focusedIOSide, setFocusedIOSide] = useState<"inputs" | "outputs">("inputs");
  const [focusedInputIdx, setFocusedInputIdx] = useState(0);
  const [focusedOutputIdx, setFocusedOutputIdx] = useState(0);
  const [focusedCol, setFocusedCol] = useState<"field" | "value" | "unit" | "format">("value");
  // Editing any cell: keyed by `${side}:${field}:${col}`
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [cursorIdx, setCursorIdx] = useState(0);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [runState, setRunState] = useState<"idle" | "done" | "running">("idle");

  const cellKey = (side: "inputs" | "outputs", field: string, col: "value" | "unit" | "format") =>
    `${side}:${field}:${col}`;

  // Modals
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [modalInput, setModalInput] = useState("");
  const [modalCursor, setModalCursor] = useState(0);
  const [modalFocusIdx, setModalFocusIdx] = useState(0);
  const [addCalcSearch, setAddCalcSearch] = useState("");
  // Two-step add flow: library pick → name → commit. Holds the library calc
  // id while the user types a section label in the name-calc modal.
  const [pendingCalcId, setPendingCalcId] = useState<string | null>(null);

  // Projects (mock)
  const [projectName, setProjectName] = useState("Tower 404 Frame");
  const [activeProjectCalcs, setActiveProjectCalcs] = useState<string[]>(
    CALCS.map(c => c.calc_name),
  );
  const [sections, setSections] = useState<Section[]>(SECTIONS);

  // Derived
  const flatTree = useMemo(() => flattenVisible(sections, expandedIds), [expandedIds, sections]);
  const treeNodes = useMemo(() => {
    const mapNodes = (nodes: Section[]): Array<{ key: string; label: string; expanded?: boolean; icon?: string; children?: ReturnType<typeof mapNodes> }> =>
      nodes.map((node) => ({
        key: node.id,
        label: node.label,
        expanded: expandedIds.has(node.id),
        icon: node.kind === "folder" ? "▤" : "▢",
        children: node.children ? mapNodes(node.children) : undefined,
      }));
    return mapNodes(sections);
  }, [expandedIds, sections]);
  const sectionById = useMemo(() => {
    const out = new Map<string, Section>();
    const walk = (nodes: Section[]) => {
      for (const node of nodes) {
        out.set(node.id, node);
        if (node.children) walk(node.children);
      }
    };
    walk(sections);
    return out;
  }, [sections]);
  const calcList = useMemo(
    () => CALCS.filter(c => activeProjectCalcs.includes(c.calc_name)),
    [activeProjectCalcs],
  );
  const leftStackHeight = Math.max(0, height - 6);
  const maxTreeSplit = Math.max(1, leftStackHeight - 4);
  const calcPaneHeight = Math.max(1, leftStackHeight - treeSplit - 3);
  const focusedCalc = calcList[focusedCalcIdx];
  const buildRow = useCallback((side: "inputs" | "outputs", field: string, spec: { value: number; units: string; label: string; format?: string }) => {
    const vKey = cellKey(side, field, "value");
    const uKey = cellKey(side, field, "unit");
    const fKey = cellKey(side, field, "format");
    const value = editedCells[vKey] ?? String(spec.value);
    const units = editedCells[uKey] ?? spec.units;
    const format = editedCells[fKey] ?? spec.format ?? DEFAULT_FORMAT;
    const isEdited = vKey in editedCells || uKey in editedCells || fKey in editedCells;
    return { field, label: spec.label, value, units, format, isEdited };
  }, [editedCells]);

  const inputRows = useMemo(() => focusedCalc
    ? Object.entries(focusedCalc.inputs).map(([field, spec]) => buildRow("inputs", field, spec))
    : [], [focusedCalc, buildRow]);
  const outputRows = useMemo(() => focusedCalc
    ? Object.entries(focusedCalc.outputs).map(([field, spec]) => buildRow("outputs", field, spec))
    : [], [focusedCalc, buildRow]);

  // Filter add-calc library
  const filteredLibrary = useMemo(() => {
    const q = addCalcSearch.toLowerCase();
    return !q ? LIBRARY_CALCS : LIBRARY_CALCS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
    );
  }, [addCalcSearch]);

  // Auto-sync tree selection → calc list
  const navigateTree = useCallback((dir: "up" | "down" | "left" | "right") => {
    const idx = flatTree.findIndex(f => f.node.id === focusedSectionId);
    if (idx === -1) { if (flatTree[0]) setFocusedSectionId(flatTree[0].node.id); return; }
    if (dir === "down") {
      const next = flatTree[(idx + 1) % flatTree.length]!.node;
      setFocusedSectionId(next.id);
      if (next.calcRef) {
        const ci = calcList.findIndex(c => c.calc_name === next.calcRef);
        if (ci >= 0) setFocusedCalcIdx(ci);
      }
    } else if (dir === "up") {
      const next = flatTree[(idx - 1 + flatTree.length) % flatTree.length]!.node;
      setFocusedSectionId(next.id);
      if (next.calcRef) {
        const ci = calcList.findIndex(c => c.calc_name === next.calcRef);
        if (ci >= 0) setFocusedCalcIdx(ci);
      }
    } else if (dir === "left") {
      if (expandedIds.has(focusedSectionId)) {
        setExpandedIds(s => { const n = new Set(s); n.delete(focusedSectionId); return n; });
      }
    } else {
      const node = flatTree[idx]?.node;
      if (node?.children?.length) setExpandedIds(s => new Set([...s, focusedSectionId]));
    }
  }, [focusedSectionId, expandedIds, flatTree, calcList]);

  const cyclePane = useCallback(() => {
    setActivePane(p => PANE_CYCLE[(PANE_CYCLE.indexOf(p) + 1) % PANE_CYCLE.length]!);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingCellKey) {
      setEditedCells(v => ({ ...v, [editingCellKey]: editValue }));
    }
    setEditingCellKey(null);
    setEditValue("");
    setCursorIdx(0);
  }, [editingCellKey, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingCellKey(null); setEditValue(""); setCursorIdx(0);
  }, []);

  const mockRun = useCallback(() => {
    setRunState("running");
    setTimeout(() => {
      setRunState("done");
      setEditedCells({});
      setTimeout(() => setRunState("idle"), 1400);
    }, 400);
  }, []);

  const setResizeMode = useCallback((next: boolean) => {
    resizingRef.current = next;
    setResizing(next);
  }, []);

  const closeAddCalcModal = useCallback(() => {
    setModalMode("none");
    setAddCalcSearch("");
    setModalFocusIdx(0);
  }, []);

  const closeNameCalcModal = useCallback(() => {
    setModalMode("none");
    setPendingCalcId(null);
    setModalInput("");
    setModalCursor(0);
  }, []);

  // Step 1: user picked a calc from the library list. Stash the id and
  // transition to the naming modal. Default the input to the library label
  // so a single Enter keeps the suggested name.
  const startNamingCalc = useCallback((calcId: string) => {
    if (!CALCS.find(c => c.calc_name === calcId)) return;
    const lib = LIBRARY_CALCS.find(c => c.id === calcId);
    const defaultName = lib?.name ?? calcId;
    setPendingCalcId(calcId);
    setModalInput(defaultName);
    setModalCursor(defaultName.length);
    setModalMode("name-calc");
    setAddCalcSearch("");
  }, []);

  // Step 2: user typed a section label and hit Enter. Append the calc to
  // the active project's calc list (if not already there) and create a new
  // section under an auto-managed "Custom" root folder so the typed name
  // shows up in the SECTIONS tree.
  const commitNamedCalc = useCallback(() => {
    const calcId = pendingCalcId;
    const label = modalInput.trim();
    if (!calcId || !label) return;
    if (!activeProjectCalcs.includes(calcId)) {
      setActiveProjectCalcs(list => [...list, calcId]);
    }
    const newSectionId = `custom-${calcId}-${Date.now().toString(36)}`;
    setSections(prev => {
      const customIdx = prev.findIndex(s => s.id === CUSTOM_FOLDER_ID);
      const newNode: Section = { id: newSectionId, label, kind: "file", calcRef: calcId };
      if (customIdx === -1) {
        return [
          ...prev,
          { id: CUSTOM_FOLDER_ID, label: "Custom", kind: "folder", children: [newNode] },
        ];
      }
      const next = prev.slice();
      const folder = next[customIdx]!;
      next[customIdx] = { ...folder, children: [...(folder.children ?? []), newNode] };
      return next;
    });
    setExpandedIds(prev => new Set([...prev, CUSTOM_FOLDER_ID]));
    setFocusedSectionId(newSectionId);
    const ci = CALCS.findIndex(c => c.calc_name === calcId);
    if (ci >= 0) {
      // Re-derive index against the post-add list (calc may not have been
      // there before this call). Use length-based approximation: if we just
      // appended, focus the last entry.
      setFocusedCalcIdx(activeProjectCalcs.includes(calcId)
        ? Math.max(0, activeProjectCalcs.indexOf(calcId))
        : activeProjectCalcs.length);
    }
    closeNameCalcModal();
  }, [pendingCalcId, modalInput, activeProjectCalcs, closeNameCalcModal]);

  // --------------------------- Input ---------------------------
  useInput((e) => {
    // 1. Edit mode intercepts everything
    if (editingCellKey) {
      if (e.key === "escape") { cancelEdit(); return; }
      if (e.key === "return") { saveEdit(); return; }
      if (e.key === "backspace") {
        if (cursorIdx > 0) {
          setEditValue(v => v.slice(0, cursorIdx - 1) + v.slice(cursorIdx));
          setCursorIdx(i => i - 1);
        }
        return;
      }
      if (e.key === "left") { setCursorIdx(i => Math.max(0, i - 1)); return; }
      if (e.key === "right") { setCursorIdx(i => Math.min(editValue.length, i + 1)); return; }
      if (e.key === "home") { setCursorIdx(0); return; }
      if (e.key === "end") { setCursorIdx(editValue.length); return; }
      if (e.char && e.char.length === 1 && !e.ctrl && !e.meta) {
        setEditValue(v => v.slice(0, cursorIdx) + e.char + v.slice(cursorIdx));
        setCursorIdx(i => i + 1);
        return;
      }
      return;
    }

    // 2. Modal intercepts everything
    if (modalMode !== "none") {
      if (modalMode === "new-project") {
        if (e.key === "escape") { setModalMode("none"); setModalInput(""); setModalCursor(0); return; }
        if (e.key === "return") {
          if (modalInput.trim()) {
            setProjectName(modalInput.trim());
            setActiveProjectCalcs([]);
            setModalMode("none"); setModalInput(""); setModalCursor(0);
          }
          return;
        }
        if (e.key === "backspace") {
          if (modalCursor > 0) {
            setModalInput(v => v.slice(0, modalCursor - 1) + v.slice(modalCursor));
            setModalCursor(i => i - 1);
          }
          return;
        }
        if (e.key === "left") { setModalCursor(i => Math.max(0, i - 1)); return; }
        if (e.key === "right") { setModalCursor(i => Math.min(modalInput.length, i + 1)); return; }
        if (e.char && e.char.length === 1 && !e.ctrl && !e.meta) {
          setModalInput(v => v.slice(0, modalCursor) + e.char + v.slice(modalCursor));
          setModalCursor(i => i + 1);
        }
        return;
      }
      if (modalMode === "open-project") {
        if (e.key === "escape") { setModalMode("none"); return; }
        if (e.key === "j" || e.key === "down") { setModalFocusIdx(i => Math.min(RECENT_PROJECTS.length - 1, i + 1)); return; }
        if (e.key === "k" || e.key === "up") { setModalFocusIdx(i => Math.max(0, i - 1)); return; }
        if (e.key === "return") {
          const p = RECENT_PROJECTS[modalFocusIdx];
          if (p) { setProjectName(p.name); setActiveProjectCalcs(CALCS.map(c => c.calc_name)); }
          setModalMode("none");
          return;
        }
        return;
      }
      if (modalMode === "add-calc") {
        return;
      }
      if (modalMode === "name-calc") {
        if (e.key === "escape") { closeNameCalcModal(); return; }
        if (e.key === "return") { commitNamedCalc(); return; }
        if (e.key === "backspace") {
          if (modalCursor > 0) {
            setModalInput(v => v.slice(0, modalCursor - 1) + v.slice(modalCursor));
            setModalCursor(i => i - 1);
          }
          return;
        }
        if (e.key === "left") { setModalCursor(i => Math.max(0, i - 1)); return; }
        if (e.key === "right") { setModalCursor(i => Math.min(modalInput.length, i + 1)); return; }
        if (e.key === "home") { setModalCursor(0); return; }
        if (e.key === "end") { setModalCursor(modalInput.length); return; }
        if (e.char && e.char.length === 1 && !e.ctrl && !e.meta) {
          setModalInput(v => v.slice(0, modalCursor) + e.char + v.slice(modalCursor));
          setModalCursor(i => i + 1);
        }
        return;
      }
    }

    if (showHelp) {
      if (e.key === "escape" || e.key === "?" || e.key === "q") { setShowHelp(false); return; }
      return;
    }

    // 3. Resize mode
    if (resizingRef.current) {
      if (e.key === "escape" || e.char === "r") { setResizeMode(false); return; }
      const MIN_WIDTH = 18;
      const MAX_WIDTH = 80;
      const MIN_SPLIT = 1;
      const MAX_SPLIT = maxTreeSplit;
      if (e.key === "left" || e.key === "h") { setTreeWidth(w => Math.max(MIN_WIDTH, w - 2)); return; }
      if (e.key === "right" || e.key === "l") { setTreeWidth(w => Math.min(MAX_WIDTH, w + 2)); return; }
      if (e.key === "up" || e.key === "k") { setTreeSplit(v => Math.max(MIN_SPLIT, v - 1)); return; }
      if (e.key === "down" || e.key === "j") { setTreeSplit(v => Math.min(MAX_SPLIT, v + 1)); return; }
      return;
    }

    // 4. Global
    if (e.ctrl && e.key === "c") { exit(); return; }
    if (e.key === "q" || e.key === "b") { chosenCode = 99; exit(); return; }
    if (e.key === "escape") { chosenCode = 99; exit(); return; }
    if (e.key === "?") { setShowHelp(true); return; }

    // 4. Project-management shortcuts (no pane restriction, any context)
    if (e.char === "n" && !e.ctrl) {
      setModalMode("new-project"); setModalInput(""); setModalCursor(0); return;
    }
    if (e.char === "o" && !e.ctrl) {
      setModalMode("open-project"); setModalFocusIdx(0); return;
    }
    if (e.char === "a" && !e.ctrl && activePane === "calcs") {
      setModalMode("add-calc"); setAddCalcSearch(""); setModalFocusIdx(0); return;
    }

    // 5. Resize toggle (left column — tree or calcs pane)
    if (e.char === "r" && !e.ctrl && activePane !== "detail") {
      setResizeMode(true); return;
    }

    // 6. Tab cycles panes — strict, always advances
    if (e.key === "tab") { cyclePane(); return; }

    // 6. Pane-specific
    if (activePane === "tree") {
      // Reorder controller keys — must fire before default tree nav.
      const ctrl = treeCtrl.current;
      if (ctrl) {
        if (reorderPhase === "grabbed") {
          if (e.key === "return") { ctrl.commit(); return; }
          if (e.key === "escape") { ctrl.cancel(); return; }
          if (e.char === "J") { ctrl.moveDown(); return; }
          if (e.char === "K") { ctrl.moveUp(); return; }
          if (e.char === ">") { ctrl.indent(); return; }
          if (e.char === "<") { ctrl.outdent(); return; }
          // While grabbed, swallow other keys so they don't navigate the tree.
          return;
        }
        if (e.char === "m" && !e.ctrl && !e.meta) { ctrl.toggleMark(focusedSectionId); return; }
        if (e.char === "g" && !e.ctrl && !e.meta) { ctrl.grabLive(); return; }
        if (e.char === "G" && !e.ctrl && !e.meta) { ctrl.grabStash(); return; }
      }
      if (e.key === "j" || e.key === "down")  navigateTree("down");
      else if (e.key === "k" || e.key === "up") navigateTree("up");
      else if (e.key === "h" || e.key === "left") navigateTree("left");
      else if (e.key === "l" || e.key === "right") navigateTree("right");
    } else if (activePane === "calcs") {
      if (mainTab === "calculation") {
        if (e.key === "j" || e.key === "down") setFocusedCalcIdx(i => Math.min(calcList.length - 1, i + 1));
        else if (e.key === "k" || e.key === "up") setFocusedCalcIdx(i => Math.max(0, i - 1));
      }
    } else if (activePane === "detail") {
      if (subTab === "io") {
        const COLS = ["field", "value", "unit", "format"] as const;
        if (e.key === "tab" && e.shift) {
          setFocusedIOSide(s => s === "inputs" ? "outputs" : "inputs"); return;
        }
        if (e.key === "j" || e.key === "down") {
          if (focusedIOSide === "inputs") setFocusedInputIdx(i => Math.min(inputRows.length - 1, i + 1));
          else setFocusedOutputIdx(i => Math.min(outputRows.length - 1, i + 1));
        } else if (e.key === "k" || e.key === "up") {
          if (focusedIOSide === "inputs") setFocusedInputIdx(i => Math.max(0, i - 1));
          else setFocusedOutputIdx(i => Math.max(0, i - 1));
        } else if (e.key === "h" || e.key === "left") {
          // At leftmost column on outputs → jump back to inputs rightmost
          if (focusedIOSide === "outputs" && focusedCol === "field") {
            setFocusedIOSide("inputs"); setFocusedCol("format");
          } else {
            setFocusedCol(c => COLS[Math.max(0, COLS.indexOf(c) - 1)]!);
          }
        } else if (e.key === "l" || e.key === "right") {
          // At rightmost column on inputs → jump to outputs leftmost
          if (focusedIOSide === "inputs" && focusedCol === "format") {
            setFocusedIOSide("outputs"); setFocusedCol("field");
          } else {
            setFocusedCol(c => COLS[Math.min(COLS.length - 1, COLS.indexOf(c) + 1)]!);
          }
        } else if (e.key === "return" && focusedCol !== "field") {
          const row = focusedIOSide === "inputs" ? inputRows[focusedInputIdx] : outputRows[focusedOutputIdx];
          if (row) {
            const current = focusedCol === "value" ? row.value :
                            focusedCol === "unit"  ? row.units :
                            row.format;
            setEditingCellKey(cellKey(focusedIOSide, row.field, focusedCol));
            setEditValue(current);
            setCursorIdx(current.length);
          }
        } else if (e.char === "s" && !e.ctrl) {
          if (Object.keys(editedCells).length > 0) mockRun();
        }
      } else {
        // non-IO sub-tabs: keep h/l for Dock vibe while Tabs handles arrows
        if (e.key === "h") {
          const tabs: SubTab[] = ["io", "json", "guide", "script"];
          setSubTab(t => tabs[(tabs.indexOf(t) - 1 + tabs.length) % tabs.length]!);
          return;
        }
        if (e.key === "l") {
          const tabs: SubTab[] = ["io", "json", "guide", "script"];
          setSubTab(t => tabs[(tabs.indexOf(t) + 1) % tabs.length]!);
          return;
        }
      }
    }
  });

  // --------------------------- Render ---------------------------

  return (
    <Box flexDirection="column" width={width} height={height} backgroundColor={C.bg}>
      {/* Header */}
      <Box paddingX={1} flexDirection="row" alignItems="center">
        <Text bold color={C.fg}>{projectName}</Text>
        <Text dim color={C.dim}>  ·  </Text>
        <Text dim color={C.dim}>Dock TUI showcase</Text>
        <Box flex={1} />
        <Text dim color={C.dim}>{calcList.length} calcs</Text>
      </Box>
      <Divider color={C.border} width={width} />

      {/* Body — sections over library, detail on the right */}
      <Panes direction="row" flex={1} borderStyle="single" borderColor={C.border}>
        <Panes direction="column" flexGrow={0} flexShrink={0} flexBasis={treeWidth}>
          {/* Sections pane */}
          <Pane height={treeSplit} flexGrow={0} flexShrink={0} flexDirection="column" paddingX={1}>
            <Text bold color={activePane === "tree" ? C.borderFocused : C.dim}>
              SECTIONS  <Text dim color={C.dim}>{flatTree.length}</Text>
            </Text>
            <Box height={1} />
            <Box flex={1}>
              <Tree
                nodes={treeNodes}
                selectedKey={focusedSectionId}
                isFocused={activePane === "tree"}
                maxVisible={Math.max(1, treeSplit - 2)}
                controller={treeCtrl}
                reorderable
                onReorder={(change) => {
                  setSections(change.nextNodes as Section[]);
                  if (change.expandedKeys.length > 0) {
                    setExpandedIds((prev) => new Set([...prev, ...change.expandedKeys]));
                  }
                }}
                onStateChange={(s) => setReorderPhase(s.phase)}
                onToggle={(key) => {
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
                onHighlightChange={(key) => {
                  setFocusedSectionId(key);
                  const node = sectionById.get(key);
                  if (node?.calcRef) {
                    const ci = calcList.findIndex((c) => c.calc_name === node.calcRef);
                    if (ci >= 0) setFocusedCalcIdx(ci);
                  }
                }}
                onSelect={(key) => {
                  setActivePane("tree");
                  setFocusedSectionId(key);
                  const node = sectionById.get(key);
                  if (!node) return;
                  if (node.children?.length) {
                    setExpandedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                    return;
                  }
                  if (node.calcRef) {
                    const ci = calcList.findIndex((c) => c.calc_name === node.calcRef);
                    if (ci >= 0) setFocusedCalcIdx(ci);
                  }
                }}
                renderNode={(node, state) => {
                  const section = sectionById.get(node.key);
                  const hasChildren = !!section?.children?.length;
                  const toggle = hasChildren ? (state.isExpanded ? "▼" : "▶") : " ";
                  const icon = section?.kind === "folder" ? "▤" : "▢";
                  return (
                    <Text
                      color={C.fg}
                      backgroundColor={state.isSelected ? C.selectedBg : undefined}
                      bold={state.isHighlighted}
                    >
                      {"  ".repeat(state.depth)}{toggle} {icon} {node.label}
                    </Text>
                  );
                }}
              />
            </Box>
          </Pane>

          {/* Calcs/files/images pane */}
          <Pane height={calcPaneHeight} flexGrow={0} flexShrink={0} flexDirection="column" paddingX={1}>
            <Tabs
              tabs={[
                { key: "calculation", label: "1 Calcs" },
                { key: "files", label: "2 Files" },
                { key: "images", label: "3 Images" },
              ]}
              activeKey={mainTab}
              onChange={(key) => {
                setMainTab(key as MainTab);
                setActivePane("calcs");
              }}
              isFocused={modalMode === "none" && !editingCellKey && !resizing && activePane === "calcs"}
              variant="pill"
              color={C.tabActive}
              inactiveColor={C.dim}
              activeBackgroundColor={C.headerBg}
              gap={1}
            />
            <Box height={1} />
            {mainTab === "calculation" ? (
              calcList.length === 0 ? (
                <Text dim color={C.dim}>no calcs · <Text color={C.fg}>a</Text> add</Text>
              ) : (
                <Table
                  flex={1}
                  columns={[{ key: "name", header: "Calculation" }]}
                  data={calcList.map(calc => ({ name: calc.display_name }))}
                  isFocused={activePane === "calcs"}
                  rowHighlight
                  focusMode="row"
                  focusedRow={focusedCalcIdx}
                  onRowPress={(rowIndex) => {
                    setActivePane("calcs");
                    setFocusedCalcIdx(rowIndex);
                  }}
                  onCellPress={(rowIndex) => {
                    setActivePane("calcs");
                    setFocusedCalcIdx(rowIndex);
                  }}
                  stateStyles={{
                    header: { color: C.dim, bold: true },
                    focusedRow: { backgroundColor: C.selectedBg, color: C.fg, bold: true },
                  }}
                  borderStyle="none"
                />
              )
            ) : mainTab === "files" ? (
              <Table
                flex={1}
                columns={[
                  { key: "file", header: "File" },
                  { key: "size", header: "KB", align: "right" },
                ]}
                data={MOCK_FILES.map(f => ({ file: f.filename, size: f.size_kb.toFixed(1) }))}
                isFocused={activePane === "calcs"}
                rowHighlight
                focusMode="row"
                focusedRow={focusedCalcIdx}
                stateStyles={{
                  header: { color: C.dim, bold: true },
                  focusedRow: { backgroundColor: C.selectedBg, color: C.fg, bold: true },
                }}
                borderStyle="none"
              />
            ) : (
              <Table
                flex={1}
                columns={[
                  { key: "image", header: "Image" },
                  { key: "size", header: "KB", align: "right" },
                ]}
                data={MOCK_IMAGES.map(img => ({ image: img.filename, size: img.size_kb.toFixed(1) }))}
                isFocused={activePane === "calcs"}
                rowHighlight
                focusMode="row"
                focusedRow={focusedCalcIdx}
                stateStyles={{
                  header: { color: C.dim, bold: true },
                  focusedRow: { backgroundColor: C.selectedBg, color: C.fg, bold: true },
                }}
                borderStyle="none"
              />
            )}
          </Pane>
        </Panes>

        {/* Detail pane */}
        <Pane
          flex={1}
          flexDirection="column"
          paddingX={1}
        >
            <Box flexDirection="row" alignItems="center">
              <Tabs
                tabs={[
                  { key: "io", label: "1 I/O" },
                  { key: "json", label: "2 JSON" },
                  { key: "guide", label: "3 Guide" },
                  { key: "script", label: "4 Script" },
                ]}
                activeKey={subTab}
                onChange={(key) => {
                  setSubTab(key as SubTab);
                  setActivePane("detail");
                }}
                isFocused={modalMode === "none" && !editingCellKey && !resizing && activePane === "detail"}
                enableArrows={subTab !== "io"}
                variant="pill"
                color={C.tabActive}
                inactiveColor={C.dim}
                activeBackgroundColor={C.headerBg}
                gap={1}
              />
              <Box flex={1} />
              {runState === "running" ? <Text color={C.warn}>⟳ running…</Text> :
               runState === "done" ? <Text color={C.accent}>✓ saved + run</Text> :
               Object.keys(editedCells).length > 0 ? <Text dim color={C.dim}>unsaved · <Text color={C.fg}>s</Text> save+run</Text> :
               <Text dim color={C.dim}>s save+run</Text>}
            </Box>
            <Box height={1} />

            {!focusedCalc ? (
              <Text dim color={C.dim}>no calculation selected</Text>
            ) : subTab === "io" ? (
              <IOView
                inputRows={inputRows}
                outputRows={outputRows}
                focusedSide={focusedIOSide}
                focusedInputIdx={focusedInputIdx}
                focusedOutputIdx={focusedOutputIdx}
                focusedCol={focusedCol}
                editingCellKey={editingCellKey}
                editValue={editValue}
                cursorIdx={cursorIdx}
                isDetailFocused={activePane === "detail"}
                onFocusCell={(side, rowIndex, column) => {
                  setActivePane("detail");
                  setFocusedIOSide(side);
                  if (side === "inputs") setFocusedInputIdx(rowIndex);
                  else setFocusedOutputIdx(rowIndex);
                  setFocusedCol(column);
                }}
              />
            ) : subTab === "json" ? (
              <ScrollView flex={1}>
                <Text color={C.fg}>{JSON.stringify({
                  inputs: focusedCalc.inputs,
                  outputs: focusedCalc.outputs,
                }, null, 2)}</Text>
              </ScrollView>
            ) : subTab === "guide" ? (
              <ScrollView flex={1}>
                <Text bold color={C.fg}>{focusedCalc.display_name}</Text>
                <Box height={1} />
                <Text dim color={C.dim}>{focusedCalc.category}</Text>
                <Box height={1} />
                <Text color={C.fg}>{focusedCalc.description}</Text>
                <Box height={1} />
                {focusedCalc.guide.split("\n").map((line, i) => (
                  <Text key={i} color={C.fg}>{line}</Text>
                ))}
              </ScrollView>
            ) : (
              <Editor
                value={focusedCalc.script}
                onChange={() => {}}
                title={focusedCalc.display_name}
                rows={Math.max(8, height - 18)}
                readOnly
                lineNumbers
                showHeader={false}
                showFooter
                footer={`${focusedCalc.script.split("\n").length} lines • read only`}
                borderColor={C.border}
                backgroundColor={C.headerBg}
                color={C.fg}
                lineNumberColor={C.dim}
              />
            )}
        </Pane>
      </Panes>

      <Divider color={C.border} width={width} />

      {/* Status bar */}
      <Box paddingX={1} flexDirection="row">
        <Text color={C.accent}>● mock data</Text>
        <Text dim color={C.dim}>  ·  </Text>
        <Text dim color={C.dim}>pane: </Text>
        <Text color={C.fg}>{activePane}</Text>
        <Text dim color={C.dim}>  ·  </Text>
        <Text dim color={C.dim}>section: </Text>
        <Text color={C.fg}>{focusedSectionId}</Text>
        <Text dim color={C.dim}>  ·  </Text>
        <Text dim color={C.dim}>calc: </Text>
        <Text color={C.fg}>{focusedCalc?.display_name ?? "—"}</Text>
        <Box flex={1} />
        {editingCellKey && <Text color={C.warn} bold>EDITING</Text>}
        {resizing && <Text color={C.accent} bold>RESIZING</Text>}
        {modalMode !== "none" && <Text color={C.warn} bold>{modalMode.toUpperCase()}</Text>}
      </Box>

      <Footer
        bindings={
            resizing
              ? [
                { key: "←/→/h/l", label: "resize width" },
                { key: "↑/↓/j/k", label: "resize split" },
                { key: "r/Esc", label: "done" },
              ]
            : editingCellKey
            ? [
                { key: "←/→", label: "cursor" },
                { key: "Home/End", label: "line" },
                { key: "Enter", label: "save" },
                { key: "Esc", label: "cancel" },
              ]
            : modalMode === "name-calc" || modalMode === "new-project"
            ? [
                { key: "←/→", label: "cursor" },
                { key: "Enter", label: "confirm" },
                { key: "Esc", label: "cancel" },
              ]
            : modalMode !== "none"
            ? [
                { key: modalMode === "add-calc" ? "↑/↓" : "j/k", label: "navigate" },
                { key: "Enter", label: "confirm" },
                { key: "Esc", label: "cancel" },
              ]
            : activePane === "tree" && reorderPhase === "grabbed"
            ? [
                { key: "J/K", label: "move" },
                { key: "</>", label: "outdent/indent" },
                { key: "Enter", label: "commit" },
                { key: "Esc", label: "cancel" },
              ]
            : activePane === "tree" && reorderPhase === "marking"
            ? [
                { key: "m", label: "toggle mark" },
                { key: "g/G", label: "grab live/stash" },
                { key: "Tab", label: `pane (${activePane})` },
                { key: "?", label: "help" },
              ]
            : [
                { key: "Tab", label: `pane (${activePane})` },
                { key: "j/k", label: "nav" },
                { key: "r", label: "resize" },
                { key: "↑/↓", label: "tree split" },
                { key: "Enter", label: activePane === "detail" && subTab === "io" ? "edit" : "—" },
                ...(activePane === "tree" ? [{ key: "m/g", label: "mark/grab" }] : []),
                { key: "n/o", label: "new/open" },
                { key: "a", label: "add calc" },
                { key: "?", label: "help" },
                { key: "q/Esc", label: "back" },
              ]
        }
      />

      {/* Modal overlays */}
      {modalMode === "new-project" && (
        <ModalBox width={56} top={Math.max(2, Math.floor(height / 2) - 6)} left={Math.max(2, Math.floor(width / 2) - 28)}>
          <Text bold color={C.borderFocused}>New Project</Text>
          <Box height={1} />
          <Text dim color={C.dim}>Project name:</Text>
          <Box flexDirection="row" borderStyle="single" borderColor={C.borderFocused} paddingX={1} marginTop={1}>
            <EditableText value={modalInput} cursorIdx={modalCursor} focused />
          </Box>
          <Box height={1} />
          <Text dim color={C.dim}>Enter confirm · Esc cancel</Text>
        </ModalBox>
      )}

      {modalMode === "open-project" && (
        <ModalBox width={60} top={Math.max(2, Math.floor(height / 2) - 10)} left={Math.max(2, Math.floor(width / 2) - 30)}>
          <Text bold color={C.borderFocused}>Open Project</Text>
          <Box height={1} />
          <ScrollView height={8}>
            {RECENT_PROJECTS.map((p, i) => {
              const cursor = i === modalFocusIdx;
              return (
                <Box key={p.path} flexDirection="row" gap={1}>
                  <Text color={cursor ? C.borderFocused : C.bg}>{cursor ? "❯" : " "}</Text>
                  <Text color={C.fg}
                    backgroundColor={cursor ? C.selectedBg : undefined}
                    bold={cursor}>
                    {` ${p.name.padEnd(26)} `}
                  </Text>
                  <Text dim color={C.dim}>{p.last}</Text>
                </Box>
              );
            })}
          </ScrollView>
          <Box height={1} />
          {RECENT_PROJECTS[modalFocusIdx] && (
            <Text dim color={C.dim}>{RECENT_PROJECTS[modalFocusIdx]!.path}</Text>
          )}
          <Box height={1} />
          <Text dim color={C.dim}>j/k navigate · Enter open · Esc cancel</Text>
        </ModalBox>
      )}

      {modalMode === "add-calc" && (
        <Modal
          visible
          title="Add Calculation"
          width={64}
          onClose={closeAddCalcModal}
          borderStyle="double"
          borderColor={C.borderFocused}
          backgroundColor={C.bg}
          opaque
          paddingX={2}
          paddingY={1}
        >
          <SearchInput
            value={addCalcSearch}
            onChange={(value) => {
              setAddCalcSearch(value);
              setModalFocusIdx(0);
            }}
            placeholder="Filter calculations..."
            resultCount={`${filteredLibrary.length} of ${LIBRARY_CALCS.length}`}
            isFocused
          />
          <Box height={1} />
          {filteredLibrary.length === 0 ? (
            <Text dim color={C.dim}>no matches</Text>
          ) : (
            <OptionList
              items={filteredLibrary.map((item) => ({ label: item.name, value: item.id }))}
              onSelect={startNamingCalc}
              isFocused
              maxVisible={10}
              renderItem={(item, state) => {
                const match = filteredLibrary.find((entry) => entry.id === item.value);
                if (!match) return null;
                const alreadyAdded = activeProjectCalcs.includes(match.id);
                return (
                  <Box flexDirection="row" gap={1} backgroundColor={state.isActive ? C.selectedBg : undefined}>
                    <Text color={state.isActive ? C.borderFocused : C.bg}>{state.isActive ? "❯" : " "}</Text>
                    <Text color={state.isActive ? C.tabActive : C.fg} bold={state.isActive}>
                      {` ${match.name.padEnd(22)} `}
                    </Text>
                    <Text dim color={C.dim}>{match.category.padEnd(14)}</Text>
                    {alreadyAdded ? <Text color={C.accent}>✓</Text> : null}
                  </Box>
                );
              }}
            />
          )}
          <Box height={1} />
          <Text dim color={C.dim}>type to filter · ↑/↓ navigate · Enter add · Esc cancel</Text>
        </Modal>
      )}

      {modalMode === "name-calc" && (
        <ModalBox width={56} top={Math.max(2, Math.floor(height / 2) - 6)} left={Math.max(2, Math.floor(width / 2) - 28)}>
          <Text bold color={C.borderFocused}>Name Calculation</Text>
          <Box height={1} />
          <Text dim color={C.dim}>Section name:</Text>
          <Box flexDirection="row" borderStyle="single" borderColor={C.borderFocused} paddingX={1} marginTop={1}>
            <EditableText value={modalInput} cursorIdx={modalCursor} focused />
          </Box>
          <Box height={1} />
          <Text dim color={C.dim}>Enter add · Esc cancel</Text>
        </ModalBox>
      )}

      {showHelp && (
        <ModalBox width={60} top={2} left={Math.max(2, Math.floor(width / 2) - 30)}>
          <Text bold color={C.borderFocused}>Help — Dock TUI</Text>
          <Box height={1} />
          <Text bold color={C.fg}>Panes</Text>
          <Text><Kbd>Tab</Kbd> cycle: tree → calcs → detail</Text>
          <Text><Kbd>j</Kbd>/<Kbd>k</Kbd> nav  <Kbd>h</Kbd>/<Kbd>l</Kbd> fold/tabs</Text>
          <Box height={1} />
          <Text bold color={C.fg}>I/O editing (detail focused)</Text>
          <Text><Kbd>Enter</Kbd> edit input value  <Kbd>←</Kbd>/<Kbd>→</Kbd> cursor</Text>
          <Text><Kbd>Home</Kbd>/<Kbd>End</Kbd> line ends  <Kbd>s</Kbd> save+run</Text>
          <Box height={1} />
          <Text bold color={C.fg}>Project</Text>
          <Text><Kbd>n</Kbd> new  <Kbd>o</Kbd> open  <Kbd>a</Kbd> add calc (calcs pane)</Text>
          <Box height={1} />
          <Text bold color={C.fg}>Other</Text>
          <Text><Kbd>?</Kbd> help  <Kbd>q</Kbd>/<Kbd>Esc</Kbd> back</Text>
        </ModalBox>
      )}
    </Box>
  );
}

// --------------------------- I/O view ---------------------------
type IORow = { field: string; label: string; value: string; units: string; format: string; isEdited?: boolean };
type IOCol = "field" | "value" | "unit" | "format";

function IOView({
  inputRows, outputRows, focusedSide, focusedInputIdx, focusedOutputIdx, focusedCol,
  editingCellKey, editValue, cursorIdx, isDetailFocused, onFocusCell,
}: {
  inputRows: IORow[];
  outputRows: IORow[];
  focusedSide: "inputs" | "outputs";
  focusedInputIdx: number;
  focusedOutputIdx: number;
  focusedCol: IOCol;
  editingCellKey: string | null;
  editValue: string;
  cursorIdx: number;
  isDetailFocused: boolean;
  onFocusCell: (side: "inputs" | "outputs", rowIndex: number, column: IOCol) => void;
}) {
  const renderCellText = (side: "inputs" | "outputs", field: string, col: "value" | "unit" | "format", text: string) => {
    const key = `${side}:${field}:${col}`;
    if (editingCellKey === key) {
      return <EditableText value={editValue} cursorIdx={cursorIdx} focused />;
    }
    return text;
  };
  const renderSide = (
    rows: IORow[],
    side: "inputs" | "outputs",
    focusedIdx: number,
    title: string,
  ) => {
    const isSideFocused = isDetailFocused && focusedSide === side;
    return (
      <Box flexDirection="column" flex={1}>
        <Text bold color={isSideFocused ? C.tabActive : C.dim}>{title}</Text>
        <Box height={1} />
        {rows.length === 0 ? (
          <Text dim color={C.dim}>no {side}</Text>
        ) : (
          <Table
            flex={1}
            columns={[
              { key: "field", header: "Field", focusable: true, locked: true },
              { key: "value", header: "Value", editable: true, align: "right" },
              { key: "unit", header: "Unit", editable: true },
              { key: "format", header: "Format", editable: true },
            ]}
            data={rows.map(row => ({
              field: row.label,
              value: row.value,
              unit: row.units,
              format: row.format,
              _fieldKey: row.field,
              _edited: row.isEdited ? "1" : "",
            }))}
            isFocused={isSideFocused}
            rowHighlight
            focusMode="cell"
            focusedCell={{ row: focusedIdx, column: focusedCol }}
            editedCells={rows.flatMap((row, rowIndex) => row.isEdited ? [
              { row: rowIndex, column: "field" },
              { row: rowIndex, column: "value" },
              { row: rowIndex, column: "unit" },
              { row: rowIndex, column: "format" },
            ] : [])}
            lockedCells={rows.map((_, rowIndex) => ({ row: rowIndex, column: "field" }))}
            onCellPress={(rowIndex, columnKey) => {
              const cols: IOCol[] = ["field", "value", "unit", "format"];
              if (!cols.includes(columnKey as IOCol)) return;
              onFocusCell(side, rowIndex, columnKey as IOCol);
            }}
            renderCell={(value, column, rowIndex) => {
              const row = rows[rowIndex]!;
              if (column.key === "field") {
                return <Text color={row.isEdited ? C.accent : C.fg}>{String(value)}</Text>;
              }
              if (column.key === "value") {
                return renderCellText(side, row.field, "value", String(value));
              }
              if (column.key === "unit") {
                return <Text color={C.dim}>{renderCellText(side, row.field, "unit", String(value))}</Text>;
              }
              return <Text color={C.dim}>{renderCellText(side, row.field, "format", String(value))}</Text>;
            }}
            stateStyles={{
              header: { color: C.dim, bold: true },
              focusedRow: { backgroundColor: C.headerBg },
              focusedCell: { backgroundColor: C.selectedBg, color: C.fg, bold: true },
              lockedCell: { color: C.dim, dim: true },
              editedCell: { color: C.accent },
            }}
            borderStyle="none"
          />
        )}
      </Box>
    );
  };
  return (
    <Box flexDirection="row" gap={3} flex={1}>
      {renderSide(inputRows, "inputs", focusedInputIdx, "Inputs")}
      {renderSide(outputRows, "outputs", focusedOutputIdx, "Outputs")}
    </Box>
  );
}

// --------------------------- Modal overlay box ---------------------------
function ModalBox({
  children, width, top, left,
}: {
  children: React.ReactNode;
  width: number;
  top: number;
  left: number;
}) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      width={width}
      flexDirection="column"
      borderStyle="double"
      borderColor={C.borderFocused}
      backgroundColor={C.bg}
      opaque
      paddingX={2}
      paddingY={1}
    >
      {children}
    </Box>
  );
}

render(<App />).waitUntilExit().then(() => process.exit(chosenCode));
