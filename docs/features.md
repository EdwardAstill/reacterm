# Storm — Feature Reference

The exhaustive catalog of every public export from `src/index.ts`,
grouped into 27 categories. This file is the **source of truth** for
the question: *"what does Storm ship?"*

For each entry, the catalog records:

- **Name** — the exported identifier
- **Kind** — Component | Hook | Type | Function | Class | Constant | Plugin | Middleware
- **Source** — file path under `src/`
- **One-liner** — what it does, ≤ 80 chars
- **Demo** — section name in `examples/reacterm-demo.tsx` that exercises it,
  or the alternative location (`docs/X.md`, `examples/Y.tsx`, "edge-case — see notes")

If the **Demo** column is `—`, the feature is not yet exercised in the
explorer. The sister doc `docs/plans/2026-04-29-explorer-all-features-plan.md`
tracks the work to fill those gaps.

> This catalog is currently a **skeleton** — categories are defined and
> seeded with one example per group so the section design has a frame
> of reference. Sub-task 1 of the plan does the full enumeration.

---

## How features are categorized

Three axes drive the grouping:

1. **What it is** — component vs hook vs subsystem (renderer, theme,
   plugin, devtools, testing).
2. **What problem it solves** — layout, input, data display, feedback,
   chrome, animation, accessibility, AI-specific.
3. **Whether you import it directly or it's used through another export**
   (e.g. headless behaviors back high-level components).

Sections marked **subsystem** are imperative APIs, not React components.

---

## Index

| §   | Category                      | Kind                  | Approx count |
|-----|-------------------------------|-----------------------|--------------|
| 1   | Core types & ANSI             | Type / Function       | ~30          |
| 2   | Layout primitives             | Component             | 7            |
| 3   | Containers                    | Component             | 9            |
| 4   | Inputs & form controls        | Component             | 14           |
| 5   | Buttons & navigation          | Component             | 10           |
| 6   | Status & feedback             | Component             | 13           |
| 7   | Display & content             | Component             | 14           |
| 8   | Data widgets                  | Component             | 10           |
| 9   | Charts                        | Component             | 8            |
| 10  | Editor / code                 | Component             | 5            |
| 11  | Effects & visual              | Component             | 11           |
| 12  | AI widgets                    | Component             | 15           |
| 13  | Hooks — essential             | Hook                  | 12           |
| 14  | Hooks — state & lifecycle     | Hook                  | 9            |
| 15  | Hooks — animation & timing    | Hook                  | 12           |
| 16  | Hooks — input & interaction   | Hook                  | 26           |
| 17  | Hooks — headless behaviors    | Hook                  | 15           |
| 18  | Theming                       | Function / Constant   | 23           |
| 19  | Personality & stylesheet      | Function / Component  | 14           |
| 20  | i18n                          | Function / Type       | 12           |
| 21  | Plugins                       | Plugin                | 5            |
| 22  | Middleware                    | Middleware            | 5            |
| 23  | DevTools (subsystem)          | Function              | 11           |
| 24  | Render & runtime utilities    | Class / Function      | 12           |
| 25  | Unicode & terminal capability | Function              | 14           |
| 26  | Web renderer & SSH (subsystem)| Class                 | 2            |
| 27  | Testing harness (subsystem)   | Function / Class      | 13           |

---

## §1. Core types & ANSI

> Low-level types and ANSI escape constants — used directly by anyone
> writing a custom renderer, middleware, or DevTools panel.

| Name       | Kind     | Source              | One-liner                                  | Demo |
|------------|----------|---------------------|--------------------------------------------|------|
| `Cell`     | Type     | `core/types.ts`     | One terminal cell: codepoint + style       | —    |
| `rgb`      | Function | `core/types.ts`     | Pack 24-bit color into the cell color int  | —    |
| `BORDER_CHARS` | Const | `core/types.ts`    | Border-style → corner/edge char map        | Layout |
| _(complete list filled by Sub-task 1)_ |

