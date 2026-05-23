import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (process.env.DATABASE_URL) {
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const { resolve } = await import("path");
    const dbUrl = process.env.DATABASE_URL.replace("file:", "");
    const adapter = new PrismaLibSql({ url: `file:${resolve(dbUrl)}` });
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["query"] });
  } else {
    const { PrismaD1 } = await import("@prisma/adapter-d1");
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as any).appmercado_db;
    if (!db) throw new Error("D1 binding appmercado_db não encontrada");
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaD1(db) });
  }
  return globalForPrisma.prisma;
}
