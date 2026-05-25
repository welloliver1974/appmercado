"use server";

import { getPrisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { analyzeSpendingTrend } from "@/lib/ai";

export async function getDashboardData() {
  try {
    const prisma = await getPrisma();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: true, redirect: "/login" };

    const [recentReceipts, criticalProducts, totalSpentMonth, totalStockItems, monthlyTotals] = await Promise.all([
      prisma.receipt.findMany({
        where: { userId }, take: 3, orderBy: { date: 'desc' },
        include: { market: true, _count: { select: { items: true } } }
      }),
      prisma.product.findMany({
        where: { userId, stock: { lte: 0 } }, take: 4, orderBy: { stock: 'asc' }
      }),
      prisma.receipt.aggregate({
        _sum: { totalAmount: true },
        where: { userId, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
      }),
      prisma.product.count({ where: { userId, items: { some: {} } } }),
      prisma.receipt.groupBy({
        by: ["date"], _sum: { totalAmount: true }, where: { userId }, orderBy: { date: "desc" },
      }),
    ]);

    const monthsMap = new Map<string, number>();
    for (const r of monthlyTotals) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      monthsMap.set(key, (monthsMap.get(key) || 0) + (r._sum.totalAmount || 0));
    }
    const monthlyArray = Array.from(monthsMap.entries()).sort();
    const lastMonths = monthlyArray.slice(-3);
    const monthlyForAI = lastMonths.map(([m, v]: [string, number]) => ({ month: m, total: v }));
    const avg = monthlyForAI.length > 0
      ? monthlyForAI.reduce((s: number, m: { total: number }) => s + m.total, 0) / monthlyForAI.length
      : 0;

    let prediction = avg;
    let insight = `Média dos últimos ${monthlyForAI.length} meses.`;
    try {
      const trendResult = await analyzeSpendingTrend(monthlyForAI);
      if (trendResult.prediction > 0) prediction = trendResult.prediction;
      if (trendResult.insight) insight = trendResult.insight;
    } catch {}

    let trend = "estável";
    let trendUp = true;
    if (lastMonths.length >= 2) {
      const prev = lastMonths[lastMonths.length - 2][1];
      const curr = lastMonths[lastMonths.length - 1][1];
      if (curr > prev * 1.1) { trend = "alta"; trendUp = false; }
      else if (curr < prev * 0.9) { trend = "queda"; trendUp = true; }
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

    return {
      recentReceipts: JSON.parse(JSON.stringify(recentReceipts)),
      criticalProducts: JSON.parse(JSON.stringify(criticalProducts)),
      spentMonth: totalSpentMonth._sum.totalAmount || 0,
      stockCount: totalStockItems,
      prediction,
      insight,
      trend,
      trendUp,
      greeting,
    };
  } catch (err) {
    console.error("Dashboard data error:", err);
    return { error: true, message: "Erro ao carregar dados" };
  }
}
