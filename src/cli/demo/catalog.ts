import {
  arcticTheme,
  midnightTheme,
  emberTheme,
  mistTheme,
  voltageTheme,
  duskTheme,
  horizonTheme,
  neonTheme,
  calmTheme,
  highContrastTheme,
  monochromeTheme,
  defaultPreset,
  minimalPreset,
  hackerPreset,
  playfulPreset,
} from "./demo-kit.js";
import type { StormColors, StormPersonality } from "./demo-kit.js";

// Themes catalog.
export const THEMES: { name: string; colors: StormColors }[] = [
  { name: "Arctic", colors: arcticTheme },
  { name: "Midnight", colors: midnightTheme },
  { name: "Ember", colors: emberTheme },
  { name: "Mist", colors: mistTheme },
  { name: "Voltage", colors: voltageTheme },
  { name: "Dusk", colors: duskTheme },
  { name: "Horizon", colors: horizonTheme },
  { name: "Neon", colors: neonTheme },
  { name: "Calm", colors: calmTheme },
  { name: "Contrast", colors: highContrastTheme },
  { name: "Mono", colors: monochromeTheme },
];

// Grouped under super-sections in the sidebar. Order is also the Tab cycle order.
export const SECTIONS = [
  { key: "welcome", label: "Welcome", icon: "✦", group: "Tour" },
  { key: "layout",  label: "Layout",  icon: "▤", group: "Build" },
  { key: "forms",   label: "Forms",   icon: "✎", group: "Build" },
  { key: "search",  label: "Search",  icon: "⌕", group: "Build" },
  { key: "data",    label: "Data",    icon: "▦", group: "Build" },
  { key: "calendar",label: "Calendar",icon: "▣", group: "Build" },
  { key: "overlays",label: "Overlays",icon: "▢", group: "Build" },
  { key: "charts",  label: "Charts",  icon: "▁", group: "Visualize" },
  { key: "ai",      label: "AI",      icon: "◆", group: "Visualize" },
  { key: "editor",  label: "Editor",  icon: "✦", group: "Visualize" },
  { key: "effects", label: "Effects", icon: "✺", group: "Visualize" },
  { key: "anim",    label: "Anim Lab", icon: "≋", group: "Hooks" },
  { key: "hooks",   label: "Hooks",   icon: "⚙", group: "Hooks" },
  { key: "behave",  label: "Behaviors", icon: "⌬", group: "Hooks" },
  { key: "i18n",    label: "i18n",    icon: "⌘", group: "Internals" },
  { key: "devtools",label: "DevTools",icon: "⚒", group: "Internals" },
  { key: "plugins", label: "Plugins", icon: "⌬", group: "Internals" },
  { key: "person",  label: "Personality", icon: "◑", group: "Internals" },
  { key: "a11y",    label: "A11y",    icon: "♿", group: "Internals" },
  { key: "caps",    label: "Capabilities", icon: "ⓘ", group: "Internals" },
  { key: "mouse",   label: "Mouse",   icon: "✥", group: "Meta" },
  { key: "themes",  label: "Themes",  icon: "◐", group: "Meta" },
  { key: "about",   label: "About",   icon: "?", group: "Meta" },
] as const;

export type SectionKey = typeof SECTIONS[number]["key"];

export const PERSONALITY_PRESETS: { name: string; preset: StormPersonality }[] = [
  { name: "Default", preset: defaultPreset },
  { name: "Minimal", preset: minimalPreset },
  { name: "Hacker",  preset: hackerPreset },
  { name: "Playful", preset: playfulPreset },
];
