/**
 * Input priority registry invariants.
 *
 * The numeric ladder in src/input/priorities.ts is load-bearing:
 *
 *   CONFIRM_DIALOG > MODAL > FLOATING_PANEL > INLINE_OVERLAY > DEFAULT
 *
 * A renumbering that flips this order would silently break stacked overlays
 * (e.g. ConfirmDialog mounted over Modal would stop receiving Escape, and
 * the host modal would close instead). These tests fail loudly if the
 * constants drift.
 */

import { describe, it, expect } from "vitest";
import { INPUT_PRIORITY } from "../input/priorities.js";

describe("INPUT_PRIORITY registry", () => {
  it("CONFIRM_DIALOG outranks MODAL (dialogs close before host modals)", () => {
    expect(INPUT_PRIORITY.CONFIRM_DIALOG).toBeGreaterThan(INPUT_PRIORITY.MODAL);
  });

  it("MODAL outranks FLOATING_PANEL (modal trap beats help/command panels)", () => {
    expect(INPUT_PRIORITY.MODAL).toBeGreaterThan(INPUT_PRIORITY.FLOATING_PANEL);
  });

  it("FLOATING_PANEL outranks INLINE_OVERLAY", () => {
    expect(INPUT_PRIORITY.FLOATING_PANEL).toBeGreaterThan(INPUT_PRIORITY.INLINE_OVERLAY);
  });

  it("INLINE_OVERLAY outranks DEFAULT", () => {
    expect(INPUT_PRIORITY.INLINE_OVERLAY).toBeGreaterThan(INPUT_PRIORITY.DEFAULT);
  });

  it("DEFAULT is zero (below all named tiers)", () => {
    expect(INPUT_PRIORITY.DEFAULT).toBe(0);
  });

  it("tiers leave insertion room (gaps ≥ 100 between neighbours)", () => {
    const tiers = [
      INPUT_PRIORITY.DEFAULT,
      INPUT_PRIORITY.INLINE_OVERLAY,
      INPUT_PRIORITY.FLOATING_PANEL,
      INPUT_PRIORITY.MODAL,
      INPUT_PRIORITY.CONFIRM_DIALOG,
    ];
    for (let i = 0; i < tiers.length - 1; i++) {
      expect(tiers[i + 1]! - tiers[i]!).toBeGreaterThanOrEqual(100);
    }
  });
});
