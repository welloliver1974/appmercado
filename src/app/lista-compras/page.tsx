import { formatCurrency } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { 
  ShoppingCart, 
  CheckSquare, 
  Plus, 
  Printer,
  AlertCircle
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShareListButton } from "@/components/ShareListButton";
import { FinalizarComprasButton } from "@/components/FinalizarComprasButton";
import { DeleteListProductButton } from "@/components/DeleteListProductButton";

export default async function ListaComprasPage() {
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  const lowStockProducts = await prisma.product.findMany({
    where: {
      userId,
      stock: {
        lte: 0
      }
    },
    include: {
      category: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  const totalEstimated = lowStockProducts.length * 15; // Estimativa simples

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            Lista de Compras
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Gerada automaticamente com base no que está acabando.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <ShareListButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {lowStockProducts.length === 0 ? (
            <div className="bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center space-y-4">
              <CheckSquare className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-zinc-300 font-bold text-lg">Tudo em dia!</p>
              <p className="text-zinc-500 italic text-sm">Seu estoque está abastecido. Nenhum item crítico por enquanto.</p>
            </div>
          ) : (
            lowStockProducts.map((product: any) => (
              <div key={product.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded border-2 border-zinc-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    {/* Checkbox placeholder */}
                  </div>
                  <div>
                    <p className="font-bold text-white">{product.name}</p>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{product.category?.name ?? "Sem categoria"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded uppercase font-bold tracking-wider">Faltando</span>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white">
                    <Plus className="h-5 w-5" />
                  </button>
                  <DeleteListProductButton id={product.id} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-xl sticky top-8">
            <h3 className="font-bold text-lg">Resumo da Lista</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total de itens:</span>
                <span className="font-bold">{lowStockProducts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Categorias:</span>
                <span className="font-bold">{new Set(lowStockProducts.map((p: any) => p.categoryId)).size}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                <span className="text-zinc-500 text-sm">Custo Estimado:</span>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-500">{formatCurrency(totalEstimated)}</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-bold">Baseado em preços médios</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Esta lista inclui apenas produtos com estoque abaixo do limite mínimo.
              </p>
            </div>

            <FinalizarComprasButton />
          </div>
        </div>
      </div>
    </div>
  );
}
