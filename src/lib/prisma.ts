import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolve } from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL não configurada");
  const dbUrl = raw.replace("file:", "");
  const adapter = new PrismaLibSql({
    url: `file:${resolve(dbUrl)}`,
  });
  return new PrismaClient({ adapter, log: ["query"] });
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
