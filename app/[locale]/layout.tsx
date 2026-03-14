import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { defaultLocale, isSupportedLocale, type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "hi" }];
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isSupportedLocale(locale) ? locale : defaultLocale;
  const dictionary = await getDictionary(safeLocale);

  return {
    title: dictionary.site.name,
    description: dictionary.site.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale as AppLocale);

  return (
    <div className="shell py-6 md:py-8">
      <Header locale={locale as AppLocale} dictionary={dictionary} />
      {children}
    </div>
  );
}
