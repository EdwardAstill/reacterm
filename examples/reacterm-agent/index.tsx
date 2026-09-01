#!/usr/bin/env npx tsx
/**
 * Reacterm Agent CLI — Entry point.
 *
 * An AI agent chat interface built with Reacterm TUI.
 * Features persistent memory, tool approval, slash commands, and streaming responses.
 *
 * Usage: npx tsx examples/reacterm-agent/index.tsx
 */

import React from "react";
import { render } from "../../src/index.js";
import { App } from "./App.js";

const app = render(<App />);
await app.waitUntilExit();
