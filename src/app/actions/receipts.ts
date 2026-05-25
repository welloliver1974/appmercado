"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { categorizeProduct } from "@/lib/ai";

export async function saveReceiptAction(data: {
  marketName: string;
  date: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
  }>;
}) {
  const prisma = await getPrisma();
  const session = await auth();
  if (!session?.user?.id) return { error: true, message: "Não autorizado" };

  const userId = session.user.id;

  try {
    // 1. Upsert Market (vinculado ao usuário)
    const market = await prisma.market.upsert({
      where: { 
        name_userId: {
          name: data.marketName,
          userId: userId
        }
      },
      update: {},
      create: { 
        name: data.marketName,
        userId: userId
      },
    });

    // 2. Create Receipt
    const receipt = await prisma.receipt.create({
      data: {
        marketId: market.id,
        userId: userId,
        date: new Date(data.date),
        totalAmount: data.totalAmount,
      },
    });

    // 3. Process Items and Update Stock
    for (const item of data.items) {
      const categoryName = await categorizeProduct(item.name);
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });

      const product = await prisma.product.upsert({
        where: { 
          name_userId: {
            name: item.name,
            userId: userId
          }
        },
        update: {
          stock: { increment: item.quantity },
          unit: item.unit,
        },
        create: {
          name: item.name,
          unit: item.unit,
          stock: item.quantity,
          categoryId: category.id,
          userId: userId
        },
      });

      await prisma.receiptItem.create({
        data: {
          receiptId: receipt.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/notas");
    revalidatePath("/estoque");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    return { error: true, message: "Falha ao salvar nota fiscal" };
  }
}
