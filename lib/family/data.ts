import type { Dictionary } from "@/lib/i18n/config";
import { getPrismaClient } from "@/lib/db/prisma";
import type { FamilyMemberView, FamilyWorkspaceData } from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

function createSamplePeople(home: HomeCopy): FamilyMemberView[] {
  return home.people.map((person, index) => ({
    id: `sample-${index + 1}`,
    ...person,
  }));
}

function buildMeta(person: {
  city: string | null;
  state: string | null;
  country: string | null;
}) {
  const parts = [person.city, person.state, person.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function getFamilyWorkspaceData(
  home: HomeCopy
): Promise<FamilyWorkspaceData> {
  if (!process.env.DATABASE_URL) {
    return {
      treeId: null,
      people: createSamplePeople(home),
      source: "sample",
    };
  }

  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        treeId: null,
        people: createSamplePeople(home),
        source: "sample",
      };
    }

    const tree = await prisma.familyTree.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        people: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!tree || tree.people.length === 0) {
      return {
        treeId: tree?.id ?? null,
        people: createSamplePeople(home),
        source: "sample",
      };
    }

    const people: FamilyMemberView[] = tree.people.map((person) => ({
      id: person.id,
      name:
        person.displayName?.trim() ||
        [person.firstName, person.lastName].filter(Boolean).join(" "),
      role: person.gender || home.placeholders.relation,
      meta: buildMeta(person) || home.defaultMeta,
      tags: [
        person.photoUrl ? home.defaultTag : home.addressTag,
        person.notes ? home.noteTag : home.addressTag,
      ],
    }));

    return {
      treeId: tree.id,
      people,
      source: "database",
    };
  } catch {
    return {
      treeId: null,
      people: createSamplePeople(home),
      source: "sample",
    };
  }
}
