"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateStockAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.userId !== userId) return;

    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
    revalidatePath("/estoque");
    revalidatePath("/");
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
  }
}

export async function finalizarComprasAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado");

  await prisma.product.updateMany({
    where: { userId, stock: { lte: 1 } },
    data: { stock: 5 },
  });

  revalidatePath("/lista-compras");
  revalidatePath("/");
  revalidatePath("/estoque");
}

export async function deleteProductAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const productId = formData.get("productId") as string;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.userId !== userId) return;

    await prisma.receiptItem.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });

    revalidatePath("/estoque");
    revalidatePath("/");
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
  }
}