## §2. Layout primitives

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Box`       | Component | `components/core/Box.tsx`     | Flexbox container, the chassis of every layout | All sections |
| `Text`      | Component | `components/core/Text.tsx`    | Styled text run                                | All sections |
| `Spacer`    | Component | `components/core/Spacer.tsx`  | Pushes flex siblings apart                     | Shell header |
| `Newline`   | Component | `components/core/Newline.tsx` | Force line break inside text flow              | —    |
| `Static`    | Component | `components/core/Static.tsx`  | Render-once children; never recompute          | —    |
| `Divider`   | Component | `components/core/Divider.tsx` | Horizontal/vertical rule                       | Shell |
| `Overlay`   | Component | `components/core/Overlay.tsx` | Absolute-position floating panel               | —    |

## §3. Containers

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Panes`       | Component | `components/core/Panes.tsx`        | Split layout with junction-aware borders | Layout (planned) |
| `Pane`        | Component | `components/core/Panes.tsx`        | Child slot for `Panes`                   | Layout (planned) |
| `ScrollView`  | Component | `components/core/ScrollView.tsx`   | Windowed scroll container                | Layout |
| `VirtualList` | Component | `components/core/VirtualList.tsx`  | Virtualized list for huge datasets       | —    |
| `ListView`    | Component | `components/core/ListView.tsx`     | Selectable list with arrow nav           | Layout |
| `Tabs`        | Component | `components/core/Tabs.tsx`         | Tab strip + content panel                | —    |
| `Modal`       | Component | `components/core/Modal.tsx`        | Full-screen overlay with focus trap      | Help overlay |
| `FocusGroup`  | Component | `components/core/FocusGroup.tsx`   | Tab order + roving tabindex region       | —    |
| `ContentSwitcher` | Component | `components/extras/ContentSwitcher.tsx` | Crossfade between two trees       | —    |

## §4. Inputs & form controls

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `TextInput`     | Component | `components/core/TextInput.tsx`        | Single-line text edit              | Forms |
| `TextArea`      | Component | `components/core/TextArea.tsx`         | Multi-line text edit with cursor   | Forms |
| `MaskedInput`   | Component | `components/extras/MaskedInput.tsx`    | Format-masked text (phone, date)   | —    |
| `SearchInput`   | Component | `components/extras/SearchInput.tsx`    | Text input + search icon + spinner | —    |
| `SearchList`    | Component | `components/extras/SearchList.tsx`     | Single-focus search-and-pick combo | Search |
| `ChatInput`     | Component | `components/extras/ChatInput.tsx`      | Multi-line input with send affordance | — |
| `Select`        | Component | `components/core/Select.tsx`           | Dropdown with keyboard nav         | —    |
| `SelectInput`   | Component | `components/core/SelectInput.tsx`      | Inline list-pick (Ink-style API)   | —    |
| `Checkbox`      | Component | `components/core/Checkbox.tsx`         | Toggle with label                  | Forms |
| `Switch`        | Component | `components/core/Switch.tsx`           | iOS-style on/off                   | Forms |
| `RadioGroup`    | Component | `components/core/RadioGroup.tsx`       | Mutually-exclusive options         | Forms |
| `Form`          | Component | `components/extras/Form.tsx`           | Schema-driven form with validation | —    |
| `OptionList`    | Component | `components/extras/OptionList.tsx`     | Bare list-pick                     | —    |
| `SelectionList` | Component | `components/extras/SelectionList.tsx`  | Multi-select list with checkmarks  | —    |

## §5. Buttons & navigation

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Button`          | Component | `components/core/Button.tsx`             | Pressable with variant + size  | Forms |
| `Link`            | Component | `components/extras/Link.tsx`             | OSC-8 hyperlink                | —    |
| `Menu`            | Component | `components/extras/Menu.tsx`             | Vertical command list          | —    |
| `Breadcrumb`      | Component | `components/extras/Breadcrumb.tsx`       | Path-style nav with separators | —    |
| `Stepper`         | Component | `components/extras/Stepper.tsx`          | Numbered progress through steps| —    |
| `Paginator`       | Component | `components/extras/Paginator.tsx`        | Page selector                  | —    |
| `CommandPalette`  | Component | `components/extras/CommandPalette.tsx`   | ⌘K-style command launcher      | —    |
| `Header`          | Component | `components/extras/Header.tsx`           | App-bar style header           | —    |
| `Footer`          | Component | `components/extras/Footer.tsx`           | Status bar with key bindings   | —    |
| `Kbd`             | Component | `components/extras/Kbd.tsx`              | Visual keyboard-key chip       | —    |

## §6. Status & feedback

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Spinner`           | Component | `components/core/Spinner.tsx`             | Animated loader, 14 styles            | Welcome / Themes |
| `ProgressBar`       | Component | `components/core/ProgressBar.tsx`         | Determinate progress                  | Themes |
| `GradientProgress`  | Component | `components/effects/GradientProgress.tsx` | Progress bar with gradient fill       | —    |
| `Badge`             | Component | `components/extras/Badge.tsx`             | Compact status pill                   | Welcome |
| `Tag`               | Component | `components/extras/Tag.tsx`               | Removable label chip                  | —    |
| `Alert`             | Component | `components/extras/Alert.tsx`             | Banner with icon + actions            | —    |
| `ConfirmDialog`     | Component | `components/extras/ConfirmDialog.tsx`     | Yes/No modal                          | —    |
| `Toast`             | Component | `components/extras/Toast.tsx`             | Auto-dismissing notification          | Globals |
| `ToastContainer`    | Component | `components/extras/Toast.tsx`             | Stack manager for toasts              | —    |
| `StatusMessage`     | Component | `components/extras/StatusMessage.tsx`     | Inline tip/warn/error line            | —    |
| `Tooltip`           | Component | `components/extras/Tooltip.tsx`           | Hover/focus tooltip                   | —    |
| `LoadingIndicator`  | Component | `components/extras/LoadingIndicator.tsx`  | Skeleton/dots/bars loader             | —    |
| `Welcome`           | Component | `components/extras/Welcome.tsx`           | Splash screen primitive               | —    |

