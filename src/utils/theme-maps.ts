import type { ReactermColors } from "../theme/colors.js";

export function getTypeColors(colors: ReactermColors): Record<string, string> {
  return {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };
}

export function getVariantColors(colors: ReactermColors): Record<string, string> {
  return {
    default: colors.text.dim,
    reacterm: colors.brand.primary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
  };
}

/** Type-to-color map for ConfirmDialog (different keys than Alert). */
export function getDialogTypeColors(colors: ReactermColors): Record<string, string> {
  return {
    info: colors.brand.primary,
    warning: colors.warning,
    danger: colors.error,
  };
}

/** Variant-to-color map for ConfirmDialog action buttons. */
export function getDialogVariantColors(colors: ReactermColors): Record<string, string> {
  return {
    primary: colors.brand.primary,
    danger: colors.error,
    default: colors.text.secondary,
  };
}
