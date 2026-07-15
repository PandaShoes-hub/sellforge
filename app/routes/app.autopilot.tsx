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
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type Language = "pt-PT" | "en-US" | "es-ES" | "fr-FR" | "it-IT" | "de-DE";

const copy = {
  "pt-PT": {
    page: "Piloto Automático",
    kicker: "Marketing sempre ativo",
    title: "Deixa a SellForge organizar o teu marketing",
    description:
      "Escolhe a frequência, as redes sociais e o orçamento. A SellForge guarda o plano e prepara a rotina de marketing.",
    enable: "Ativar Piloto Automático",
    enableHint: "A SellForge passa a preparar conteúdo e anúncios de forma recorrente.",
    posts: "Publicações por semana",
    reels: "Reels por semana",
    stories: "Stories por semana",
    budget: "Orçamento diário para anúncios",
    platforms: "Onde queres publicar?",
    goal: "Objetivo principal",
    sales: "Vender mais",
    traffic: "Levar pessoas ao site",
    awareness: "Dar a conhecer a marca",
    facebookInstagram: "Facebook e Instagram",
    facebook: "Só Facebook",
    instagram: "Só Instagram",
    allSocial: "Facebook, Instagram e TikTok",
    save: "Guardar Piloto Automático",
    saving: "A guardar...",
    saved: "Piloto Automático guardado com sucesso.",
    status: "Estado atual",
    on: "Ligado",
    off: "Desligado",
    nextRun: "Próxima execução",
    notScheduled: "Ainda não agendado",
    summary: "Resumo da rotina",
    summaryHint: "O que a SellForge vai fazer por semana.",
    postsLabel: "Publicações",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Orçamento diário",
  },
  "en-US": {
    page: "Autopilot",
    kicker: "Always-on marketing",
    title: "Let SellForge organise your marketing",
    description:
      "Choose frequency, social channels and budget. SellForge saves the plan and prepares the marketing routine.",
    enable: "Enable Autopilot",
    enableHint: "SellForge starts preparing recurring content and ads.",
    posts: "Posts per week",
    reels: "Reels per week",
    stories: "Stories per week",
    budget: "Daily ad budget",
    platforms: "Where do you want to publish?",
    goal: "Main goal",
    sales: "Sell more",
    traffic: "Send people to the website",
    awareness: "Build brand awareness",
    facebookInstagram: "Facebook and Instagram",
    facebook: "Facebook only",
    instagram: "Instagram only",
    allSocial: "Facebook, Instagram and TikTok",
    save: "Save Autopilot",
    saving: "Saving...",
    saved: "Autopilot saved successfully.",
    status: "Current status",
    on: "On",
    off: "Off",
    nextRun: "Next run",
    notScheduled: "Not scheduled yet",
    summary: "Routine summary",
    summaryHint: "What SellForge will prepare every week.",
    postsLabel: "Posts",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Daily budget",
  },
  "es-ES": {
    page: "Piloto automático",
    kicker: "Marketing siempre activo",
    title: "Deja que SellForge organice tu marketing",
    description:
      "Elige frecuencia, redes sociales y presupuesto. SellForge guarda el plan y prepara la rutina.",
    enable: "Activar Piloto automático",
    enableHint: "SellForge empieza a preparar contenido y anuncios recurrentes.",
    posts: "Publicaciones por semana",
    reels: "Reels por semana",
    stories: "Stories por semana",
    budget: "Presupuesto diario para anuncios",
    platforms: "¿Dónde quieres publicar?",
    goal: "Objetivo principal",
    sales: "Vender más",
    traffic: "Llevar personas al sitio web",
    awareness: "Dar a conocer la marca",
    facebookInstagram: "Facebook e Instagram",
    facebook: "Solo Facebook",
    instagram: "Solo Instagram",
    allSocial: "Facebook, Instagram y TikTok",
    save: "Guardar Piloto automático",
    saving: "Guardando...",
    saved: "Piloto automático guardado correctamente.",
    status: "Estado actual",
    on: "Activado",
    off: "Desactivado",
    nextRun: "Próxima ejecución",
    notScheduled: "Todavía no programado",
    summary: "Resumen de la rutina",
    summaryHint: "Lo que SellForge preparará cada semana.",
    postsLabel: "Publicaciones",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Presupuesto diario",
  },
  "fr-FR": {
    page: "Pilote automatique",
    kicker: "Marketing toujours actif",
    title: "Laissez SellForge organiser votre marketing",
    description:
      "Choisissez la fréquence, les réseaux et le budget. SellForge enregistre le plan et prépare la routine.",
    enable: "Activer le Pilote automatique",
    enableHint: "SellForge commence à préparer du contenu et des publicités récurrentes.",
    posts: "Publications par semaine",
    reels: "Reels par semaine",
    stories: "Stories par semaine",
    budget: "Budget publicitaire quotidien",
    platforms: "Où souhaitez-vous publier ?",
    goal: "Objectif principal",
    sales: "Vendre davantage",
    traffic: "Envoyer des visiteurs vers le site",
    awareness: "Faire connaître la marque",
    facebookInstagram: "Facebook et Instagram",
    facebook: "Facebook uniquement",
    instagram: "Instagram uniquement",
    allSocial: "Facebook, Instagram et TikTok",
    save: "Enregistrer le Pilote automatique",
    saving: "Enregistrement...",
    saved: "Pilote automatique enregistré avec succès.",
    status: "État actuel",
    on: "Activé",
    off: "Désactivé",
    nextRun: "Prochaine exécution",
    notScheduled: "Pas encore programmée",
    summary: "Résumé de la routine",
    summaryHint: "Ce que SellForge préparera chaque semaine.",
    postsLabel: "Publications",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Budget quotidien",
  },
  "it-IT": {
    page: "Pilota automatico",
    kicker: "Marketing sempre attivo",
    title: "Lascia che SellForge organizzi il marketing",
    description:
      "Scegli frequenza, social e budget. SellForge salva il piano e prepara la routine.",
    enable: "Attiva Pilota automatico",
    enableHint: "SellForge inizia a preparare contenuti e annunci ricorrenti.",
    posts: "Post a settimana",
    reels: "Reels a settimana",
    stories: "Stories a settimana",
    budget: "Budget pubblicitario giornaliero",
    platforms: "Dove vuoi pubblicare?",
    goal: "Obiettivo principale",
    sales: "Vendere di più",
    traffic: "Portare persone al sito",
    awareness: "Far conoscere il brand",
    facebookInstagram: "Facebook e Instagram",
    facebook: "Solo Facebook",
    instagram: "Solo Instagram",
    allSocial: "Facebook, Instagram e TikTok",
    save: "Salva Pilota automatico",
    saving: "Salvataggio...",
    saved: "Pilota automatico salvato con successo.",
    status: "Stato attuale",
    on: "Attivo",
    off: "Disattivo",
    nextRun: "Prossima esecuzione",
    notScheduled: "Non ancora programmata",
    summary: "Riepilogo routine",
    summaryHint: "Ciò che SellForge preparerà ogni settimana.",
    postsLabel: "Post",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Budget giornaliero",
  },
  "de-DE": {
    page: "Autopilot",
    kicker: "Dauerhaftes Marketing",
    title: "Lass SellForge dein Marketing organisieren",
    description:
      "Wähle Häufigkeit, Plattformen und Budget. SellForge speichert den Plan und bereitet die Routine vor.",
    enable: "Autopilot aktivieren",
    enableHint: "SellForge beginnt, wiederkehrende Inhalte und Anzeigen vorzubereiten.",
    posts: "Beiträge pro Woche",
    reels: "Reels pro Woche",
    stories: "Stories pro Woche",
    budget: "Tägliches Anzeigenbudget",
    platforms: "Wo möchtest du veröffentlichen?",
    goal: "Hauptziel",
    sales: "Mehr verkaufen",
    traffic: "Besucher zur Website bringen",
    awareness: "Marke bekannter machen",
    facebookInstagram: "Facebook und Instagram",
    facebook: "Nur Facebook",
    instagram: "Nur Instagram",
    allSocial: "Facebook, Instagram und TikTok",
    save: "Autopilot speichern",
    saving: "Wird gespeichert...",
    saved: "Autopilot erfolgreich gespeichert.",
    status: "Aktueller Status",
    on: "Aktiv",
    off: "Inaktiv",
    nextRun: "Nächste Ausführung",
    notScheduled: "Noch nicht geplant",
    summary: "Routineübersicht",
    summaryHint: "Was SellForge jede Woche vorbereitet.",
    postsLabel: "Beiträge",
    reelsLabel: "Reels",
    storiesLabel: "Stories",
    budgetLabel: "Tagesbudget",
  },
} satisfies Record<Language, Record<string, string>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [config, language] = await Promise.all([
    db.autopilotConfig.upsert({
      where: { shop: session.shop },
      update: {},
      create: { shop: session.shop },
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    config,
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const enabled = form.get("enabled") === "on";
  const postsPerWeek = Math.max(
    0,
    Math.min(21, Number(form.get("postsPerWeek") || 3)),
  );
  const reelsPerWeek = Math.max(
    0,
    Math.min(14, Number(form.get("reelsPerWeek") || 1)),
  );
  const storiesPerWeek = Math.max(
    0,
    Math.min(35, Number(form.get("storiesPerWeek") || 3)),
  );
  const dailyBudget = Math.max(
    0,
    Number(form.get("dailyBudget") || 0),
  );
  const platforms = String(
    form.get("platforms") || "facebook,instagram",
  );
  const goal = String(form.get("goal") || "sales");

  const config = await db.autopilotConfig.upsert({
    where: { shop: session.shop },
    update: {
      enabled,
      postsPerWeek,
      reelsPerWeek,
      storiesPerWeek,
      dailyBudget,
      platforms,
      goal,
      nextRunAt: enabled
        ? new Date(Date.now() + 86_400_000)
        : null,
    },
    create: {
      shop: session.shop,
      enabled,
      postsPerWeek,
      reelsPerWeek,
      storiesPerWeek,
      dailyBudget,
      platforms,
      goal,
      nextRunAt: enabled
        ? new Date(Date.now() + 86_400_000)
        : null,
    },
  });

  return {
    ok: true,
    config,
  };
};

export default function Autopilot() {
  const { config, language } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const currentLanguage = language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";
  const savedConfig =
    result && "config" in result ? result.config : config;

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">A</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">{text.description}</p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <Form method="post" className="lp-form">
              <label className="lp-toggle-row">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={savedConfig.enabled}
                />

                <span>
                  <strong>{text.enable}</strong>
                  <small>{text.enableHint}</small>
                </span>
              </label>

              <div className="lp-two-cols">
                <label>
                  {text.posts}
                  <input
                    name="postsPerWeek"
                    type="number"
                    min="0"
                    max="21"
                    defaultValue={savedConfig.postsPerWeek}
                  />
                </label>

                <label>
                  {text.reels}
                  <input
                    name="reelsPerWeek"
                    type="number"
                    min="0"
                    max="14"
                    defaultValue={savedConfig.reelsPerWeek}
                  />
                </label>
              </div>

              <div className="lp-two-cols">
                <label>
                  {text.stories}
                  <input
                    name="storiesPerWeek"
                    type="number"
                    min="0"
                    max="35"
                    defaultValue={savedConfig.storiesPerWeek}
                  />
                </label>

                <label>
                  {text.budget}
                  <input
                    name="dailyBudget"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={savedConfig.dailyBudget}
                  />
                </label>
              </div>

              <div className="lp-two-cols">
                <label>
                  {text.platforms}
                  <select
                    name="platforms"
                    defaultValue={savedConfig.platforms}
                  >
                    <option value="facebook,instagram">
                      {text.facebookInstagram}
                    </option>
                    <option value="facebook">{text.facebook}</option>
                    <option value="instagram">{text.instagram}</option>
                    <option value="facebook,instagram,tiktok">
                      {text.allSocial}
                    </option>
                  </select>
                </label>

                <label>
                  {text.goal}
                  <select
                    name="goal"
                    defaultValue={savedConfig.goal}
                  >
                    <option value="sales">{text.sales}</option>
                    <option value="traffic">{text.traffic}</option>
                    <option value="awareness">{text.awareness}</option>
                  </select>
                </label>
              </div>

              <button
                className="lp-native-button lp-primary"
                disabled={busy}
                type="submit"
              >
                {busy ? text.saving : text.save}
              </button>
            </Form>

            {result && "ok" in result && result.ok ? (
              <p className="lp-success-message">{text.saved}</p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.status}</h3>
                <p className="lp-panel-subtitle">{text.summaryHint}</p>
              </div>
            </div>

            <div
              className={`lp-connection-state ${
                savedConfig.enabled ? "ready" : "pending"
              }`}
            >
              <span>{savedConfig.enabled ? "✓" : "→"}</span>

              <div>
                <strong>
                  {savedConfig.enabled ? text.on : text.off}
                </strong>
                <p>
                  {text.nextRun}:{" "}
                  {savedConfig.nextRunAt
                    ? new Date(
                        savedConfig.nextRunAt,
                      ).toLocaleString(currentLanguage)
                    : text.notScheduled}
                </p>
              </div>
            </div>

            <h3 className="lp-panel-title">{text.summary}</h3>

            <ul className="lp-checklist">
              <li>
                <span className="lp-check">✓</span>
                {text.postsLabel}: {savedConfig.postsPerWeek}
              </li>

              <li>
                <span className="lp-check">✓</span>
                {text.reelsLabel}: {savedConfig.reelsPerWeek}
              </li>

              <li>
                <span className="lp-check">✓</span>
                {text.storiesLabel}: {savedConfig.storiesPerWeek}
              </li>

              <li>
                <span className="lp-check">✓</span>
                {text.budgetLabel}: €{savedConfig.dailyBudget}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};