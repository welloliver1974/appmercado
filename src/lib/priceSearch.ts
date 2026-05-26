const STORE_DOMAINS = [
  "mercadolivre.com.br", "carrefour.com.br", "paodeacucar.com.br",
  "extra.com.br", "atacadao.com.br", "amazon.com.br",
  "mundomr.com.br", "supermercadosbh.com.br", "angeloni.com.br",
  "smart.com.br", "sonda.com.br", "mambo.com.br",
  "walmart.com.br", "shopee.com.br", "magazineluiza.com.br",
  "americanas.com.br", "casasbahia.com.br",
  "tendaatacado.com.br", "assai.com.br", "samsclub.com.br",
];

export interface PriceResult {
  title: string;
  link: string;
  price: string | null;
  store: string;
}

export async function searchProductPrice(productName: string): Promise<PriceResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `comprar ${productName}`,
        gl: "br",
        hl: "pt-br",
        num: 10,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.organic || !Array.isArray(data.organic)) return [];

    return parseSerperResults(data.organic);
  } catch {
    return [];
  }
}

function parseSerperResults(items: any[]): PriceResult[] {
  const results: PriceResult[] = [];
  for (const item of items) {
    const domain = extractDomain(item.link);
    const store = getStoreName(domain);
    if (!store) continue;

    const snippet = item.snippet || "";
    const title = item.title || "";
    const price = extractPrice(title, snippet);

    results.push({ title, link: item.link, price, store });
    if (results.length >= 5) break;
  }
  return results;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function getStoreName(domain: string): string | null {
  if (!domain) return null;
  const skipTLDs = [".gov", ".gov.br", ".edu", ".edu.br"];
  for (const tld of skipTLDs) { if (domain.endsWith(tld)) return null; }
  if (domain.endsWith(".org") || domain.endsWith(".org.br")) return null;
  for (const d of STORE_DOMAINS) {
    if (domain === d || domain.endsWith("." + d)) return d.split(".")[0];
  }
  const parts = domain.split(".");
  if (parts[0] === "www") parts.shift();
  return parts[0] || domain;
}

function extractPrice(title: string, snippet: string): string | null {
  const text = `${title} ${snippet}`;
  const match = text.match(/R\$\s*([0-9]+(?:[,\.][0-9]+)?)/);
  if (match) return `R$ ${match[1].replace(".", ",")}`;
  return null;
}
