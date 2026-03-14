"use server";

import { revalidatePath } from "next/cache";

import { getPrismaClient } from "@/lib/db/prisma";

type CreateFamilyMemberInput = {
  treeId: string | null;
  firstName: string;
  lastName: string;
  relation: string;
  city: string;
  note: string;
};

export async function createFamilyMemberAction(input: CreateFamilyMemberInput) {
  if (!process.env.DATABASE_URL || !input.treeId) {
    return {
      ok: false,
      reason: "database_unavailable" as const,
    };
  }

  const firstName = input.firstName.trim();
  const relation = input.relation.trim();

  if (!firstName || !relation) {
    return {
      ok: false,
      reason: "invalid_input" as const,
    };
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return {
      ok: false,
      reason: "database_unavailable" as const,
    };
  }

  await prisma.person.create({
    data: {
      familyTreeId: input.treeId,
      firstName,
      lastName: input.lastName.trim() || null,
      displayName: [firstName, input.lastName.trim()].filter(Boolean).join(" "),
      city: input.city.trim() || null,
      notes: input.note.trim() || null,
      primaryRelation: relation,
    },
  });

  revalidatePath("/[locale]", "page");

  return {
    ok: true,
    reason: null,
  };
}

type CreateRelationshipInput = {
  treeId: string | null;
  fromId: string;
  toId: string;
  type: string;
};

export async function createRelationshipAction(input: CreateRelationshipInput) {
  if (!process.env.DATABASE_URL || !input.treeId) {
    return {
      ok: false,
      reason: "database_unavailable" as const,
    };
  }

  const type = input.type.trim();

  if (!input.fromId || !input.toId || !type || input.fromId === input.toId) {
    return {
      ok: false,
      reason: "invalid_input" as const,
    };
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return {
      ok: false,
      reason: "database_unavailable" as const,
    };
  }

  await prisma.relationship.create({
    data: {
      familyTreeId: input.treeId,
      fromId: input.fromId,
      toId: input.toId,
      type,
    },
  });

  revalidatePath("/[locale]", "page");

  return {
    ok: true,
    reason: null,
  };
}
