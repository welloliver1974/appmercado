"use server";

import { getPrisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateStockAction(formData: FormData) {
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.userId !== userId) return;

    const newStock = quantity > 0 ? 1 : 0;
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    revalidatePath("/estoque");
    revalidatePath("/");
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
  }
}

export async function finalizarComprasAction() {
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Não autenticado" };

  try {
    await prisma.product.updateMany({
      where: { userId, stock: { lte: 0 } },
      data: { stock: 1 },
    });

    revalidatePath("/lista-compras");
    revalidatePath("/");
    revalidatePath("/estoque");
    return { success: true };
  } catch (error) {
    console.error("Erro ao finalizar compras:", error);
    return { error: "Falha ao finalizar compras" };
  }
}

export async function recalculateStockAction() {
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  try {
    const products = await prisma.product.findMany({
      where: { userId },
      select: { id: true },
    });

    for (const product of products) {
      const itemCount = await prisma.receiptItem.count({
        where: { productId: product.id },
      });
      const actualStock = itemCount > 0 ? 1 : 0;

      await prisma.product.update({
        where: { id: product.id },
        data: { stock: actualStock },
      });
    }

    revalidatePath("/");
    revalidatePath("/estoque");
    revalidatePath("/lista-compras");
  } catch (error) {
    console.error("Erro ao recalcular estoque:", error);
  }
}

export async function deleteProductAction(formData: FormData) {
  const prisma = await getPrisma();
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
