/**
 * reacterm demo — an interactive showcase.
 *
 * One running app, 22 sections, every reacterm feature wired up so you can
 * hit a key and *do* something instead of just looking at it.
 *
 * Globals: Tab/Shift-Tab cycle sections · ? help overlay · t cycle theme · q quit
 *
 * Usage: reacterm demo
 *    or: npx tsx examples/reacterm-demo.tsx
 */

import React, { useState } from "react";
import { PersonalityProvider, ThemeProvider, useTerminal } from "./demo-kit.js";
import { PERSONALITY_PRESETS, THEMES, type SectionKey } from "./catalog.js";
import { pushToast, type DemoToast, type ToastFn } from "./shared.js";
import { GlobalShortcuts, Shell } from "./shell.js";
import {
  A11ySection,
  AboutSection,
  AiSection,
  AnimLabSection,
  BehaviorsSection,
  CalendarSection,
  CapabilitiesSection,
  ChartsSection,
  DataSection,
  DevToolsSection,
  EditorSection,
  EffectsSection,
  FormsSection,
  HooksSection,
  I18nSection,
  LayoutSection,
  MouseSection,
  OverlaysSection,
  PersonalitySection,
  PluginsSection,
  SearchSection,
  ThemesSection,
  WelcomeSection,
} from "./sections/index.js";

export function App(): React.ReactElement {
  const { width, height } = useTerminal();
  const [section, setSection] = useState<SectionKey>("welcome");
  const [themeIdx, setThemeIdx] = useState(0);
  const [presetIdx, setPresetIdx] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [dataFocus, setDataFocus] = useState<"tree" | "grid">("tree");
  const [editorInputFocused, setEditorInputFocused] = useState(true);
  const [toasts, setToasts] = useState<DemoToast[]>([]);

  const toast: ToastFn = (msg, type = "info") =>
    pushToast(setToasts, msg, type);

  const section_content = (() => {
    switch (section) {
      case "welcome":  return <WelcomeSection />;
      case "layout":   return <LayoutSection />;
      case "forms":    return <FormsSection pushToast={toast} />;
      case "search":   return <SearchSection pushToast={toast} />;
      case "data":     return <DataSection focused={dataFocus} />;
      case "calendar": return <CalendarSection />;
      case "overlays": return <OverlaysSection />;
      case "charts":   return <ChartsSection />;
      case "ai":       return <AiSection pushToast={toast} />;
      case "editor":   return <EditorSection inputFocused={editorInputFocused} setInputFocused={setEditorInputFocused} />;
      case "effects":  return <EffectsSection />;
      case "anim":     return <AnimLabSection />;
      case "hooks":    return <HooksSection pushToast={toast} />;
      case "behave":   return <BehaviorsSection />;
      case "i18n":     return <I18nSection />;
      case "devtools": return <DevToolsSection />;
      case "plugins":  return <PluginsSection />;
      case "person":   return <PersonalitySection presetIdx={presetIdx} setPresetIdx={setPresetIdx} />;
      case "a11y":     return <A11ySection />;
      case "caps":     return <CapabilitiesSection />;
      case "mouse":    return <MouseSection />;
      case "themes":   return <ThemesSection themeIdx={themeIdx} setThemeIdx={setThemeIdx} />;
      case "about":    return <AboutSection />;
    }
  })();

  const personality = PERSONALITY_PRESETS[presetIdx]!.preset;

  return (
    <PersonalityProvider personality={personality}>
      <ThemeProvider theme={THEMES[themeIdx]!.colors}>
        <Shell
          width={width}
          height={height}
          section={section}
          onSelectSection={setSection}
          themeName={THEMES[themeIdx]!.name}
          personalityName={PERSONALITY_PRESETS[presetIdx]!.name}
          toasts={toasts}
          showHelp={showHelp}
          onToggleHelp={() => setShowHelp((v) => !v)}
          onCycleTheme={() => {
            setThemeIdx((i) => (i + 1) % THEMES.length);
            toast(`Theme: ${THEMES[(themeIdx + 1) % THEMES.length]!.name}`);
          }}
          onDismissToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        >
          {section_content}
        </Shell>
        <GlobalShortcuts
          section={section}
          showHelp={showHelp}
          editorInputFocused={editorInputFocused}
          setShowHelp={setShowHelp}
          setSection={setSection}
          themeIdx={themeIdx}
          setThemeIdx={setThemeIdx}
          setDataFocus={setDataFocus}
          toast={toast}
        />
      </ThemeProvider>
    </PersonalityProvider>
  );
}
