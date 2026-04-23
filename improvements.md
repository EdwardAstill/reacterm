# Reacterm Improvements

This file records follow-up improvements discovered while integrating and
debugging `reacterm` inside `dash`.

## 1. Extract terminal glyph width logic into a dedicated library

### Problem

Terminal Unicode width is not reliably determined by Unicode data alone.

Examples seen in real usage:

- Some symbols render consistently as narrow text glyphs.
- Some symbols render consistently as wide emoji glyphs.
- Some symbols are font/terminal dependent and behave differently on the same
  machine depending on the glyph:
  - `☔` / `☔︎` / `☔️`
  - `☀` / `☀︎` / `☀️`
  - `☁` / `☁︎` / `☁️`
  - `⛅` / `⛅︎` / `⛅️`

This creates layout bugs in tight terminal UIs:

- borders appear to shift
- header alignment breaks
- cards look like they have incorrect width calculations
- the bug can be mistaken for a scrollbar or clipping issue

### Why `reacterm` should not keep this as ad hoc logic forever

`reacterm` currently needs to answer several related but distinct questions:

- What is the semantic Unicode width of a grapheme cluster?
- What width do common terminals actually render?
- How should ambiguous-width symbols be treated in layout-critical components?
- When should the framework prefer a safe fallback icon over a decorative glyph?

That is a real domain, not just a utility function.

### Suggested improvement

Create a separate library focused on terminal glyph measurement and ambiguity
handling. `reacterm` can depend on it rather than growing one-off rules in
`core/unicode`.

Possible scope for the library:

- grapheme segmentation
- Unicode width tables
- emoji-presentation selector handling
- text-presentation selector handling
- ambiguous-width symbol registry
- terminal/font profile overrides
- safe-icon normalization helpers
- "layout-safe" mode for TUI components
- fixtures and regression tests for known problematic glyphs

Potential API ideas:

- `stringWidth(text, options)`
- `graphemeWidth(segment, options)`
- `isAmbiguousTerminalGlyph(text)`
- `normalizeForTerminalIcon(text, { safe: true })`
- `pickSafeIcon({ preferred, fallback, tightLayout })`

The important design point is to separate:

1. Unicode-theoretical width
2. terminal-practical width
3. application-safe fallback choice

## 2. Keep scrollbar/layout math under one contract

The scrollbar issue uncovered during this debugging session came from layout
and renderer using slightly different rules for reserved width.

Improvement direction:

- keep viewport reserve logic in one shared place
- ensure layout, clipping, hit-testing, and host viewport metadata all use the
  same effective width
- test overflow and non-overflow cases separately

This is less fundamental than the glyph-width problem, but it should stay under
the same "layout correctness" bucket.

## 3. Add a documented safe-icon policy for tight layouts

For narrow headers, tables, and bordered cards, `reacterm` should document a
recommended policy:

- use ASCII or text-presentation-safe symbols in tight layouts
- reserve decorative emoji for roomy layouts
- provide helpers so component authors do not rediscover terminal glyph bugs by
  accident

That policy can live in docs even before the glyph library exists.
