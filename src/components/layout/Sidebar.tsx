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
  FileText,
  Bot,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/logout";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/nova-nota", icon: <QrCode />, label: "Nova Nota" },
    { href: "/notas", icon: <History />, label: "Notas" },
    { href: "/estoque", icon: <Package />, label: "Estoque" },
    { href: "/lista-compras", icon: <ListTodo />, label: "Compras" },
    { href: "/analise", icon: <TrendingUp />, label: "Análise" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-black hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-zinc-800 bg-black">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-500">
            <ShoppingCart className="h-6 w-6" />
            Controle de Despesas
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem href="/" icon={<LayoutDashboard />} label="Dashboard" active={pathname === "/"} />
          <NavItem href="/nova-nota" icon={<QrCode />} label="Nova Nota" active={pathname === "/nova-nota"} />
          <NavItem href="/notas" icon={<History />} label="Minhas Notas" active={pathname === "/notas"} />
          <NavItem href="/estoque" icon={<Package />} label="Estoque" active={pathname === "/estoque"} />
          <NavItem href="/lista-compras" icon={<ListTodo />} label="Lista de Compras" active={pathname === "/lista-compras"} />
          <NavItem href="/analise" icon={<TrendingUp />} label="Análise de Preços" active={pathname === "/analise"} />
          <NavItem href="/relatorios" icon={<FileText />} label="Relatórios" active={pathname === "/relatorios"} />
          <NavItem href="/mercados" icon={<Store />} label="Mercados" active={pathname === "/mercados"} />
          <NavItem href="/assistente" icon={<Bot />} label="Assistente IA" active={pathname === "/assistente"} />
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-black space-y-2">
          <NavItem href="/config" icon={<Settings />} label="Configurações" active={pathname === "/config"} />
          <form action={logoutAction}>
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 z-50 safe-area-bottom">
        <div className="flex overflow-x-auto py-2 px-1 gap-0 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory">
          {[
            { href: "/", icon: <LayoutDashboard />, label: "Dashboard" },
            { href: "/nova-nota", icon: <QrCode />, label: "Nova Nota" },
            { href: "/notas", icon: <History />, label: "Notas" },
            { href: "/estoque", icon: <Package />, label: "Estoque" },
            { href: "/lista-compras", icon: <ListTodo />, label: "Compras" },
            { href: "/analise", icon: <TrendingUp />, label: "Análise" },
            { href: "/relatorios", icon: <FileText />, label: "Relatórios" },
            { href: "/mercados", icon: <Store />, label: "Mercados" },
            { href: "/assistente", icon: <Bot />, label: "Assistente" },
            { href: "/config", icon: <Settings />, label: "Config" },
          ].map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`snap-start flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 flex-shrink-0 ${
                  isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className="h-5 w-5">{item.icon}</span>
                <span className="text-[10px] leading-tight truncate text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
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
