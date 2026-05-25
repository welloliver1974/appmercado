import { formatQty, formatCurrency } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { ArrowLeft, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { DeleteReceiptButton } from "@/components/DeleteButtons";

export default async function NotaDetailPage(props: { params: Promise<{ id: string }> }) {
  const p = await props.params;
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <p className="text-white p-8">Não autorizado</p>;

  const receipt = await prisma.receipt.findFirst({
    where: { id: p.id, userId },
    include: {
      market: true,
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (!receipt) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-black min-h-screen text-white">
      <div className="flex items-center gap-4">
        <Link href="/notas" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Detalhes da Nota</h1>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {receipt.market.name[0]}
          </div>
          <div>
            <p className="text-xl font-bold">{receipt.market.name}</p>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date(receipt.date).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl p-4 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(receipt.totalAmount)}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-zinc-500" />
            <p className="text-sm text-zinc-500 uppercase font-bold tracking-wider">
              Itens ({receipt.items.length})
            </p>
          </div>
          <div className="space-y-2">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black border border-zinc-800 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.product.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatQty(item.quantity)} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="font-bold ml-4">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>

        <DeleteReceiptButton id={receipt.id} />
      </div>
    </div>
  );
}
