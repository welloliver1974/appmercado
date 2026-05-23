"use client";

import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Settings,
  Store,
  History,
  LogOut,
  ListTodo,
  FileText
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-black hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800 bg-black">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-500">
          <ShoppingCart className="h-6 w-6" />
          Controle de Despesas
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem href="/" icon={<LayoutDashboard />} label="Dashboard" active={pathname === "/"} />
        <NavItem href="/notas" icon={<History />} label="Minhas Notas" active={pathname === "/notas"} />
        <NavItem href="/estoque" icon={<Package />} label="Estoque" active={pathname === "/estoque"} />
        <NavItem href="/lista-compras" icon={<ListTodo />} label="Lista de Compras" active={pathname === "/lista-compras"} />
        <NavItem href="/analise" icon={<TrendingUp />} label="Análise de Preços" active={pathname === "/analise"} />
        <NavItem href="/relatorios" icon={<FileText />} label="Relatórios" active={pathname === "/relatorios"} />
        <NavItem href="/mercados" icon={<Store />} label="Mercados" active={pathname === "/mercados"} />
      </nav>

      <div className="p-4 border-t border-zinc-800 bg-black space-y-2">
        <NavItem href="/config" icon={<Settings />} label="Configurações" active={pathname === "/config"} />
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      <span className="h-4 w-4">{icon}</span>
      {label}
    </Link>
  );
}
