import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface HelpBinding {
    /** Key combo label, e.g. "Ctrl+S", "↑↓" */
    keys: string;
    /** Human-readable description of what the binding does */
    description: string;
    /** Category for grouping (e.g. "Navigation", "Editing") */
    category?: string;
}
export interface HelpPanelProps extends StormLayoutStyleProps {
    /** Array of keyboard shortcut bindings to display. */
    bindings: HelpBinding[];
    /** Display mode: "inline" renders in document flow, "modal" renders as an overlay. */
    mode?: "inline" | "modal";
    /** Title displayed at the top of the panel. */
    title?: string;
    /** Description text displayed below the title. */
    description?: string;
    /** Number of columns for the binding list. Defaults to 2. */
    columns?: number;
    /** Whether the panel is currently visible. Managed externally or via triggerKey. */
    visible?: boolean;
    /** Called when the panel requests to close (Escape or triggerKey toggle). */
    onClose?: () => void;
    /** Key that toggles the panel open/closed. Defaults to "?". */
    triggerKey?: string;
    /** When true, the panel listens for the trigger key to toggle visibility. */
    selfManaged?: boolean;
    /** Maximum height before scrolling (number of rows). 0 = no limit. */
    maxHeight?: number;
    /** Custom render for each binding row. */
    renderBinding?: (binding: HelpBinding) => React.ReactNode;
}
export declare const HelpPanel: React.NamedExoticComponent<HelpPanelProps>;
//# sourceMappingURL=HelpPanel.d.ts.map