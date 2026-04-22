---
name: reacterm
description: >
  Use when working in the reacterm/Storm codebase. Covers where the docs live,
  how to run and verify the project, the main rendering/input architecture, and
  the project-specific component patterns that matter when editing examples,
  docs, hooks, or UI components.
---

# Reacterm / Storm

Storm is a React-based terminal UI framework. This repo contains the core renderer, components, hooks, examples, widgets, docs, and tests.

## Quick orientation

- Package/runtime: Node.js 20+, Bun available and used in local workflows
- Main package file: `package.json`
- Public exports: `src/index.ts` and `src/components/index.ts`
- Core docs entrypoints:
  - `README.md`
  - `docs/getting-started.md`
  - `docs/components.md`
  - `docs/hook-guide.md`
  - `docs/recipes.md`
  - `docs/pitfalls.md`

## Commands

Use these first:

```bash
bun x tsc --noEmit
bun test
```

Useful focused commands:

```bash
bun test src/__tests__/tree.test.ts
bun test src/__tests__/table.test.ts
npx tsx examples/ui-terminal/showcase/dock.tsx
```

## How the repo is organized

- `src/components/core/` — primitive UI pieces like `Box`, `Text`, `TextInput`
- `src/components/data/` — structured data views like `Table`, `DataGrid`, `Tree`
- `src/components/extras/` — higher-level controls like `SearchInput`, `CommandPalette`, `DirectoryTree`
- `src/hooks/` — public hooks
- `src/hooks/headless/` — behavior-only hooks used by components and advanced consumers
- `src/widgets/` — AI-specific widgets and composite UI
- `src/testing/` and `src/__tests__/` — test utilities and test suite
- `examples/` — runnable demos/showcases
- `docs/` — canonical documentation

## Project rules that matter when editing code

### 1. Prefer refs + `requestRender()` for high-frequency updates

Storm has a custom reconciler. Frequent animation-like updates should usually use refs and imperative repaint, not React state churn.

Read:
- `docs/getting-started.md`
- `docs/pitfalls.md`

### 2. Use `useCleanup()` for cleanup in Storm-managed components

Do not assume regular React effect cleanup is the right pattern everywhere in this repo. Follow the existing component style.

### 3. Scroll containers need constraints

`ScrollView` and similar components need a height or flex constraint. If scrolling seems broken, check layout first.

### 4. Verify exports and docs when changing public components

If you touch a public component:
- update docs in `docs/components/*.md`
- update recipes or getting-started docs if usage changed materially
- add or update tests in `src/__tests__/`

## Patterns already established in this repo

### Trees and sidebars

Use `Tree` for hierarchical sidebars and dock-style navigation. It now supports:

- expand/collapse via `onToggle`
- controlled selection via `selectedKey`
- row activation via `onSelect`
- highlight tracking via `onHighlightChange`
- keyboard navigation
- mouse row clicks and disclosure-marker clicks
- custom row rendering via `renderNode`

Relevant files:
- `src/components/data/Tree.tsx`
- `src/hooks/headless/useTreeBehavior.ts`
- `src/__tests__/tree.test.ts`
- `docs/components/data.md`

### Tables in narrow panes

`Table` auto-sized columns fit available width by default. If the table has an explicit width or sits in a constrained pane, wide columns shrink with ellipsis rather than forcing the whole layout wider.

Relevant files:
- `src/components/table/Table.tsx`
- `src/utils/table-render.ts`
- `src/__tests__/table.test.ts`
- `docs/components/data.md`

### Search

There are two common search/filter patterns:

1. Visible search field with `SearchInput`
2. Hidden type-to-filter behavior inside pickers/lists

`SearchInput` is controlled only. It does not filter data itself. The app owns:
- query state
- filtering logic
- result counts

Matching patterns used in the repo:
- substring match: `toLowerCase().includes(...)`
- fuzzy matching for command pickers/palettes

Relevant files:
- `src/components/extras/SearchInput.tsx`
- `src/components/core/SelectInput.tsx`
- `src/components/extras/CommandPalette.tsx`
- `src/widgets/ai/CommandDropdown.tsx`
- `docs/components/input.md`

## When editing examples

Examples should show real framework usage, not duplicate core behavior in ad hoc ways when a real component already exists.

Example:
- a dock/sidebar tree should prefer `Tree`
- a filesystem browser should prefer `DirectoryTree`
- a searchable picker should prefer `SearchInput` or a built-in filterable list pattern

If an example exposes a framework gap, prefer improving the core component and then switching the example to use it.

## Documentation map

- Public component API docs: `docs/components/`
- Practical copy-paste examples: `docs/recipes.md`
- High-level onboarding: `docs/getting-started.md`
- Hook selection and headless behaviors: `docs/hook-guide.md`
- Performance and reconciler gotchas: `docs/pitfalls.md`, `docs/performance.md`

## Good workflow for changes

1. Read the component/hook implementation and its docs
2. Check for an existing test file in `src/__tests__/`
3. Patch the implementation
4. Patch docs if the public behavior changed
5. Run `bun x tsc --noEmit`
6. Run relevant tests, then `bun test` if the change is broad

## Do not duplicate these abstractions

Before inventing a new component, check whether one of these already fits:

- hierarchy: `Tree`, `DirectoryTree`
- tabular data: `Table`, `DataGrid`
- text input: `TextInput`, `SearchInput`, `TextArea`
- filtered selection: `SelectInput`, `Select`, `SelectionList`, `CommandPalette`, `CommandDropdown`

If the existing abstraction is close, improve it first.
