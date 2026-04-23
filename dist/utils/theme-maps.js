export function getTypeColors(colors) {
    return {
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
    };
}
export function getVariantColors(colors) {
    return {
        default: colors.text.dim,
        storm: colors.brand.primary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
    };
}
/** Type-to-color map for ConfirmDialog (different keys than Alert). */
export function getDialogTypeColors(colors) {
    return {
        info: colors.brand.primary,
        warning: colors.warning,
        danger: colors.error,
    };
}
/** Variant-to-color map for ConfirmDialog action buttons. */
export function getDialogVariantColors(colors) {
    return {
        primary: colors.brand.primary,
        danger: colors.error,
        default: colors.text.secondary,
    };
}
//# sourceMappingURL=theme-maps.js.map