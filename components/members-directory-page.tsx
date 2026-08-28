"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/config";
import type { FamilyMemberView } from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type MembersDirectoryPageProps = {
  home: HomeCopy;
  initialPeople: FamilyMemberView[];
  locale: string;
};

function getStorageKey() {
  return "famitree.members.shared";
}

export function MembersDirectoryPage({
  home,
  initialPeople,
  locale,
}: MembersDirectoryPageProps) {
  const [people, setPeople] = useState<FamilyMemberView[]>(initialPeople);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => {
    const stored = window.localStorage.getItem(getStorageKey());
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
  }, [initialPeople]);

  const roles = Array.from(new Set(people.map((p) => p.role)));

  const filteredPeople = people.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(search.toLowerCase()) ||
      person.meta?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === "all" || person.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <main className="space-y-6 pb-12">
      <div className="glass rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              {people.length} Total Members
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {home.familyPanelLabel}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Search and filter your entire family directory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member or location..."
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Roles ({people.length})</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => (
            <article
              key={person.id}
              className="flex items-start gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-base font-bold text-[var(--accent)]">
                {person.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold text-[var(--text)]">{person.name}</h3>
                  <span className="rounded-full bg-[#edf4ee] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--forest)] shrink-0">
                    {person.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{person.meta}</p>

                {person.tags && person.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {person.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {filteredPeople.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-[var(--muted)]">
              {people.length === 0
                ? "Your family directory is empty."
                : "No family members match your search query."}
            </p>
            {people.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem(getStorageKey());
                  window.localStorage.removeItem("famitree.relationships.shared");
                  setPeople(initialPeople);
                }}
                className="mt-4 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-xs font-bold text-[var(--text)] shadow-sm hover:bg-gray-50"
              >
                Restore Sample Tree
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
