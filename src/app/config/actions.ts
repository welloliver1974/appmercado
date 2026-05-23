"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateName(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Não autenticado" };

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) return { error: "Nome não pode ficar vazio" };

  await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
  revalidatePath("/config");
  return { success: true };
}
