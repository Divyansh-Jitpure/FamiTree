import Link from "next/link";

import { localeLabels, locales, type AppLocale, type Dictionary } from "@/lib/i18n/config";

type HeaderProps = {
  locale: AppLocale;
  dictionary: Dictionary;
};

export function Header({ locale, dictionary }: HeaderProps) {
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
          className="rounded-full px-4 py-2 text-sm font-medium transition hover:bg-[var(--accent-soft)]"
        >
          {dictionary.nav.home}
        </Link>
        <div className="ml-0 flex gap-2 md:ml-2">
          {locales.map((item) => (
            <Link
              key={item}
              href={`/${item}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                item === locale
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-white/70"
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
