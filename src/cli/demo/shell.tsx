import React from "react";
import {
  Box,
  Text,
  Spacer,
  Divider,
  ScrollView,
  KeyboardHelp,
  Modal,
  Toast,
  useInput,
  useTheme,
  useTui,
} from "./demo-kit.js";
import { SECTIONS, THEMES, type SectionKey } from "./catalog.js";
import { Clickable, type DemoToast, type ToastFn } from "./shared.js";

interface GlobalShortcutsProps {
  section: SectionKey;
  showHelp: boolean;
  editorInputFocused: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  setSection: React.Dispatch<React.SetStateAction<SectionKey>>;
  themeIdx: number;
  setThemeIdx: React.Dispatch<React.SetStateAction<number>>;
  setDataFocus: React.Dispatch<React.SetStateAction<"tree" | "grid">>;
  toast: ToastFn;
}

function GlobalShortcuts(props: GlobalShortcutsProps): null {
  const { exit } = useTui();
  const activeSectionOwnsLetters =
    props.section === "layout"
    || props.section === "forms"
    || props.section === "search"
    || props.section === "editor";

  // Keep this as one stable listener. `useCleanup` is app-exit cleanup, not a
  // React unmount hook, so remounting a shortcut component leaks stale handlers.
  useInput((e) => {
    if (props.showHelp) {
      if (e.key === "escape" || e.char === "?" || e.char === "q") {
        e.consumed = true;
        props.setShowHelp(false);
      }
      return;
    }

    if (e.key === "c" && e.ctrl) {
      e.consumed = true;
      exit();
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "q") {
      e.consumed = true;
      exit();
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "?") {
      e.consumed = true;
      props.setShowHelp(true);
      return;
    }
    if (!activeSectionOwnsLetters && e.char === "t") {
      e.consumed = true;
      props.setThemeIdx((i) => (i + 1) % THEMES.length);
      props.toast(`Theme: ${THEMES[(props.themeIdx + 1) % THEMES.length]!.name}`);
      return;
    }
    if (e.key === "tab") {
      if (props.section === "editor" && props.editorInputFocused) return;
      e.consumed = true;
      const idx = SECTIONS.findIndex((s) => s.key === props.section);
      const dir = e.shift ? -1 : 1;
      const next = SECTIONS[(idx + dir + SECTIONS.length) % SECTIONS.length]!;
      props.setSection(next.key);
      return;
    }
    if (props.section === "data") {
      if (e.char === "f") { e.consumed = true; props.setDataFocus("tree"); return; }
      if (e.char === "g") { e.consumed = true; props.setDataFocus("grid"); return; }
    }
  });

  return null;
}

interface ShellProps {
  width: number;
  height: number;
  section: SectionKey;
  onSelectSection: (key: SectionKey) => void;
  themeName: string;
  personalityName: string;
  toasts: DemoToast[];
  showHelp: boolean;
  onToggleHelp: () => void;
  onCycleTheme: () => void;
  onDismissToast: (id: string) => void;
  children: React.ReactNode;
}

