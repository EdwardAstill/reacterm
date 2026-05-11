import React, { useState } from "react";
import { PERSONALITY_PRESETS } from "../catalog.js";
import type {
  Locale,
  StormColors,
} from "../demo-kit.js";
import {
  Badge,
  bestColorDepth,
  Box,
  contrastRatio,
  detectImageCaps,
  detectTerminal,
  formatNumber,
  i18nT,
  LocaleProvider,
  plural,
  PLURAL_AR,
  PLURAL_EN,
  PLURAL_FR,
  PLURAL_JA,
  PLURAL_RU,
  Spinner,
  Text,
  useAnnounce,
  useInput,
  useTheme,
  validateContrast,
} from "../demo-kit.js";
import { Clickable } from "../shared.js";

const LOCALES_DEMO: Record<string, Locale> = {
  en: { code: "en", direction: "ltr", pluralRule: PLURAL_EN,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdaysShort: ["S","M","T","W","T","F","S"],
    strings: {
      "items.one": "{count} item",
      "items.other": "{count} items",
      "greeting": "Hello, {name}!",
    },
  },
  fr: { code: "fr", direction: "ltr", pluralRule: PLURAL_FR,
    numbers: { decimal: ",", thousands: " ", grouping: 3 },
    months: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
    monthsShort: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
    weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    weekdaysShort: ["D","L","M","M","J","V","S"],
    strings: {
      "items.one": "{count} élément",
      "items.other": "{count} éléments",
      "greeting": "Bonjour, {name} !",
    },
  },
  de: { code: "de", direction: "ltr",
    numbers: { decimal: ",", thousands: ".", grouping: 3 },
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    weekdaysShort: ["S","M","D","M","D","F","S"],
    strings: {
      "items.one": "{count} Element",
      "items.other": "{count} Elemente",
      "greeting": "Hallo, {name}!",
    },
  },
  ru: { code: "ru", direction: "ltr", pluralRule: PLURAL_RU,
    numbers: { decimal: ",", thousands: " ", grouping: 3 },
    months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    monthsShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    weekdaysShort: ["В","П","В","С","Ч","П","С"],
    strings: {
      "items.one":   "{count} элемент",
      "items.few":   "{count} элемента",
      "items.many":  "{count} элементов",
      "items.other": "{count} элементов",
      "greeting":    "Привет, {name}!",
    },
  },
  ar: { code: "ar", direction: "rtl", pluralRule: PLURAL_AR,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"],
    monthsShort: ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"],
    weekdays: ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"],
    weekdaysShort: ["أ","ا","ث","أ","خ","ج","س"],
    strings: {
      "items.zero":  "لا عناصر",
      "items.one":   "عنصر واحد",
      "items.two":   "عنصران",
      "items.few":   "{count} عناصر",
      "items.many":  "{count} عنصرًا",
      "items.other": "{count} عنصر",
      "greeting":    "مرحبا، {name}!",
    },
  },
  ja: { code: "ja", direction: "ltr", pluralRule: PLURAL_JA,
    numbers: { decimal: ".", thousands: ",", grouping: 3 },
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    monthsShort: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    weekdays: ["日","月","火","水","木","金","土"],
    weekdaysShort: ["日","月","火","水","木","金","土"],
    strings: {
      "items.other": "{count} 個",
      "greeting":    "こんにちは、{name}さん！",
    },
  },
};

