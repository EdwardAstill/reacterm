/**
 * Vim Mode Plugin — adds vim-style key bindings to navigation components.
 *
 * Registers j/k as next/prev key bindings for Select, Menu, and ListView.
 */

import type { ReactermPlugin } from "../core/plugin.js";

export const vimModePlugin: ReactermPlugin = {
  name: "vim-mode",
  componentDefaults: {
    Select: { keyBindings: { next: "j", prev: "k" } },
    Menu: { keyBindings: { next: "j", prev: "k" } },
    ListView: { keyBindings: { next: "j", prev: "k" } },
  },
};
