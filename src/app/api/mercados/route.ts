import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = await getPrisma();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { name } = await request.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });

  const market = await prisma.market.upsert({
    where: { name_userId: { name: name.trim(), userId } },
    update: {},
    create: { name: name.trim(), userId },
  });

  return NextResponse.json({ success: true, market });
}
