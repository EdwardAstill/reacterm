/** Paint-order bands shared by built-in terminal overlays. */
export const OVERLAY_LAYER = {
  INLINE: 10_000,
  WINDOW_BASE: 20_000,
  FLOATING_PANEL: 30_000,
  MODAL: 40_000,
  CONFIRM_DIALOG: 50_000,
} as const;
