type PrismaClientType = import("@prisma/client").PrismaClient;

declare global {
  var prisma: PrismaClientType | undefined;
}

export async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
  }

  return prisma;
}
