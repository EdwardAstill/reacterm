import React from "react";
import { render, Box, Text, Spinner, useInput, useTui } from "../src/index.js";

function App() {
  const { exit } = useTui();
  useInput((e) => { if (e.key === "c" && e.ctrl) exit(); });

  return (
    <Box padding={1}>
      <Spinner type="diamond" color="#82AAFF" />
      <Text bold color="#82AAFF"> storm is alive</Text>
    </Box>
  );
}

render(<App />).waitUntilExit();
