import { type ReactNode } from "react";
export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
export interface PluralRule {
    /** Given a number, return the plural category */
    select: (n: number) => PluralCategory;
}
/** English: 1 = "one", everything else = "other" */
export declare const PLURAL_EN: PluralRule;
/** Arabic: 0="zero", 1="one", 2="two", 3-10="few", 11-99="many", 100+="other" */
export declare const PLURAL_AR: PluralRule;
/** French/Portuguese: 0-1 = "one", 2+ = "other" */
export declare const PLURAL_FR: PluralRule;
/** Russian/Polish: complex Slavic plurals */
export declare const PLURAL_RU: PluralRule;
/** Japanese/Chinese/Korean: no plural forms */
export declare const PLURAL_JA: PluralRule;
export interface NumberFormat {
    /** Decimal separator, e.g. "." or "," */
    readonly decimal: string;
    /** Thousands separator, e.g. "," or "." */
    readonly thousands: string;
    /** Digits per group (typically 3) */
    readonly grouping: number;
}
export interface Locale {
    /** ISO 639-1 code, e.g. "en", "ja", "ar" */
    readonly code: string;
    /** Text direction */
    readonly direction: "ltr" | "rtl";
    /** Number formatting */
    readonly numbers: NumberFormat;
    /** Full month names (January..December) */
    readonly months: readonly string[];
    /** Short month names (Jan..Dec) */
    readonly monthsShort: readonly string[];
    /** Full weekday names (Sunday..Saturday) */
    readonly weekdays: readonly string[];
    /** Short weekday names (Sun..Sat) */
    readonly weekdaysShort: readonly string[];
    /** Translatable UI strings keyed by dot-path */
    readonly strings: Readonly<Record<string, string>>;
    /** Plural rule for this locale (defaults to English rules if omitted) */
    readonly pluralRule?: PluralRule;
}
export declare const EN: Locale;
/** Register a locale for later lookup by code. */
export declare function registerLocale(locale: Locale): void;
/** Retrieve a registered locale by code. */
export declare function getLocale(code: string): Locale | undefined;
/** List all registered locale codes. */
export declare function getRegisteredLocales(): string[];
/**
 * Format a number according to the locale's decimal/thousands conventions.
 *
 * @example
 * ```ts
 * formatNumber(1234567.89, EN); // "1,234,567.89"
 * ```
 */
export declare function formatNumber(n: number, locale: Locale): string;
/**
 * Translate a key with optional parameter interpolation.
 *
 * Parameters are replaced using `{name}` placeholders.
 * Falls back to the key itself if no translation is found.
 *
 * @example
 * ```ts
 * const locale = { ...EN, strings: { "greeting": "Hello, {name}!" } };
 * t("greeting", locale, { name: "World" }); // "Hello, World!"
 * t("missing.key", locale); // "missing.key"
 * ```
 */
export declare function t(key: string, locale: Locale, params?: Record<string, string | number>): string;
/**
 * Select the correct plural form for a number.
 *
 * Looks up `${key}.${category}` in the locale's strings (or provided
 * `strings` override), falling back to `${key}.other`, then to `${count}`.
 * Interpolates `{count}` with the number.
 *
 * @example
 * ```ts
 * const messages = {
 *   "items.one": "{count} item",
 *   "items.other": "{count} items",
 *   "items.zero": "No items",
 * };
 * plural("items", 0, EN, messages); // "No items"
 * plural("items", 1, EN, messages); // "1 item"
 * plural("items", 5, EN, messages); // "5 items"
 * ```
 */
export declare function plural(key: string, count: number, locale: Locale, strings?: Record<string, string>): string;
export declare const LocaleContext: import("react").Context<Locale>;
/**
 * Provider component that sets the locale for the subtree.
 *
 * @example
 * ```tsx
 * <LocaleProvider locale={myLocale}>
 *   <App />
 * </LocaleProvider>
 * ```
 */
export declare function LocaleProvider({ locale, children, }: {
    locale: Locale;
    children?: ReactNode;
}): import("react").FunctionComponentElement<import("react").ProviderProps<Locale>>;
/**
 * Read the current locale from context. Falls back to EN.
 * Prefer using this via the `useLocale` hook from `hooks/useLocale.js`.
 */
export declare function useLocaleContext(): Locale;
//# sourceMappingURL=i18n.d.ts.map