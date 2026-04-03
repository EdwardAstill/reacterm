import React from "react";
import { render, Box, MessageBubble, OperationTree, ApprovalPrompt,
         useTerminal, useTui, useInput } from "../src/index.js";

function App() {
  const { width, height } = useTerminal();
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });

  return (
    <Box flexDirection="column" width={width} height={height}>
      <MessageBubble role="assistant">I'll fix the bug in auth.ts.</MessageBubble>

      <OperationTree nodes={[
        { id: "1", label: "Reading auth.ts", status: "completed", durationMs: 120 },
        { id: "2", label: "Editing code", status: "running" },
        { id: "3", label: "Running tests", status: "pending" },
      ]} />

      <ApprovalPrompt tool="writeFile" risk="medium" params={{ path: "auth.ts" }} onSelect={() => {}} />
    </Box>
  );
}

render(<App />).waitUntilExit();
