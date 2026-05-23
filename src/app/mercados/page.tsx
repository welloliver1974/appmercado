import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Store, Receipt, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default async function MercadosPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const markets = await prisma.market.findMany({
    where: { userId },
    include: {
      _count: { select: { receipts: true } },
      receipts: {
        select: { totalAmount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Mercados</h1>
          <p className="text-zinc-400 text-sm">Todos os mercados onde você compra</p>
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
          <Store className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum mercado cadastrado. Adicione uma nota para criar um.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => {
            const total = market.receipts.reduce((sum, r) => sum + r.totalAmount, 0);
            return (
              <div key={market.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">{market.name}</h3>
                    {market.location && (
                      <p className="text-xs text-zinc-500">{market.location}</p>
                    )}
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Store className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Notas</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1 mt-1">
                      <Receipt className="h-4 w-4 text-blue-400" />
                      {market._count.receipts}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Total Gasto</p>
                    <p className="text-lg font-bold text-white mt-1">
                      R$ {total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/notas?mercado=${market.id}`}
                  className="block w-full text-center py-2 text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/5"
                >
                  Ver notas deste mercado →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
