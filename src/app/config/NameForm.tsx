"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { updateName } from "./actions";

export function NameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);

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
    <form action={updateName} className="flex items-center gap-2">
      <input
        name="name"
        defaultValue={currentName}
        placeholder="Seu nome"
        required
        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
      />
      <button type="submit" className="text-xs text-blue-400 font-medium hover:text-blue-300">
        Salvar
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-400">
        cancelar
      </button>
    </form>
  );
}
