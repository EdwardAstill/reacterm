/**
 * SSH Demo — serve a Storm TUI app over SSH.
 *
 * Generate a host key:   ssh-keygen -t ed25519 -f host_key -N ""
 * Run:                    npx tsx examples/ssh-demo.tsx
 * Connect:                ssh localhost -p 2222
 */

import React from "react";
import { readFileSync } from "node:fs";
import { Box, Text, Spinner } from "../src/index.js";
import { StormSSHServer, type SSHSession } from "../src/ssh/index.js";

function App({ session }: { session: SSHSession }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="#82AAFF">
        Welcome to Storm over SSH!
      </Text>
      <Text>
        Connected as: {session.username}
      </Text>
      <Text>
        Terminal: {session.width}x{session.height}
      </Text>
      <Text>
        From: {session.remoteAddress}
      </Text>
      <Box marginTop={1}>
        <Spinner type="dots" />
        <Text> Storm is running</Text>
      </Box>
      <Text dim marginTop={1}>
        Press Ctrl+C to disconnect
      </Text>
    </Box>
  );
}

const server = new StormSSHServer({
  port: 2222,
  hostKey: readFileSync("./host_key"),
  // Accept all connections (for demo only — use proper auth in production)
  authenticate: () => true,
  app: (session) => <App session={session} />,
  onEvent: (event) => {
    if (event.type === "session-start") console.log(`  + ${event.username} connected from ${event.remoteAddress}`);
    if (event.type === "session-end") console.log(`  - ${event.username} disconnected`);
  },
});

await server.listen();
console.log("Storm SSH server listening on port 2222");
console.log("Connect: ssh localhost -p 2222");
