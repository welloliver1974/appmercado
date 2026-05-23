import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolve } from "path";

const adapter = new PrismaLibSql({ url: "file:" + resolve(".") + "/dev.db" });
const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany();
console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
