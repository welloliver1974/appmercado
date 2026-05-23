"use client";

import { useState } from "react";
import { Edit3, Check, Loader2 } from "lucide-react";

export function NameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("name") as string;

    const res = await fetch("/api/config/name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      setEditing(false);
      window.location.reload();
    }
    setPending(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors"
      >
        <Edit3 className="h-4 w-4" />
        Alterar nome
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        name="name"
        defaultValue={currentName}
        placeholder="Seu nome"
        required
        className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-sm text-zinc-500 hover:text-zinc-400"
      >
        Cancelar
      </button>
    </form>
  );
}
