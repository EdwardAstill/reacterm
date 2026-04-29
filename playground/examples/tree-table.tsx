import React, { useCallback, useState } from "react";
import {
  render,
  Box,
  Text,
  TreeTable,
  type TreeTableRow,
  useInput,
  useTui,
} from "../../src/index.js";

const initial: TreeTableRow[] = [
  {
    key: "alpha",
    values: { name: "Project Alpha", owner: "Edward", priority: "P0", status: "in-progress" },
    icon: "📁",
    expanded: true,
    children: [
      {
        key: "alpha-auth",
        values: { name: "Auth flow", owner: "Edward", priority: "P0", status: "in-progress" },
        expanded: true,
        children: [
          { key: "alpha-auth-jwt", values: { name: "JWT refresh", owner: "Edward", priority: "P0", status: "todo" } },
          { key: "alpha-auth-mfa", values: { name: "MFA prompt", owner: "Sara", priority: "P1", status: "in-progress" } },
        ],
      },
      {
        key: "alpha-dash",
        values: { name: "Dashboard", owner: "Maya", priority: "P1", status: "review" },
        children: [
          { key: "alpha-dash-charts", values: { name: "Live charts", owner: "Maya", priority: "P1", status: "review" } },
        ],
      },
    ],
  },
  {
    key: "beta",
    values: { name: "Project Beta", owner: "Sara", priority: "P2", status: "blocked" },
    icon: "📁",
    children: [
      { key: "beta-spec", values: { name: "Spec writing", owner: "Sara", priority: "P2", status: "blocked" } },
      { key: "beta-arch", values: { name: "Arch review", owner: "Edward", priority: "P2", status: "todo" } },
    ],
  },
  {
    key: "gamma",
    values: { name: "Project Gamma", owner: "Maya", priority: "P3", status: "done" },
    icon: "✅",
  },
];

const columns = [
  { key: "name", header: "Name" },
  { key: "owner", header: "Owner", width: 10 },
  { key: "priority", header: "Pri", width: 5, align: "center" as const },
  { key: "status", header: "Status", width: 14 },
];

function toggleExpanded(rows: TreeTableRow[], key: string): TreeTableRow[] {
  return rows.map((row) => {
    if (row.key === key) return { ...row, expanded: !row.expanded };
    if (row.children) return { ...row, children: toggleExpanded(row.children, key) };
    return row;
  });
}

function App() {
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });
  const [data, setData] = useState(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const onToggle = useCallback((key: string) => {
    setData((prev) => toggleExpanded(prev, key));
  }, []);

  const onRowSelect = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Box paddingBottom={1}>
        <Text bold color="#82AAFF">TreeTable demo — </Text>
        <Text dim>↑/↓ navigate · ←/→ collapse/expand · Enter select · s sort · Ctrl+C exit</Text>
      </Box>
      <TreeTable
        columns={columns}
        data={data}
        isFocused
        rowHighlight
        sortable
        onToggle={onToggle}
        onRowSelect={onRowSelect}
        maxVisibleRows={20}
      />
      <Box paddingTop={1}>
        <Text dim>Selected: </Text>
        <Text>{selectedKey ?? "(none)"}</Text>
      </Box>
    </Box>
  );
}

render(<App />).waitUntilExit();
