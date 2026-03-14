import { getDictionary } from "@/lib/i18n/dictionaries";
import { type AppLocale } from "@/lib/i18n/config";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as AppLocale);
  const people = dictionary.home.people;
  const focusPerson = people[0];

  return (
    <main className="space-y-8 pb-12">
      <section className="glass overflow-hidden rounded-[2rem]">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                {dictionary.home.badge}
              </span>
              <span className="inline-flex rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-medium text-[var(--muted)]">
                {dictionary.home.workspaceStatus}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
                {dictionary.home.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                {dictionary.home.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {dictionary.home.stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/75 px-4 py-4"
                >
                  <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {dictionary.home.actions.map((action, index) => (
                <button
                  key={action}
                  type="button"
                  className={`rounded-full px-5 py-3 text-sm font-semibold ${
                    index === 0
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-white/60 text-[var(--text)]"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
          <aside className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {dictionary.home.familyPanelLabel}
            </p>
            <div className="mt-4 space-y-3">
              {people.map((person) => (
                <article
                  key={person.name}
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                      {person.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-[var(--muted)]">{person.meta}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
                    {person.role}
                  </span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass rounded-[1.75rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {dictionary.home.detailsLabel}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)]">
                  {focusPerson.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{focusPerson.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{focusPerson.meta}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusPerson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
              <h3 className="font-semibold">{dictionary.home.infoLabel}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                {dictionary.home.infoRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-[var(--muted)]">{row.label}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>

        <section className="glass rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {dictionary.home.canvasLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{dictionary.home.canvasTitle}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {dictionary.home.canvasFilters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    index === 0
                      ? "bg-[var(--forest)] text-white"
                      : "border border-[var(--line)] bg-white/80"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(180deg,#fffefb_0%,#f7f1e7_100%)] p-5">
            <div className="flex min-h-[420px] flex-col justify-between">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-px bg-[var(--line)]" />
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-white px-5 py-4 text-center shadow-sm">
                    <p className="font-semibold">{people[1].name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{people[1].role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-[1.5rem] border-2 border-[var(--accent-soft)] bg-white px-6 py-5 text-center shadow-sm">
                    <p className="text-lg font-bold">{focusPerson.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{focusPerson.meta}</p>
                    <div className="mt-3 flex justify-center gap-2">
                      {focusPerson.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-16 w-px bg-[var(--line)]" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-px bg-[var(--line)]" />
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-white px-5 py-4 text-center shadow-sm">
                    <p className="font-semibold">{people[2].name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{people[2].role}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {people.slice(3).map((person) => (
                  <div key={person.name} className="flex flex-col items-center gap-3">
                    <div className="h-10 w-px bg-[var(--line)]" />
                    <div className="w-full rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-4 text-center shadow-sm">
                      <p className="font-semibold">{person.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{person.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
