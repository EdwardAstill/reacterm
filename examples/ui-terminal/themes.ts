/**
 * Storm TUI theme catalog.
 *
 * Each theme is a self-contained bundle of colors + stylistic knobs
 * (border glyphs, button rendering). The app reads the active theme
 * and paints both the Showcase and Style Guide views accordingly.
 */

export type BorderStyleName = "round" | "single" | "double" | "heavy" | "ascii" | "storm";

export type ButtonStyle =
  | "plain"     //  Submit
  | "bracket"   //  [ Submit ]
  | "brace"     //  { Submit }
  | "angle"     //  < Submit >
  | "fill"      //  ▉ Submit ▉ / filled background
  | "shaded"    //  ▓ Submit ▓
  | "double";   //  ╣ Submit ╠

export interface TuiPalette {
  bg: string;
  fg: string;
  dim: string;
  border: string;
  borderFocus: string;
  accent: string;
  accentAlt: string;
  selected: string;
  selectedBg: string;
  success: string;
  warning: string;
  error: string;
}

export interface TuiTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: TuiPalette;
  borderStyle: BorderStyleName;
  buttonStyle: ButtonStyle;
  /** Radius flavor: flavor only, used for style-guide annotation. */
  cornerLabel: "square" | "rounded" | "sharp-double";
}

export const THEMES: TuiTheme[] = [
  {
    id: "mono",
    name: "Monochrome",
    emoji: "◐",
    description: "Greyscale-only, rounded borders, bracket buttons.",
    borderStyle: "round",
    buttonStyle: "bracket",
    cornerLabel: "rounded",
    colors: {
      bg: "#0B0B0D",
      fg: "#F4F4F5",
      dim: "#71717A",
      border: "#525252",
      borderFocus: "#FFFFFF",
      accent: "#E4E4E7",
      accentAlt: "#A1A1AA",
      selected: "#F4F4F5",
      selectedBg: "#2E2E32",
      success: "#A1A1AA",
      warning: "#D4D4D8",
      error: "#F4F4F5",
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    emoji: "☘",
    description: "Phosphor green on black, angle brackets, single borders.",
    borderStyle: "single",
    buttonStyle: "angle",
    cornerLabel: "square",
    colors: {
      bg: "#000000",
      fg: "#4AFF4A",
      dim: "#1f7a1f",
      border: "#1f7a1f",
      borderFocus: "#7AFF7A",
      accent: "#7AFF7A",
      accentAlt: "#37c837",
      selected: "#000000",
      selectedBg: "#4AFF4A",
      success: "#8CFF8C",
      warning: "#FFD54A",
      error: "#FF6A6A",
    },
  },
  {
    id: "amber",
    name: "Amber CRT",
    emoji: "◼",
    description: "Amber monochrome console, double borders, braces.",
    borderStyle: "double",
    buttonStyle: "brace",
    cornerLabel: "sharp-double",
    colors: {
      bg: "#1A0F00",
      fg: "#FFB64C",
      dim: "#8A5A10",
      border: "#8A5A10",
      borderFocus: "#FFD082",
      accent: "#FFD082",
      accentAlt: "#FFA02A",
      selected: "#1A0F00",
      selectedBg: "#FFB64C",
      success: "#FFCC66",
      warning: "#FFD082",
      error: "#FF6B4C",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    emoji: "◆",
    description: "Navy field with cyan ink, bold borders, filled buttons.",
    borderStyle: "heavy",
    buttonStyle: "fill",
    cornerLabel: "square",
    colors: {
      bg: "#0A1F3A",
      fg: "#D6ECFF",
      dim: "#6B8FC2",
      border: "#4A7BB5",
      borderFocus: "#8FD1FF",
      accent: "#3FB8FF",
      accentAlt: "#8FD1FF",
      selected: "#0A1F3A",
      selectedBg: "#3FB8FF",
      success: "#5EE6B0",
      warning: "#FFD166",
      error: "#FF6F69",
    },
  },
  {
    id: "paper",
    name: "Paper",
    emoji: "☼",
    description: "Light paper, classic ASCII borders, bracket buttons.",
    borderStyle: "ascii",
    buttonStyle: "bracket",
    cornerLabel: "square",
    colors: {
      bg: "#F5F1E8",
      fg: "#2B2620",
      dim: "#908878",
      border: "#C6BEAD",
      borderFocus: "#2B2620",
      accent: "#B8532A",
      accentAlt: "#3B6E8F",
      selected: "#F5F1E8",
      selectedBg: "#2B2620",
      success: "#3E8B5A",
      warning: "#B8832A",
      error: "#B8532A",
    },
  },
  {
    id: "neon",
    name: "Neon",
    emoji: "✦",
    description: "Deep violet with magenta/cyan, double borders, shaded buttons.",
    borderStyle: "double",
    buttonStyle: "shaded",
    cornerLabel: "sharp-double",
    colors: {
      bg: "#0E0B20",
      fg: "#F0E8FF",
      dim: "#6A5A9C",
      border: "#6A5A9C",
      borderFocus: "#FF4DDB",
      accent: "#FF4DDB",
      accentAlt: "#4DFFF1",
      selected: "#0E0B20",
      selectedBg: "#FF4DDB",
      success: "#4DFFB0",
      warning: "#FFE14D",
      error: "#FF5C7A",
    },
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "♣",
    description: "Deep forest green + warm yellow, round borders, plain buttons.",
    borderStyle: "round",
    buttonStyle: "plain",
    cornerLabel: "rounded",
    colors: {
      bg: "#0D1F13",
      fg: "#E6E2C6",
      dim: "#7A8A66",
      border: "#3C5A3A",
      borderFocus: "#E6B94A",
      accent: "#E6B94A",
      accentAlt: "#6EAF6A",
      selected: "#0D1F13",
      selectedBg: "#E6B94A",
      success: "#6EAF6A",
      warning: "#E6B94A",
      error: "#B85A4A",
    },
  },
  {
    id: "royal",
    name: "Royal",
    emoji: "♛",
    description: "Deep purple field with gold, double borders, brace buttons.",
    borderStyle: "double",
    buttonStyle: "brace",
    cornerLabel: "sharp-double",
    colors: {
      bg: "#1A0F2E",
      fg: "#F0E6C7",
      dim: "#7A6F9C",
      border: "#4A3A6E",
      borderFocus: "#D4AF37",
      accent: "#D4AF37",
      accentAlt: "#B8A2D8",
      selected: "#1A0F2E",
      selectedBg: "#D4AF37",
      success: "#8CC18C",
      warning: "#D4AF37",
      error: "#C25A6E",
    },
  },
];

export function renderButton(label: string, style: ButtonStyle): string {
  switch (style) {
    case "plain":   return label;
    case "bracket": return `[ ${label} ]`;
    case "brace":   return `{ ${label} }`;
    case "angle":   return `< ${label} >`;
    case "fill":    return ` ${label} `;
    case "shaded":  return `▓ ${label} ▓`;
    case "double":  return `╣ ${label} ╠`;
  }
}
