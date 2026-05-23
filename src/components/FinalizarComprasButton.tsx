"use client";

import { useState } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { finalizarComprasAction } from "@/app/actions/stock";

export function FinalizarComprasButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Marcar todos os itens como comprados e reabastecer o estoque?")) return;
    setPending(true);
    await finalizarComprasAction();
    window.location.reload();
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full py-4 bg-white text-black rounded-xl font-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5" />}
      {pending ? "Atualizando..." : "FINALIZAR COMPRAS"}
    </button>
  );
}
