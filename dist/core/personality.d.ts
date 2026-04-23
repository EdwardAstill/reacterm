import React from "react";
import type { StormColors } from "../theme/colors.js";
import type { BorderStyle } from "./types.js";
/** Controls colors, borders, animation timing, typography, focus indicators, and per-component defaults. */
export interface StormPersonality {
    /** Color theme (existing StormColors). */
    colors: StormColors;
    /** Border personality — style per usage context. */
    borders: {
        default: BorderStyle;
        focused: BorderStyle;
        accent: BorderStyle;
        panel: BorderStyle;
    };
    /** Animation personality — timing and motion preferences. */
    animation: {
        durationFast: number;
        durationNormal: number;
        durationSlow: number;
        easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
        reducedMotion: boolean;
        spinnerType: string;
    };
    /** Typography defaults. */
    typography: {
        headingBold: boolean;
        headingColor: string;
        codeBg: string;
        linkColor: string;
        linkUnderline: boolean;
    };
    /** Interaction style — how the UI communicates intent. */
    interaction: {
        focusIndicator: "border" | "highlight" | "arrow" | "bar";
        selectionChar: string;
        promptChar: string;
        cursorStyle: "block" | "underline" | "bar";
        collapseHint: string;
    };
    /** Component defaults — override any prop for any component by name. */
    components: Record<string, Record<string, unknown>>;
}
/** Recursively makes all properties optional. */
export type DeepPartialPersonality<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartialPersonality<T[P]> : T[P];
};
export declare const defaultPersonality: StormPersonality;
/**
 * Create a full personality by merging partial overrides onto the
 * default personality. Only the properties you specify are replaced.
 */
export declare function createPersonality(overrides: DeepPartialPersonality<StormPersonality>): StormPersonality;
/**
 * Merge overrides onto an existing personality.
 * Returns a new object; the base is not mutated.
 */
export declare function mergePersonality(base: StormPersonality, overrides: DeepPartialPersonality<StormPersonality>): StormPersonality;
declare const PersonalityContext: React.Context<StormPersonality>;
/**
 * Provide a StormPersonality to all descendant components.
 * Components use usePersonality() to read the active personality.
 */
export declare function PersonalityProvider(props: {
    personality: StormPersonality;
    children: React.ReactNode;
}): React.ReactElement;
/**
 * Read the active StormPersonality from context, with colors
 * always reflecting the active theme (not the static dark-theme
 * defaults captured at module load time).
 *
 * If a PersonalityProvider supplies an explicit `colors` override
 * that differs from the default dark palette, that override is
 * preserved. Otherwise the colors (and color-derived typography
 * fields) are replaced with the live theme from ThemeProvider.
 */
export declare function usePersonality(): StormPersonality;
export { PersonalityContext };
//# sourceMappingURL=personality.d.ts.map