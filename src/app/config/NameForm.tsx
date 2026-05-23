"use client";

import { useActionState, useState, useEffect } from "react";
import { updateName } from "./actions";
import { Edit3, Check, Loader2, X } from "lucide-react";

export function NameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateName, {});

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

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
    <form action={action} className="flex items-center gap-2">
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
        className="p-2 text-zinc-500 hover:text-zinc-400 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        Cancelar
      </button>
    </form>
  );
}