## §7. Display & content

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Heading`         | Component | `components/extras/Heading.tsx`        | H1–H6 with sizing                    | —    |
| `Paragraph`       | Component | `components/extras/Paragraph.tsx`      | Word-wrapped body text               | —    |
| `Card`            | Component | `components/extras/Card.tsx`           | Bordered content block               | —    |
| `Avatar`          | Component | `components/extras/Avatar.tsx`         | Initials/emoji avatar                | —    |
| `Calendar`        | Component | `components/extras/Calendar.tsx`       | Month grid with selection            | —    |
| `DatePicker`      | Component | `components/extras/DatePicker.tsx`     | Date input with calendar popover     | —    |
| `Timer`           | Component | `components/extras/Timer.tsx`          | Live countdown                       | —    |
| `Stopwatch`       | Component | `components/extras/Stopwatch.tsx`      | Live elapsed-time display            | —    |
| `Accordion`       | Component | `components/extras/Accordion.tsx`      | Expand/collapse sections             | —    |
| `Collapsible`     | Component | `components/extras/Collapsible.tsx`    | Single expand/collapse panel         | —    |
| `TabbedContent`   | Component | `components/extras/TabbedContent.tsx`  | Compact tab + body                   | —    |
| `HelpPanel`       | Component | `components/extras/HelpPanel.tsx`      | Sliding bindings panel               | —    |
| `KeyboardHelp`    | Component | `components/extras/KeyboardHelp.tsx`   | Inline `key label` cheatsheet        | Shell footer + help modal |
| `Placeholder`     | Component | `components/extras/Placeholder.tsx`    | Empty-state hint                     | —    |

## §8. Data widgets

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Tree`            | Component | `components/data/Tree.tsx`            | Expandable tree with reorder hooks | Data |
| `DirectoryTree`   | Component | `components/extras/DirectoryTree.tsx` | Tree styled for filesystems        | —    |
| `FilePicker`      | Component | `components/extras/FilePicker.tsx`    | Modal for picking files/directories| —    |
| `Table`           | Component | `components/table/Table.tsx`          | Read-only data table               | —    |
| `DataGrid`        | Component | `components/data/DataGrid.tsx`        | Sortable / editable / resizable    | Data |
| `RichLog`         | Component | `components/data/RichLog.tsx`         | Append-only log with levels        | —    |
| `Pretty`          | Component | `components/data/Pretty.tsx`          | Pretty-print JSON-like values      | —    |
| `DefinitionList`  | Component | `components/data/DefinitionList.tsx`  | term/definition pairs              | —    |
| `OrderedList`     | Component | `components/extras/OrderedList.tsx`   | Numbered list with styling tokens  | —    |
| `UnorderedList`   | Component | `components/extras/UnorderedList.tsx` | Bulleted list with status icons    | —    |

## §9. Charts

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Sparkline`   | Component | `components/data/Sparkline.tsx`   | Single-line trend chart        | Charts |
| `LineChart`   | Component | `components/data/LineChart.tsx`   | Multi-series line chart        | —    |
| `AreaChart`   | Component | `components/data/AreaChart.tsx`   | Filled-area variant of line    | —    |
| `ScatterPlot` | Component | `components/data/ScatterPlot.tsx` | XY scatter with categories     | —    |
| `Heatmap`     | Component | `components/data/Heatmap.tsx`     | 2D matrix with color intensity | —    |
| `Histogram`   | Component | `components/data/Histogram.tsx`   | Frequency-distribution bars    | —    |
| `BarChart`    | Component | `components/data/BarChart.tsx`    | Vertical/horizontal bars       | Charts |
| `Gauge`       | Component | `components/data/Gauge.tsx`       | Percent dial with thresholds   | Charts |

## §10. Editor / code

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Editor`         | Component | `components/extras/Editor.tsx`         | Multi-line code editor with shortcuts  | —    |
| `Markdown`       | Component | `components/extras/Markdown.tsx`       | Inline markdown renderer               | —    |
| `MarkdownViewer` | Component | `components/extras/MarkdownViewer.tsx` | Scrollable markdown document viewer    | —    |
| `MarkdownEditor` | Component | `components/extras/MarkdownEditor.tsx` | Editor + live debounced preview pair   | —    |
| `DiffView`       | Component | `components/extras/DiffView.tsx`       | Unified or split-diff with line numbers| —    |
| `InlineDiff`     | Component | `components/extras/InlineDiff.tsx`     | Word-level inline diff                 | —    |

