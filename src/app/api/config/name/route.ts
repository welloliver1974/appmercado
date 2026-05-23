import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const text = await request.text();
  const params = new URLSearchParams(text);
  const name = params.get("name");
  if (!name || !name.trim()) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
  return NextResponse.json({ success: true });
}
