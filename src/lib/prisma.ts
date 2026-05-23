import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolve } from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  const raw = process.env.DATABASE_URL;
  if (raw) {
    const dbUrl = raw.replace("file:", "");
    const adapter = new PrismaLibSql({
      url: `file:${resolve(dbUrl)}`,
    });
    return new PrismaClient({ adapter, log: ["query"] });
  }
  const ctx = getCloudflareContext();
  const db = (ctx.env as any).appmercado_db;
  if (!db) throw new Error("D1 binding appmercado_db não encontrada");
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}

function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = createPrisma();
  return globalForPrisma.prisma;
}

export const prisma = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_, prop) { return Reflect.get(getPrisma(), prop, getPrisma()); },
  set(_, prop, value) { return Reflect.set(getPrisma(), prop, value, getPrisma()); },
  has(_, prop) { return Reflect.has(getPrisma(), prop); },
});
