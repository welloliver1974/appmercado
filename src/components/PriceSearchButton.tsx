"use client";

import { useState } from "react";
import { Search, ExternalLink, Loader2, Globe } from "lucide-react";

interface PriceResult {
  title: string;
  link: string;
  price: string | null;
  store: string;
}

export function PriceSearchButton({ productName }: { productName: string }) {
  const [results, setResults] = useState<PriceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pesquisar-preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setError("Nenhum resultado encontrado. Configure GOOGLE_API_KEY e GOOGLE_CX no .env");
      }
    } catch {
      setError("Erro ao pesquisar.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleSearch}
        disabled={loading}
        className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
        {loading ? "Buscando..." : "Preço online"}
      </button>

      {results && results.length > 0 && (
        <div className="mt-3 space-y-2 bg-zinc-950 rounded-xl border border-zinc-800 p-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Search className="h-3 w-3" /> Preços encontrados na web
          </p>
          {results.map((r, i) => (
            <a
              key={i}
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-zinc-300 hover:text-blue-400 transition-colors bg-zinc-900 rounded-lg p-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate max-w-[180px]">{r.store}</span>
                <div className="flex items-center gap-1">
                  {r.price && <span className="font-bold text-emerald-400">{r.price}</span>}
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-[10px] text-zinc-600 mt-2">{error}</p>
      )}
    </div>
  );
}
