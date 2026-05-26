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
  try {
    const body = new URLSearchParams({ q: `comprar ${productName}`, o: "json" });

    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
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

  const linkRegex = /<a rel="nofollow" href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRegex = /<td class='result-snippet'>([\s\S]*?)<\/td>/g;

  const links: { url: string; title: string }[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    if (url && title && !url.includes("duckduckgo.com")) {
      links.push({ url, title });
    }
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(match[1].replace(/<[^>]*>/g, "").trim());
  }

  for (let i = 0; i < links.length; i++) {
    const { url, title } = links[i];
    const domain = extractDomain(url);
    const store = getStoreName(domain);
    if (!store) continue;

    const snippet = snippets[i] || "";
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
