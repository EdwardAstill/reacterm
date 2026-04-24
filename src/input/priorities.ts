/**
 * Central registry for `useInput` priorities.
 *
 * Priorities determine which handler receives a key event when multiple
 * components are mounted simultaneously. The highest-priority handlers run
 * first; lower-priority handlers are suppressed unless the higher ones pass
 * the event through (`event.consumed = false`).
 *
 * Rule of thumb: the topmost visible UI layer should have the highest
 * priority. This matches user expectation — Escape inside a ConfirmDialog
 * stacked over a Modal should dismiss the dialog, not the host modal.
 *
 * Numeric gaps let us insert new layers without renumbering.
 */
export const INPUT_PRIORITY = {
  /** Below all custom handlers; default when no priority specified. */
  DEFAULT: 0,
  /** Non-modal in-flow overlays (Welcome banner, inline prompts). */
  INLINE_OVERLAY: 500,
  /** Floating panels that dismiss on trigger-key or Escape (HelpPanel, CommandPalette). */
  FLOATING_PANEL: 900,
  /** Full-screen modal panels (Modal). */
  MODAL: 1000,
  /**
   * Confirmation dialogs that stack OVER modals. Must exceed MODAL so a
   * confirm-over-modal scenario dispatches Escape to the dialog, not the host
   * modal. See robustness.test.ts — "ConfirmDialog Escape wins over Modal".
   */
  CONFIRM_DIALOG: 2000,
} as const;

export type InputPriority = typeof INPUT_PRIORITY[keyof typeof INPUT_PRIORITY];
