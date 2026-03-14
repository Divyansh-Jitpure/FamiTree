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

async function ensureDefaultFamilyTree(prisma: Awaited<ReturnType<typeof getPrismaClient>>) {
  if (!prisma) {
    return null;
  }

  const existingTree = await prisma.familyTree.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingTree) {
    return existingTree;
  }

  return prisma.familyTree.create({
    data: {
      title: "Jitpure Family Tree",
      description: "Default family tree for the FamiTree workspace.",
    },
  });
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

    const baseTree = await ensureDefaultFamilyTree(prisma);

    if (!baseTree) {
      return {
        treeId: null,
        people: createSamplePeople(home),
        source: "sample",
      };
    }

    const tree = await prisma.familyTree.findUnique({
      where: {
        id: baseTree.id,
      },
      include: {
        people: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!tree) {
      return {
        treeId: baseTree.id,
        people: createSamplePeople(home),
        source: "database",
      };
    }

    if (tree.people.length === 0) {
      return {
        treeId: tree.id,
        people: createSamplePeople(home),
        source: "database",
      };
    }

    const people: FamilyMemberView[] = tree.people.map((person) => ({
      id: person.id,
      name:
        person.displayName?.trim() ||
        [person.firstName, person.lastName].filter(Boolean).join(" "),
      role: person.primaryRelation || home.placeholders.relation,
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
