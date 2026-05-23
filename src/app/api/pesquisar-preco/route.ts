import { searchProductPrice } from "@/lib/priceSearch";

export async function POST(request: Request) {
  const { productName } = await request.json();
  if (!productName) return Response.json({ error: "Nome do produto obrigatório" }, { status: 400 });

  const results = await searchProductPrice(productName);
  return Response.json({ results });
}
