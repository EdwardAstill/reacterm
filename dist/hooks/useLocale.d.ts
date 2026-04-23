import { type Locale } from "../core/i18n.js";
/**
 * Returns the current {@link Locale} from the nearest `<LocaleProvider>`.
 *
 * @example
 * ```tsx
 * function Greeting() {
 *   const locale = useLocale();
 *   return <Text>{t("hello", locale)}</Text>;
 * }
 * ```
 */
export declare function useLocale(): Locale;
//# sourceMappingURL=useLocale.d.ts.map