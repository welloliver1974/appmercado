import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ano = searchParams.get("ano");
  const mes = searchParams.get("mes");
  const formato = searchParams.get("formato") || "csv";

  if (!ano || !mes) return NextResponse.json({ error: "Parâmetros ano e mes são obrigatórios" }, { status: 400 });

  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Number(ano), Number(mes) - 1, 1),
        lt: new Date(Number(ano), Number(mes), 1),
      },
    },
    include: {
      market: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "asc" },
  });

  const label = new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  if (formato === "csv") {
    const header = "Mercado;Data;Produto;Quantidade;Unidade;Preço Unitário;Preço Total\n";
    const rows = receipts.flatMap((r: any) =>
      r.items.map(
        (i: any) =>
          `${r.market.name};${new Date(r.date).toLocaleDateString("pt-BR")};${i.product.name};${i.quantity};${i.product.unit};${i.unitPrice.toFixed(2).replace(".", ",")};${i.totalPrice.toFixed(2).replace(".", ",")}`
      )
    );
    const total = receipts.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
    const footer = `\nTotal Gasto;${total.toFixed(2).replace(".", ",")};;;;;\n`;

    return new NextResponse(`\uFEFF${header}${rows.join("\n")}${footer}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-${label.replace(/\s/g, "-")}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Formato não suportado" }, { status: 400 });
}
