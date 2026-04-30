# Draggable Scrollbars Design

## Context

`ScrollView` now supports horizontal overflow, a horizontal scrollbar, and wheel/keyboard scrolling across both axes. The next step is direct manipulation: users should be able to grab a terminal scrollbar thumb with the mouse and drag it to scroll.

This must remain a terminal UI feature. Browser playground behavior is out of scope.

## Goals

- Make vertical and horizontal scrollbar thumbs draggable in real terminal sessions.
- Keep the feature optional so existing `ScrollView` mouse behavior does not change by default.
- Let applications style normal, active, and axis-specific scrollbar visuals.
- Preserve existing wheel and keyboard behavior.
- Demonstrate the feature in `./bin/reacterm.mjs demo horizontal-scroll` with enough content to scroll both vertically and horizontally.

## Non-Goals

- No browser-specific dragging behavior.
- No inertial scrolling, kinetic scrolling, or touch gesture handling.
- No nested scroll synchronization beyond existing hit-testing and active-scroll routing.
- No rewrite of the layout engine beyond any metadata needed to support dragging.

## Proposed Public API

Add optional props to `ScrollViewProps`:

```ts
draggableScrollbars?: boolean;
scrollbarActiveThumbColor?: string | number;
scrollbarActiveTrackColor?: string | number;
verticalScrollbarChar?: string;
verticalScrollbarTrackChar?: string;
horizontalScrollbarChar?: string;
horizontalScrollbarTrackChar?: string;
horizontalScrollbarActiveChar?: string;
verticalScrollbarActiveChar?: string;
```

Behavior defaults:

- `draggableScrollbars` defaults to `false`.
- Existing `scrollbarThumbColor`, `scrollbarTrackColor`, `scrollbarChar`, and `scrollbarTrackChar` continue to work.
- Axis-specific char props override the generic char props for that axis.
- Active style props apply only while a thumb is being dragged or pressed.

## Interaction Model

When `draggableScrollbars` is enabled:

- Mouse press on a vertical thumb starts vertical drag capture.
- Mouse press on a horizontal thumb starts horizontal drag capture.
- Mouse move while captured updates `scrollTop` or `scrollLeft`.
- Mouse release ends capture.
- Drag capture continues even if the pointer leaves the scrollbar bounds.
- Clicking the scrollbar track outside the thumb page-scrolls toward that location.

When `draggableScrollbars` is disabled:

- Pressing scrollbar cells has no new effect.
- Mouse wheel and keyboard behavior remain as implemented today.

## Architecture

### Renderer Geometry

`paintScrollView` already computes viewport size, content size, scroll offsets, and scrollbar thumb positions. It should publish this geometry into the `ScrollView` host props or focus entry:

```ts
type ScrollbarGeometry = {
  vertical?: {
    trackX: number;
    trackY: number;
    trackHeight: number;
    thumbY: number;
    thumbHeight: number;
  };
  horizontal?: {
    trackX: number;
    trackY: number;
    trackWidth: number;
    thumbX: number;
    thumbWidth: number;
  };
};
```

The geometry must be screen-space, not local coordinates, because mouse events arrive in screen coordinates.

### Focus Entry Hooks

Extend the scroll focus entry with optional callbacks:

```ts
onScrollbarPress?: (event: MouseEvent) => boolean;
onScrollbarDrag?: (event: MouseEvent) => void;
onScrollbarRelease?: (event: MouseEvent) => void;
```

`onScrollbarPress` returns `true` when it starts capture. That lets input wiring know whether to consume subsequent move/release events.

### Drag State

`ScrollView` owns drag state in refs:

```ts
type DragState =
  | { axis: "vertical"; pointerStart: number; scrollStart: number }
  | { axis: "horizontal"; pointerStart: number; scrollStart: number }
  | null;
```

Mapping:

- Vertical drag delta uses `event.y - pointerStart`.
- Horizontal drag delta uses `event.x - pointerStart`.
- Scroll value maps through available thumb travel:
  - `trackSpan = trackHeight - thumbHeight` or `trackWidth - thumbWidth`
  - `scrollDelta = pointerDelta / trackSpan * maxScroll`
  - clamp to `[0, maxScroll]` or `[0, maxHScroll]`

If thumb travel is zero, dragging does nothing.

### Input Wiring Capture

`InputWiring` currently routes press and wheel events. It should add a single active scrollbar capture slot:

