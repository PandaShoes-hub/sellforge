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

type Language =
  | "pt-PT"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "it-IT"
  | "de-DE";

const copy = {
  "pt-PT": {
    page: "Calendário",
    kicker: "Planeamento de conteúdos",
    title: "Organiza as próximas publicações",
    description:
      "Escolhe um conteúdo, a rede social e a data. A SellForge guarda tudo no calendário.",
    newPost: "Agendar nova publicação",
    newPostHint: "Escolhe um conteúdo já criado no Estúdio.",
    campaign: "Conteúdo",
    chooseCampaign: "Escolhe um conteúdo",
    platform: "Onde queres publicar?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Data e hora",
    schedule: "Agendar publicação",
    scheduling: "A agendar...",
    scheduled: "Publicação agendada com sucesso.",
    removed: "Publicação removida.",
    invalid: "Escolhe um conteúdo e uma data válida.",
    upcoming: "Próximas publicações",
    upcomingHint: "Tudo o que está planeado para os próximos dias.",
    noPosts: "Ainda não tens publicações agendadas.",
    remove: "Remover",
    status: "Agendada",
    today: "Hoje",
    tomorrow: "Amanhã",
    past: "Data ultrapassada",
    total: "Total agendado",
    next: "Próxima publicação",
    platforms: "Redes utilizadas",
    none: "Sem data",
  },
  "en-US": {
    page: "Calendar",
    kicker: "Content planning",
    title: "Organise upcoming posts",
    description:
      "Choose content, a social network and a date. SellForge saves everything in the calendar.",
    newPost: "Schedule a new post",
    newPostHint: "Choose content already created in the Studio.",
    campaign: "Content",
    chooseCampaign: "Choose content",
    platform: "Where do you want to publish?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Date and time",
    schedule: "Schedule post",
    scheduling: "Scheduling...",
    scheduled: "Post scheduled successfully.",
    removed: "Post removed.",
    invalid: "Choose content and a valid date.",
    upcoming: "Upcoming posts",
    upcomingHint: "Everything planned for the next few days.",
    noPosts: "You have no scheduled posts yet.",
    remove: "Remove",
    status: "Scheduled",
    today: "Today",
    tomorrow: "Tomorrow",
    past: "Past date",
    total: "Total scheduled",
    next: "Next post",
    platforms: "Networks used",
    none: "No date",
  },
  "es-ES": {
    page: "Calendario",
    kicker: "Planificación de contenido",
    title: "Organiza las próximas publicaciones",
    description:
      "Elige un contenido, una red social y una fecha. SellForge lo guarda en el calendario.",
    newPost: "Programar nueva publicación",
    newPostHint: "Elige contenido ya creado en el Estudio.",
    campaign: "Contenido",
    chooseCampaign: "Elige un contenido",
    platform: "¿Dónde quieres publicar?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Fecha y hora",
    schedule: "Programar publicación",
    scheduling: "Programando...",
    scheduled: "Publicación programada correctamente.",
    removed: "Publicación eliminada.",
    invalid: "Elige un contenido y una fecha válida.",
    upcoming: "Próximas publicaciones",
    upcomingHint: "Todo lo planificado para los próximos días.",
    noPosts: "Todavía no tienes publicaciones programadas.",
    remove: "Eliminar",
    status: "Programada",
    today: "Hoy",
    tomorrow: "Mañana",
    past: "Fecha pasada",
    total: "Total programado",
    next: "Próxima publicación",
    platforms: "Redes utilizadas",
    none: "Sin fecha",
  },
  "fr-FR": {
    page: "Calendrier",
    kicker: "Planification de contenu",
    title: "Organisez les prochaines publications",
    description:
      "Choisissez un contenu, un réseau social et une date. SellForge l’enregistre dans le calendrier.",
    newPost: "Programmer une publication",
    newPostHint: "Choisissez un contenu déjà créé dans le Studio.",
    campaign: "Contenu",
    chooseCampaign: "Choisir un contenu",
    platform: "Où souhaitez-vous publier ?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Date et heure",
    schedule: "Programmer",
    scheduling: "Programmation...",
    scheduled: "Publication programmée avec succès.",
    removed: "Publication supprimée.",
    invalid: "Choisissez un contenu et une date valide.",
    upcoming: "Prochaines publications",
    upcomingHint: "Tout ce qui est prévu pour les prochains jours.",
    noPosts: "Aucune publication programmée.",
    remove: "Supprimer",
    status: "Programmée",
    today: "Aujourd’hui",
    tomorrow: "Demain",
    past: "Date dépassée",
    total: "Total programmé",
    next: "Prochaine publication",
    platforms: "Réseaux utilisés",
    none: "Aucune date",
  },
  "it-IT": {
    page: "Calendario",
    kicker: "Pianificazione contenuti",
    title: "Organizza le prossime pubblicazioni",
    description:
      "Scegli un contenuto, un social e una data. SellForge salva tutto nel calendario.",
    newPost: "Programma una pubblicazione",
    newPostHint: "Scegli un contenuto già creato nello Studio.",
    campaign: "Contenuto",
    chooseCampaign: "Scegli un contenuto",
    platform: "Dove vuoi pubblicare?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Data e ora",
    schedule: "Programma pubblicazione",
    scheduling: "Programmazione...",
    scheduled: "Pubblicazione programmata con successo.",
    removed: "Pubblicazione rimossa.",
    invalid: "Scegli un contenuto e una data valida.",
    upcoming: "Prossime pubblicazioni",
    upcomingHint: "Tutto ciò che è previsto nei prossimi giorni.",
    noPosts: "Non hai ancora pubblicazioni programmate.",
    remove: "Rimuovi",
    status: "Programmata",
    today: "Oggi",
    tomorrow: "Domani",
    past: "Data passata",
    total: "Totale programmato",
    next: "Prossima pubblicazione",
    platforms: "Social utilizzati",
    none: "Nessuna data",
  },
  "de-DE": {
    page: "Kalender",
    kicker: "Inhaltsplanung",
    title: "Plane deine nächsten Beiträge",
    description:
      "Wähle Inhalt, Plattform und Datum. SellForge speichert alles im Kalender.",
    newPost: "Neuen Beitrag planen",
    newPostHint: "Wähle bereits im Studio erstellte Inhalte.",
    campaign: "Inhalt",
    chooseCampaign: "Inhalt auswählen",
    platform: "Wo möchtest du veröffentlichen?",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    dateTime: "Datum und Uhrzeit",
    schedule: "Beitrag planen",
    scheduling: "Wird geplant...",
    scheduled: "Beitrag erfolgreich geplant.",
    removed: "Beitrag entfernt.",
    invalid: "Wähle Inhalt und ein gültiges Datum.",
    upcoming: "Geplante Beiträge",
    upcomingHint: "Alles, was für die nächsten Tage geplant ist.",
    noPosts: "Noch keine Beiträge geplant.",
    remove: "Entfernen",
    status: "Geplant",
    today: "Heute",
    tomorrow: "Morgen",
    past: "Datum vergangen",
    total: "Geplant insgesamt",
    next: "Nächster Beitrag",
    platforms: "Verwendete Netzwerke",
    none: "Kein Datum",
  },
} satisfies Record<Language, Record<string, string>>;

