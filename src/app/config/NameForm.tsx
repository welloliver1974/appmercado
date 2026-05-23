"use client";

import { useState } from "react";
import { Edit3, Loader2 } from "lucide-react";

export function NameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const form = e.currentTarget as HTMLFormElement;
    const data = new URLSearchParams(new FormData(form) as any);

    try {
      const res = await fetch("/api/config/name", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data,
      });
      const json = await res.json();
      if (json.error) {
        setErro(json.error);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setErro(err.message || "Erro desconhecido");
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">{currentName || "—"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          name="name"
          defaultValue={currentName}
          placeholder="Seu nome"
          required
          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="text-xs text-blue-400 font-medium hover:text-blue-300"
        >
          Salvar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-400">
          cancelar
        </button>
      </form>
      {erro && <p className="text-xs text-red-400 mt-1">{erro}</p>}
    </div>
  );
}
