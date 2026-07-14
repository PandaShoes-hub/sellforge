import db from "./db.server";
import { normalizeLanguage, type Language } from "./i18n";

export async function getShopLanguage(shop: string): Promise<Language> {
  const settings = await db.brandSettings.findUnique({
    where: { shop },
    select: { language: true },
  });

  return normalizeLanguage(settings?.language);
}
