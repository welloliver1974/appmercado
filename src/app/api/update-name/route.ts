import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const cookieHeader = request.headers.get("cookie") || "";
  const userId = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("user-id="))
    ?.split("=")[1];

  if (!userId) {
    return Response.redirect(`${origin}/config?erro=login`, 302);
  }

  const text = await request.text();
  const params = new URLSearchParams(text);
  const name = params.get("name");
  if (!name || !name.trim()) {
    return Response.redirect(`${origin}/config?erro=nome`, 302);
  }

  await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
  return Response.redirect(`${origin}/config`, 302);
}
