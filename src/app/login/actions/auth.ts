"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function authenticate(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Preencha email e senha." };

  const envPassword = process.env.AUTH_PASSWORD;
  if (!envPassword || password !== envPassword) return { error: "Email ou senha inválidos." };

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  const cookieStore = await cookies();
  cookieStore.set("user-id", user.id, { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set("user-email", user.email ?? "", { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 7 });

  redirect("/");
}
