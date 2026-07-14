type GenerateInput = {
  productTitle: string;
  productDescription?: string;
  price?: string;
  tone: string;
  language: string;
  goal: string;
  format: string;
};

type GeneratedCampaign = {
  title: string;
  caption: string;
  hashtags: string;
  callToAction: string;
  source: "openai" | "template";
};

function templateCampaign(input: GenerateInput): GeneratedCampaign {
  const priceLine = input.price ? ` por ${input.price}` : "";
  const title = `${input.productTitle}: a escolha certa para hoje`;
  const caption = `${input.productTitle}${priceLine}. ${input.productDescription || "Descobre um produto pensado para tornar o teu dia melhor."} Aproveita agora e visita a nossa loja para veres todos os detalhes.`;
  const words = input.productTitle.toLowerCase().replace(/[^a-z0-9À-ÿ ]/gi, "").split(/\s+/).filter(Boolean).slice(0, 3);
  const hashtags = ["#novidade", "#comprasonline", "#shopify", ...words.map((w) => `#${w}`)].join(" ");
  return { title, caption, hashtags, callToAction: "Comprar agora", source: "template" };
}

export async function generateCampaign(input: GenerateInput): Promise<GeneratedCampaign> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return templateCampaign(input);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: "You are an ecommerce social media copywriter. Return only valid JSON with title, caption, hashtags and callToAction." },
          { role: "user", content: JSON.stringify(input) },
        ],
        text: { format: { type: "json_schema", name: "campaign", schema: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, caption: { type: "string" }, hashtags: { type: "string" }, callToAction: { type: "string" } }, required: ["title", "caption", "hashtags", "callToAction"] } } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json() as any;
    const text = data.output_text || data.output?.flatMap((o:any)=>o.content||[]).find((c:any)=>c.type==="output_text")?.text;
    const parsed = JSON.parse(text);
    return { ...parsed, source: "openai" };
  } catch {
    return templateCampaign(input);
  }
}
