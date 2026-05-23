import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileDown, FileText } from "lucide-react";
import Link from "next/link";

export default async function RelatoriosPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const months = await prisma.receipt.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const availableMonths = Array.from(
    new Set(
      months.map((r: any) => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    )
  );

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatórios</h2>
          <p className="text-zinc-400 text-sm">Exporte seus gastos mensais</p>
        </div>
      </div>

      {availableMonths.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
          <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhuma nota cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableMonths.map((ym: string) => {
            const [year, month] = ym.split("-");
            const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            });
            return (
              <div key={ym} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold capitalize">{label}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/relatorios/exportar?ano=${year}&mes=${month}&formato=csv`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all"
                  >
                    <FileDown className="h-4 w-4" /> CSV
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
