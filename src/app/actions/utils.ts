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

export async function fetchQRReceiptAction(qrUrl: string) {
  try {
    const res = await fetch(qrUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    // Tenta extrair CNPJ
    const cnpjMatch = html.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    const cnpj = cnpjMatch ? cnpjMatch[1] : "";

    // Tenta extrair nome fantasia/razão social
    const nomeMatch = html.match(/fantasia["':\s]*["']([^"']+)["']/i)
      || html.match(/razao["':\s]*["']([^"']+)["']/i)
      || html.match(/(?:Nome\s*(?:Fantasia|Razão\s*Social)|Razão\s*Social|Mercado|Estabelecimento)\s*[: ]\s*([^<\n]+)/i)
      || html.match(/<[^>]*>(?:Nome|Razão|Mercado|Empresa)[^<]*<\/[^>]*>\s*<[^>]*>([^<]+)</i)
      || html.match(/<title>([^<]+)<\/title>/i);
    const marketName = nomeMatch ? nomeMatch[1].trim().replace(/\s+/g, " ") : `Mercado CNPJ ${cnpj}`;

    // Tenta extrair data
    const dataMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/);
    const date = dataMatch
      ? new Date(dataMatch[1].split("/").reverse().join("-")).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Tenta extrair valor total - várias heurísticas
    let total = 0;
    const totalPatterns = [
      /[Vv]alor\s*[Tt]otal[^<\d]*R?\$?\s*([\d.,]+)/,
      /[Tt]otal\s*[aA]?[Pp]agar[^<\d]*R?\$?\s*([\d.,]+)/,
      /[Tt]otal[^<\d]*R?\$?\s*([\d.,]+)/,
      /[Vv]l\.?\s*[Tt]otal[^<\d]*([\d.,]+)/,
    ];
    for (const pat of totalPatterns) {
      const m = html.match(pat);
      if (m) {
        const v = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
        if (!isNaN(v) && v > 0) { total = v; break; }
      }
    }

    // Tenta extrair itens - procura linhas de tabela com código, descrição, qtd, un, preço
    const items: { name: string; quantity: number; unitPrice: number }[] = [];
    const tablePatterns = [
      // Tabela NFC-e padrão: linhas <tr> com <td> contendo descrição, qtd, un, preço
      /<tr[^>]*>[\s\S]*?<td[^>]*>(?:<span[^>]*>)?(\d+)(?:<\/span>)?<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([\d.,]+)<\/td>/gi,
      // Formato simplificado
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
          if (!isNaN(qty) && !isNaN(price) && qty > 0 && qty < 10000) {
            items.push({ name, quantity: qty, unitPrice: price });
          }
        }
      }
      if (items.length > 0) break;
    }

    return {
      marketName,
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
    };
  } catch (error) {
    console.error("Erro ao buscar NFCE:", error);
    return { error: true, message: "Não foi possível obter os dados da NFCE." };
  }
}
