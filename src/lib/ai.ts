import OpenAI from "openai";

const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || "openrouter";

const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.2-11b-vision-instruct:free", // Ou outro modelo de sua preferência
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.2-11b-vision-preview",
  },
};

const activeConfig = provider === "groq" ? config.groq : config.openrouter;

const openai = new OpenAI({
  apiKey: activeConfig.apiKey,
  baseURL: activeConfig.baseURL,
  dangerouslyAllowBrowser: true // Apenas para facilitar o dev, o ideal é via Server Action
});

export async function processReceiptImage(base64Image: string) {
  try {
    const response = await openai.chat.completions.create({
      model: activeConfig.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de nota fiscal de supermercado e retorne APENAS um JSON no seguinte formato:
              {
                "marketName": "Nome do Mercado",
                "date": "YYYY-MM-DD",
                "totalAmount": 0.00,
                "items": [
                  { "name": "Nome do Produto", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00, "unit": "un/kg/L" }
                ]
              }
              Se não conseguir identificar algum campo, deixe-o vazio ou como 0.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Erro ao processar imagem com IA:", error);
    throw error;
  }
}
