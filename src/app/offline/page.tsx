import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 mb-6">
          <WifiOff className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Você está offline</h1>
        <p className="text-zinc-400 text-sm">
          Conecte-se à internet para acessar o Controle de Despesas.
        </p>
      </div>
    </div>
  );
}
