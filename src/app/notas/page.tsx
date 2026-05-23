import { getPrisma } from "@/lib/prisma";
import { 
  History, 
  Calendar, 
  ChevronRight,
  FileText
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";

export default async function NotasPage(props: { searchParams?: Promise<{ q?: string; mercado?: string }> }) {
  const prisma = await getPrisma();
  const sp = await props.searchParams;
  const query = sp?.q?.toLowerCase() || "";
  const mercadoId = sp?.mercado || "";
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    include: {
      market: true,
      items: {
        include: {
          product: { select: { name: true } }
        }
      },
      _count: {
        select: { items: true }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  let filtered = query
    ? receipts.filter((r: any) =>
        r.market.name.toLowerCase().includes(query) ||
        r.items.some((i: any) => i.product.name.toLowerCase().includes(query))
      )
    : receipts;

  if (mercadoId) {
    filtered = filtered.filter((r: any) => r.marketId === mercadoId);
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-blue-500" />
            Minhas Notas
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Histórico completo de todas as suas compras.</p>
        </div>
        <SearchInput placeholder="Buscar por mercado ou produto..." />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
            <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">{query ? "Nenhuma nota encontrada." : "Nenhuma nota cadastrada."}</p>
          </div>
        ) : (
          filtered.map((receipt: any) => (
            <div key={receipt.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {receipt.market.name[0]}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{receipt.market.name}</p>
                  <div className="flex items-center gap-3 text-sm text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(receipt.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span>{receipt._count.items} {receipt._count.items === 1 ? 'item' : 'itens'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total</p>
                  <p className="text-xl font-bold text-white">R$ {receipt.totalAmount.toFixed(2)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
