import "server-only";

import type { AppLocale, Dictionary } from "@/lib/i18n/config";

const dictionaries: Record<AppLocale, () => Promise<Dictionary>> = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  hi: () => import("@/messages/hi.json").then((module) => module.default),
};

export async function getDictionary(locale: AppLocale) {
  return dictionaries[locale]();
}