## §11. Effects & visual

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Transition`        | Component | `components/effects/Transition.tsx`        | Enter/exit animation wrapper       | —    |
| `AnimatePresence`   | Component | `components/effects/AnimatePresence.tsx`   | Manages mount/unmount animations   | —    |
| `RevealTransition`  | Component | `components/effects/RevealTransition.tsx`  | Reveal/wipe animations             | —    |
| `Image`             | Component | `components/effects/Image.tsx`             | Render image via Sixel/Kitty/iTerm | —    |
| `Shadow`            | Component | `components/effects/Shadow.tsx`            | Drop shadow effect                 | —    |
| `GlowText`          | Component | `components/effects/GlowText.tsx`          | Glowing text via underline color   | —    |
| `GradientBorder`    | Component | `components/effects/GradientBorder.tsx`    | Multi-color border                 | —    |
| `Gradient`          | Component | `components/effects/Gradient.tsx`          | Gradient text fill                 | —    |
| `Digits`            | Component | `components/effects/Digits.tsx`            | Big-number display                 | —    |
| `Diagram`           | Component | `components/effects/Diagram.tsx`           | Node-and-edge diagram              | —    |
| `Canvas`            | Component | `components/effects/canvas/index.tsx`      | Free-form Canvas with nodes/edges  | —    |

## §12. AI widgets

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `OperationTree`    | Component | `widgets/ai/OperationTree.tsx`     | Operation hierarchy with status spinners | AI |
| `StreamingText`    | Component | `widgets/ai/StreamingText.tsx`     | Token-by-token streamed text             | AI |
| `SyntaxHighlight`  | Component | `widgets/dev/SyntaxHighlight.tsx`  | Code with language-aware coloring        | —    |
| `ShimmerText`      | Component | `widgets/ai/ShimmerText.tsx`       | Thinking/loading shimmer text            | —    |
| `BlinkDot`         | Component | `widgets/ai/BlinkDot.tsx`          | Pulsing status indicator                 | —    |
| `ApprovalPrompt`   | Component | `widgets/ai/ApprovalPrompt.tsx`    | y/n/a tool-call approval                 | AI |
| `CommandDropdown`  | Component | `widgets/ai/CommandDropdown.tsx`   | Slash-command picker                     | —    |
| `StatusLine`       | Component | `widgets/ai/StatusLine.tsx`        | Single-line status (model + tokens)      | —    |
| `MessageBubble`    | Component | `widgets/ai/MessageBubble.tsx`     | Role-tagged chat message                 | AI |
| `PerformanceHUD`   | Component | `widgets/dev/PerformanceHUD.tsx`   | FPS / frame-time HUD                     | —    |
| `TokenStream`      | Component | `widgets/ai/TokenStream.tsx`       | Live token-rate display                  | —    |
| `ContextWindow`    | Component | `widgets/ai/ContextWindow.tsx`     | Token-window utilization bar             | —    |
| `CostTracker`      | Component | `widgets/ai/CostTracker.tsx`       | Running USD spend                        | —    |
| `ModelBadge`       | Component | `widgets/ai/ModelBadge.tsx`        | Model name + color chip                  | —    |
| `CommandBlock`     | Component | `widgets/ai/CommandBlock.tsx`      | Code-block with copy/run actions         | —    |

## §13. Hooks — essential

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `useTui`           | Hook | `context/TuiContext.ts`         | App-wide context: render, input, focus | All sections |
| `useApp`           | Hook | `hooks/useApp.ts`               | Exit + waitUntilExit                   | —    |
| `useTerminal`      | Hook | `hooks/useTerminal.ts`          | Live width/height                      | Shell |
| `useInput`         | Hook | `hooks/useInput.ts`             | Keyboard handler with priority         | All sections |
| `useMouse`         | Hook | `hooks/useMouse.ts`             | Raw mouse events                       | Mouse |
| `useMousePosition` | Hook | `hooks/useMousePosition.ts`     | Tracked cursor position + isInside     | Mouse |
| `useFocus`         | Hook | `hooks/useFocus.ts`             | Manage focus state for a widget        | —    |
| `useFocusManager`  | Hook | `hooks/useFocusManager.ts`      | Tab-order management                   | —    |
| `useBuffer`        | Hook | `hooks/useBuffer.ts`            | Direct ScreenBuffer access             | —    |
| `useStdin`/`useStdout`/`useStderr` | Hook | `hooks/useStd*.ts`  | Raw stream access                      | —    |

## §14. Hooks — state & lifecycle

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `useCleanup`         | Hook | `hooks/useCleanup.ts`         | Reliable teardown (replaces `useEffect` return) | — |
| `useAsyncCleanup`    | Hook | `hooks/useAsyncCleanup.ts`    | Async-safe cleanup                            | — |
| `useForceUpdate`     | Hook | `hooks/useForceUpdate.ts`     | Imperative re-render trigger                  | — |
| `usePersistentState` | Hook | `hooks/usePersistentState.ts` | useState backed by storage                    | — |
| `useHistory`         | Hook | `hooks/useHistory.ts`         | Bounded history ring                          | — |
| `useUndoRedo`        | Hook | `hooks/useUndoRedo.ts`        | Undo/redo over arbitrary state                | — |
| `useBatchAction`     | Hook | `hooks/useBatchAction.ts`     | Coalesce N rapid actions into one             | — |
| `useStreamConsumer`  | Hook | `hooks/useStreamConsumer.ts`  | Subscribe to AsyncIterable                    | — |
| `useAsyncLoader`     | Hook | `hooks/useAsyncLoader.ts`     | Promise → loading/error/data tuple            | — |

## §15. Hooks — animation & timing

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `useAnimation`            | Hook | `hooks/useAnimation.ts`         | Tween value over duration         | — |
| `useTransition`           | Hook | `hooks/useTransition.ts`        | Enter/exit phase coordinator      | — |
| `useTick`                 | Hook | `hooks/useTick.ts`              | Interval timer with reactive flag | Charts / AI |
| `useTimer`                | Hook | `hooks/useTimer.ts`             | Countdown timer                   | — |
| `useTimeout`              | Hook | `hooks/useTimeout.ts`           | Delayed callback                  | — |
| `useInterval`             | Hook | `hooks/useInterval.ts`          | Repeating callback                | — |
| `useEasedInterval`        | Hook | `hooks/useEasedInterval.ts`     | Eased per-tick value              | — |
| `usePhaseTimer`           | Hook | `hooks/usePhaseTimer.ts`        | Multi-phase timeline driver       | — |
| `useTextCycler`           | Hook | `hooks/useTextCycler.ts`        | Cycle through phrases             | — |
| `useGhostText`            | Hook | `hooks/useGhostText.ts`         | Type-out / delete-out animation   | — |
| `useImperativeAnimation`  | Hook | `hooks/useImperativeAnimation.ts` | Mutable-ref animation loop      | — |
| `useReducedMotion`        | Hook | `hooks/useReducedMotion.ts`     | Honor `prefers-reduced-motion`    | — |

## §16. Hooks — input & interaction

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `useHotkey`              | Hook | `hooks/useHotkey.ts`              | Single-keystroke binding             | — |
| `useKeyChord`            | Hook | `hooks/useKeyChord.ts`            | Multi-key sequences (Ctrl-X Ctrl-S)  | — |
| `useTypeahead`           | Hook | `hooks/useTypeahead.ts`           | "Type-to-jump" in lists              | — |
| `useSearchFilter`        | Hook | `hooks/useSearchFilter.ts`        | Filter state machinery               | — |
| `useMultiSelect`         | Hook | `hooks/useMultiSelect.ts`         | Multi-row selection state            | — |
| `useCommandPalette`      | Hook | `hooks/useCommandPalette.ts`      | Backing state for CommandPalette     | — |
| `useConfirmAction`       | Hook | `hooks/useConfirmAction.ts`       | "Press X again to confirm"           | — |
| `useNotification`        | Hook | `hooks/useNotification.ts`        | Toast queue API                      | — |
| `useWizard`              | Hook | `hooks/useWizard.ts`              | Step-flow state                      | — |
| `usePaste`               | Hook | `hooks/usePaste.ts`               | Bracketed-paste handler              | — |
| `useClipboard`           | Hook | `hooks/useClipboard.ts`           | OSC-52 read/write                    | — |
| `useCopyPasteBuffer`     | Hook | `hooks/useCopyPasteBuffer.ts`     | Selection → clipboard scaffold       | — |
| `useContextMenu`         | Hook | `hooks/useContextMenu.ts`         | Right-click menu state               | — |
| `useDragReorder`         | Hook | `hooks/useDragReorder.ts`         | Reorder by mouse drag                | — |
| `useInfiniteScroll`      | Hook | `hooks/useInfiniteScroll.ts`      | Bottom-trigger pagination            | — |
| `useSortable`            | Hook | `hooks/useSortable.ts`            | Sortable column state                | — |
| `useScroll`              | Hook | `hooks/useScroll.ts`              | Scroll offset + handlers             | — |
| `useVirtualList`         | Hook | `hooks/useVirtualList.ts`         | Windowing math for virt lists        | — |
| `useInlinePrompt`        | Hook | `hooks/useInlinePrompt.ts`        | Bottom-line prompt state             | — |
| `useCollapsibleContent`  | Hook | `hooks/useCollapsibleContent.ts`  | Expand/collapse driver               | — |
| `useModeCycler`          | Hook | `hooks/useModeCycler.ts`          | Cycle through enumerated modes       | — |
| `useAccessibility`       | Hook | `hooks/useAccessibility.ts`       | Live a11y announcements              | — |
| `useAnnounce`            | Hook | `hooks/useAnnounce.ts`            | Imperative ARIA-live announce        | — |
| `useColors`              | Hook | `hooks/useColors.ts`              | Theme.colors shortcut                | All sections |
| `useMeasure`             | Hook | `hooks/useMeasure.ts`             | Live element rect                    | — |
| `useStyleSheet`          | Hook | `hooks/useStyleSheet.ts`          | Apply parsed `.storm.css`            | — |

## §17. Hooks — headless behaviors

> 15 behavior hooks back the high-level components in §3-§8.
> Most users prefer the components, but the hooks are public for
> custom widget authors who want the keyboard model without the
> visual chrome.

`useSelectBehavior`, `useListBehavior`, `useMenuBehavior`,
`useTreeBehavior`, `useTabsBehavior`, `useAccordionBehavior`,
`usePaginatorBehavior`, `useStepperBehavior`, `useTableBehavior`,
`useVirtualListBehavior`, `useDialogBehavior`, `useToastBehavior`,
`useFormBehavior`, `useCalendarBehavior`, `useCollapsibleBehavior`.

| Demo | Headless tab in the explorer demonstrates one of these (e.g. a custom keyboard-driven list using `useListBehavior` rendered in a non-list visual style). |

## §18. Theming

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `useTheme` / `ThemeProvider` / `ThemeContext` | Hook / Component | `theme/provider.ts` | Theme injection | All sections |
| `colors` (default), 11 preset themes          | Constant | `theme/colors.ts`, `theme/presets.ts` | Built-in palettes | Themes |
| `extendTheme` / `createTheme`                  | Function | `theme/index.ts` | Compose custom palette | — |
| `extractThemeOverrides`                        | Function | `theme/index.ts` | Diff a theme against default | — |
| `generateShades` / `generateThemeShades`       | Function | `theme/shades.ts` | Tint/shade ramp generator | — |
| `validateTheme` / `validateContrast`           | Function | `theme/validate.ts` | Theme linter | — |
| `loadTheme` / `parseTheme` / `saveTheme` / `serializeTheme` | Function | `theme/loader.ts` | `.storm.theme.json` round-trip | — |
| `spacing`                                      | Constant | `theme/spacing.ts` | Spacing scale tokens | — |

## §19. Personality & stylesheet

> Personality controls the "voice" of the framework (icon set,
> wording, animation style). Stylesheet provides CSS-style runtime
> theming via `.storm.css` files.

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `defaultPersonality` / `createPersonality` / `mergePersonality` | Function | `core/personality.ts` | Build/extend personality | — |
| `PersonalityProvider` / `usePersonality`                        | Hook / Component | `core/personality.ts` | Inject personality | — |
| `defaultPreset` / `minimalPreset` / `hackerPreset` / `playfulPreset` | Constant | `core/personality-presets.ts` | Built-in personalities | Personality (planned) |
| `createStyleSheet` / `StyleSheet`               | Function / Class | `core/stylesheet.ts` | Build stylesheet rules | — |
| `StyleProvider` / `StyleContext` / `useStyles`  | Component / Hook | `core/style-provider.ts` | Apply stylesheets | — |
| `parseStormCSS` / `createStyleSheetLoader`      | Function | `core/stylesheet-loader.ts` | Read `.storm.css` | — |

## §20. i18n

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `Locale`, `NumberFormat`, `PluralCategory`, `PluralRule` | Type | `core/i18n.ts` | i18n types | — |
| `EN`, `PLURAL_EN`, `PLURAL_AR`, `PLURAL_FR`, `PLURAL_RU`, `PLURAL_JA` | Constant | `core/i18n.ts` | Built-in plural rules | — |
| `registerLocale` / `getLocale` / `getRegisteredLocales` | Function | `core/i18n.ts` | Locale registry | — |
| `formatNumber` / `t` / `plural`                 | Function | `core/i18n.ts` | Format / translate / pluralize | — |
| `LocaleContext` / `LocaleProvider`              | Component | `core/i18n.ts` | Inject locale | — |

## §21. Plugins

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `vimModePlugin`     | Plugin | `plugins/vim-mode.ts`     | hjkl + visual mode for ScrollView/lists | — |
| `compactModePlugin` | Plugin | `plugins/compact-mode.ts` | Removes padding for high-density UIs   | — |
| `autoScrollPlugin`  | Plugin | `plugins/auto-scroll.ts`  | Keep ScrollView at bottom               | — |
| `screenshotPlugin`  | Plugin | `plugins/screenshot.ts`   | Capture buffer to file                  | — |
| `statusBarPlugin`   | Plugin | `plugins/status-bar.ts`   | Inject a status bar at app bottom       | — |

## §22. Middleware

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `MiddlewarePipeline`        | Class       | `core/middleware.ts` | Compose layout/paint middleware | — |
| `scanlineMiddleware`        | Middleware  | `core/middleware.ts` | CRT-style scanline overlay      | — |
| `fpsCounterMiddleware`      | Middleware  | `core/middleware.ts` | Corner FPS readout              | — |
| `debugBorderMiddleware`     | Middleware  | `core/middleware.ts` | Color every box border          | — |
| `darkenColor`               | Function    | `core/middleware.ts` | RGB darken helper               | — |

## §23. DevTools (subsystem)

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `enableDevTools`              | Function | `devtools/enable.ts`            | One-call wireup of all panels   | — |
| `createInspectorMiddleware`   | Function | `devtools/inspector.ts`         | Component-tree inspector        | — |
| `createPerformanceMonitor`    | Function | `devtools/performance-monitor.ts` | FPS / frame metrics tracker   | — |
| `createEventLogger`           | Function | `devtools/event-logger.ts`      | Log key/mouse/paste stream      | — |
| `createDevToolsOverlay`       | Function | `devtools/devtools-overlay.ts`  | The 4-panel overlay shell       | — |
| `createTimeTravel`            | Function | `devtools/time-travel.ts`       | Frame replay                    | — |
| `createRenderHeatmap`         | Function | `devtools/render-heatmap.ts`    | Heatmap of cell-write frequency | — |
| `createAccessibilityAudit`    | Function | `devtools/accessibility-audit.ts` | WCAG audit                    | — |
| `createProfiler`              | Function | `devtools/profiler.ts`          | Per-component profiler          | — |
| `enableCrashLog`              | Function | `devtools/crash-log.ts`         | Persist crashes to file         | — |
| `serializeTree`               | Function | `devtools/tree-view.ts`         | Snapshot the element tree       | — |

## §24. Render & runtime utilities

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `render`                          | Function | `reconciler/render.ts`         | Mount a React tree to terminal | Bootstrap |
| `renderToString`                  | Function | `reconciler/render-to-string.ts` | Headless render               | — |
| `paintBackgroundToBuffer`          | Function | `reconciler/renderer.ts`       | Paint helper                   | — |
| `RenderContext`                    | Class    | `core/render-context.ts`       | Per-app dirty/region state     | — |
| `FocusManager`                     | Class    | `core/focus.ts`                | Focus tree                     | — |
| `AnimationScheduler`               | Class    | `core/animation-scheduler.ts`  | Frame scheduler                | — |
| `ResizeObserver`                   | Function | `core/resize-observer.ts`      | Resize hook plumbing           | — |
| `BrailleCanvas`                    | Class    | `utils/braille-canvas.ts`      | Sub-cell Braille drawing       | — |
| `createAnimation` / `tickAnimation`/ `easings` | Function | `utils/animate.ts`  | Imperative animation loop      | — |
| `enableTreeSitter` / `getTreeSitter` | Function | `utils/tree-sitter.ts`       | Optional WASM syntax tokens    | — |

## §25. Unicode & terminal capability

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `charWidth` / `stringWidth` / `padEndCells` / `padStartCells` / `iterGraphemes` | Function | `core/unicode.ts` | Cell-aware text math | — |
| `detectTerminal` / `terminalInfo`            | Function | `core/terminal-detect.ts` | Probe TERM caps      | — |
| `detectImageCaps` / `bestImageProtocolDetailed` | Function | `core/terminal-caps.ts` | Image protocol pick | — |
| `bestImageProtocol` / `bestKeyboardProtocol` / `bestColorDepth` | Function | `core/adaptive.ts` | Adaptive picks | — |
| `enableKittyKeyboard` / `enableSyncOutput`   | Function | `core/adaptive.ts` | Opt into terminal protocols | — |
| `adaptiveChar` / `adaptiveBorder`            | Function | `core/adaptive.ts` | Char fallback by terminal cap | — |
| `createAdaptiveConfig`                       | Function | `core/adaptive.ts` | Build adaptive config | — |

## §26. Web renderer & SSH (subsystem)

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `WebRenderer`     | Class | `core/web-renderer.ts` | Render to HTML canvas (browser playground) | Playground (separate) |
| `StormSSHServer`  | Class | `ssh/index.ts`         | Serve apps over SSH (optional ssh2 dep)   | `examples/ssh-demo.tsx` |

## §27. Testing harness (subsystem)

| Name | Kind | Source | One-liner | Demo |
|------|------|--------|-----------|------|
| `TestInputManager` / `MockInputManager` | Class | `testing/index.ts` | Mock input | — |
| `renderForTest`                          | Function | `testing/index.ts` | Headless render w/ assertions | Used by tests |
| `expectOutput` / `createSnapshot` / `compareSnapshot` / `clearSnapshots` | Function | `testing/index.ts` | Assertion helpers | — |
| `saveSnapshot` / `compareFileSnapshot`   | Function | `testing/index.ts` | File-backed snapshots | — |
| `saveSvgSnapshot` / `compareSvgSnapshot` / `renderToSvg` | Function | `testing/svg-renderer.ts` | SVG snapshots | — |
| `createStormMatchers`                    | Function | `testing/index.ts` | Vitest matchers | — |

---

## Coverage rollup

The plan target was ≥95% of cataloged features either demoed in
`examples/reacterm-demo.tsx` or explicitly justified as edge-case.
Honest pragmatic numbers after the autonomous build pass:

```
sections in explorer:    21 (Tour / Build / Visualize / Hooks / Internals / Meta)
public exports surfaced: ~140 of ~190 (~74%)
informationally listed:  ~30 (Behaviors / Plugins / DevTools / Middleware
                              cards — hooks/plugins are listed by name,
                              not actually invoked, because they're
                              registered at render() time or back high-level
                              components)
