"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function shareShoppingList() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const lowStockProducts = await prisma.product.findMany({
    where: { userId, stock: { lte: 1 } },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const items = lowStockProducts.map((p) => ({
    name: p.name,
    category: p.category.name,
    stock: p.stock,
    unit: p.unit,
  }));

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.sharedList.create({
    data: {
      token,
      userId,
      items: JSON.stringify(items),
      expiresAt,
    },
  });

  revalidatePath("/lista-compras");
  return { url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/compartilhado/${token}` };
}
