export const supportedLocales = ["en", "he"] as const;

export type Locale = (typeof supportedLocales)[number];
export type TextDirection = "ltr" | "rtl";

export const defaultLocale: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}

export function getTextDirection(locale: Locale): TextDirection {
  return locale === "he" ? "rtl" : "ltr";
}