function Shell(props: ShellProps): React.ReactElement {
  const theme = useTheme();
  const sectionLabel = SECTIONS.find((s) => s.key === props.section)?.label ?? "?";

  return (
    <Box flexDirection="column" width={props.width} height={props.height}>
      {/* Header — theme + help-toggle are clickable */}
      <Box flexDirection="row" paddingX={2} height={1} flexShrink={0}>
        <Text bold color={theme.colors.brand.primary}>◆ reacterm</Text>
        <Text color={theme.colors.text.dim}>  ·  </Text>
        <Text color={theme.colors.text.secondary}>demo</Text>
        <Spacer />
        <Clickable onClick={props.onCycleTheme} flexDirection="row">
          <Text color={theme.colors.text.dim}>theme: </Text>
          <Text bold color={theme.colors.brand.primary}>{props.themeName}</Text>
        </Clickable>
        <Text color={theme.colors.text.dim}>  ·  preset: </Text>
        <Text bold color={theme.colors.warning}>{props.personalityName}</Text>
        <Text color={theme.colors.text.dim}>  ·  </Text>
        <Text bold color={theme.colors.info}>{sectionLabel}</Text>
        <Text color={theme.colors.text.dim}>  </Text>
        <Clickable onClick={props.onToggleHelp} paddingX={1}
          borderStyle="round" borderColor={theme.colors.divider}>
          <Text bold color={theme.colors.text.secondary}>?</Text>
        </Clickable>
      </Box>
      <Divider />

      {/* Body: sidebar + content */}
      <Box flexDirection="row" flex={1}>
        {/* Sidebar — sections grouped under super-headings */}
        <Box flexDirection="column" width={20} flexShrink={0} paddingX={1} paddingY={0} borderRight borderStyle="single" borderColor={theme.colors.divider}>
          <ScrollView height={props.height - 4}>
            {(() => {
              const grouped = SECTIONS.reduce<Record<string, typeof SECTIONS[number][]>>((acc, s) => {
                (acc[s.group] = acc[s.group] ?? []).push(s);
                return acc;
              }, {});
              const groupOrder = ["Tour", "Build", "Visualize", "Hooks", "Internals", "Meta"];
              return groupOrder.flatMap((g) => [
                <Text key={`g-${g}`} bold color={theme.colors.text.dim}>{g.toUpperCase()}</Text>,
                ...(grouped[g] ?? []).map((s) => {
                  const active = s.key === props.section;
                  return (
                    <Clickable key={s.key} flexDirection="row" onClick={() => props.onSelectSection(s.key)}>
                      <Text color={active ? theme.colors.brand.primary : theme.colors.text.dim} bold={active}>
                        {active ? "▶ " : "  "}
                      </Text>
                      <Text color={active ? theme.colors.text.primary : theme.colors.text.secondary} bold={active}>
                        {s.icon} {s.label}
                      </Text>
                    </Clickable>
                  );
                }),
                <Box key={`s-${g}`} height={1} />,
              ]);
            })()}
          </ScrollView>
        </Box>

        {/* Content */}
        <Box flex={1} flexDirection="column" overflow="hidden">
          {props.children}
        </Box>
      </Box>

      {/* Toasts: stack at bottom-right */}
      {props.toasts.length > 0 && (
        <Box flexDirection="column" paddingX={2}>
          {props.toasts.slice(-3).map((t) => (
            <Toast
              key={t.id}
              message={t.msg}
              type={t.type ?? "info"}
              visible
              durationMs={2200}
              animated
              onDismiss={() => props.onDismissToast(t.id)}
            />
          ))}
        </Box>
      )}

      {/* Footer */}
      <Divider />
      <Box flexDirection="row" paddingX={2} height={1} flexShrink={0}>
        <KeyboardHelp
          bindings={[
            { key: "Tab",       label: "next section" },
            { key: "?",         label: "help" },
            { key: "t",         label: "theme" },
            { key: "q",         label: "quit" },
          ]}
        />
      </Box>

      {/* Help modal */}
      <Modal visible={props.showHelp} title="Keyboard cheatsheet" size="md" onClose={() => {}}>
        <Box flexDirection="column" gap={1}>
          <Text bold color={theme.colors.brand.primary}>Globals</Text>
          <KeyboardHelp
            columns={2}
            bindings={[
              { key: "Tab",        label: "next section" },
              { key: "Shift-Tab",  label: "prev section" },
              { key: "?",          label: "this overlay" },
              { key: "t",          label: "cycle theme" },
              { key: "q / Ctrl-C", label: "quit" },
            ]}
          />
          <Text bold color={theme.colors.brand.primary}>Section-local</Text>
          <KeyboardHelp
            columns={2}
            bindings={[
              { key: "Forms",         label: "Shift-←/→ next field" },
              { key: "Search",        label: "type / arrows / Enter" },
              { key: "Data",          label: "f tree, g grid; ↑↓ + s sort" },
              { key: "AI",            label: "r run, y/n/a approve" },
              { key: "Mouse",         label: "move + space" },
              { key: "Themes",        label: "←/→ cycle" },
            ]}
          />
          <Text color={theme.colors.text.dim}>Press any key to close.</Text>
        </Box>
      </Modal>
    </Box>
  );
}

export { GlobalShortcuts, Shell };
