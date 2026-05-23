import { prisma } from "@/lib/prisma";
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle,
  Filter
} from "lucide-react";
import { updateStockAction, deleteProductAction } from "@/app/actions/stock";
import { auth } from "@/auth";

export default async function EstoquePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      category: true,
      items: {
        orderBy: {
          receipt: {
            date: 'desc'
          }
        },
        take: 1,
        include: {
          receipt: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            Meu Estoque
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Gerencie as quantidades e validade dos seus produtos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider">Produto</th>
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider">Categoria</th>
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider">Estoque Atual</th>
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider">Último Preço</th>
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold uppercase text-zinc-500 tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500 italic">
                  Nenhum produto cadastrado. Adicione uma nota fiscal para começar!
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <ProductRow key={product.id} product={product} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: any }) {
  const lastItem = product.items[0];
  const isLowStock = product.stock <= (product.minStock || 1);

  // Criamos funções que chamam as server actions
  async function handleDecrement() {
    "use server";
    await updateStockAction(product.id, -1);
  }

  async function handleIncrement() {
    "use server";
    await updateStockAction(product.id, 1);
  }

  async function handleDelete() {
    "use server";
    await deleteProductAction(product.id);
  }

  return (
    <tr className="group hover:bg-zinc-800/30 transition-colors">
      <td className="p-4">
        <div className="font-bold text-zinc-100">{product.name}</div>
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          Comprado em: {lastItem ? new Date(lastItem.receipt.date).toLocaleDateString('pt-BR') : 'N/A'}
        </div>
      </td>
      <td className="p-4">
        <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">
          {product.category.name}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-mono font-bold ${isLowStock ? 'text-amber-500' : 'text-white'}`}>
            {product.stock} <span className="text-xs font-normal text-zinc-500">{product.unit}</span>
          </span>
        </div>
      </td>
      <td className="p-4 font-mono text-emerald-400 font-bold">
        {lastItem ? `R$ ${lastItem.unitPrice.toFixed(2)}` : '---'}
      </td>
      <td className="p-4">
        {isLowStock ? (
          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase">
            <AlertTriangle className="h-3 w-3" />
            Baixo
          </div>
        ) : (
          <div className="text-emerald-500 text-xs font-bold uppercase">Normal</div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <form action={handleDecrement}>
            <button className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all">
              <Minus className="h-4 w-4" />
            </button>
          </form>
          <form action={handleIncrement}>
            <button className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <form action={handleDelete}>
            <button className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-500 transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
