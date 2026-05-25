"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteReceiptAction(formData: FormData) {
  const prisma = await getPrisma();
  const session = await auth();
  if (!session?.user?.id) return { error: true, message: "Não autorizado" };

  const id = formData.get("id") as string;
  if (!id) return { error: true, message: "ID não informado" };

  try {
    const items = await prisma.receiptItem.findMany({
      where: { receipt: { id, userId: session.user.id } },
      select: { productId: true, quantity: true },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.receiptItem.deleteMany({ where: { receipt: { id, userId: session.user.id } } });
    await prisma.receipt.deleteMany({ where: { id, userId: session.user.id } });
    revalidatePath("/notas");
    revalidatePath("/estoque");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar nota:", error);
    return { error: true, message: "Falha ao deletar nota" };
  }
}

export async function deleteMarketAction(formData: FormData) {
  const prisma = await getPrisma();
  const session = await auth();
  if (!session?.user?.id) return { error: true, message: "Não autorizado" };

  const id = formData.get("id") as string;
  if (!id) return { error: true, message: "ID não informado" };

  try {
    const items = await prisma.receiptItem.findMany({
      where: { receipt: { marketId: id, userId: session.user.id } },
      select: { productId: true, quantity: true },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.receiptItem.deleteMany({ where: { receipt: { marketId: id, userId: session.user.id } } });
    await prisma.receipt.deleteMany({ where: { marketId: id, userId: session.user.id } });
    await prisma.market.deleteMany({ where: { id, userId: session.user.id } });
    revalidatePath("/mercados");
    revalidatePath("/estoque");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar mercado:", error);
    return { error: true, message: "Falha ao deletar mercado" };
  }
}
