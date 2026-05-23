"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

export function AddMarketButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("name") as string;

    await fetch("/api/mercados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setPending(false);
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
      >
        <Plus className="h-4 w-4" />
        Novo Mercado
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Mercado</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                placeholder="Nome do mercado"
                required
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-medium hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
