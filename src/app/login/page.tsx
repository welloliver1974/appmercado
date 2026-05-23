"use client";

import { signIn as webAuthnSignIn } from "next-auth/webauthn";
import { useState, useEffect, useActionState, useRef } from "react";
import { authenticate } from "./actions/auth";
import { Fingerprint, ShoppingCart, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"senha" | "digital">("senha");
  const [error, setError] = useState("");
  const [actionState, formAction, pending] = useActionState(authenticate, { error: "" });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionState?.error) setError(actionState.error);
  }, [actionState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("Falha na autenticação. Tente novamente.");
  }, []);

  const handlePasskeyLogin = async () => {
    const email = emailRef.current?.value;
    if (!email) return setError("Digite seu e-mail.");
    setError("");
    try {
      await webAuthnSignIn("passkey", { email, callbackUrl: "/" });
    } catch (err) {
      console.error(err);
      setError("Erro na biometria. Use a opção Senha.");
    }
  };

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

        <div className="flex rounded-xl bg-black p-1 border border-zinc-800">
          <button type="button" onClick={() => setMode("senha")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "senha" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-300"}`}>
            <KeyRound className="h-4 w-4" /> Senha
          </button>
          <button type="button" onClick={() => setMode("digital")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "digital" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-300"}`}>
            <Fingerprint className="h-4 w-4" /> Digital
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        {mode === "senha" ? (
          <form action={formAction} className="mt-2 space-y-6">
            <div className="space-y-4">
              <input ref={emailRef} name="email" type="email" autoComplete="email" required
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
        ) : (
          <div className="mt-2 space-y-6">
            <div className="space-y-4">
              <input ref={emailRef} name="email" type="email" autoComplete="email" required
                className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="seu@email.com" />
            </div>
            <button type="button" onClick={handlePasskeyLogin} disabled={pending}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:bg-blue-800 transition-all shadow-lg">
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Fingerprint className="mr-2 h-5 w-5" /> ENTRAR COM DIGITAL</>}
            </button>
            <p className="text-xs text-zinc-600 text-center px-4">Use Digital ou FaceID do seu celular.</p>
          </div>
        )}
      </div>
    </div>
  );
}
