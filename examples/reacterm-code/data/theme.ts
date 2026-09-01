/**
 * Reacterm Code theme — dark and light palettes.
 *
 * All colors centralized here. Components import S from this file.
 * Toggle with 't' key at runtime.
 */

export interface ReactermTheme {
  /** Electric arc accent */
  arc: string;
  /** Primary text */
  text: string;
  /** Dimmed / secondary */
  dim: string;
  /** Success / additions */
  success: string;
  /** Error / removals */
  error: string;
  /** Warning / medium risk */
  warning: string;
  /** Subtle surface bg for user messages */
  userBg: string;
  /** Bold user text override */
  userText: string;
  /** Background (terminal default if empty) */
  bg: string;
}

export const DARK: ReactermTheme = {
  arc: "#82AAFF",
  text: "#C0CAF5",
  dim: "#565F89",
  success: "#9ECE6A",
  error: "#F7768E",
  warning: "#E0AF68",
  userBg: "#1E2030",
  userText: "#FFFFFF",
  bg: "",
};

export const LIGHT: ReactermTheme = {
  arc: "#3B6FD4",
  text: "#24292E",
  dim: "#8B949E",
  success: "#2DA44E",
  error: "#CF222E",
  warning: "#BF8700",
  userBg: "#F0F4FF",
  userText: "#1B1F24",
  bg: "#FFFFFF",
};

/** Mutable current theme — components read from this */
let current: ReactermTheme = DARK;

/** Get current theme */
export function getTheme(): ReactermTheme {
  return current;
}

/** Set current theme */
export function setTheme(theme: ReactermTheme): void {
  current = theme;
}

/** Toggle between dark and light */
export function toggleTheme(): ReactermTheme {
  current = current === DARK ? LIGHT : DARK;
  return current;
}

/** Shorthand — components use `S.arc`, `S.text`, etc. */
export const S = new Proxy({} as ReactermTheme, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string" || !Object.prototype.hasOwnProperty.call(current, prop)) return undefined;
    return current[prop as keyof ReactermTheme];
  },
});
