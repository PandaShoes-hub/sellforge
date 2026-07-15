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

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const CAMPAIGN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      minLength: 3,
      maxLength: 90,
    },
    caption: {
      type: "string",
      minLength: 20,
      maxLength: 1200,
    },
    hashtags: {
      type: "string",
      minLength: 1,
      maxLength: 300,
    },
    callToAction: {
      type: "string",
      minLength: 2,
      maxLength: 60,
    },
  },
  required: [
    "title",
    "caption",
    "hashtags",
    "callToAction",
  ],
} as const;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanHashtags(value: unknown) {
  const tags = String(value ?? "")
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .map((tag) =>
      tag
        .replace(/[^\p{L}\p{N}_#]/gu, "")
        .slice(0, 40),
    )
    .filter((tag) => tag.length > 1);

  return [...new Set(tags)].slice(0, 12).join(" ");
}

function languageFamily(language: string) {
  const code = language.toLowerCase();

  if (code.startsWith("pt")) return "pt";
  if (code.startsWith("es")) return "es";
  if (code.startsWith("fr")) return "fr";
  if (code.startsWith("it")) return "it";
  if (code.startsWith("de")) return "de";

  return "en";
}

function templateCampaign(
  input: GenerateInput,
): GeneratedCampaign {
  const language = languageFamily(input.language);
  const price = input.price ? ` ${input.price}` : "";
  const description =
    cleanText(input.productDescription, 260) ||
    cleanText(input.productTitle, 120);

  const templates = {
    pt: {
      title: `${input.productTitle}: descobre porque vale a pena`,
      caption: `${input.productTitle}${price}. ${description}. Descobre todos os detalhes na nossa loja e escolhe a opção certa para ti.`,
      hashtags: "#novidade #comprasonline #lojaonline",
      cta: "Comprar agora",
    },
    es: {
      title: `${input.productTitle}: descubre por qué merece la pena`,
      caption: `${input.productTitle}${price}. ${description}. Descubre todos los detalles en nuestra tienda y elige la opción ideal para ti.`,
      hashtags: "#novedad #comprasonline #tiendaonline",
      cta: "Comprar ahora",
    },
    fr: {
      title: `${input.productTitle} : découvrez pourquoi il mérite votre attention`,
      caption: `${input.productTitle}${price}. ${description}. Découvrez tous les détails dans notre boutique et choisissez l’option qui vous convient.`,
      hashtags: "#nouveaute #achatsenligne #boutiqueenligne",
      cta: "Acheter maintenant",
    },
    it: {
      title: `${input.productTitle}: scopri perché vale la pena`,
      caption: `${input.productTitle}${price}. ${description}. Scopri tutti i dettagli nel nostro negozio e scegli l’opzione giusta per te.`,
      hashtags: "#novita #acquistionline #negozioonline",
      cta: "Acquista ora",
    },
    de: {
      title: `${input.productTitle}: entdecke die Vorteile`,
      caption: `${input.productTitle}${price}. ${description}. Entdecke alle Details in unserem Shop und finde die passende Option für dich.`,
      hashtags: "#neu #onlineshopping #onlineshop",
      cta: "Jetzt kaufen",
    },
    en: {
      title: `${input.productTitle}: discover why it stands out`,
      caption: `${input.productTitle}${price}. ${description}. Explore the details in our store and choose the right option for you.`,
      hashtags: "#newarrival #onlineshopping #shoponline",
      cta: "Shop now",
    },
  } as const;

  const selected = templates[language];
  const productTags = input.productTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .map((word) => `#${word}`);

  return {
    title: cleanText(selected.title, 90),
    caption: cleanText(selected.caption, 1200),
    hashtags: cleanHashtags(
      `${selected.hashtags} ${productTags.join(" ")}`,
    ),
    callToAction: selected.cta,
    source: "template",
  };
}

function extractOutputText(data: OpenAIResponse) {
  if (data.output_text?.trim()) {
    return data.output_text.trim();
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        content.type === "output_text" &&
        content.text?.trim()
      ) {
        return content.text.trim();
      }

      if (content.type === "refusal" && content.refusal) {
        throw new Error(content.refusal);
      }
    }
  }

  throw new Error("OpenAI returned no campaign text");
}

function validateGeneratedCampaign(
  value: unknown,
): Omit<GeneratedCampaign, "source"> {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid campaign response");
  }

  const campaign = value as Record<string, unknown>;

  const title = cleanText(campaign.title, 90);
  const caption = cleanText(campaign.caption, 1200);
  const hashtags = cleanHashtags(campaign.hashtags);
  const callToAction = cleanText(
    campaign.callToAction,
    60,
  );

  if (
    title.length < 3 ||
    caption.length < 20 ||
    hashtags.length < 2 ||
    callToAction.length < 2
  ) {
    throw new Error("Incomplete campaign response");
  }

  return {
    title,
    caption,
    hashtags,
    callToAction,
  };
}

function buildSystemPrompt(input: GenerateInput) {
  return [
    "You are SellForge AI, an expert ecommerce marketing copywriter.",
    "Create persuasive but honest social media copy for a Shopify product.",
    "Never invent product features, discounts, guarantees, stock levels, reviews or delivery promises.",
    "Use only the product information provided.",
    `Write in locale: ${input.language}.`,
    `Tone: ${input.tone}.`,
    `Marketing goal: ${input.goal}.`,
    `Content format: ${input.format}.`,
    "Keep the title clear and commercial.",
    "Keep the caption easy to read and suitable for the selected format.",
    "Use 4 to 10 relevant hashtags.",
    "Return only the requested structured JSON.",
  ].join("\n");
}

export async function generateCampaign(
  input: GenerateInput,
): Promise<GeneratedCampaign> {
  const fallback = templateCampaign(input);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return fallback;
  }

  const model =
    process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          store: false,
          input: [
            {
              role: "system",
              content: buildSystemPrompt(input),
            },
            {
              role: "user",
              content: JSON.stringify({
                productTitle: cleanText(
                  input.productTitle,
                  160,
                ),
                productDescription: cleanText(
                  input.productDescription,
                  1200,
                ),
                price: cleanText(input.price, 50),
                tone: cleanText(input.tone, 50),
                language: cleanText(input.language, 20),
                goal: cleanText(input.goal, 50),
                format: cleanText(input.format, 50),
              }),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "sellforge_campaign",
              strict: true,
              schema: CAMPAIGN_SCHEMA,
            },
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    const data = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          `OpenAI request failed (${response.status})`,
      );
    }

    const parsed = JSON.parse(extractOutputText(data));
    const campaign = validateGeneratedCampaign(parsed);

    return {
      ...campaign,
      source: "openai",
    };
  } catch (error) {
    console.error(
      "SellForge campaign generation failed. Using template fallback.",
      error,
    );

    return fallback;
  }
}