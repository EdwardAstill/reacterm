/**
 * Vim Mode Plugin — adds vim-style key bindings to navigation components.
 *
 * Registers j/k as next/prev key bindings for Select, Menu, and ListView.
 */
export const vimModePlugin = {
    name: "vim-mode",
    componentDefaults: {
        Select: { keyBindings: { next: "j", prev: "k" } },
        Menu: { keyBindings: { next: "j", prev: "k" } },
        ListView: { keyBindings: { next: "j", prev: "k" } },
    },
};
//# sourceMappingURL=vim-mode.js.map