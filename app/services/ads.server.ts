export type AdProvider = "meta" | "google" | "tiktok";

export type AdDraftInput = {
  provider: AdProvider;
  productTitle: string;
  price?: string;
  goal: string;
  dailyBudget: number;
  storeUrl?: string;
};

export type AdDraft = {
  name: string;
  objective: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  destinationUrl: string | null;
  budgetLabel: string;
};

function providerName(provider: AdProvider) {
  switch (provider) {
    case "meta":
      return "Meta";
    case "google":
      return "Google";
    case "tiktok":
      return "TikTok";
  }
}

function goalToObjective(goal: string) {
  switch (goal) {
    case "traffic":
      return "Traffic";
    case "awareness":
      return "Brand Awareness";
    case "sales":
    default:
      return "Sales";
  }
}

export function createAdDraft(input: AdDraftInput): AdDraft {
  const provider = providerName(input.provider);
  const price = input.price ? ` por ${input.price}` : "";
  return {
    name: `${provider} | ${input.productTitle}`,
    objective: goalToObjective(input.goal),
    headline: `${input.productTitle}${input.price ? ` • ${input.price}` : ""}`,
    primaryText:
      `Descobre ${input.productTitle}${price}. ` +
      "Encomenda online de forma rápida, simples e segura.",
    description:
      "Criado automaticamente pela SellForge AI e pronto para revisão antes da publicação.",
    callToAction: "Comprar agora",
    destinationUrl: input.storeUrl ?? null,
    budgetLabel: `€${input.dailyBudget}/dia`,
  };
}

export function providerReadiness() {
  return {
    meta: Boolean(
      process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      process.env.META_REDIRECT_URI
    ),
    google: Boolean(
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET
    ),
    tiktok: Boolean(
      process.env.TIKTOK_APP_ID &&
      process.env.TIKTOK_APP_SECRET
    ),
  };
}

export function availableProviders(): AdProvider[] {
  const ready = providerReadiness();
  return (Object.keys(ready) as AdProvider[]).filter(
    (key) => ready[key]
  );
}