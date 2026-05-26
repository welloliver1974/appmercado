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
  const query = `comprar ${productName}`;

  // 1. Try Serper.dev (https://serper.dev) - Highly reliable, 2500 free searches
  if (process.env.SERPER_API_KEY) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          gl: "br",
          hl: "pt-br",
          num: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.organic && data.organic.length > 0) {
          const results = processOrganicResults(data.organic.map((x: any) => ({
            title: x.title,
            link: x.link,
            snippet: x.snippet || ""
          })));
          if (results.length > 0) return results;
        }
      }
    } catch (e) {
      console.error("Serper.dev Search Error:", e);
    }
  }

  // 2. Try SerpApi (https://serpapi.com) - Very robust, 100 free searches/mo
  if (process.env.SERPAPI_API_KEY) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("engine", "google");
      url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
      url.searchParams.set("gl", "br");
      url.searchParams.set("hl", "pt-br");
      url.searchParams.set("num", "10");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.organic_results && data.organic_results.length > 0) {
          const results = processOrganicResults(data.organic_results.map((x: any) => ({
            title: x.title,
            link: x.link,
            snippet: x.snippet || ""
          })));
          if (results.length > 0) return results;
        }
      }
    } catch (e) {
      console.error("SerpApi Search Error:", e);
    }
  }

  // 3. Try Tavily (https://tavily.com) - Perfect for AI, 1000 free searches/mo
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: "basic",
          max_results: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const results = processOrganicResults(data.results.map((x: any) => ({
            title: x.title,
            link: x.url,
            snippet: x.content || ""
          })));
          if (results.length > 0) return results;
        }
      }
    } catch (e) {
      console.error("Tavily Search Error:", e);
    }
  }

  // 4. Try Google Custom Search (https://developers.google.com/custom-search/v1/overview)
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_CX) {
    try {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", process.env.GOOGLE_SEARCH_API_KEY);
      url.searchParams.set("cx", process.env.GOOGLE_CX);
      url.searchParams.set("q", query);
      url.searchParams.set("gl", "br");
      url.searchParams.set("hl", "pt-br");
      url.searchParams.set("num", "10");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const results = processOrganicResults(data.items.map((x: any) => ({
            title: x.title,
            link: x.link,
            snippet: x.snippet || ""
          })));
          if (results.length > 0) return results;
        }
      }
    } catch (e) {
      console.error("Google Custom Search Error:", e);
    }
  }

  // 5. Ultimate Fallback: DuckDuckGo Lite HTML Scraping
  try {
    const body = new URLSearchParams({ q: query, o: "json" });
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body,
    });

    if (res.ok) {
      const html = await res.text();
      return parseDuckDuckGoLite(html);
    }
  } catch (e) {
    console.error("DuckDuckGo Lite Fallback Error:", e);
  }

  return [];
}

interface GenericResult {
  title: string;
  link: string;
  snippet: string;
}

function processOrganicResults(items: GenericResult[]): PriceResult[] {
  const results: PriceResult[] = [];

  for (const item of items) {
    const domain = extractDomain(item.link);
    const store = getStoreName(domain);
    if (!store) continue;

    const price = extractPrice(item.title, item.snippet);
    results.push({
      title: item.title,
      link: item.link,
      price,
      store,
    });

    if (results.length >= 5) break;
  }

  return results;
}

function parseDuckDuckGoLite(html: string): PriceResult[] {
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
  const match = text.match(/R\$\s*([0-9]+(?:[,\.][0-9]+)?)/i);
  if (match) return `R$ ${match[1].replace(".", ",")}`;
  return null;
}