function I18nSection(): React.ReactElement {
  const theme = useTheme();
  const [code, setCode] = useState<string>("en");
  const [count, setCount] = useState(2);

  useInput((e) => {
    if (e.key === "left") { e.consumed = true; setCount((c) => Math.max(0, c - 1)); }
    else if (e.key === "right") { e.consumed = true; setCount((c) => c + 1); }
  });

  const codes = Object.keys(LOCALES_DEMO);
  useInput((e) => {
    const idx = codes.indexOf(code);
    if (e.char === "n") { e.consumed = true; setCode(codes[(idx + 1) % codes.length]!); }
    if (e.char === "p") { e.consumed = true; setCode(codes[(idx - 1 + codes.length) % codes.length]!); }
  });

  const locale = LOCALES_DEMO[code]!;
  const num = formatNumber(1234567.89, locale);
  const greet = i18nT("greeting", locale, { name: "World" });
  const items = plural("items", count, locale);

  return (
    <LocaleProvider locale={locale}>
      <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
        <Text bold color={theme.colors.brand.primary}>i18n</Text>
        <Text color={theme.colors.text.dim}>
          n/p locale (or click a chip) · ←/→ count · 6 locales with plural rules + RTL.
        </Text>

        <Box flexDirection="row" gap={1} marginTop={1}>
          {codes.map((c) => {
            const active = c === code;
            return (
              <Clickable key={c} onClick={() => setCode(c)}
                borderStyle={active ? "double" : "round"}
                borderColor={active ? theme.colors.brand.primary : theme.colors.divider} paddingX={1}>
                <Text bold={active} color={active ? theme.colors.brand.primary : theme.colors.text.secondary}>
                  {c.toUpperCase()}
                </Text>
              </Clickable>
            );
          })}
        </Box>

        <Box flexDirection="column" marginTop={1} gap={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>direction:</Text>
            <Text bold color={theme.colors.brand.primary}>{locale.direction}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>formatNumber(1234567.89):</Text>
            <Text bold color={theme.colors.warning}>{num}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>t("greeting"):</Text>
            <Text bold color={theme.colors.success}>{greet}</Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.colors.text.secondary}>plural("items", {count}):</Text>
            <Text bold color={theme.colors.info}>{items}</Text>
          </Box>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Text color={theme.colors.text.secondary}>weekdays:</Text>
            {locale.weekdays.map((w, i) => (
              <Text key={i} color={theme.colors.text.dim}>{w}</Text>
            ))}
          </Box>
        </Box>
      </Box>
    </LocaleProvider>
  );
}

// ── DevTools ────────────────────────────────────────────────────────────
const DEVTOOL_PANELS = [
  { key: "1", name: "Render heatmap",  desc: "Color each cell by write frequency" },
  { key: "2", name: "Accessibility audit", desc: "Live WCAG 4.5:1 contrast check" },
  { key: "3", name: "Time-travel",     desc: "Freeze + scrub last 120 frames" },
  { key: "4", name: "Inspector",       desc: "Component tree, computed styles, FPS" },
];

