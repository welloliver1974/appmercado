"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateStockAction(productId: string, quantity: number) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
    revalidatePath("/estoque");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    throw new Error("Falha ao atualizar estoque");
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

export async function deleteProductAction(productId: string) {
  try {
    // Primeiro removemos os itens de recibo vinculados
    await prisma.receiptItem.deleteMany({
      where: { productId },
    });
    
    await prisma.product.delete({
      where: { id: productId },
    });
    
    revalidatePath("/estoque");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    throw new Error("Falha ao deletar produto");
  }
}
