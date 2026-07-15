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
import { runAutopilot } from "../services/autopilot.server";

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
    page: "Piloto Automático",
    kicker: "Marketing sempre ativo",
    title: "Deixa a SellForge trabalhar por ti",
    description:
      "A IA escolhe produtos, cria campanhas e agenda conteúdos automaticamente.",
    enable: "Ativar Piloto Automático",
    enableHint: "A SellForge prepara conteúdos de forma recorrente.",
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
    save: "Guardar configuração",
    saving: "A guardar...",
    saved: "Configuração guardada com sucesso.",
    runNow: "Executar agora",
    running: "A executar...",
    runSuccess: "Autopilot executado com sucesso.",
    runSkipped: "O Autopilot não executou porque está desligado ou ainda não chegou a hora.",
    runError: "Não foi possível executar o Autopilot.",
    status: "Estado atual",
    on: "Ligado",
    off: "Desligado",
    lastRun: "Última execução",
    nextRun: "Próxima execução",
    notScheduled: "Ainda não agendado",
    totalCampaigns: "Campanhas criadas",
    scheduledPosts: "Publicações agendadas",
    publishedPosts: "Publicações publicadas",
    recentActivity: "Atividade recente",
    noActivity: "Ainda não existe atividade do Autopilot.",
    created: "campanhas criadas",
    scheduled: "publicações agendadas",
    configuration: "Configuração",
    overview: "Visão geral",
    productsChosen: "Produtos escolhidos recentemente",
    noProducts: "Ainda não existem produtos escolhidos.",
  },
  "en-US": {
    page: "Autopilot",
    kicker: "Always-on marketing",
    title: "Let SellForge work for you",
    description:
      "AI selects products, creates campaigns and schedules content automatically.",
    enable: "Enable Autopilot",
    enableHint: "SellForge prepares recurring content.",
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
    save: "Save configuration",
    saving: "Saving...",
    saved: "Configuration saved successfully.",
    runNow: "Run now",
    running: "Running...",
    runSuccess: "Autopilot completed successfully.",
    runSkipped: "Autopilot did not run because it is disabled or not due yet.",
    runError: "Autopilot could not be executed.",
    status: "Current status",
    on: "On",
    off: "Off",
    lastRun: "Last run",
    nextRun: "Next run",
    notScheduled: "Not scheduled yet",
    totalCampaigns: "Campaigns created",
    scheduledPosts: "Scheduled posts",
    publishedPosts: "Published posts",
    recentActivity: "Recent activity",
    noActivity: "There is no Autopilot activity yet.",
    created: "campaigns created",
    scheduled: "posts scheduled",
    configuration: "Configuration",
    overview: "Overview",
    productsChosen: "Recently selected products",
    noProducts: "No products selected yet.",
  },
  "es-ES": {
    page: "Piloto automático",
    kicker: "Marketing siempre activo",
    title: "Deja que SellForge trabaje por ti",
    description:
      "La IA elige productos, crea campañas y programa contenido automáticamente.",
    enable: "Activar Piloto automático",
    enableHint: "SellForge prepara contenido recurrente.",
    posts: "Publicaciones por semana",
    reels: "Reels por semana",
    stories: "Stories por semana",
    budget: "Presupuesto diario",
    platforms: "¿Dónde quieres publicar?",
    goal: "Objetivo principal",
    sales: "Vender más",
    traffic: "Llevar personas al sitio",
    awareness: "Dar a conocer la marca",
    facebookInstagram: "Facebook e Instagram",
    facebook: "Solo Facebook",
    instagram: "Solo Instagram",
    allSocial: "Facebook, Instagram y TikTok",
    save: "Guardar configuración",
    saving: "Guardando...",
    saved: "Configuración guardada.",
    runNow: "Ejecutar ahora",
    running: "Ejecutando...",
    runSuccess: "Piloto automático ejecutado.",
    runSkipped: "No se ejecutó porque está apagado o aún no corresponde.",
    runError: "No fue posible ejecutar el Piloto automático.",
    status: "Estado actual",
    on: "Activado",
    off: "Desactivado",
    lastRun: "Última ejecución",
    nextRun: "Próxima ejecución",
    notScheduled: "Todavía no programado",
    totalCampaigns: "Campañas creadas",
    scheduledPosts: "Publicaciones programadas",
    publishedPosts: "Publicaciones publicadas",
    recentActivity: "Actividad reciente",
    noActivity: "Todavía no existe actividad.",
    created: "campañas creadas",
    scheduled: "publicaciones programadas",
    configuration: "Configuración",
    overview: "Resumen",
    productsChosen: "Productos elegidos recientemente",
    noProducts: "Todavía no hay productos elegidos.",
  },
  "fr-FR": {
    page: "Pilote automatique",
    kicker: "Marketing toujours actif",
    title: "Laissez SellForge travailler pour vous",
    description:
      "L’IA sélectionne les produits, crée les campagnes et programme le contenu.",
    enable: "Activer le Pilote automatique",
    enableHint: "SellForge prépare du contenu récurrent.",
    posts: "Publications par semaine",
    reels: "Reels par semaine",
    stories: "Stories par semaine",
    budget: "Budget quotidien",
    platforms: "Où souhaitez-vous publier ?",
    goal: "Objectif principal",
    sales: "Vendre davantage",
    traffic: "Envoyer des visiteurs vers le site",
    awareness: "Faire connaître la marque",
    facebookInstagram: "Facebook et Instagram",
    facebook: "Facebook uniquement",
    instagram: "Instagram uniquement",
    allSocial: "Facebook, Instagram et TikTok",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Configuration enregistrée.",
    runNow: "Exécuter maintenant",
    running: "Exécution...",
    runSuccess: "Pilote automatique exécuté.",
    runSkipped: "Aucune exécution car il est désactivé ou pas encore prévu.",
    runError: "Impossible d’exécuter le Pilote automatique.",
    status: "État actuel",
    on: "Activé",
    off: "Désactivé",
    lastRun: "Dernière exécution",
    nextRun: "Prochaine exécution",
    notScheduled: "Pas encore programmée",
    totalCampaigns: "Campagnes créées",
    scheduledPosts: "Publications programmées",
    publishedPosts: "Publications publiées",
    recentActivity: "Activité récente",
    noActivity: "Aucune activité pour le moment.",
    created: "campagnes créées",
    scheduled: "publications programmées",
    configuration: "Configuration",
    overview: "Vue générale",
    productsChosen: "Produits récemment sélectionnés",
    noProducts: "Aucun produit sélectionné.",
  },
  "it-IT": {
    page: "Pilota automatico",
    kicker: "Marketing sempre attivo",
    title: "Lascia che SellForge lavori per te",
    description:
      "L’IA sceglie i prodotti, crea campagne e programma contenuti automaticamente.",
    enable: "Attiva Pilota automatico",
    enableHint: "SellForge prepara contenuti ricorrenti.",
    posts: "Post a settimana",
    reels: "Reels a settimana",
    stories: "Stories a settimana",
    budget: "Budget giornaliero",
    platforms: "Dove vuoi pubblicare?",
    goal: "Obiettivo principale",
    sales: "Vendere di più",
    traffic: "Portare persone al sito",
    awareness: "Far conoscere il brand",
    facebookInstagram: "Facebook e Instagram",
    facebook: "Solo Facebook",
    instagram: "Solo Instagram",
    allSocial: "Facebook, Instagram e TikTok",
    save: "Salva configurazione",
    saving: "Salvataggio...",
    saved: "Configurazione salvata.",
    runNow: "Esegui ora",
    running: "Esecuzione...",
    runSuccess: "Pilota automatico eseguito.",
    runSkipped: "Non è stato eseguito perché è disattivato o non è ancora il momento.",
    runError: "Impossibile eseguire il Pilota automatico.",
    status: "Stato attuale",
    on: "Attivo",
    off: "Disattivo",
    lastRun: "Ultima esecuzione",
    nextRun: "Prossima esecuzione",
    notScheduled: "Non ancora programmata",
    totalCampaigns: "Campagne create",
    scheduledPosts: "Pubblicazioni programmate",
    publishedPosts: "Pubblicazioni pubblicate",
    recentActivity: "Attività recente",
    noActivity: "Nessuna attività disponibile.",
    created: "campagne create",
    scheduled: "pubblicazioni programmate",
    configuration: "Configurazione",
    overview: "Panoramica",
    productsChosen: "Prodotti scelti di recente",
    noProducts: "Nessun prodotto selezionato.",
  },
  "de-DE": {
    page: "Autopilot",
    kicker: "Dauerhaftes Marketing",
    title: "Lass SellForge für dich arbeiten",
    description:
      "Die KI wählt Produkte, erstellt Kampagnen und plant Inhalte automatisch.",
    enable: "Autopilot aktivieren",
    enableHint: "SellForge bereitet wiederkehrende Inhalte vor.",
    posts: "Beiträge pro Woche",
    reels: "Reels pro Woche",
    stories: "Stories pro Woche",
    budget: "Tägliches Budget",
    platforms: "Wo möchtest du veröffentlichen?",
    goal: "Hauptziel",
    sales: "Mehr verkaufen",
    traffic: "Besucher zur Website bringen",
    awareness: "Marke bekannter machen",
    facebookInstagram: "Facebook und Instagram",
    facebook: "Nur Facebook",
    instagram: "Nur Instagram",
    allSocial: "Facebook, Instagram und TikTok",
    save: "Konfiguration speichern",
    saving: "Wird gespeichert...",
    saved: "Konfiguration gespeichert.",
    runNow: "Jetzt ausführen",
    running: "Wird ausgeführt...",
    runSuccess: "Autopilot erfolgreich ausgeführt.",
    runSkipped: "Keine Ausführung, da er deaktiviert oder noch nicht fällig ist.",
    runError: "Autopilot konnte nicht ausgeführt werden.",
    status: "Aktueller Status",
    on: "Aktiv",
    off: "Inaktiv",
    lastRun: "Letzte Ausführung",
    nextRun: "Nächste Ausführung",
    notScheduled: "Noch nicht geplant",
    totalCampaigns: "Erstellte Kampagnen",
    scheduledPosts: "Geplante Beiträge",
    publishedPosts: "Veröffentlichte Beiträge",
    recentActivity: "Letzte Aktivität",
    noActivity: "Noch keine Aktivität.",
    created: "Kampagnen erstellt",
    scheduled: "Beiträge geplant",
    configuration: "Konfiguration",
    overview: "Übersicht",
    productsChosen: "Kürzlich ausgewählte Produkte",
    noProducts: "Noch keine Produkte ausgewählt.",
  },
} satisfies Record<Language, Record<string, string>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [config, language, campaignCount, scheduledCount, publishedCount, recent] =
    await Promise.all([
      db.autopilotConfig.upsert({
        where: { shop: session.shop },
        update: {},
        create: { shop: session.shop },
      }),
      getShopLanguage(session.shop),
      db.campaign.count({
        where: { shop: session.shop },
      }),
      db.scheduledPost.count({
        where: {
          shop: session.shop,
          status: "scheduled",
        },
      }),
      db.scheduledPost.count({
        where: {
          shop: session.shop,
          status: "published",
        },
      }),
      db.campaign.findMany({
        where: {
          shop: session.shop,
          productTitle: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  return {
    config,
    language,
    campaignCount,
    scheduledCount,
    publishedCount,
    recent,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  if (intent === "run_now") {
    const existing = await db.autopilotConfig.findUnique({
      where: { shop: session.shop },
    });

    if (!existing?.enabled) {
      return {
        ok: false,
        intent,
        error: "AUTOPILOT_DISABLED",
      };
    }

    await db.autopilotConfig.update({
      where: { shop: session.shop },
      data: { nextRunAt: new Date() },
    });

    try {
      const run = await runAutopilot({
        shop: session.shop,
        admin,
        now: new Date(),
      });

      return {
        ok: true,
        intent,
        run,
      };
    } catch (error) {
      return {
        ok: false,
        intent,
        error:
          error instanceof Error
            ? error.message
            : "AUTOPILOT_FAILED",
      };
    }
  }

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
      nextRunAt: enabled ? new Date() : null,
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
      nextRunAt: enabled ? new Date() : null,
    },
  });

  return {
    ok: true,
    intent,
    config,
  };
};

export default function Autopilot() {
  const data = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const currentLanguage = data.language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";
  const runningIntent =
    navigation.formData?.get("intent")?.toString() ?? "";

  const savedConfig =
    result &&
    "config" in result &&
    result.config
      ? result.config
      : data.config;

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">AI</div>
          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">{text.description}</p>
          </div>
        </section>

        <section className="lp-stats-grid">
          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">A</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.status}</p>
              <h2 className="lp-stat-value">
                {savedConfig.enabled ? text.on : text.off}
              </h2>
              <p className="lp-muted">
                {text.lastRun}:{" "}
                {savedConfig.lastRunAt
                  ? new Date(savedConfig.lastRunAt).toLocaleString(
                      currentLanguage,
                    )
                  : text.notScheduled}
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">C</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.totalCampaigns}</p>
              <h2 className="lp-stat-value">{data.campaignCount}</h2>
              <p className="lp-muted">{text.created}</p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">S</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.scheduledPosts}</p>
              <h2 className="lp-stat-value">{data.scheduledCount}</h2>
              <p className="lp-muted">{text.nextRun}</p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">P</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.publishedPosts}</p>
              <h2 className="lp-stat-value">{data.publishedCount}</h2>
              <p className="lp-muted">{text.recentActivity}</p>
            </div>
          </article>
        </section>

        {result && result.intent === "run_now" ? (
          result.ok && "run" in result ? (
            <div className="lp-social-notice success">
              {result.run?.skipped
                ? text.runSkipped
                  : `${text.runSuccess} ${result.run?.created ?? 0} ${text.created} · ${result.run?.scheduled ?? 0} ${text.scheduled}.`}
            </div>
          ) : (
            <div className="lp-social-notice error">
              {text.runError}
            </div>
          )
        ) : null}

        {result && result.intent === "save" && result.ok ? (
          <div className="lp-social-notice success">{text.saved}</div>
        ) : null}

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.configuration}</h3>
                <p className="lp-panel-subtitle">{text.enableHint}</p>
              </div>
            </div>

            <Form method="post" className="lp-form">
              <input type="hidden" name="intent" value="save" />

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
                  <select name="goal" defaultValue={savedConfig.goal}>
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
                {busy && runningIntent === "save"
                  ? text.saving
                  : text.save}
              </button>
            </Form>

            <Form method="post">
              <input type="hidden" name="intent" value="run_now" />
              <button
                className="lp-native-button"
                type="submit"
                disabled={busy || !savedConfig.enabled}
              >
                {busy && runningIntent === "run_now"
                  ? text.running
                  : text.runNow}
              </button>
            </Form>
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.overview}</h3>
                <p className="lp-panel-subtitle">
                  {text.nextRun}:{" "}
                  {savedConfig.nextRunAt
                    ? new Date(savedConfig.nextRunAt).toLocaleString(
                        currentLanguage,
                      )
                    : text.notScheduled}
                </p>
              </div>
            </div>

            <div
              className={`lp-connection-state ${
                savedConfig.enabled ? "ready" : "pending"
              }`}
            >
              <span>{savedConfig.enabled ? "✓" : "→"}</span>
              <div>
                <strong>{savedConfig.enabled ? text.on : text.off}</strong>
                <p>
                  {savedConfig.postsPerWeek} {text.posts.toLowerCase()} ·{" "}
                  {savedConfig.reelsPerWeek} {text.reels.toLowerCase()} ·{" "}
                  {savedConfig.storiesPerWeek} {text.stories.toLowerCase()}
                </p>
              </div>
            </div>

            <h3 className="lp-panel-title">{text.productsChosen}</h3>

            <div className="lp-campaign-list">
              {data.recent.length ? (
                data.recent.map((campaign) => (
                  <article className="lp-campaign-row" key={campaign.id}>
                    {campaign.productImage ? (
                      <img src={campaign.productImage} alt="" />
                    ) : (
                      <div className="lp-row-placeholder">AI</div>
                    )}
                    <div>
                      <strong>
                        {campaign.productTitle || campaign.title}
                      </strong>
                      <span>
                        {campaign.format} ·{" "}
                        {new Date(campaign.createdAt).toLocaleDateString(
                          currentLanguage,
                        )}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="lp-muted">{text.noProducts}</p>
              )}
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