function DevToolsSection(): React.ReactElement {
  const theme = useTheme();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useInput((e) => {
    if (e.char === "1" || e.char === "2" || e.char === "3" || e.char === "4") {
      e.consumed = true;
      setEnabled((prev) => ({ ...prev, [e.char]: !prev[e.char] }));
    }
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>DevTools</Text>
      <Text color={theme.colors.text.dim}>
        Toggle 1/2/3/4 — or click a panel. In a real app, `enableDevTools(app)` wires all four at once.
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {DEVTOOL_PANELS.map((p) => {
          const on = enabled[p.key] ?? false;
          const toggle = () => setEnabled((prev) => ({ ...prev, [p.key]: !prev[p.key] }));
          return (
            <Clickable key={p.key} onClick={toggle} flexDirection="row">
              <Box borderStyle={on ? "double" : "round"}
                borderColor={on ? theme.colors.success : theme.colors.divider} paddingX={1}>
                <Text bold color={on ? theme.colors.success : theme.colors.text.secondary}>
                  {p.key} {on ? "ON " : "OFF"}
                </Text>
              </Box>
              <Box flexDirection="column" marginLeft={1}>
                <Text bold color={theme.colors.text.primary}>{p.name}</Text>
                <Text color={theme.colors.text.dim}>{p.desc}</Text>
              </Box>
            </Clickable>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Middleware</Text>
        <Text color={theme.colors.text.secondary}>
          Three built-in middlewares run as render-pipeline passes:
        </Text>
        <Text color={theme.colors.text.dim}>
          · scanlineMiddleware — CRT-style overlay
        </Text>
        <Text color={theme.colors.text.dim}>
          · fpsCounterMiddleware — corner FPS readout
        </Text>
        <Text color={theme.colors.text.dim}>
          · debugBorderMiddleware — color every box border
        </Text>
        <Text color={theme.colors.text.dim}>
          Apply via `app.middleware.use(scanlineMiddleware)`.
        </Text>
      </Box>
    </Box>
  );
}

// ── Plugins ─────────────────────────────────────────────────────────────
const PLUGIN_LIST = [
  { key: "vimModePlugin",     desc: "hjkl + visual mode for ScrollView/lists" },
  { key: "compactModePlugin", desc: "Strip padding for high-density UIs" },
  { key: "autoScrollPlugin",  desc: "Keep ScrollView pinned to bottom" },
  { key: "screenshotPlugin",  desc: "Capture buffer to a file" },
  { key: "statusBarPlugin",   desc: "Inject a persistent status bar" },
];

function PluginsSection(): React.ReactElement {
  const theme = useTheme();
  const [active] = useState<Record<string, boolean>>({});

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Plugins</Text>
      <Text color={theme.colors.text.dim}>
        Plugins extend the renderer. They're activated at `render()` time —
        this section is informational. See README.md for live wiring.
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {PLUGIN_LIST.map((p) => {
          const on = active[p.key] ?? false;
          return (
            <Box key={p.key} flexDirection="row" gap={2}>
              <Box width={26}>
                <Text bold color={theme.colors.brand.primary}>{p.key}</Text>
              </Box>
              <Text color={on ? theme.colors.success : theme.colors.text.secondary}>{p.desc}</Text>
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>Plugin contract</Text>
        <Text color={theme.colors.text.secondary}>
          A plugin implements StormPlugin: name, optional onMount, beforeRender,
          onComponentMount, getCustomElementHandlers. PluginManager fires hooks
          at every lifecycle stage — your plugin gets a turn before the renderer.
        </Text>
      </Box>
    </Box>
  );
}
function PersonalitySection({ presetIdx, setPresetIdx }: { presetIdx: number; setPresetIdx: (i: number) => void }): React.ReactElement {
  const theme = useTheme();
  useInput((e) => {
    if (e.key === "left")  { e.consumed = true; setPresetIdx((presetIdx - 1 + PERSONALITY_PRESETS.length) % PERSONALITY_PRESETS.length); }
    if (e.key === "right") { e.consumed = true; setPresetIdx((presetIdx + 1) % PERSONALITY_PRESETS.length); }
  });

  const active = PERSONALITY_PRESETS[presetIdx]!;

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Personality</Text>
      <Text color={theme.colors.text.dim}>
        ←/→ to cycle preset, or click a card. Personality changes icons, prompts, animation style — applied at the app root.
      </Text>

      <Box flexDirection="row" gap={1} marginTop={1}>
        {PERSONALITY_PRESETS.map((p, i) => {
          const isActive = i === presetIdx;
          return (
            <Clickable key={p.name} onClick={() => setPresetIdx(i)}
              borderStyle={isActive ? "double" : "round"}
              borderColor={isActive ? theme.colors.brand.primary : theme.colors.divider} paddingX={1}>
              <Text bold={isActive} color={isActive ? theme.colors.brand.primary : theme.colors.text.secondary}>
                {p.name}
              </Text>
            </Clickable>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1} gap={1}>
        <Text bold color={theme.colors.text.primary}>Active: {active.name}</Text>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>prompt char: </Text>
          <Text bold color={theme.colors.brand.primary}>{active.preset.interaction.promptChar}</Text>
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>selection char: </Text>
          <Text bold color={theme.colors.brand.primary}>{active.preset.interaction.selectionChar}</Text>
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>spinner: </Text>
          <Spinner type={active.preset.animation.spinnerType as "dots"} color={theme.colors.brand.primary} />
        </Box>
        <Box flexDirection="row" gap={3}>
          <Text color={theme.colors.text.secondary}>borders: </Text>
          <Text bold color={theme.colors.warning}>{active.preset.borders.default}</Text>
        </Box>
      </Box>
    </Box>
  );
}

// ── Accessibility ───────────────────────────────────────────────────────
function A11ySection(): React.ReactElement {
  const theme = useTheme();
  const announcer = useAnnounce();
  const [log, setLog] = useState<string[]>([]);

  useInput((e) => {
    if (e.char === "a") {
      e.consumed = true;
      const msg = `Polite announcement at ${new Date().toLocaleTimeString()}`;
      announcer.announce(msg);
      setLog((prev) => [...prev.slice(-5), `· ${msg}`]);
    }
    if (e.char === "A") {
      e.consumed = true;
      const msg = `URGENT announcement at ${new Date().toLocaleTimeString()}`;
      announcer.announceUrgent(msg);
      setLog((prev) => [...prev.slice(-5), `! ${msg}`]);
    }
  });

  // contrastRatio between current theme's text.primary and surface.base
  const fg = theme.colors.text.primary;
  const bg = theme.colors.surface.base;
  const ratio = contrastRatio(fg, bg);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  // Theme-wide validation
  const validation = validateContrast(theme.colors as StormColors);

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Accessibility</Text>
      <Text color={theme.colors.text.dim}>
        a → polite announce · A → urgent announce.
        Live WCAG audit of the current theme.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>contrastRatio()</Text>
          <Text color={theme.colors.text.dim}>text.primary vs surface.base</Text>
          <Text color={passesAA ? theme.colors.success : theme.colors.error}>
            {ratio.toFixed(2)} : 1
          </Text>
          <Box flexDirection="row" gap={1}>
            <Badge label={passesAA ? "AA ✓" : "AA ✗"} variant={passesAA ? "success" : "error"} />
            <Badge label={passesAAA ? "AAA ✓" : "AAA ✗"} variant={passesAAA ? "success" : "warning"} />
          </Box>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>validateContrast(theme)</Text>
          <Text color={theme.colors.text.dim}>scans every text role</Text>
          <Text color={validation.errors.length === 0 ? theme.colors.success : theme.colors.error}>
            {validation.errors.length} error{validation.errors.length === 1 ? "" : "s"}
          </Text>
          <Text color={validation.warnings.length === 0 ? theme.colors.success : theme.colors.warning}>
            {validation.warnings.length} warning{validation.warnings.length === 1 ? "" : "s"}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>useAnnounce log</Text>
        {log.length === 0
          ? <Text color={theme.colors.text.dim} dim>(press a or A to announce)</Text>
          : log.map((line, i) => (
              <Text key={i} color={line.startsWith("!") ? theme.colors.warning : theme.colors.text.secondary}>
                {line}
              </Text>
            ))}
      </Box>
    </Box>
  );
}

// ── Capabilities ────────────────────────────────────────────────────────
function CapabilitiesSection(): React.ReactElement {
  const theme = useTheme();
  const [info] = useState(() => detectTerminal());
  const [imgCaps] = useState(() => detectImageCaps());
  const [colorDepth] = useState(() => bestColorDepth(info));

  const Row = ({ k, v, color }: { k: string; v: string | number | boolean; color?: string | number }) => (
    <Box flexDirection="row" gap={2}>
      <Box width={22}>
        <Text color={theme.colors.text.dim}>{k}</Text>
      </Box>
      <Text bold color={color ?? theme.colors.brand.primary}>{String(v)}</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
      <Text bold color={theme.colors.brand.primary}>Terminal capabilities</Text>
      <Text color={theme.colors.text.dim}>
        What did reacterm detect about THIS terminal? Read-only.
      </Text>

      <Box flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>detectTerminal()</Text>
          <Row k="name"           v={info.name} />
          <Row k="kittyKeyboard"  v={info.kittyKeyboard} color={info.kittyKeyboard ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="syncOutput"     v={info.syncOutput} color={info.syncOutput ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="trueColor"      v={info.trueColor} color={info.trueColor ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="hyperlinks"     v={info.hyperlinks} color={info.hyperlinks ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="mouse"          v={info.mouse} color={info.mouse ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="bracketedPaste" v={info.bracketedPaste} color={info.bracketedPaste ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="size"           v={`${info.columns}×${info.rows}`} />
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1} flex={1}>
          <Text bold color={theme.colors.text.primary}>detectImageCaps()</Text>
          <Row k="bestProtocol" v={imgCaps.bestProtocol} />
          <Row k="kitty graphics" v={imgCaps.supportsKittyGraphics} color={imgCaps.supportsKittyGraphics ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="iterm2" v={imgCaps.supportsITerm2} color={imgCaps.supportsITerm2 ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="sextant" v={imgCaps.supportsSextant} color={imgCaps.supportsSextant ? theme.colors.success : theme.colors.text.secondary} />
          <Row k="colored underline" v={imgCaps.supportsColoredUnderline} />
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.divider} paddingX={1}>
        <Text bold color={theme.colors.text.primary}>bestColorDepth()</Text>
        <Row k="depth" v={colorDepth} color={theme.colors.warning} />
      </Box>
    </Box>
  );
}

export {
  A11ySection,
  CapabilitiesSection,
  DevToolsSection,
  I18nSection,
  PersonalitySection,
  PluginsSection,
};
