"use client";

import { useState } from "react";
import { Edit3, Check, Loader2 } from "lucide-react";
import { updateName } from "./actions";

export function NameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">{currentName || "—"}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        await updateName({}, formData);
        setPending(false);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        defaultValue={currentName}
        placeholder="Seu nome"
        required
        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-zinc-500 hover:text-zinc-400"
      >
        cancelar
      </button>
    </form>
  );
}
