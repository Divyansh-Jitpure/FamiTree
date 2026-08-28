"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Dictionary } from "@/lib/i18n/config";
import { FamilyTreeBoard } from "@/components/family-tree-board";
import {
  createFamilyMemberAction,
  createRelationshipAction,
} from "@/lib/family/actions";
import type {
  FamilyMemberView,
  FamilyRelationshipView,
} from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type FamilyTreeCanvasPageProps = {
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

export function FamilyTreeCanvasPage({
  home,
  initialPeople,
  initialRelationships,
  locale,
  treeId,
  source,
}: FamilyTreeCanvasPageProps) {
  const [people, setPeople] = useState<FamilyMemberView[]>(initialPeople);
  const [relationships, setRelationships] = useState<FamilyRelationshipView[]>(initialRelationships);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Load from localStorage in sample mode
  useEffect(() => {
    if (source === "database") {
      setPeople(initialPeople);
      setRelationships(initialRelationships);
      setHasLoadedStorage(true);
      return;
    }

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
    setHasLoadedStorage(true);
  }, [initialPeople, initialRelationships, source]);

  // Sync to localStorage in sample mode
  useEffect(() => {
    if (!hasLoadedStorage || source === "database") return;
    window.localStorage.setItem(getStorageKey(), JSON.stringify(people));
    window.localStorage.setItem(getRelationshipStorageKey(), JSON.stringify(relationships));
  }, [hasLoadedStorage, locale, people, relationships, source]);

  const handleAddPerson = (
    newPerson: FamilyMemberView,
    relationship?: { fromId: string; toId: string; type: string }
  ) => {
    setPeople((prev) => [...prev, newPerson]);

    if (relationship) {
      const fromP =
        people.find((p) => p.id === relationship.fromId) ||
        (relationship.fromId === newPerson.id ? newPerson : null);
      const toP =
        people.find((p) => p.id === relationship.toId) ||
        (relationship.toId === newPerson.id ? newPerson : null);

      const rel: FamilyRelationshipView = {
        id: `rel-${Date.now()}`,
        fromId: relationship.fromId,
        toId: relationship.toId,
        fromName: fromP?.name || "",
        toName: toP?.name || "",
        type: relationship.type,
      };
      setRelationships((prev) => [...prev, rel]);
    }

    if (source === "database" && treeId) {
      startTransition(async () => {
        const nameParts = newPerson.name.split(" ");
        await createFamilyMemberAction({
          treeId,
          firstName: nameParts[0] || newPerson.name,
          lastName: nameParts.slice(1).join(" ") || "",
          relation: newPerson.role,
          city: newPerson.meta || "",
          note: "",
        });
        if (relationship) {
          await createRelationshipAction({
            treeId,
            fromId: relationship.fromId,
            toId: relationship.toId,
            type: relationship.type,
          });
        }
        router.refresh();
      });
    }
  };

  const handleAddRelationship = (fromId: string, toId: string, type: string) => {
    const fromPerson = people.find((p) => p.id === fromId);
    const toPerson = people.find((p) => p.id === toId);
    if (!fromPerson || !toPerson) return;

    const newRel: FamilyRelationshipView = {
      id: `rel-${Date.now()}`,
      fromId,
      toId,
      fromName: fromPerson.name,
      toName: toPerson.name,
      type,
    };

    setRelationships((prev) => [...prev, newRel]);

    if (source === "database" && treeId) {
      startTransition(async () => {
        await createRelationshipAction({ treeId, fromId, toId, type });
        router.refresh();
      });
    }
  };

  const handleUpdatePerson = (updatedPerson: FamilyMemberView) => {
    setPeople((prev) => prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)));
  };

  const handleDeletePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    setRelationships((prev) => prev.filter((r) => r.fromId !== personId && r.toId !== personId));
  };

  return (
    <main className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">
            {home.canvasTitle}
          </h1>
          <p className="text-xs text-[var(--muted)] md:text-sm">
            {home.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            {people.length} Members
          </span>
          <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
            {relationships.length} Connections
          </span>
        </div>
      </div>

      <FamilyTreeBoard
        people={people}
        relationships={relationships}
        focusPersonId={people[0]?.id}
        labels={home.boardLabels}
        home={home}
        isFullscreen={true}
        onAddPerson={handleAddPerson}
        onAddRelationship={handleAddRelationship}
        onUpdatePerson={handleUpdatePerson}
        onDeletePerson={handleDeletePerson}
      />
    </main>
  );
}
