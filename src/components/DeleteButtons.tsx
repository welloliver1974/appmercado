"use client";

import { Trash2 } from "lucide-react";
import { deleteReceiptAction, deleteMarketAction } from "@/app/actions/delete";
import { useRouter } from "next/navigation";

export function DeleteReceiptButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!confirm("Excluir esta nota?")) return;
        const fd = new FormData();
        fd.set("id", id);
        const result = await deleteReceiptAction(fd);
        if (result?.error) {
          alert(result.message);
        } else {
          router.push("/notas");
        }
      }}
    >
      <button
        type="submit"
        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Excluir Nota
      </button>
    </form>
  );
}

export function DeleteMarketButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!confirm("Excluir este mercado e todas as notas dele?")) return;
        const fd = new FormData();
        fd.set("id", id);
        const result = await deleteMarketAction(fd);
        if (result?.error) {
          alert(result.message);
        } else {
          router.push("/mercados");
        }
      }}
    >
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-400 transition-colors"
      >
        Excluir
      </button>
    </form>
  );
}
