import { generateOpenAIText, isOpenAIConfigured } from "./openai.server";

export type AIContext = {
  shopName?: string;
  products?: Array<{
    id: string;
    title: string;
    price?: string;
    description?: string;
  }>;
};

export async function answerQuestion(
  question: string,
  context: AIContext = {},
) {
  if (!isOpenAIConfigured()) {
    return {
      source: "template" as const,
      answer:
        "Liga a chave OPENAI_API_KEY para obter respostas da IA.",
    };
  }

  const prompt = [
    `Loja: ${context.shopName ?? "Desconhecida"}`,
    "",
    "Produtos:",
    JSON.stringify(context.products ?? [], null, 2),
    "",
    `Pergunta: ${question}`,
    "",
    "Responde em português de Portugal, de forma prática e orientada para ecommerce.",
  ].join("\n");

  const answer = await generateOpenAIText({
    system:
      "És o SellForge AI, especialista em Shopify, Meta Ads, Google Ads, TikTok Ads e marketing digital.",
    user: prompt,
  });

  return {
    source: "openai" as const,
    answer,
  };
}

export async function analyzeStore(context: AIContext) {
  return answerQuestion(
    "Analisa esta loja e indica oportunidades para aumentar as vendas.",
    context,
  );
}

export async function findBestProducts(context: AIContext) {
  return answerQuestion(
    "Escolhe os melhores produtos para anunciar e explica porquê.",
    context,
  );
}

export async function generateMarketingPlan(context: AIContext) {
  return answerQuestion(
    "Cria um plano de marketing para os próximos 30 dias.",
    context,
  );
}

export async function generateSocialCalendar(context: AIContext) {
  return answerQuestion(
    "Cria um calendário de conteúdos para 30 dias.",
    context,
  );
}

export async function generateAds(context: AIContext) {
  return answerQuestion(
    "Cria campanhas para Meta Ads, Google Ads e TikTok Ads.",
    context,
  );
}
