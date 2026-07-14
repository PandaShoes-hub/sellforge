export type AdProvider = "meta" | "google" | "tiktok";

type AdDraftInput = {
  provider: AdProvider;
  productTitle: string;
  price?: string;
  goal: string;
  dailyBudget: number;
  storeUrl?: string;
};

export function createAdDraft(input: AdDraftInput) {
  const providerLabel = input.provider === "meta" ? "Meta" : input.provider === "google" ? "Google" : "TikTok";
  return {
    name: `${providerLabel} | ${input.productTitle}`,
    objective: input.goal,
    headline: `${input.productTitle}${input.price ? ` — ${input.price}` : ""}`,
    primaryText: `Descobre ${input.productTitle}. Compra online de forma simples e segura.`,
    destinationUrl: input.storeUrl || null,
  };
}

export function providerReadiness() {
  return {
    meta: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    google: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET),
    tiktok: Boolean(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET),
  };
}
