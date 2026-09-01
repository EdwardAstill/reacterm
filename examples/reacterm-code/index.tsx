#!/usr/bin/env npx tsx
/**
 * Reacterm Code CLI — Entry point.
 *
 * A coding assistant chat interface built with Reacterm TUI.
 * Features tool approval, slash commands, and streaming responses.
 *
 * Usage: npx tsx examples/reacterm-code/index.tsx
 */

import React from "react";
import { render } from "../../src/index.js";
import { App } from "./App.js";

const app = render(<App />);
await app.waitUntilExit();
