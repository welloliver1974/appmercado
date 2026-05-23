"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, Package } from "lucide-react";
import Link from "next/link";

interface CriticalItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
}

export function CriticalStockAlert({ items }: { items: CriticalItem[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (items.length > 0 && !notified && "Notification" in window && Notification.permission === "granted") {
      new Notification("Estoque Crítico", {
        body: `${items.length} item(ns) estão com estoque baixo!`,
        icon: "/icon.png",
      });
      setNotified(true);
    }
  }, [items, notified]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (items.length === 0 || dismissed) return null;

  return (
    <div className="bg-amber-900/20 border border-amber-700/50 rounded-2xl p-4 flex items-start gap-3">
      <div className="p-2 bg-amber-600/20 rounded-xl shrink-0">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-amber-300 font-bold text-sm">
          {items.length} {items.length === 1 ? "item com estoque crítico" : "itens com estoque crítico"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {items.slice(0, 5).map((item) => (
            <span key={item.id} className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1">
              <Package className="h-3 w-3" />
              {item.name} ({item.stock} {item.unit})
            </span>
          ))}
          {items.length > 5 && (
            <span className="text-xs text-zinc-500">+{items.length - 5} mais</span>
          )}
        </div>
        <Link
          href="/estoque"
          className="mt-3 inline-block text-xs text-amber-400 font-medium hover:text-amber-300 transition-colors"
        >
          Ver estoque completo →
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
