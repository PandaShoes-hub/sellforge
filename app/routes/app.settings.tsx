import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getTranslations, normalizeLanguage } from "../i18n";

import "../styles/launchpilot.css";

type Language =
  | "pt-PT"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "it-IT"
  | "de-DE";

const copy = {
  "pt-PT": {
    page: "Definições",
    kicker: "Configuração da loja",
    title: "Personaliza a SellForge para a tua marca",
    description:
      "Define o nome, idioma, tom e cor principal usados em toda a aplicação.",
    brandName: "Nome da marca",
    brandNameHint: "Exemplo: Panda Shoes",
    logoUrl: "URL do logótipo",
    logoHint: "Opcional. Usa um endereço HTTPS.",
    language: "Idioma da aplicação",
    tone: "Tom da comunicação",
    friendly: "Simples e próximo",
    premium: "Elegante",
    energetic: "Energético",
    minimal: "Curto e direto",
    brandColor: "Cor principal",
    save: "Guardar definições",
    saving: "A guardar...",
    saved: "Definições guardadas com sucesso.",
    integrations: "Ligações da aplicação",
    integrationsHint: "Vê o que já está preparado para funcionar.",
    ready: "Pronto",
    missing: "Por configurar",
    ai: "Criação com IA",
    aiReady: "A chave OpenAI está configurada.",
    aiMissing: "Falta adicionar OPENAI_API_KEY no Railway.",
    meta: "Facebook e Instagram",
    metaReady: "Credenciais Meta detetadas.",
    metaMissing: "Falta configurar META_APP_ID e META_APP_SECRET.",
    google: "Google Ads",
    googleReady: "Credenciais Google Ads detetadas.",
    googleMissing:
      "Falta configurar as credenciais Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenciais TikTok detetadas.",
    tiktokMissing:
      "Falta configurar TIKTOK_APP_ID e TIKTOK_APP_SECRET.",
    security: "Segurança",
    securityText:
      "As chaves ficam guardadas no servidor e nunca são mostradas aos clientes.",
    preview: "Pré-visualização da marca",
    previewHint: "Assim aparece a tua identidade dentro da aplicação.",
    noBrand: "A tua marca",
    languageApplied:
      "Atualiza a página depois de guardar para aplicar o idioma em toda a app.",
  },
  "en-US": {
    page: "Settings",
    kicker: "Store configuration",
    title: "Personalise SellForge for your brand",
    description:
      "Set the name, language, tone and main colour used across the app.",
    brandName: "Brand name",
    brandNameHint: "Example: Panda Shoes",
    logoUrl: "Logo URL",
    logoHint: "Optional. Use an HTTPS address.",
    language: "App language",
    tone: "Communication tone",
    friendly: "Simple and friendly",
    premium: "Elegant",
    energetic: "Energetic",
    minimal: "Short and direct",
    brandColor: "Main colour",
    save: "Save settings",
    saving: "Saving...",
    saved: "Settings saved successfully.",
    integrations: "App connections",
    integrationsHint: "See what is already ready to work.",
    ready: "Ready",
    missing: "Needs setup",
    ai: "AI creation",
    aiReady: "OpenAI key is configured.",
    aiMissing: "Add OPENAI_API_KEY in Railway.",
    meta: "Facebook and Instagram",
    metaReady: "Meta credentials detected.",
    metaMissing: "Configure META_APP_ID and META_APP_SECRET.",
    google: "Google Ads",
    googleReady: "Google Ads credentials detected.",
    googleMissing: "Configure Google Ads credentials.",
    tiktok: "TikTok Ads",
    tiktokReady: "TikTok credentials detected.",
    tiktokMissing: "Configure TIKTOK_APP_ID and TIKTOK_APP_SECRET.",
    security: "Security",
    securityText:
      "Keys stay on the server and are never shown to customers.",
    preview: "Brand preview",
    previewHint: "This is how your identity appears inside the app.",
    noBrand: "Your brand",
    languageApplied:
      "Refresh the page after saving to apply the language across the app.",
  },
  "es-ES": {
    page: "Configuración",
    kicker: "Configuración de la tienda",
    title: "Personaliza SellForge para tu marca",
    description:
      "Define el nombre, idioma, tono y color principal de la aplicación.",
    brandName: "Nombre de la marca",
    brandNameHint: "Ejemplo: Panda Shoes",
    logoUrl: "URL del logotipo",
    logoHint: "Opcional. Usa una dirección HTTPS.",
    language: "Idioma de la aplicación",
    tone: "Tono de comunicación",
    friendly: "Simple y cercano",
    premium: "Elegante",
    energetic: "Enérgico",
    minimal: "Corto y directo",
    brandColor: "Color principal",
    save: "Guardar configuración",
    saving: "Guardando...",
    saved: "Configuración guardada correctamente.",
    integrations: "Conexiones de la aplicación",
    integrationsHint: "Consulta qué está listo para funcionar.",
    ready: "Listo",
    missing: "Por configurar",
    ai: "Creación con IA",
    aiReady: "La clave de OpenAI está configurada.",
    aiMissing: "Falta OPENAI_API_KEY en Railway.",
    meta: "Facebook e Instagram",
    metaReady: "Credenciales Meta detectadas.",
    metaMissing: "Faltan META_APP_ID y META_APP_SECRET.",
    google: "Google Ads",
    googleReady: "Credenciales Google Ads detectadas.",
    googleMissing: "Faltan las credenciales de Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenciales TikTok detectadas.",
    tiktokMissing: "Faltan TIKTOK_APP_ID y TIKTOK_APP_SECRET.",
    security: "Seguridad",
    securityText:
      "Las claves permanecen en el servidor y nunca se muestran a los clientes.",
    preview: "Vista previa de la marca",
    previewHint: "Así aparece tu identidad dentro de la aplicación.",
    noBrand: "Tu marca",
    languageApplied:
      "Actualiza la página después de guardar para aplicar el idioma.",
  },
  "fr-FR": {
    page: "Paramètres",
    kicker: "Configuration de la boutique",
    title: "Personnalisez SellForge pour votre marque",
    description:
      "Définissez le nom, la langue, le ton et la couleur principale.",
    brandName: "Nom de la marque",
    brandNameHint: "Exemple : Panda Shoes",
    logoUrl: "URL du logo",
    logoHint: "Facultatif. Utilisez une adresse HTTPS.",
    language: "Langue de l’application",
    tone: "Ton de communication",
    friendly: "Simple et proche",
    premium: "Élégant",
    energetic: "Énergique",
    minimal: "Court et direct",
    brandColor: "Couleur principale",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Paramètres enregistrés avec succès.",
    integrations: "Connexions de l’application",
    integrationsHint: "Voyez ce qui est déjà prêt.",
    ready: "Prêt",
    missing: "À configurer",
    ai: "Création avec IA",
    aiReady: "La clé OpenAI est configurée.",
    aiMissing: "Ajoutez OPENAI_API_KEY dans Railway.",
    meta: "Facebook et Instagram",
    metaReady: "Identifiants Meta détectés.",
    metaMissing: "Configurez META_APP_ID et META_APP_SECRET.",
    google: "Google Ads",
    googleReady: "Identifiants Google Ads détectés.",
    googleMissing: "Configurez les identifiants Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Identifiants TikTok détectés.",
    tiktokMissing: "Configurez TIKTOK_APP_ID et TIKTOK_APP_SECRET.",
    security: "Sécurité",
    securityText:
      "Les clés restent sur le serveur et ne sont jamais montrées aux clients.",
    preview: "Aperçu de la marque",
    previewHint: "Voici comment votre identité apparaît dans l’application.",
    noBrand: "Votre marque",
    languageApplied:
      "Actualisez la page après l’enregistrement pour appliquer la langue.",
  },
  "it-IT": {
    page: "Impostazioni",
    kicker: "Configurazione del negozio",
    title: "Personalizza SellForge per il tuo brand",
    description:
      "Definisci nome, lingua, tono e colore principale dell’app.",
    brandName: "Nome del brand",
    brandNameHint: "Esempio: Panda Shoes",
    logoUrl: "URL del logo",
    logoHint: "Opzionale. Usa un indirizzo HTTPS.",
    language: "Lingua dell’app",
    tone: "Tono della comunicazione",
    friendly: "Semplice e vicino",
    premium: "Elegante",
    energetic: "Energico",
    minimal: "Breve e diretto",
    brandColor: "Colore principale",
    save: "Salva impostazioni",
    saving: "Salvataggio...",
    saved: "Impostazioni salvate con successo.",
    integrations: "Connessioni dell’app",
    integrationsHint: "Controlla cosa è già pronto.",
    ready: "Pronto",
    missing: "Da configurare",
    ai: "Creazione con IA",
    aiReady: "La chiave OpenAI è configurata.",
    aiMissing: "Aggiungi OPENAI_API_KEY in Railway.",
    meta: "Facebook e Instagram",
    metaReady: "Credenziali Meta rilevate.",
    metaMissing: "Configura META_APP_ID e META_APP_SECRET.",
    google: "Google Ads",
    googleReady: "Credenziali Google Ads rilevate.",
    googleMissing: "Configura le credenziali Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenziali TikTok rilevate.",
    tiktokMissing: "Configura TIKTOK_APP_ID e TIKTOK_APP_SECRET.",
    security: "Sicurezza",
    securityText:
      "Le chiavi restano sul server e non vengono mai mostrate ai clienti.",
    preview: "Anteprima del brand",
    previewHint: "Così appare la tua identità dentro l’app.",
    noBrand: "Il tuo brand",
    languageApplied:
      "Aggiorna la pagina dopo il salvataggio per applicare la lingua.",
  },
  "de-DE": {
    page: "Einstellungen",
    kicker: "Shop-Konfiguration",
    title: "Passe SellForge an deine Marke an",
    description:
      "Lege Name, Sprache, Ton und Hauptfarbe der App fest.",
    brandName: "Markenname",
    brandNameHint: "Beispiel: Panda Shoes",
    logoUrl: "Logo-URL",
    logoHint: "Optional. Verwende eine HTTPS-Adresse.",
    language: "App-Sprache",
    tone: "Kommunikationston",
    friendly: "Einfach und freundlich",
    premium: "Elegant",
    energetic: "Energiegeladen",
    minimal: "Kurz und direkt",
    brandColor: "Hauptfarbe",
    save: "Einstellungen speichern",
    saving: "Wird gespeichert...",
    saved: "Einstellungen erfolgreich gespeichert.",
    integrations: "App-Verbindungen",
    integrationsHint: "Sieh, was bereits einsatzbereit ist.",
    ready: "Bereit",
    missing: "Einrichtung nötig",
    ai: "KI-Erstellung",
    aiReady: "OpenAI-Schlüssel ist konfiguriert.",
    aiMissing: "OPENAI_API_KEY in Railway hinzufügen.",
    meta: "Facebook und Instagram",
    metaReady: "Meta-Zugangsdaten erkannt.",
    metaMissing: "META_APP_ID und META_APP_SECRET konfigurieren.",
    google: "Google Ads",
    googleReady: "Google-Ads-Zugangsdaten erkannt.",
    googleMissing: "Google-Ads-Zugangsdaten konfigurieren.",
    tiktok: "TikTok Ads",
    tiktokReady: "TikTok-Zugangsdaten erkannt.",
    tiktokMissing: "TIKTOK_APP_ID und TIKTOK_APP_SECRET konfigurieren.",
    security: "Sicherheit",
    securityText:
      "Schlüssel bleiben auf dem Server und werden Kunden nie angezeigt.",
    preview: "Markenvorschau",
    previewHint: "So erscheint deine Identität innerhalb der App.",
    noBrand: "Deine Marke",
    languageApplied:
      "Nach dem Speichern die Seite aktualisieren, um die Sprache anzuwenden.",
  },
} satisfies Record<Language, Record<string, string>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const settings = await db.brandSettings.findUnique({
    where: { shop: session.shop },
  });

  return {
    settings,
    aiReady: Boolean(process.env.OPENAI_API_KEY),
    metaReady: Boolean(
      process.env.META_APP_ID && process.env.META_APP_SECRET,
    ),
    googleReady: Boolean(
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
        process.env.GOOGLE_ADS_CLIENT_ID &&
        process.env.GOOGLE_ADS_CLIENT_SECRET,
    ),
    tiktokReady: Boolean(
      process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET,
    ),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const safeLanguage = normalizeLanguage(
    String(form.get("language") || "pt-PT"),
  );

  const settings = await db.brandSettings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      brandName: String(form.get("brandName") || "").trim(),
      tone: String(form.get("tone") || "friendly"),
      language: safeLanguage,
      primaryColor: String(
        form.get("primaryColor") || "#5B3DF5",
      ),
      logoUrl:
        String(form.get("logoUrl") || "").trim() || null,
    },
    update: {
      brandName: String(form.get("brandName") || "").trim(),
      tone: String(form.get("tone") || "friendly"),
      language: safeLanguage,
      primaryColor: String(
        form.get("primaryColor") || "#5B3DF5",
      ),
      logoUrl:
        String(form.get("logoUrl") || "").trim() || null,
    },
  });

  return {
    ok: true,
    settings,
  };
};

