"use client";

import { useState, useEffect, useActionState } from "react";
import { authenticate } from "./actions/auth";
import { ShoppingCart, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [actionState, formAction, pending] = useActionState(authenticate, { error: "" });

  useEffect(() => {
    if (actionState?.error) setError(actionState.error);
  }, [actionState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("Falha na autenticação. Tente novamente.");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <ShoppingCart className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">Controle de Despesas</h2>
          <p className="mt-2 text-sm text-zinc-400 font-medium">Gerencie seus gastos de forma inteligente</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        <form action={formAction} className="mt-2 space-y-6">
          <div className="space-y-4">
            <input name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="seu@email.com" />
            <input name="password" type="password" autoComplete="current-password" required
              className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="sua senha" />
          </div>
          <button type="submit" disabled={pending}
            className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:bg-blue-800 transition-all shadow-lg">
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><KeyRound className="mr-2 h-5 w-5" /> ENTRAR</>}
          </button>
          <p className="text-xs text-zinc-600 text-center px-4">Use a senha definida no sistema.</p>
        </form>
      </div>
    </div>
  );
}