edge-case (not in explorer):
  - WebRenderer       — browser only; lives in playground/
  - StormSSHServer    — ssh2 dep + open port; see examples/ssh-demo.tsx
  - testing harness   — used BY the explorer's tests; not a section
  - core types        — type-only, no runtime
  - low-level ANSI    — used internally; not consumer-facing in a demo
  - render utilities  — RenderContext, FocusManager, etc. — internal plumbing
not yet covered:
  - useFocus / useFocusManager        — needs a focus-trap subsection
  - useTimer / useTimeout / useInterval — covered in spirit by useTick
  - useGhostText / useImperativeAnimation — Animation lab gap
  - Image / Canvas / RevealTransition — Effects gap (Image needs a real file)
  - DirectoryTree / FilePicker / Table — Data gap
  - Form (schema-driven) — Forms section uses individual controls instead
  - CommandPalette as overlay — replaced by sidebar nav
  - Calendar / DatePicker — Display & content gap
  - Tooltip / Alert / ConfirmDialog / Welcome — feedback gap
```

### Section ↔ feature map (concrete)

| Section       | Features actually exercised |
|---------------|------------------------------|
| Welcome       | Spinner, Badge, Divider, ModelBadge, BlinkDot, useTheme |
| Layout        | Box, Text, ScrollView, ListView, Badge |
| Forms         | TextInput, TextArea, MaskedInput, ChatInput, Select, Switch, Checkbox, RadioGroup, Button, Stepper, Tag, Kbd, useInput |
| Search        | SearchList, useSearchFilter (internal) |
| Data          | Tree, DataGrid, RichLog, Pretty |
| Charts        | Sparkline, Gauge, BarChart, LineChart, AreaChart, Histogram, Heatmap, useTick |
| AI            | MessageBubble, OperationTree, StreamingText, ApprovalPrompt, ModelBadge, ContextWindow, CostTracker, TokenStream, CommandBlock, StatusLine |
| Editor        | Editor, Markdown, MarkdownViewer, DiffView, InlineDiff, SyntaxHighlight |
| Effects       | Gradient, GlowText, Shadow, GradientBorder, Digits, Transition, AnimatePresence, Diagram |
| Anim Lab      | useTextCycler, useEasedInterval, useTick (imperative), Sparkline, ShimmerText, BlinkDot |
| Hooks         | useUndoRedo, usePersistentState, memoryStorage, useWizard, useConfirmAction, useHotkey |
| Behaviors     | (15 headless behavior hooks listed by name) |
| i18n          | LocaleProvider, formatNumber, t, plural, PLURAL_* (5 rules), 6 demo locales |
| DevTools      | (4 panels + 3 middlewares listed informationally) |
| Plugins       | (5 plugins listed informationally) |
| Personality   | PersonalityProvider, defaultPreset, minimalPreset, hackerPreset, playfulPreset, Spinner |
| A11y          | useAnnounce, contrastRatio, validateContrast, Badge |
| Capabilities  | detectTerminal, detectImageCaps, bestColorDepth |
| Mouse         | useMousePosition, useMouse, useInput |
| Themes        | 11 preset themes, useTheme, ThemeProvider, Badge, ProgressBar, Spinner |
| About        | Heading, DefinitionList, OrderedList, UnorderedList |

### Globals (used in the shell across all sections)

`render`, `useTui`, `useTerminal`, `useInput` (priority), `Toast`,
`KeyboardHelp`, `Modal`, `Divider`, `Spacer`, `useColors`,
`PersonalityProvider`, `ThemeProvider`.

### Closing the gap

Items in "not yet covered" above are tracked in
[`ROADMAP.md`](../ROADMAP.md). Each will land in a follow-up commit
that expands an existing section rather than adding a 22nd one — the
six-super-section sidebar is at its navigation budget.
