"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteProductAction(formData: FormData) {
  const prisma = await getPrisma();
  const session = await auth();
  if (!session?.user?.id) return { error: true, message: "Não autorizado" };

  const id = formData.get("id") as string;
  if (!id) return { error: true, message: "ID não informado" };

  try {
    await prisma.product.deleteMany({ where: { id, userId: session.user.id } });
    revalidatePath("/estoque");
    revalidatePath("/lista-compras");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return { error: true, message: "Falha ao deletar produto" };
  }
}

function parseTotal(html: string): number {
  const pats = [
    /[Vv]alor\s*[Tt]otal[^<\d]*R?\$?\s*([\d.,]+)/,
    /VALOR\s+A\s+PAGAR[^<\d]*R?\$?\s*([\d.,]+)/i,
    /[Tt]otal[^<]{0,50}R\$\s*([\d.,]+)/,
    /[Vv]alor\s*[Ll]íquido[^<\d]*R?\$?\s*([\d.,]+)/i,
  ];
  for (const pat of pats) {
    const m = html.match(pat);
    if (m) {
      const v = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return 0;
}

function parseItems(html: string): { name: string; quantity: number; unitPrice: number }[] {
  const items: { name: string; quantity: number; unitPrice: number }[] = [];

  // Tenta pattern de tabela genérica
  const pats = [
    /<tr[^>]*>[\s\S]*?<td[^>]*>(?:<span[^>]*>)?(\d+)(?:<\/span>)?<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([\d.,]+)<\/td>/gi,
    /<td[^>]*>([^<]{3,80})<\/td>\s*<td[^>]*>([\d.,]+)\s*<\/td>\s*<td[^>]*>(\w+)\s*<\/td>\s*<td[^>]*>([\d.,]+)\s*<\/td>/gi,
    // Pattern para div-based layout
    /<div[^>]*class="[^"]*tx[^"]*"[^>]*>([^<]{3,80})<\/div>(?:[\s\S]*?<div[^>]*class="[^"]*tx[^"]*"[^>]*>([^<]*)<\/div>){3}/gi,
  ];

  for (const pat of pats) {
    let match;
    while ((match = pat.exec(html)) !== null) {
      const name = (match[2] || match[1] || "").replace(/<[^>]+>/g, "").trim();
      let qtyStr = "";
      let priceStr = "";
      if (match.length >= 6) {
        qtyStr = (match[4] || "").replace(/<[^>]+>/g, "").trim();
        priceStr = (match[5] || "").replace(/<[^>]+>/g, "").trim();
      } else if (match.length >= 5) {
        qtyStr = (match[2] || "").replace(/<[^>]+>/g, "").trim();
        priceStr = (match[4] || "").replace(/<[^>]+>/g, "").trim();
      }
      if (name && qtyStr && priceStr) {
        const qty = parseFloat(qtyStr.replace(",", "."));
        const price = parseFloat(priceStr.replace(/\./g, "").replace(",", "."));
        if (!isNaN(qty) && !isNaN(price) && qty > 0 && qty < 10000 && price > 0 && price < 100000) {
          items.push({ name, quantity: qty, unitPrice: price });
        }
      }
    }
    if (items.length > 0) break;
  }

  return items;
}

function parseMarketName(html: string): string {
  const pats = [
    /fantasia["':\s]*["']([^"']+)["']/i,
    /razao["':\s]*["']([^"']+)["']/i,
    /(?:Razão\s*Social|Nome\s*Fantasia|Razao\s*Social)\s*[:.]?\s*(?:<[^>]*>\s*)?([^<{]{3,60})/i,
    /(?:Nome\s*(?:Fantasia|Razão\s*Social)|Razão\s*Social|Mercado|Estabelecimento)\s*[:]\s*([^<\n]{3,60})/i,
    /<[^>]*>(?:Nome|Razão|Mercado|Empresa)[^<]*<\/[^>]*>\s*<[^>]*>([^<]{3,60})</i,
    /<title>([^-<]{3,60})/i,
  ];
  for (const pat of pats) {
    const m = html.match(pat);
    if (m) {
      const name = m[1].trim().replace(/\s+/g, " ").replace(/<[^>]+>/g, "");
      if (name.length > 3 && !/secretaria|governo|nota fiscal|consulta|página/i.test(name)) {
        return name;
      }
    }
  }
  return "";
}

export async function fetchQRReceiptAction(qrUrl: string) {
  try {
    const res = await fetch(qrUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    if (html.includes("Página não encontrada") || html.includes("g-recaptcha") || html.includes("captcha")) {
      return { error: true, message: "Página com CAPTCHA ou não encontrada." };
    }

    const marketName = parseMarketName(html);
    const dateMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/);
    const date = dateMatch
      ? new Date(dateMatch[1].split("/").reverse().join("-")).toISOString().split("T")[0]
      : "";
    const total = parseTotal(html);
    const items = parseItems(html);

    // Se não achou nada útil, retorna erro pra usar fallback do accessKey
    if (!marketName && items.length === 0 && !total && !date) {
      return { error: true, message: "Não foi possível extrair dados da página." };
    }

    return {
      marketName: marketName || "",
      date,
      totalAmount: total || undefined,
      items: items.slice(0, 80).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.quantity,
        unit: "un",
      })),
      qrCode: qrUrl,
      _partial: !marketName,
    };
  } catch (error) {
    console.error("Erro ao buscar NFCE:", error);
    return { error: true, message: "Não foi possível obter os dados da NFCE." };
  }
}
