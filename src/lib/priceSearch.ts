const STORE_DOMAINS = [
  "mercadolivre.com.br", "carrefour.com.br", "paodeacucar.com.br",
  "extra.com.br", "atacadao.com.br", "amazon.com.br",
  "mundomr.com.br", "supermercadosbh.com.br", "angeloni.com.br",
  "smart.com.br", "sonda.com.br", "mambo.com.br",
  "walmart.com.br", "shopee.com.br", "magazineluiza.com.br",
  "americanas.com.br", "casasbahia.com.br",
];

export interface PriceResult {
  title: string;
  link: string;
  price: string | null;
  store: string;
}

export async function searchProductPrice(productName: string): Promise<PriceResult[]> {
  const body = new URLSearchParams({ q: `${productName} preço` });

  try {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const html = await res.text();
    return parseResults(html);
  } catch {
    return [];
  }
}

function parseResults(html: string): PriceResult[] {
  const results: PriceResult[] = [];
  const blockRegex = /<div\s+class="result\s+results_links[^>]*>([\s\S]*?)<\/div>\s*<div\s+class="clear"[^>]*>/gi;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[1];
    const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const url = titleMatch[1];
    const title = titleMatch[2].replace(/<[^>]*>/g, "").trim();
    if (!title) continue;

    const domain = extractDomain(url);
    const store = getStoreName(domain);
    if (!store) continue;

    const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
    const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";
    const price = extractPrice(title, snippet);

    results.push({ title, link: url, price, store });
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
  for (const d of STORE_DOMAINS) {
    if (domain === d || domain.endsWith("." + d)) return d.split(".")[0];
  }
  return null;
}

function extractPrice(title: string, snippet: string): string | null {
  const text = `${title} ${snippet}`;
  const match = text.match(/R\$\s*([0-9]+(?:[,\.][0-9]+)?)/);
  if (match) return `R$ ${match[1].replace(".", ",")}`;
  return null;
}
