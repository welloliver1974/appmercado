"use client";

import { signIn as webAuthnSignIn } from "next-auth/webauthn";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Fingerprint, ShoppingCart, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"biometria" | "senha">("biometria");
  const [hasWebAuthn, setHasWebAuthn] = useState(false);

  useEffect(() => {
    setHasWebAuthn(typeof window !== "undefined" && !!window.PublicKeyCredential);
  }, []);

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("Por favor, digite seu e-mail.");

    setLoading(true);
    try {
      await webAuthnSignIn("passkey", { email, callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      alert("Erro ao autenticar com biometria. Tente usar senha.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Preencha email e senha.");

    setLoading(true);
    try {
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      alert("Email ou senha inválidos.");
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
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">AppMercado</h2>
          <p className="mt-2 text-sm text-zinc-400 font-medium">Seu gerenciador inteligente de compras</p>
        </div>

        <div className="flex rounded-xl bg-black p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode("biometria")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
              mode === "biometria" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Fingerprint className="h-4 w-4" />
            Digital
          </button>
          <button
            type="button"
            onClick={() => setMode("senha")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
              mode === "senha" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Senha
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={mode === "biometria" ? handlePasskeyLogin : handlePasswordLogin}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="block text-xs font-bold uppercase text-zinc-500 mb-2 ml-1">
                E-mail
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                placeholder="seu@email.com"
              />
            </div>

            {mode === "senha" && (
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase text-zinc-500 mb-2 ml-1">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white placeholder-zinc-600 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                  placeholder="sua senha"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-black text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "biometria" ? (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  ENTRAR COM BIOMETRIA
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-5 w-5" />
                  ENTRAR
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          {mode === "biometria" && (
            <p className="text-xs text-zinc-600 leading-relaxed px-4">
              {hasWebAuthn
                ? "Use Digital ou FaceID do seu celular. No notebook, use a opção Senha."
                : "Seu navegador não suporta biometria. Use a opção Senha."}
            </p>
          )}
          {mode === "senha" && (
            <p className="text-xs text-zinc-600 leading-relaxed px-4">
              Use a senha definida no sistema para acessar pelo notebook.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
