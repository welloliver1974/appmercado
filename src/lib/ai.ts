import OpenAI from "openai";

const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || "groq";

const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-exp:free",
    chatModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    chatModel: "llama-3.3-70b-versatile",
  },
};

function getClient() {
  const activeConfig = provider === "groq" ? config.groq : config.openrouter;
  if (!activeConfig.apiKey || activeConfig.apiKey === "your_key_here") return null;
  return new OpenAI({
    apiKey: activeConfig.apiKey,
    baseURL: activeConfig.baseURL,
  });
}

function chatModel() {
  return provider === "groq" ? config.groq.chatModel : config.openrouter.chatModel;
}

export async function processReceiptImage(base64Image: string) {
  const openai = getClient();
  if (!openai) {
    return { error: true, message: "API de IA não configurada. Configure OPENROUTER_API_KEY ou GROQ_API_KEY no .env" };
  }

  try {
    const response = await openai.chat.completions.create({
      model: provider === "groq" ? config.groq.model : config.openrouter.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Você é um OCR especializado em notas fiscais brasileiras. Analise a imagem COM MUITO CUIDADO e retorne APENAS um JSON no seguinte formato:
              {
                "marketName": "Nome do Mercado",
                "date": "YYYY-MM-DD",
                "totalAmount": 0.00,
                "items": [
                  { "name": "Nome do Produto", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00, "unit": "un/kg/L" }
                ]
              }

              REGRAS IMPORTANTES:
              - Leia CADA número com atenção. Um desvio de 1kg pode representar 100% de erro.
              - No Brasil a vírgula separa decimais: "1,735 kg" significa UM VÍRGULA SETECENTOS E TRINTA E CINCO kg (≈1.7 kg), não mil setecentos.
              - Converta para ponto: 1,735 → 1.735
              - "1 kg" significa 1.0, não 1000.
              - Se o peso for "1.200 kg" no Brasil significa MIL E DUZENTOS kg. Só use isso se realmente houver 1200 kg.
              - Confira se o número faz sentido: uma banana não pesa 2000 kg. Use o bom senso.
              - Preços (unitPrice) e totais (totalPrice) seguem a mesma regra: R$ 1,99 → 1.99
              - Se não conseguir identificar algum campo, deixe vazio ou como 0.`
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    const detail = error?.message || error?.status || "Erro desconhecido";
    console.error("Erro ao processar imagem com IA:", detail);
    return { error: true, message: `Erro na API de IA: ${detail}` };
  }
}

export async function categorizeProduct(productName: string): Promise<string> {
  const openai = getClient();
  if (!openai) return "Geral";

  try {
    const response = await openai.chat.completions.create({
      model: chatModel(),
      messages: [
        {
          role: "system",
          content: "Você classifica produtos de supermercado em categorias. Retorne APENAS o nome da categoria em português. Escolha entre: Hortifrúti, Laticínios, Carnes, Bebidas, Limpeza, Higiene, Padaria, Enlatados, Grãos, Massas, Temperos, Doces, Congelados, Bebidas Alcoólicas, Pet Shop, Bebês, Utilidades Domésticas, Outros."
        },
        {
          role: "user",
          content: `Em qual categoria se encaixa "${productName}"?`
        }
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    const category = response.choices[0].message.content?.trim() || "Geral";
    const validCategories = ["Hortifrúti", "Laticínios", "Carnes", "Bebidas", "Limpeza", "Higiene", "Padaria", "Enlatados", "Grãos", "Massas", "Temperos", "Doces", "Congelados", "Bebidas Alcoólicas", "Pet Shop", "Bebês", "Utilidades Domésticas", "Outros"];
    return validCategories.includes(category) ? category : "Outros";
  } catch {
    return "Geral";
  }
}

export async function askAssistant(
  message: string,
  context: {
    totalSpentMonth: number;
    totalStockItems: number;
    criticalItems: number;
    recentPurchases: string;
    monthlyHistory: string;
  }
): Promise<string> {
  const openai = getClient();
  if (!openai) return "⚠️ API de IA não configurada. Configure OPENROUTER_API_KEY ou GROQ_API_KEY no .env para usar o assistente.";

  try {
    const response = await openai.chat.completions.create({
      model: chatModel(),
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro pessoal especializado em análise de gastos de supermercado.
Responda em português de forma clara e direta, baseando-se APENAS nos dados fornecidos.

Contexto atual do usuário:
- Total gasto no mês: R$ ${context.totalSpentMonth.toFixed(2)}
- Total de itens em estoque: ${context.totalStockItems}
- Itens com estoque crítico: ${context.criticalItems}

Últimas compras: ${context.recentPurchases}

Histórico de gastos mensais: ${context.monthlyHistory}

Se perguntarem sobre algo que não está nos dados, diga que não tem essa informação.`
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Não consegui processar sua pergunta.";
  } catch {
    return "Erro ao consultar IA. Verifique sua chave de API.";
  }
}

export async function analyzeSpendingTrend(monthlyTotals: { month: string; total: number }[]): Promise<{
  prediction: number;
  insight: string;
}> {
  const openai = getClient();
  if (!openai) {
    const avg = monthlyTotals.reduce((s: number, m: { month: string; total: number }) => s + m.total, 0) / monthlyTotals.length;
    return { prediction: avg, insight: `Média dos últimos ${monthlyTotals.length} meses. Configure a IA para análise avançada.` };
  }

  try {
    const data = monthlyTotals.map(m => `${m.month}: R$ ${m.total.toFixed(2)}`).join("\n");
    const response = await openai.chat.completions.create({
      model: chatModel(),
      messages: [
        {
          role: "system",
          content: `Analise o histórico de gastos mensais de supermercado e retorne APENAS um JSON:
{
  "prediction": 0.00,
  "insight": "Texto curto em português explicando a tendência"
}
A previsão deve ser para o próximo mês baseada na tendência dos dados.`
        },
        {
          role: "user",
          content: `Histórico de gastos:\n${data}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    const avg = monthlyTotals.reduce((s: number, m: { month: string; total: number }) => s + m.total, 0) / monthlyTotals.length;
    return { prediction: avg, insight: "Previsão baseada na média simples (IA indisponível no momento)." };
  }
}

export async function detectPriceAnomaly(
  productName: string,
  currentPrice: number,
  priceHistory: { date: string; price: number }[]
): Promise<{ isAnomaly: boolean; reason: string } | null> {
  const openai = getClient();
  if (!openai) return null;

  if (priceHistory.length < 2) return null;

  try {
    const avg = priceHistory.reduce((s: number, p: { date: string; price: number }) => s + p.price, 0) / priceHistory.length;
    const deviation = ((currentPrice - avg) / avg) * 100;

    if (Math.abs(deviation) < 15) return null;

    const data = priceHistory.map(p => `${p.date}: R$ ${p.price.toFixed(2)}`).join("\n");
    const response = await openai.chat.completions.create({
      model: chatModel(),
      messages: [
        {
          role: "system",
          content: `Analise se o preço atual de um produto é anormal comparado ao histórico. Retorne APENAS um JSON:
{ "isAnomaly": true, "reason": "Explicação curta em português" }
ou { "isAnomaly": false } se o preço for normal.`
        },
        {
          role: "user",
          content: `Produto: ${productName}\nPreço atual: R$ ${currentPrice.toFixed(2)}\nMédia histórica: R$ ${avg.toFixed(2)}\nDesvio: ${deviation.toFixed(1)}%\n\nHistórico:\n${data}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    return null;
  }
}
