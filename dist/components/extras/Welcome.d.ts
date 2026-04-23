import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
/** A selectable action shown in the recent items section. */
export interface WelcomeAction {
    /** Unique key for this action. */
    id: string;
    /** Display label (e.g. "my-project — 2 hours ago"). */
    label: string;
    /** Optional description shown dimmed after the label. */
    description?: string;
    /** Optional icon/symbol prefix (e.g. "📁", "⚡"). */
    icon?: string;
}
/** A keyboard shortcut entry shown in the shortcuts section. */
export interface WelcomeShortcut {
    /** Key combination display string (e.g. "Ctrl+N"). */
    key: string;
    /** Human-readable label (e.g. "New project"). */
    label: string;
}
export interface WelcomeProps extends StormLayoutStyleProps {
    /** App title displayed prominently at center. */
    title: string;
    /** Optional app version string (e.g. "v1.2.3"). */
    version?: string;
    /** Optional app description / tagline. */
    description?: string;
    /** Optional ASCII art or logo text rendered above the title. */
    logo?: string;
    /** Gradient color stops for the title. When provided, title renders with gradient. */
    titleGradient?: string[];
    /** Gradient color stops for the logo. When provided, logo renders with gradient. */
    logoGradient?: string[];
    /** Recent items / actions list. When provided, renders a selectable list. */
    actions?: WelcomeAction[];
    /** Keyboard shortcuts to display. */
    shortcuts?: WelcomeShortcut[];
    /** Section header for the actions list (default: "Recent"). */
    actionsTitle?: string;
    /** Section header for the shortcuts list (default: "Keyboard Shortcuts"). */
    shortcutsTitle?: string;
    /** Number of columns for keyboard shortcuts (default: 2). */
    shortcutColumns?: number;
    /** Dismiss prompt text (default: "Press any key to continue"). */
    prompt?: string;
    /** Called when the user presses any key or selects an action. */
    onDismiss?: (selectedAction?: WelcomeAction) => void;
    /** Optional background pattern prop (passed to root container). */
    background?: unknown;
    /** Whether the welcome screen is visible (default: true). */
    visible?: boolean;
    children?: React.ReactNode;
}
export declare const Welcome: React.NamedExoticComponent<WelcomeProps>;
//# sourceMappingURL=Welcome.d.ts.map