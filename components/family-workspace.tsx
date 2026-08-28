"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Dictionary } from "@/lib/i18n/config";
import { FamilyTreeBoard } from "@/components/family-tree-board";
import type {
  FamilyMemberView,
  FamilyRelationshipView,
} from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type FamilyWorkspaceProps = {
  home: HomeCopy;
  initialPeople: FamilyMemberView[];
  initialRelationships: FamilyRelationshipView[];
  locale: string;
  treeId: string | null;
  source: "database" | "sample";
};

function getStorageKey() {
  return "famitree.members.shared";
}

function getRelationshipStorageKey() {
  return "famitree.relationships.shared";
}

export function FamilyWorkspace({
  home,
  initialPeople,
  initialRelationships,
  locale,
  source,
}: FamilyWorkspaceProps) {
  const [people, setPeople] = useState<FamilyMemberView[]>(initialPeople);
  const [relationships, setRelationships] = useState<FamilyRelationshipView[]>(initialRelationships);

  useEffect(() => {
    if (source === "database") return;

    const stored = window.localStorage.getItem(getStorageKey());
    const storedRel = window.localStorage.getItem(getRelationshipStorageKey());

    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored) as FamilyMemberView[];
        if (Array.isArray(parsed)) {
          const sampleMap = new Map(initialPeople.map((p) => [p.id, p]));
          const mergedPeople = parsed.map((person) => {
            if (person.id.startsWith("sample-")) {
              const localized = sampleMap.get(person.id);
              if (localized) {
                return {
                  ...person,
                  name: localized.name,
                  role: localized.role,
                  meta: localized.meta,
                };
              }
            }
            return person;
          });
          setPeople(mergedPeople);
        }
      } catch {
        /* fallback */
      }
    }
    if (storedRel !== null) {
      try {
        const parsedRel = JSON.parse(storedRel);
        if (Array.isArray(parsedRel)) setRelationships(parsedRel);
      } catch {
        /* fallback */
      }
    }
  }, [initialPeople, source]);

  const stats = [
    { label: home.stats[0].label, value: String(people.length) },
    {
      label: home.stats[1].label,
      value: String(new Set(people.map((person) => person.role)).size),
    },
    {
      label: home.stats[2].label,
      value: String(relationships.length),
    },
  ];

  return (
    <main className="space-y-8 pb-12">
      {/* Hero Banner Section */}
      <section className="glass overflow-hidden rounded-[2rem]">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-10">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                {home.badge}
              </span>
              <span className="inline-flex rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-medium text-[var(--muted)]">
                {source === "database" ? home.databaseModeNotice : home.sampleModeNotice}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
                {home.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                {home.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <article
                  key={`stat-${index}-${stat.label}`}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/75 px-4 py-4 shadow-sm"
                >
                  <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--text)]">{stat.value}</p>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/${locale}/tree`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-95"
              >
                <span>Launch Interactive Canvas</span>
                <span className="text-lg">➔</span>
              </Link>
              <Link
                href={`/${locale}/members`}
                className="rounded-full border border-[var(--line)] bg-white/80 px-5 py-3.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white"
              >
                View Family Directory ({people.length})
              </Link>
            </div>
          </div>

          {/* Quick Recent Members Panel */}
          <aside className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Recent Family Members
              </p>
              <Link
                href={`/${locale}/members`}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {people.slice(0, 5).map((person, index) => (
                <article
                  key={`person-list-${index}-${person.id}`}
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                      {person.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm">{person.name}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{person.meta}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#edf4ee] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--forest)] shrink-0">
                    {person.role}
                  </span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Embedded Canvas Board Preview */}
      <section className="glass rounded-[1.75rem] p-5 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {home.canvasLabel}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{home.canvasTitle}</h2>
          </div>
          <Link
            href={`/${locale}/tree`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline"
          >
            <span>Open Fullscreen Canvas</span>
            <span>↗</span>
          </Link>
        </div>

        <div className="mt-4">
          <FamilyTreeBoard
            people={people}
            relationships={relationships}
            focusPersonId={people[0]?.id}
            labels={home.boardLabels}
            home={home}
            isFullscreen={false}
          />
        </div>
      </section>
    </main>
  );
}
