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

function parseSPTotal(html: string): number {
  // SP DANFE: "Valor Total R$ 123,45" em div.tx
  const spPats = [
    /[Vv]alor\s*[Tt]otal[^<\d]*R?\$?\s*([\d.,]+)/,
    /VALOR\s+A\s+PAGAR[^<\d]*R?\$?\s*([\d.,]+)/i,
    />R\$\s*([\d.,]+)</,
  ];
  for (const pat of spPats) {
    const m = html.match(pat);
    if (m) {
      const v = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return 0;
}

function parseSPItems(html: string, isSP: boolean): { name: string; quantity: number; unitPrice: number }[] {
  const items: { name: string; quantity: number; unitPrice: number }[] = [];

  if (isSP) {
    // SP DANFE: tabela XSLT com div.tx contendo os dados
    // Padrão: <div class="tx">DESCRICAO</div>...<div class="tx">QTD</div>...<div class="tx">UN</div>...<div class="tx">VALOR</div>
    const spLines: string[] = [];
    const txRegex = /<div[^>]*class="tx"[^>]*>([^<]*)<\/div>/gi;
    let txMatch;
    while ((txMatch = txRegex.exec(html)) !== null) {
      spLines.push(txMatch[1].trim());
    }

    // Agrupa em grupos de 4 (descricao, qtd, un, preco)
    for (let i = 0; i + 3 < spLines.length; i += 4) {
      const name = spLines[i].replace(/\s+/g, " ");
      const qtyStr = spLines[i + 1];
      const priceStr = spLines[i + 3];
      if (name && name.length > 2 && qtyStr && priceStr) {
        const qty = parseFloat(qtyStr.replace(",", "."));
        const price = parseFloat(priceStr.replace(/\./g, "").replace(",", "."));
        if (!isNaN(qty) && !isNaN(price) && qty > 0 && qty < 10000 && price > 0 && price < 100000) {
          items.push({ name, quantity: qty, unitPrice: price });
        }
      }
    }
    if (items.length > 0) return items;
  }

  // Padrão genérico: linhas <tr> com <td>
  const tablePatterns = [
    /<tr[^>]*>[\s\S]*?<td[^>]*>(?:<span[^>]*>)?(\d+)(?:<\/span>)?<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([\d.,]+)<\/td>/gi,
    /<td[^>]*>([^<]{3,80})<\/td>\s*<td[^>]*>([\d.,]+)\s*<\/td>\s*<td[^>]*>(\w+)\s*<\/td>\s*<td[^>]*>([\d.,]+)\s*<\/td>/gi,
  ];

  for (const tablePat of tablePatterns) {
    let match;
    while ((match = tablePat.exec(html)) !== null) {
      const name = (match[2] || match[1] || "").replace(/<[^>]+>/g, "").trim();
      let qtyStr = "";
      let priceStr = "";
      if (match.length >= 6) {
        qtyStr = (match[4] || "").replace(/<[^>]+>/g, "").trim();
        priceStr = (match[5] || "").replace(/<[^>]+>/g, "").trim();
      } else {
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

export async function fetchQRReceiptAction(qrUrl: string, accessKey?: string) {
  try {
    const urlLower = qrUrl.toLowerCase();
    const isSP = urlLower.includes("fazenda.sp.gov.br");

    const res = await fetch(qrUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    // Detecta se é página de erro/CAPTCHA (não contém dados da nota)
    if (html.includes("Página não encontrada") || html.includes("g-recaptcha") || html.includes("captcha")) {
      return { error: true, message: "Página com CAPTCHA ou não encontrada." };
    }

    // Extrai CNPJ
    const cnpjMatch = html.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    const cnpj = cnpjMatch ? cnpjMatch[1] : "";

    // Extrai nome do mercado - patterns específicos e genéricos
    const namePats = isSP ? [
      // SP: "Razão Social" seguido do nome em div.tx ou span
      /(?:Razão\s*Social|Nome\s*Fantasia|Razao\s*Social)\s*[:.]?\s*<[^>]*>\s*([^<]{3,80})\s*<\//i,
      /(?:Razão\s*Social|Nome\s*Fantasia)(?:[^<]*?<[^>]*>){1,3}\s*([^<]{3,80})\s*<\//i,
      // SP: nome em destaque no topo
      /<div[^>]*class="tx"[^>]*>\s*([A-Z][A-Z\s.&,/-]{5,60})\s*<\/div>/,
    ] : [];
    const genericPats = [
      /fantasia["':\s]*["']([^"']+)["']/i,
      /razao["':\s]*["']([^"']+)["']/i,
      /(?:Nome\s*(?:Fantasia|Razão\s*Social)|Razão\s*Social|Mercado|Estabelecimento)\s*[:]\s*([^<\n]{3,60})/i,
      /<[^>]*>(?:Nome|Razão|Mercado|Empresa)[^<]*<\/[^>]*>\s*<[^>]*>([^<]{3,60})</i,
      /<title>([^<]+)<\/title>/i,
    ];
    const allPats = [...namePats, ...genericPats];
    let marketName = "";
    for (const pat of allPats) {
      const m = html.match(pat);
      if (m) {
        const name = m[1].trim().replace(/\s+/g, " ").replace(/<[^>]+>/g, "");
        if (name.length > 3 && !name.toLowerCase().includes("secretaria") && !name.toLowerCase().includes("governo")) {
          marketName = name;
          break;
        }
      }
    }

    // Se não achou nome ou parece inválido, tenta fallback via accessKey
    const marketIsFallback = !marketName || marketName.length < 4;

    // Data
    const dataMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/);
    const date = dataMatch
      ? new Date(dataMatch[1].split("/").reverse().join("-")).toISOString().split("T")[0]
      : "";

    // Total
    let total = parseSPTotal(html);
    if (!total) {
      // Fallback: procura qualquer valor R$ no HTML próximo a "total"
      const fallbackTotal = html.match(/[Tt]otal[^<]*R\$\s*([\d.,]+)/);
      if (fallbackTotal) {
        const v = parseFloat(fallbackTotal[1].replace(/\./g, "").replace(",", "."));
        if (!isNaN(v) && v > 0) total = v;
      }
    }

    // Itens
    const items = parseSPItems(html, isSP);

    // Se veio tudo genérico (sem nome, sem itens), retorna erro pra usar fallback do accessKey
    if (marketIsFallback && items.length === 0 && !total) {
      return { error: true, message: "Não foi possível extrair dados da página." };
    }

    return {
      marketName: marketName || "Mercado",
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
      _partial: marketIsFallback,
    };
  } catch (error) {
    console.error("Erro ao buscar NFCE:", error);
    return { error: true, message: "Não foi possível obter os dados da NFCE." };
  }
}
