/**
 * Compact Mode Plugin — reduces padding and sizes for space-constrained UIs.
 *
 * Applies smaller defaults to Modal, Card, and Button components.
 */

import type { ReactermPlugin } from "../core/plugin.js";

export const compactModePlugin: ReactermPlugin = {
  name: "compact-mode",
  componentDefaults: {
    Modal: { size: "sm" },
    Card: { padding: 0 },
    Button: { size: "sm" },
  },
};
