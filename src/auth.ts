import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { cookies } from "next/headers";

const { handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

async function auth(): Promise<{ user: { id: string; name: string | null; email: string | null } } | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user-id")?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) return null;
  return { user: { id: user.id, name: user.name, email: user.email } };
}

export { handlers, auth, signIn, signOut };