export default function Settings() {
  const {
    settings,
    aiReady,
    metaReady,
    googleReady,
    tiktokReady,
  } = useLoaderData<typeof loader>();

  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const currentLanguage = normalizeLanguage(
    result && "settings" in result
      ? result.settings.language
      : settings?.language || "pt-PT",
  ) as Language;

  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";

  const currentSettings =
    result && "settings" in result
      ? result.settings
      : settings;

  const integrationRows = [
    {
      name: text.ai,
      ready: aiReady,
      readyText: text.aiReady,
      missingText: text.aiMissing,
    },
    {
      name: text.meta,
      ready: metaReady,
      readyText: text.metaReady,
      missingText: text.metaMissing,
    },
    {
      name: text.google,
      ready: googleReady,
      readyText: text.googleReady,
      missingText: text.googleMissing,
    },
    {
      name: text.tiktok,
      ready: tiktokReady,
      readyText: text.tiktokReady,
      missingText: text.tiktokMissing,
    },
  ];

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">S</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">
              {text.description}
            </p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <Form method="post" className="lp-form">
              <label>
                {text.brandName}
                <input
                  name="brandName"
                  placeholder={text.brandNameHint}
                  defaultValue={currentSettings?.brandName || ""}
                />
              </label>

              <label>
                {text.logoUrl}
                <input
                  name="logoUrl"
                  type="url"
                  placeholder={text.logoHint}
                  defaultValue={currentSettings?.logoUrl || ""}
                />
              </label>

              <div className="lp-two-cols">
                <label>
                  {text.language}
                  <select
                    name="language"
                    defaultValue={
                      currentSettings?.language || "pt-PT"
                    }
                  >
                    <option value="pt-PT">Português</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="it-IT">Italiano</option>
                    <option value="de-DE">Deutsch</option>
                  </select>
                </label>

                <label>
                  {text.tone}
                  <select
                    name="tone"
                    defaultValue={
                      currentSettings?.tone || "friendly"
                    }
                  >
                    <option value="friendly">
                      {text.friendly}
                    </option>
                    <option value="premium">
                      {text.premium}
                    </option>
                    <option value="energetic">
                      {text.energetic}
                    </option>
                    <option value="minimal">
                      {text.minimal}
                    </option>
                  </select>
                </label>
              </div>

              <label>
                {text.brandColor}
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={
                    currentSettings?.primaryColor || "#5B3DF5"
                  }
                />
              </label>

              <button
                className="lp-native-button lp-primary"
                type="submit"
                disabled={busy}
              >
                {busy ? text.saving : text.save}
              </button>

              {result && "ok" in result && result.ok ? (
                <>
                  <p className="lp-success-message">
                    {text.saved}
                  </p>
                  <p className="lp-muted">
                    {text.languageApplied}
                  </p>
                </>
              ) : null}
            </Form>
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.preview}
                </h3>
                <p className="lp-panel-subtitle">
                  {text.previewHint}
                </p>
              </div>
            </div>

            <div
              className="lp-connected-account"
              style={{
                borderLeft: `5px solid ${
                  currentSettings?.primaryColor || "#5B3DF5"
                }`,
              }}
            >
              {currentSettings?.logoUrl ? (
                <img
                  src={currentSettings.logoUrl}
                  alt={
                    currentSettings.brandName || text.noBrand
                  }
                />
              ) : (
                <div className="lp-social-avatar">
                  {(currentSettings?.brandName || text.noBrand)
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}

              <div>
                <strong>
                  {currentSettings?.brandName || text.noBrand}
                </strong>
                <span>{currentSettings?.tone || "friendly"}</span>
              </div>
            </div>

            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.integrations}
                </h3>
                <p className="lp-panel-subtitle">
                  {text.integrationsHint}
                </p>
              </div>
            </div>

            <div className="lp-integration-list">
              {integrationRows.map((integration) => (
                <div key={integration.name}>
                  <div>
                    <strong>{integration.name}</strong>
                    <span>
                      {integration.ready
                        ? integration.readyText
                        : integration.missingText}
                    </span>
                  </div>

                  <span
                    className={`lp-status ${
                      integration.ready
                        ? "lp-status-active"
                        : ""
                    }`}
                  >
                    {integration.ready
                      ? text.ready
                      : text.missing}
                  </span>
                </div>
              ))}
            </div>

            <div className="lp-coming-soon">
              <div>
                <strong>{text.security}</strong>
                <div>{text.securityText}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};