```ts
private scrollbarCapture:
  | { id: string; onDrag: MouseHandler; onRelease: MouseHandler }
  | null;
```

Routing:

- On mouse press, hit-test scroll views first for scrollbar geometry if dragging is enabled.
- If a scrollbar thumb press starts capture, future move/release goes to that captured scroll view.
- Release clears capture.
- Existing input press handling still works for non-scrollbar presses.

### Track Clicking

Track clicks outside the thumb should page-scroll in the clicked direction:

- Vertical track above thumb: `onScroll(-viewportHeight)`.
- Vertical track below thumb: `onScroll(viewportHeight)`.
- Horizontal track left of thumb: `onHScroll(-viewportWidth)`.
- Horizontal track right of thumb: `onHScroll(viewportWidth)`.

This behavior only exists when `draggableScrollbars` is enabled.

## Styling

Painting should resolve style in this order:

1. Axis-specific active char/color, if currently dragged.
2. Axis-specific normal char/color.
3. Generic scrollbar char/color.
4. Current defaults.

Suggested defaults:

- Vertical thumb: `┃`
- Vertical track: `│`
- Horizontal thumb: `━`
- Horizontal track: `─`
- Active thumb color: existing thumb color if provided, otherwise theme secondary/brand-like emphasis.

The demo should set obvious thumb and active colors so dragging is visible.

## Demo Requirements

Update `examples/debug/horizontal-scroll.tsx`:

- Enable `draggableScrollbars`.
- Include enough rows to overflow vertically.
- Keep rows wide enough to overflow horizontally.
- Add visible active scrollbar styling.
- Keep instructions short:
  - mouse wheel scrolls vertical
  - grab vertical/horizontal bars to drag
  - Shift+wheel or Left/Right scrolls horizontal
  - `q` exits

The CLI entry `./bin/reacterm.mjs demo horizontal-scroll` remains the canonical way to try it.

## Testing Strategy

Add tests before implementation.

Unit/behavior tests:

- `ScrollView` does not drag by default when `draggableScrollbars` is omitted.
- Pressing a vertical thumb and moving the mouse updates `clampedTop`.
- Pressing a horizontal thumb and moving the mouse updates `clampedLeft`.
- Drag capture continues when pointer leaves scrollbar bounds.
- Releasing mouse ends drag capture.
- Clicking vertical track pages vertically.
- Clicking horizontal track pages horizontally.
- Active style renders while dragging.

Regression checks:

- Existing wheel scrolling still works.
- Existing keyboard scrolling still works.
- Existing horizontal wheel fallback behavior still works.
- Existing scrollbar gutter tests still pass.

## Implementation Plan

1. Extend `MouseEvent` testing helpers so tests can emit `move` and `release`, not only `press`.
2. Add failing `ScrollView` tests for disabled dragging, vertical thumb drag, horizontal thumb drag, capture release, and track click.
3. Add scrollbar geometry storage from `paintScrollView`.
4. Extend `FocusManager` entries with scrollbar press/drag/release callbacks.
5. Add drag refs and scroll mapping to `ScrollView`.
6. Extend `InputWiring` with scrollbar capture routing.
7. Add active/axis-specific style props and painting.
8. Update terminal demo and docs.
9. Run focused tests, typecheck, full suite, and the standalone scroll-width optimization script.

## Acceptance Criteria

- [ ] `bun run test src/__tests__/scrollview.test.ts` -> exit 0, including tests for disabled dragging, vertical drag, horizontal drag, capture release, and track clicks.
- [ ] `bun run test src/__tests__/scrollview-gutter.test.ts` -> exit 0.
- [ ] `bun tests/optimization/layout/scrollview-inner-width.ts` -> prints `14 passed, 0 failed`.
- [ ] `bun x tsc --noEmit` -> exit 0.
- [ ] `bun run test` -> exit 0 with all Vitest tests passing.
- [ ] `timeout 1s ./bin/reacterm.mjs demo horizontal-scroll` -> exits 0 or 124 after rendering the terminal demo without throwing.
- [ ] `docs/components/core.md` documents `draggableScrollbars` and the added scrollbar style props.

## Known Limitations

None yet.

## Post-Implementation Review

### Acceptance results

Not implemented yet.

### Scope drift

Not implemented yet.

### Refactor proposals

Not implemented yet.
