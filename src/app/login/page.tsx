"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { Fingerprint, ShoppingCart, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("Por favor, digite seu e-mail.");
    
    setLoading(true);
    try {
      // O provider 'passkey' gerencia tanto o registro quanto o login
      await signIn("passkey", { email, callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      alert("Erro ao autenticar com biometria.");
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

        <form className="mt-8 space-y-6" onSubmit={handlePasskeyLogin}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="block text-xs font-bold uppercase text-zinc-500 mb-2 ml-1">
                E-mail para acesso
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
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-black text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  ENTRAR COM BIOMETRIA
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-zinc-600 leading-relaxed px-4">
            Usamos Passkeys para que você nunca precise decorar senhas. 
            O acesso é feito via Digital ou FaceID do seu celular.
          </p>
        </div>
      </div>
    </div>
  );
}
