"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { Dictionary } from "@/lib/i18n/config";
import { createFamilyMemberAction } from "@/lib/family/actions";
import type { FamilyMemberView } from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type FamilyWorkspaceProps = {
  home: HomeCopy;
  initialPeople: FamilyMemberView[];
  locale: string;
  treeId: string | null;
  source: "database" | "sample";
};

type DraftForm = {
  firstName: string;
  lastName: string;
  relation: string;
  city: string;
  note: string;
};

function getStorageKey(locale: string) {
  return `famitree.members.${locale}`;
}

function createEmptyForm(home: HomeCopy): DraftForm {
  return {
    firstName: "",
    lastName: home.placeholders.lastName,
    relation: home.relationOptions[0] ?? "",
    city: "",
    note: "",
  };
}

export function FamilyWorkspace({
  home,
  initialPeople,
  locale,
  treeId,
  source,
}: FamilyWorkspaceProps) {
  const [people, setPeople] = useState<FamilyMemberView[]>(initialPeople);
  const [form, setForm] = useState<DraftForm>(() => createEmptyForm(home));
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (source === "database") {
      setPeople(initialPeople);
      setHasLoadedStorage(true);
      return;
    }

    const stored = window.localStorage.getItem(getStorageKey(locale));

    if (!stored) {
      setPeople(initialPeople);
      setHasLoadedStorage(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as FamilyMemberView[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        setPeople(parsed);
      }
    } catch {
      window.localStorage.removeItem(getStorageKey(locale));
    }

    setHasLoadedStorage(true);
  }, [initialPeople, locale, source]);

  useEffect(() => {
    if (!hasLoadedStorage || source === "database") {
      return;
    }

    window.localStorage.setItem(getStorageKey(locale), JSON.stringify(people));
  }, [hasLoadedStorage, locale, people, source]);

  const focusPerson = people[0];
  const stats = [
    { label: home.stats[0].label, value: String(people.length) },
    {
      label: home.stats[1].label,
      value: String(new Set(people.map((person) => person.role)).size),
    },
    {
      label: home.stats[2].label,
      value: String(
        people.reduce(
          (count, person) =>
            count +
            person.tags.filter((tag) => tag === home.defaultTag).length,
          0
        )
      ),
    },
  ];

  function handleChange(field: keyof DraftForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.firstName.trim() || !form.relation.trim()) {
      setSubmitMessage(home.messages.invalid);
      return;
    }

    if (source === "database" && treeId) {
      const payload = { ...form, treeId };

      startTransition(async () => {
        const result = await createFamilyMemberAction(payload);

        if (!result.ok) {
          setSubmitMessage(
            result.reason === "invalid_input" ? home.messages.invalid : home.messages.databaseUnavailable
          );
          return;
        }

        setForm(createEmptyForm(home));
        setSubmitMessage(home.messages.savedToDatabase);
        router.refresh();
      });

      return;
    }

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const nextPerson: FamilyMemberView = {
      id: `draft-${Date.now()}`,
      name: fullName,
      role: form.relation.trim(),
      meta: form.city.trim() || home.defaultMeta,
      tags: [home.defaultTag, form.note.trim() ? home.noteTag : home.addressTag],
    };

    setPeople((current) => [nextPerson, ...current]);
    setForm(createEmptyForm(home));
    setSubmitMessage(home.messages.savedToBrowser);
  }

  function resetWorkspace() {
    setPeople(initialPeople);
    setForm(createEmptyForm(home));
    if (source === "sample") {
      window.localStorage.removeItem(getStorageKey(locale));
    }
    setSubmitMessage(null);
  }

  return (
    <main className="space-y-8 pb-12">
      <section className="glass overflow-hidden rounded-[2rem]">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                {home.badge}
              </span>
              <span className="inline-flex rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-medium text-[var(--muted)]">
                {home.workspaceStatus}
              </span>
              <span className="inline-flex rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-medium text-[var(--muted)]">
                {source === "database" ? home.databaseModeNotice : home.sampleModeNotice}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
                {home.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                {home.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
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
              <button
                type="button"
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              >
                {home.actions[0]}
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--line)] bg-white/60 px-5 py-3 text-sm font-semibold text-[var(--text)]"
              >
                {home.actions[1]}
              </button>
              <button
                type="button"
                onClick={resetWorkspace}
                className="rounded-full border border-[var(--line)] bg-white/60 px-5 py-3 text-sm font-semibold text-[var(--text)]"
              >
                {home.resetAction}
              </button>
            </div>
          </div>
          <aside className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {home.familyPanelLabel}
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                {people.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {people.map((person) => (
                <article
                  key={`${person.name}-${person.meta}`}
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

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass rounded-[1.75rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {home.formLabel}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{home.formTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{home.formDescription}</p>
          {source === "database" && !treeId ? null : (
            <p className="mt-2 rounded-[1rem] border border-[var(--line)] bg-white/75 px-4 py-3 text-xs leading-6 text-[var(--muted)]">
              {source === "database" ? home.databaseHelperText : home.sampleHelperText}
            </p>
          )}
          {submitMessage ? (
            <p className="mt-2 rounded-[1rem] border border-[var(--line)] bg-white/75 px-4 py-3 text-xs leading-6 text-[var(--muted)]">
              {submitMessage}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{home.fields.firstName}</span>
              <input
                value={form.firstName}
                onChange={(event) => handleChange("firstName", event.target.value)}
                placeholder={home.placeholders.firstName}
                className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{home.fields.lastName}</span>
              <input
                value={form.lastName}
                onChange={(event) => handleChange("lastName", event.target.value)}
                placeholder={home.placeholders.lastName}
                className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{home.fields.relation}</span>
              <select
                value={form.relation}
                onChange={(event) => handleChange("relation", event.target.value)}
                className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              >
                {home.relationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{home.fields.city}</span>
              <input
                value={form.city}
                onChange={(event) => handleChange("city", event.target.value)}
                placeholder={home.placeholders.city}
                className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{home.fields.note}</span>
              <textarea
                value={form.note}
                onChange={(event) => handleChange("note", event.target.value)}
                placeholder={home.placeholders.note}
                rows={4}
                className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending ? home.submitPending : home.submitAction}
            </button>
          </form>
        </aside>

        <section className="glass rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {home.canvasLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{home.canvasTitle}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {home.canvasFilters.map((filter, index) => (
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
                {people.slice(1, 3).map((person) => (
                  <div key={person.name} className="flex flex-col items-center gap-4">
                    <div className="h-16 w-px bg-[var(--line)]" />
                    <div className="rounded-[1.25rem] border border-[var(--line)] bg-white px-5 py-4 text-center shadow-sm">
                      <p className="font-semibold">{person.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{person.role}</p>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-4 lg:col-start-2 lg:row-start-1">
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
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {people.slice(3, 6).map((person) => (
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
