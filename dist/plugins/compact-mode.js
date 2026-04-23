/**
 * Compact Mode Plugin — reduces padding and sizes for space-constrained UIs.
 *
 * Applies smaller defaults to Modal, Card, and Button components.
 */
export const compactModePlugin = {
    name: "compact-mode",
    componentDefaults: {
        Modal: { size: "sm" },
        Card: { padding: 0 },
        Button: { size: "sm" },
    },
};
//# sourceMappingURL=compact-mode.js.map