"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  try {
    // 1. Upsert Market
    const market = await prisma.market.upsert({
      where: { name: data.marketName },
      update: {},
      create: { name: data.marketName },
    });

    // 2. Create Receipt
    const receipt = await prisma.receipt.create({
      data: {
        marketId: market.id,
        date: new Date(data.date),
        totalAmount: data.totalAmount,
      },
    });

    // 3. Process Items and Update Stock
    for (const item of data.items) {
      // Upsert Category (Default to 'Geral' if not identified)
      const category = await prisma.category.upsert({
        where: { name: "Geral" },
        update: {},
        create: { name: "Geral" },
      });

      // Upsert Product
      const product = await prisma.product.upsert({
        where: { name: item.name },
        update: {
          stock: { increment: item.quantity },
          unit: item.unit,
        },
        create: {
          name: item.name,
          unit: item.unit,
          stock: item.quantity,
          categoryId: category.id,
        },
      });

      // Create Receipt Item
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
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw new Error("Falha ao salvar nota fiscal");
  }
}
