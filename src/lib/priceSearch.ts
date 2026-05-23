const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

const supermarketDomains = [
  "paodeacucar.com.br", "carrefour.com.br", "extra.com.br",
  "smart.com.br", "mambo.com.br", "supermercadosbh.com.br",
  "sonda.com.br", "angeloni.com.br", "walmart.com.br"
];

export interface PriceResult {
  title: string;
  link: string;
  price: string | null;
  store: string;
}

export async function searchProductPrice(productName: string): Promise<PriceResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX || GOOGLE_API_KEY === "your_key_here") {
    return [];
  }

  const query = encodeURIComponent(`${productName} preço`);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&gl=br&hl=pt-BR&num=5`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => {
      const domain = extractDomain(item.link);
      const price = extractPrice(item.title, item.snippet);
      return {
        title: item.title,
        link: item.link,
        price,
        store: domain.replace(".com.br", "").replace(".com", ""),
      };
    }).filter((r: PriceResult) => r.store !== "unknown");
  } catch {
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

function extractPrice(title: string, snippet: string): string | null {
  const text = `${title} ${snippet}`;
  const match = text.match(/R\$\s*([0-9]+(?:[,\.][0-9]+)?)/);
  if (match) return `R$ ${match[1].replace(".", ",")}`;
  return null;
}
