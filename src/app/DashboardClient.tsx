"use client";

import { formatCurrency } from "@/lib/format";
import { useEffect, useState } from "react";
import { ShoppingCart, Package, TrendingUp, PlusCircle, QrCode, Camera, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";

export default function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardData().then((result: any) => {
      if (result?.redirect) {
        router.push(result.redirect);
        return;
      }
      if (result?.error) {
        setError(result.message || "Erro ao carregar dados");
      } else {
        setData(result);
      }
      setLoading(false);
    }).catch(() => {
      setError("Erro de conexão");
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-zinc-400 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-8 bg-black min-h-screen text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-zinc-400">{error}</p>
        <div className="flex gap-3">
          <Link href="/nova-nota" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all">Adicionar Nova Nota</Link>
          <button onClick={() => { setLoading(true); setError(""); getDashboardData().then((r: any) => { if (r?.redirect) { router.push(r.redirect); return; } setData(r); setLoading(false); }).catch(() => { setError("Erro de conexão"); setLoading(false); }); }} className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hour = new Date().getHours();
  const displayName = data.greeting === "Bom dia" ? "Bom dia" : data.greeting === "Boa tarde" ? "Boa tarde" : "Boa noite";

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Olá! <ShoppingCart className="h-6 w-6 inline text-blue-500" />
          </h2>
          <p className="text-zinc-400 text-sm">Aqui está o resumo das suas compras este mês.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <Link href="/nova-nota" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
            <PlusCircle className="h-4 w-4" />
            Adicionar Nota
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Gasto Mensal" value={formatCurrency(data.spentMonth)} trend="+0%" trendUp={true} icon={<ShoppingCart className="h-5 w-5 text-blue-400" />} color="bg-blue-500/10" />
        <StatCard title="Itens em Estoque" value={data.stockCount.toString()} trend="Total" trendUp={true} icon={<Package className="h-5 w-5 text-emerald-400" />} color="bg-emerald-500/10" />
        <StatCard title="Alertas de Estoque" value={data.criticalProducts.length.toString()} trend="Itens baixos" trendUp={false} icon={<TrendingUp className="h-5 w-5 text-amber-400" />} color="bg-amber-500/10" />
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div className={`flex items-center text-xs font-bold ${data.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.trend}
              {data.trendUp ? <ArrowUpRight className="h-3 w-3 ml-1" /> : <ArrowDownRight className="h-3 w-3 ml-1" />}
            </div>
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Previsão Próx. Mês</p>
            <h4 className="text-2xl font-bold text-white mt-1">{formatCurrency(data.prediction)}</h4>
            <p className="text-xs text-zinc-500 mt-1">{data.insight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6">Entrada Rápida</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/nova-nota" className="flex flex-col items-start gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-blue-500/50 transition-all group">
                <div className="p-3 bg-blue-600 rounded-lg text-white group-hover:scale-110 transition-transform"><QrCode className="h-6 w-6" /></div>
                <div className="text-left"><span className="block font-bold text-zinc-100">Escanear QR Code</span><span className="text-sm text-zinc-500">Importação automática via SEFAZ</span></div>
              </Link>
              <Link href="/nova-nota" className="flex flex-col items-start gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all group">
                <div className="p-3 bg-emerald-600 rounded-lg text-white group-hover:scale-110 transition-transform"><Camera className="h-6 w-6" /></div>
                <div className="text-left"><span className="block font-bold text-zinc-100">Tirar Foto</span><span className="text-sm text-zinc-500">Processar nota usando IA</span></div>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Últimas Compras</h3>
              <Link href="/notas" className="text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">Ver todas</Link>
            </div>
            <div className="divide-y divide-zinc-800">
              {data.recentReceipts.length === 0 ? (
                <p className="p-6 text-zinc-500 text-sm italic">Nenhuma compra cadastrada.</p>
              ) : (
                data.recentReceipts.map((receipt: any) => (
                  <RecentReceiptItem key={receipt.id} market={receipt.market.name} date={new Date(receipt.date).toLocaleDateString('pt-BR')} amount={formatCurrency(receipt.totalAmount)} items={receipt._count.items.toString()} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Estoque Crítico</h3>
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-5">
              {data.criticalProducts.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">Nenhum item crítico.</p>
              ) : (
                data.criticalProducts.map((product: any) => (
                  <CriticalItem key={product.id} name={product.name} color="bg-amber-500" />
                ))
              )}
            </div>
            <Link href="/lista-compras" className="block w-full mt-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 text-center">
              Gerar Lista de Compras
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-zinc-900 p-6 rounded-2xl text-white border border-blue-500/20 shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-blue-400" /><h4 className="font-bold">Assistente IA</h4></div>
              <p className="text-zinc-300 text-sm leading-relaxed">Tire dúvidas sobre seus gastos. Vá até o Assistente IA e pergunte!</p>
              <Link href="/assistente" className="mt-3 inline-block text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors">Abrir Assistente →</Link>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="h-32 w-32 text-blue-400" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon, color }: any) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <div className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend}
          {trendUp ? <ArrowUpRight className="h-3 w-3 ml-1" /> : <ArrowDownRight className="h-3 w-3 ml-1" />}
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
      </div>
    </div>
  );
}

function RecentReceiptItem({ market, date, amount, items }: any) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
          {market[0]}
        </div>
        <div>
          <p className="font-bold text-zinc-100 text-sm">{market}</p>
          <p className="text-zinc-500 text-xs">{date} • {items} itens</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <p className="font-bold text-white text-sm">{amount}</p>
        <button className="p-1 hover:bg-zinc-700 rounded-md transition-colors text-zinc-500"><MoreVertical className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function CriticalItem({ name, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-300">{name}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: '0%' }} />
      </div>
    </div>
  );
}
