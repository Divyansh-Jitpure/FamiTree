"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { localeLabels, locales, type AppLocale, type Dictionary } from "@/lib/i18n/config";

type HeaderProps = {
  locale: AppLocale;
  dictionary: Dictionary;
};

export function Header({ locale, dictionary }: HeaderProps) {
  const pathname = usePathname();

  const getLocalePath = (targetLocale: AppLocale) => {
    if (!pathname) return `/${targetLocale}`;
    const segments = pathname.split("/");
    if (segments.length > 1 && locales.includes(segments[1] as AppLocale)) {
      segments[1] = targetLocale;
      return segments.join("/");
    }
    return `/${targetLocale}`;
  };

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-[var(--line)] bg-white/65 px-5 py-4 backdrop-blur md:mb-8 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <Link href={`/${locale}`} className="text-xl font-bold tracking-tight">
          {dictionary.site.name}
        </Link>
        <p className="text-sm text-[var(--muted)]">{dictionary.site.tagline}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            pathname === `/${locale}`
              ? "bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
              : "hover:bg-[var(--accent-soft)]"
          }`}
        >
          {dictionary.nav.home}
        </Link>
        <Link
          href={`/${locale}/tree`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            pathname === `/${locale}/tree`
              ? "bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
              : "hover:bg-[var(--accent-soft)]"
          }`}
        >
          {dictionary.nav.tree}
        </Link>
        <Link
          href={`/${locale}/members`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            pathname === `/${locale}/members`
              ? "bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
              : "hover:bg-[var(--accent-soft)]"
          }`}
        >
          {dictionary.nav.members}
        </Link>
        <div className="ml-0 flex gap-2 md:ml-2">
          {locales.map((item) => (
            <Link
              key={item}
              href={getLocalePath(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                item === locale
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-white/70 hover:bg-white"
              }`}
            >
              {localeLabels[item]}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
