import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import "../styles/launchpilot.css";
import { getTranslations, normalizeLanguage } from "../i18n.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return {
    settings: await db.brandSettings.findUnique({ where: { shop: session.shop } }),
    aiReady: Boolean(process.env.OPENAI_API_KEY),
    metaReady: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const language = String(form.get("language") || "pt-PT");
  const safeLanguage = normalizeLanguage(language);

  const settings = await db.brandSettings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      brandName: String(form.get("brandName") || ""),
      tone: String(form.get("tone") || "friendly"),
      language: safeLanguage,
      primaryColor: String(form.get("primaryColor") || "#5B3DF5"),
      logoUrl: String(form.get("logoUrl") || "") || null,
    },
    update: {
      brandName: String(form.get("brandName") || ""),
      tone: String(form.get("tone") || "friendly"),
      language: safeLanguage,
      primaryColor: String(form.get("primaryColor") || "#5B3DF5"),
      logoUrl: String(form.get("logoUrl") || "") || null,
    },
  });

  return { ok: true, settings };
};

export default function Settings() {
  const { settings, aiReady, metaReady } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const t = getTranslations(settings?.language || "en-US");

  return (
    <s-page heading={t("settings")}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">⚙️</div>
          <div>
            <p className="lp-eyebrow">{t("brand_workspace_title")}</p>
            <h2 className="lp-module-title">{t("store_settings")}</h2>
            <p className="lp-module-description">
              {t("settings_desc")}
            </p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <Form method="post" className="lp-form">
              <label>
                {t("brand_name")}
                <input name="brandName" defaultValue={settings?.brandName || ""} />
              </label>

              <label>
                {t("logo_url")}
                <input name="logoUrl" defaultValue={settings?.logoUrl || ""} />
              </label>

              <div className="lp-two-cols">
                <label>
                  {t("language")}
                  <select name="language" defaultValue={settings?.language || "pt-PT"}>
                    <option value="pt-PT">Português</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="it-IT">Italiano</option>
                    <option value="de-DE">Deutsch</option>
                  </select>
                </label>

                <label>
                  {t("tone")}
                  <select name="tone" defaultValue={settings?.tone || "friendly"}>
                    <option value="friendly">{t("friendly")}</option>
                    <option value="premium">Premium</option>
                    <option value="energetic">{t("energetic")}</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </label>
              </div>

              <label>
                {t("brand_color")}
                <input type="color" name="primaryColor" defaultValue={settings?.primaryColor || "#5B3DF5"} />
              </label>

              <button className="lp-native-button lp-primary">
                {t("save_settings")}
              </button>

              {result?.ok && (
                <p className="lp-success-message">
                  {t("saved_refresh")}
                </p>
              )}
            </Form>
          </section>

          <section className="lp-panel">
            <h3 className="lp-panel-title">{t("integrations")}</h3>
            <div className="lp-integration-list">
              <div>
                <strong>{t("ai_generation")}</strong>
                <span>{aiReady ? t("ready") : t("template_mode")}</span>
              </div>
              <div>
                <strong>{t("meta_publishing")}</strong>
                <span>{metaReady ? t("credentials_detected") : t("add_meta")}</span>
              </div>
            </div>
            <p className="lp-muted">
              {t("secrets_safe")}
            </p>
          </section>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => boundary.headers(args);
