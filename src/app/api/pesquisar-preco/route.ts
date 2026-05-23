import { searchProductPrice } from "@/lib/priceSearch";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { productName } = await request.json();
  if (!productName) return Response.json({ error: "Nome do produto obrigatório" }, { status: 400 });

  const results = await searchProductPrice(productName);
  return Response.json({ results });
}
