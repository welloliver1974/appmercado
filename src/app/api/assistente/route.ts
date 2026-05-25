import { getPrisma } from "@/lib/prisma";
import { askAssistant } from "@/lib/ai";

interface ReceiptWithMarket {
  id: string;
  date: Date;
  totalAmount: number;
  market: { name: string };
  items: { product: { name: string } }[];
}

interface MonthlyAgg {
  date: Date;
  _sum: { totalAmount: number | null };
}

export async function POST(request: Request) {
  const prisma = await getPrisma();
  const cookieHeader = request.headers.get("cookie") || "";
  const userId = cookieHeader.split(";").find(c => c.startsWith("user-id="))?.split("=")[1];
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { message } = await request.json();
  if (!message) return Response.json({ error: "Mensagem vazia" }, { status: 400 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalSpentMonth, totalStockItems, criticalItems, recentReceipts, monthlyAgg] = await Promise.all([
    prisma.receipt.aggregate({ where: { userId, date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    prisma.product.aggregate({ where: { userId }, _sum: { stock: true } }),
    prisma.product.count({ where: { userId, stock: { lte: 0 } } }),
    prisma.receipt.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { market: true, items: { include: { product: { select: { name: true } } }, take: 3 } },
    }),
    prisma.receipt.groupBy({
      by: ["date"],
      where: { userId },
      _sum: { totalAmount: true },
    }),
  ]);

  const recentPurchases = (recentReceipts as unknown as ReceiptWithMarket[])
    .map((r: any) => `${r.market.name} (${r.date.toLocaleDateString("pt-BR")}): R$ ${r.totalAmount.toFixed(2)}`)
    .join(" | ");

  const monthMap = new Map<string, number>();
  for (const r of monthlyAgg as unknown as MonthlyAgg[]) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + (r._sum.totalAmount || 0));
  }
  const monthlyHistory = Array.from(monthMap.entries())
    .sort(([a]: [string, any], [b]: [string, any]) => a.localeCompare(b))
    .map(([m, v]: [string, any]) => `${m}: R$ ${v.toFixed(2)}`)
    .join(" | ");

  const response = await askAssistant(message, {
    totalSpentMonth: totalSpentMonth._sum.totalAmount || 0,
    totalStockItems: Math.round((totalStockItems._sum.stock || 0) * 1000) / 1000,
    criticalItems,
    recentPurchases,
    monthlyHistory,
  });

  return Response.json({ response });
}
