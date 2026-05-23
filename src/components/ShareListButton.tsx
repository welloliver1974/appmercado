"use client";

import { useState } from "react";
import { Share2, Check, Copy, Loader2 } from "lucide-react";
import { shareShoppingList } from "@/app/actions/share";

export function ShareListButton() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const { url } = await shareShoppingList();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert("Erro ao compartilhar lista.");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {copied ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}
