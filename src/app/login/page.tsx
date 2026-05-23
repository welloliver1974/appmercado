"use client";

import { signIn as webAuthnSignIn } from "next-auth/webauthn";
import { getCsrfToken } from "next-auth/react";
import { useState, useEffect } from "react";
import { Fingerprint, ShoppingCart, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"biometria" | "senha">("senha");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("Falha na autenticação. Tente novamente.");
  }, []);

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Digite seu e-mail.");
    setError("");
    setLoading(true);
    try {
      await webAuthnSignIn("passkey", { email, callbackUrl: "/" });
    } catch (err) {
      console.error(err);
      setError("Erro na biometria. Use a opção Senha.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Preencha email e senha.");
    setError("");
    setLoading(true);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken: csrfToken ?? "",
          callbackUrl: "/",
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      setError("Email ou senha inválidos.");
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/20">
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
          <button type="button" onClick={() => setMode("biometria")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "biometria" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-300"}`}>
            <Fingerprint className="h-4 w-4" /> Digital
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        <form className="mt-2 space-y-6" onSubmit={mode === "biometria" ? handlePasskeyLogin : handlePasswordLogin}>
          <div className="space-y-4">
            <input id="email" name="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="seu@email.com" />

            {mode === "senha" && (
              <input id="password" name="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="sua senha" />
            )}
          </div>

          <button type="submit" disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:bg-blue-800 transition-all shadow-lg">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "biometria" ? (
              <><Fingerprint className="mr-2 h-5 w-5" /> ENTRAR COM DIGITAL</>
            ) : (
              <><KeyRound className="mr-2 h-5 w-5" /> ENTRAR</>
            )}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center px-4">
          {mode === "senha" ? "Use a senha definida no sistema." : "Use Digital ou FaceID do seu celular."}
        </p>
      </div>
    </div>
  );
}
