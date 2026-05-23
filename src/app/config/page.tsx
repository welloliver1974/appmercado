import { Settings, Smartphone, Download, Globe, User } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ConfigPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-zinc-400 text-sm">Informações do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-lg">Sua Conta</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="text-white">{session.user.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Nome</span>
              <span className="text-white">{session.user.name || "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-lg">App Instalável (PWA)</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Adicione este site à tela inicial do seu celular para usar como app:
          </p>
          <ul className="text-sm text-zinc-500 space-y-1 list-disc list-inside">
            <li><strong className="text-zinc-300">iOS (Safari):</strong> Compartilhar {"→"} Adicionar à Tela de Início</li>
            <li><strong className="text-zinc-300">Android (Chrome):</strong> Menu {"→"} Instalar App</li>
          </ul>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-lg">Exportar Dados</h3>
          </div>
          <p className="text-sm text-zinc-400">Acesse a página de relatórios para exportar seus gastos.</p>
          <a href="/relatorios" className="inline-block text-sm text-blue-400 font-medium hover:text-blue-300">
            Ir para Relatórios →
          </a>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-lg">Versão</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Framework</span>
              <span className="text-white">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Banco</span>
              <span className="text-white">SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
