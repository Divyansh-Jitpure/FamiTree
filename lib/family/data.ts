import type { Dictionary } from "@/lib/i18n/config";
import { getPrismaClient } from "@/lib/db/prisma";
import type {
  FamilyMemberView,
  FamilyRelationshipView,
  FamilyWorkspaceData,
} from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

function createSamplePeople(home: HomeCopy): FamilyMemberView[] {
  return home.people.map((person, index) => ({
    id: `sample-${index + 1}`,
    ...person,
  }));
}

function createSampleRelationships(
  home: HomeCopy,
  people: FamilyMemberView[]
): FamilyRelationshipView[] {
  const byName = new Map(people.map((person) => [person.name, person]));

  return home.sampleRelationships
    .map((relationship, index) => {
      const from = byName.get(relationship.fromName);
      const to = byName.get(relationship.toName);

      if (!from || !to) {
        return null;
      }

      return {
        id: `sample-rel-${index + 1}`,
        fromId: from.id,
        toId: to.id,
        fromName: from.name,
        toName: to.name,
        type: relationship.type,
      };
    })
    .filter((relationship): relationship is FamilyRelationshipView => relationship !== null);
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
  const samplePeople = createSamplePeople(home);
  const sampleRelationships = createSampleRelationships(home, samplePeople);

  if (!process.env.DATABASE_URL) {
    return {
      treeId: null,
      people: samplePeople,
      relationships: sampleRelationships,
      source: "sample",
    };
  }

  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        treeId: null,
        people: samplePeople,
        relationships: sampleRelationships,
        source: "sample",
      };
    }

    const baseTree = await ensureDefaultFamilyTree(prisma);

    if (!baseTree) {
      return {
        treeId: null,
        people: samplePeople,
        relationships: sampleRelationships,
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
        relationships: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            from: true,
            to: true,
          },
        },
      },
    });

    if (!tree) {
      return {
        treeId: baseTree.id,
        people: samplePeople,
        relationships: [],
        source: "database",
      };
    }

    if (tree.people.length === 0) {
      return {
        treeId: tree.id,
        people: samplePeople,
        relationships: [],
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

    const relationships: FamilyRelationshipView[] = tree.relationships.map((relationship) => ({
      id: relationship.id,
      fromId: relationship.fromId,
      toId: relationship.toId,
      fromName:
        relationship.from.displayName?.trim() ||
        [relationship.from.firstName, relationship.from.lastName].filter(Boolean).join(" "),
      toName:
        relationship.to.displayName?.trim() ||
        [relationship.to.firstName, relationship.to.lastName].filter(Boolean).join(" "),
      type: relationship.type,
    }));

    return {
      treeId: tree.id,
      people,
      relationships,
      source: "database",
    };
  } catch {
    return {
      treeId: null,
      people: samplePeople,
      relationships: sampleRelationships,
      source: "sample",
    };
  }
}
