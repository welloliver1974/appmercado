"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistentePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Pergunte sobre seus gastos, estoque, preços ou qualquer coisa sobre suas compras." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "Erro ao responder." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <Bot className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistente IA</h1>
          <p className="text-zinc-400 text-sm">Pergunte sobre seus gastos e estoque</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-w-3xl mx-auto w-full">
        {messages.map((msg: any, i: number) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="p-2 bg-blue-600/20 rounded-xl h-fit shrink-0">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-200"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="p-2 bg-zinc-700 rounded-xl h-fit shrink-0">
                <User className="h-4 w-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="p-2 bg-blue-600/20 rounded-xl">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: quanto gastei esse mês?"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