function getPlatformLabel(platform: string) {
  if (platform === "facebook") return "Facebook";
  if (platform === "tiktok") return "TikTok";
  return "Instagram";
}

function getDayLabel(
  date: Date,
  language: Language,
  text: (typeof copy)["pt-PT"],
) {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (target.getTime() < today.getTime()) return text.past;
  if (target.getTime() === today.getTime()) return text.today;
  if (target.getTime() === tomorrow.getTime()) return text.tomorrow;

  return new Intl.DateTimeFormat(language, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [campaigns, posts, language] = await Promise.all([
    db.campaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.scheduledPost.findMany({
      where: { shop: session.shop },
      include: { campaign: true },
      orderBy: { scheduledAt: "asc" },
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    campaigns,
    posts,
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "schedule");

  if (intent === "delete") {
    const id = String(form.get("id") || "");

    if (id) {
      await db.scheduledPost.deleteMany({
        where: {
          id,
          shop: session.shop,
        },
      });
    }

    return {
      ok: true,
      deleted: true,
    };
  }

  const campaignId = String(form.get("campaignId") || "");
  const scheduledAt = new Date(
    String(form.get("scheduledAt") || ""),
  );

  if (!campaignId || Number.isNaN(scheduledAt.getTime())) {
    return {
      ok: false,
      error: "INVALID_SCHEDULE",
    };
  }

  await db.scheduledPost.create({
    data: {
      shop: session.shop,
      campaignId,
      platform: String(form.get("platform") || "instagram"),
      scheduledAt,
    },
  });

  return {
    ok: true,
    scheduled: true,
  };
};

export default function Calendar() {
  const { campaigns, posts, language } =
    useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const currentLanguage = language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";

  const nextPost = posts.find(
    (post) => new Date(post.scheduledAt).getTime() >= Date.now(),
  );

  const platformCount = new Set(
    posts.map((post) => post.platform),
  ).size;

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">K</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">
              {text.description}
            </p>
          </div>
        </section>

        <section className="lp-stats-grid">
          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">#</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.total}</p>
              <h2 className="lp-stat-value">
                {posts.length}
              </h2>
              <p className="lp-muted">{text.upcomingHint}</p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">N</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.next}</p>
              <h2 className="lp-stat-value">
                {nextPost
                  ? new Intl.DateTimeFormat(currentLanguage, {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(nextPost.scheduledAt))
                  : "—"}
              </h2>
              <p className="lp-muted">
                {nextPost
                  ? getPlatformLabel(nextPost.platform)
                  : text.none}
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">R</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.platforms}</p>
              <h2 className="lp-stat-value">
                {platformCount}
              </h2>
              <p className="lp-muted">
                Facebook · Instagram · TikTok
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">C</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.campaign}</p>
              <h2 className="lp-stat-value">
                {campaigns.length}
              </h2>
              <p className="lp-muted">{text.newPostHint}</p>
            </div>
          </article>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.newPost}
                </h3>
                <p className="lp-panel-subtitle">
                  {text.newPostHint}
                </p>
              </div>
            </div>

            <Form method="post" className="lp-form">
              <input
                type="hidden"
                name="intent"
                value="schedule"
              />

              <label>
                {text.campaign}
                <select name="campaignId" required defaultValue="">
                  <option value="">
                    {text.chooseCampaign}
                  </option>

                  {campaigns.map((campaign) => (
                    <option
                      key={campaign.id}
                      value={campaign.id}
                    >
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {text.platform}
                <select
                  name="platform"
                  defaultValue="instagram"
                >
                  <option value="instagram">
                    {text.instagram}
                  </option>
                  <option value="facebook">
                    {text.facebook}
                  </option>
                  <option value="tiktok">
                    {text.tiktok}
                  </option>
                </select>
              </label>

              <label>
                {text.dateTime}
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                />
              </label>

              <button
                className="lp-native-button lp-primary"
                type="submit"
                disabled={busy || campaigns.length === 0}
              >
                {busy ? text.scheduling : text.schedule}
              </button>
            </Form>

            {campaigns.length === 0 ? (
              <p className="lp-error">
                {text.chooseCampaign}
              </p>
            ) : null}

            {result &&
            "error" in result &&
            result.error ? (
              <p className="lp-error">{text.invalid}</p>
            ) : null}

            {result &&
            "scheduled" in result &&
            result.scheduled ? (
              <p className="lp-success-message">
                {text.scheduled}
              </p>
            ) : null}

            {result &&
            "deleted" in result &&
            result.deleted ? (
              <p className="lp-success-message">
                {text.removed}
              </p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.upcoming}
                </h3>
                <p className="lp-panel-subtitle">
                  {text.upcomingHint}
                </p>
              </div>
            </div>

            <div className="lp-schedule-list">
              {posts.length > 0 ? (
                posts.map((post) => {
                  const scheduledDate = new Date(
                    post.scheduledAt,
                  );

                  return (
                    <article
                      className="lp-schedule-row"
                      key={post.id}
                    >
                      <div className="lp-social-avatar">
                        {getPlatformLabel(post.platform)
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{post.campaign.title}</strong>
                        <span>
                          {getPlatformLabel(post.platform)} ·{" "}
                          {getDayLabel(
                            scheduledDate,
                            currentLanguage,
                            text,
                          )}{" "}
                          ·{" "}
                          {new Intl.DateTimeFormat(
                            currentLanguage,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          ).format(scheduledDate)}
                        </span>
                      </div>

                      <span className="lp-status lp-status-active">
                        {text.status}
                      </span>

                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete"
                        />
                        <input
                          type="hidden"
                          name="id"
                          value={post.id}
                        />
                        <button
                          className="lp-link-button"
                          type="submit"
                          disabled={busy}
                        >
                          {text.remove}
                        </button>
                      </Form>
                    </article>
                  );
                })
              ) : (
                <p className="lp-muted">{text.noPosts}</p>
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