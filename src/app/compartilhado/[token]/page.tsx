import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShoppingCart, Clock, Package } from "lucide-react";

export default async function SharedListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const shared = await prisma.sharedList.findUnique({ where: { token } });

  if (!shared || shared.expiresAt < new Date()) {
    notFound();
  }

  let items: { name: string; category: string; stock: number; unit: string }[] = [];
  try {
    items = JSON.parse(shared.items);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <ShoppingCart className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black">Lista de Compras</h1>
          <p className="text-zinc-400 text-sm flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Lista compartilhada • válida até {shared.expiresAt.toLocaleDateString("pt-BR")}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center space-y-4">
            <Package className="h-12 w-12 text-zinc-600 mx-auto" />
            <p className="text-zinc-500">Nenhum item na lista.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded border-2 border-zinc-700" />
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-500 font-bold">{item.stock} {item.unit}</p>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-zinc-600 pt-4">
              Lista gerada automaticamente • {items.length} {items.length === 1 ? "item" : "itens"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
