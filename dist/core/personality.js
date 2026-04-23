import React, { createContext, useContext, useMemo } from "react";
import { colors as defaultColors } from "../theme/colors.js";
import { useTheme } from "../theme/provider.js";
import { deepMerge } from "../theme/utils.js";
export const defaultPersonality = {
    colors: defaultColors,
    borders: {
        default: "round",
        focused: "round",
        accent: "double",
        panel: "round",
    },
    animation: {
        durationFast: 100,
        durationNormal: 200,
        durationSlow: 400,
        easing: "easeOut",
        reducedMotion: false,
        spinnerType: "diamond",
    },
    typography: {
        headingBold: true,
        headingColor: defaultColors.text.primary,
        codeBg: defaultColors.surface.raised,
        linkColor: defaultColors.info,
        linkUnderline: true,
    },
    interaction: {
        focusIndicator: "bar",
        selectionChar: "\u25C6", // ◆ (diamond — selection indicator)
        promptChar: "\u203A", // ›
        cursorStyle: "block",
        collapseHint: "ctrl+o to expand",
    },
    components: {},
};
/**
 * Create a full personality by merging partial overrides onto the
 * default personality. Only the properties you specify are replaced.
 */
export function createPersonality(overrides) {
    return deepMerge(defaultPersonality, overrides);
}
/**
 * Merge overrides onto an existing personality.
 * Returns a new object; the base is not mutated.
 */
export function mergePersonality(base, overrides) {
    return deepMerge(base, overrides);
}
const PersonalityContext = createContext(defaultPersonality);
/**
 * Provide a StormPersonality to all descendant components.
 * Components use usePersonality() to read the active personality.
 */
export function PersonalityProvider(props) {
    return React.createElement(PersonalityContext.Provider, { value: props.personality }, props.children);
}
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
export function usePersonality() {
    const base = useContext(PersonalityContext);
    const themeColors = useTheme().colors;
    return useMemo(() => {
        // when the personality uses the default color palette. Custom
        // personality colors (e.g. hackerPreset, playfulPreset) are preserved.
        const colors = base.colors === defaultPersonality.colors ? themeColors : base.colors;
        const typography = { ...base.typography };
        // Only patch typography values that still match the original
        // dark-theme defaults — if the personality explicitly set them
        // to something custom, leave them alone.
        if (base.typography.headingColor === defaultColors.text.primary) {
            typography.headingColor = colors.text.primary;
        }
        if (base.typography.codeBg === defaultColors.surface.raised) {
            typography.codeBg = colors.surface.raised;
        }
        if (base.typography.linkColor === defaultColors.info) {
            typography.linkColor = colors.info;
        }
        return {
            ...base,
            colors,
            typography,
        };
    }, [base, themeColors]);
}
export { PersonalityContext };
//# sourceMappingURL=personality.js.map