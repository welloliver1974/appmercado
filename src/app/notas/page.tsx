import { prisma } from "@/lib/prisma";
import { 
  History, 
  Search, 
  Calendar, 
  Store, 
  ChevronRight,
  FileText
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";

export default async function NotasPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    include: {
      market: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por mercado..." 
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {receipts.length === 0 ? (
          <div className="bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center space-y-4">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto" />
            <p className="text-zinc-500 italic">Nenhuma nota encontrada. Que tal cadastrar a primeira?</p>
            <Link href="/nova-nota" className="inline-flex items-center gap-2 text-blue-500 hover:underline font-bold">
              Cadastrar Nota agora
            </Link>
          </div>
        ) : (
          receipts.map((receipt: any) => (
            <div key={receipt.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {receipt.market.name[0]}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">{receipt.market.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(receipt.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5" />
                        {receipt._count.items} itens
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Pago</p>
                    <p className="text-2xl font-black text-emerald-400">R$ {receipt.totalAmount.toFixed(2)}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
