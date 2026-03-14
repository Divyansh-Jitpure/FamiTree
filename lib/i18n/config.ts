import en from "@/messages/en.json";

export const locales = ["en", "hi"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "hi";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  hi: "हिंदी",
};

export type Dictionary = typeof en;

export function isSupportedLocale(locale: string): locale is AppLocale {
  return locales.includes(locale as AppLocale);
}
