import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function auth(): Promise<{ user: { id: string; name: string | null; email: string | null } } | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user-id")?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) return null;
  return { user: { id: user.id, name: user.name, email: user.email } };
}

export { auth };
