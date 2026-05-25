"use client";

import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/actions/utils";
import { useRouter } from "next/navigation";

export function DeleteListProductButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!confirm("Remover este item da lista?")) return;
        const fd = new FormData();
        fd.set("id", id);
        const result = await deleteProductAction(fd);
        if (result?.error) {
          alert(result.message);
        } else {
          router.refresh();
        }
      }}
    >
      <button type="submit" className="p-2 hover:bg-red-900/30 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
