import { prisma } from "@/lib/prisma";
import { 
  TrendingUp, 
  Search, 
  ArrowDown, 
  ArrowUp, 
  Minus,
  Store,
  Tag
} from "lucide-react";

export default async function AnalisePage() {
  const products = await prisma.product.findMany({
    include: {
      items: {
        include: {
          receipt: {
            include: {
              market: true
            }
          }
        }
      }
    }
  });

  const productAnalysis = products.map((product: any) => {
    const prices = product.items.map((item: any) => item.unitPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    
    const bestMarket = product.items.find((item: any) => item.unitPrice === minPrice)?.receipt.market.name;
    const lastPrice = product.items[product.items.length - 1]?.unitPrice;

    return {
      ...product,
      minPrice,
      maxPrice,
      avgPrice,
      bestMarket,
      lastPrice
    };
  }).filter((p: any) => p.items.length > 0);

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            Análise de Preços
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Descubra onde seus produtos favoritos estão mais baratos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productAnalysis.length === 0 ? (
          <div className="col-span-full bg-zinc-900 p-12 rounded-2xl border border-zinc-800 text-center text-zinc-500 italic">
            Ainda não há dados suficientes para analisar preços. Cadastre algumas notas primeiro!
          </div>
        ) : (
          productAnalysis.map((product: any) => (
            <div key={product.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6 hover:border-blue-500/30 transition-all shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">{product.name}</h3>
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{product.unit}</span>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Tag className="h-5 w-5 text-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Menor Preço</p>
                  <p className="text-xl font-black text-emerald-400">R$ {product.minPrice.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Preço Médio</p>
                  <p className="text-xl font-black text-blue-400">R$ {product.avgPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Melhor mercado:
                  </span>
                  <span className="font-bold text-white">{product.bestMarket}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-red-500" />
                    Maior preço:
                  </span>
                  <span className="font-bold text-zinc-300">R$ {product.maxPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Variação total:</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {(((product.maxPrice - product.minPrice) / product.minPrice) * 100).toFixed(0)}% de diferença
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
