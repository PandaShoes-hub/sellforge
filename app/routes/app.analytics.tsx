import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import StatCard from "../components/dashboard/StatCard";
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type Language = "pt-PT" | "en-US" | "es-ES" | "fr-FR" | "it-IT" | "de-DE";

const copy = {
  "pt-PT": {
    page: "Estatísticas",
    kicker: "Resultados da loja",
    title: "Percebe facilmente o que está a funcionar",
    description:
      "Vê os anúncios criados, o dinheiro investido e os resultados registados nesta loja.",
    adsCreated: "Anúncios criados",
    adsCreatedHint: "Todos os anúncios guardados",
    contentCreated: "Conteúdos criados",
    contentCreatedHint: "Textos e imagens preparados",
    scheduled: "Publicações agendadas",
    scheduledHint: "Conteúdos no calendário",
    published: "Publicações feitas",
    publishedHint: "Conteúdos já publicados",
    spend: "Dinheiro gasto",
    spendHint: "Total registado nos anúncios",
    revenue: "Vendas geradas",
    revenueHint: "Receita atribuída aos anúncios",
    return: "Retorno dos anúncios",
    returnHint: "Quanto voltou por cada euro gasto",
    noReturn: "Ainda sem dados",
    summary: "Resumo dos anúncios",
    summaryHint: "Uma leitura simples dos resultados desta loja.",
    goodReturn: "Os anúncios estão a dar lucro",
    goodReturnText:
      "Por cada euro gasto, a loja está a gerar mais dinheiro em vendas.",
    lowReturn: "Os anúncios precisam de melhorias",
    lowReturnText:
      "O retorno está baixo. Revê os produtos, os textos e o orçamento.",
    noSpend: "Ainda não existem gastos registados",
    noSpendText:
      "Depois de ligares as plataformas de anúncios, os gastos e vendas aparecem aqui.",
    recentAds: "Anúncios recentes",
    recentAdsHint: "Últimos anúncios preparados para esta loja.",
    recentContent: "Conteúdos recentes",
    recentContentHint: "Últimos conteúdos criados para promover produtos.",
    noAds: "Ainda não existem anúncios.",
    noContent: "Ainda não existem conteúdos.",
    draft: "Rascunho",
    perDay: "por dia",
    manual: "Conteúdo manual",
    source: "Origem",
  },
  "en-US": {
    page: "Statistics",
    kicker: "Store results",
    title: "Understand what is working",
    description:
      "See created ads, recorded spend and results for this store.",
    adsCreated: "Ads created",
    adsCreatedHint: "All saved ads",
    contentCreated: "Content created",
    contentCreatedHint: "Prepared copy and images",
    scheduled: "Scheduled posts",
    scheduledHint: "Content in the calendar",
    published: "Published posts",
    publishedHint: "Content already published",
    spend: "Money spent",
    spendHint: "Recorded ad spend",
    revenue: "Sales generated",
    revenueHint: "Revenue attributed to ads",
    return: "Ad return",
    returnHint: "How much came back per euro spent",
    noReturn: "No data yet",
    summary: "Ad summary",
    summaryHint: "A simple view of this store's results.",
    goodReturn: "Your ads are profitable",
    goodReturnText:
      "For every euro spent, the store is generating more money in sales.",
    lowReturn: "Your ads need improvement",
    lowReturnText:
      "Return is low. Review products, copy and budget.",
    noSpend: "No spend has been recorded yet",
    noSpendText:
      "After connecting ad platforms, spend and sales will appear here.",
    recentAds: "Recent ads",
    recentAdsHint: "Latest ads prepared for this store.",
    recentContent: "Recent content",
    recentContentHint: "Latest content created to promote products.",
    noAds: "There are no ads yet.",
    noContent: "There is no content yet.",
    draft: "Draft",
    perDay: "per day",
    manual: "Manual content",
    source: "Source",
  },
  "es-ES": {
    page: "Estadísticas",
    kicker: "Resultados de la tienda",
    title: "Entiende fácilmente qué está funcionando",
    description:
      "Consulta los anuncios creados, el dinero invertido y los resultados registrados.",
    adsCreated: "Anuncios creados",
    adsCreatedHint: "Todos los anuncios guardados",
    contentCreated: "Contenido creado",
    contentCreatedHint: "Textos e imágenes preparados",
    scheduled: "Publicaciones programadas",
    scheduledHint: "Contenido en el calendario",
    published: "Publicaciones realizadas",
    publishedHint: "Contenido ya publicado",
    spend: "Dinero gastado",
    spendHint: "Gasto registrado en anuncios",
    revenue: "Ventas generadas",
    revenueHint: "Ingresos atribuidos a los anuncios",
    return: "Retorno de anuncios",
    returnHint: "Cuánto vuelve por cada euro gastado",
    noReturn: "Todavía sin datos",
    summary: "Resumen de anuncios",
    summaryHint: "Una lectura sencilla de los resultados.",
    goodReturn: "Los anuncios están generando beneficio",
    goodReturnText:
      "Por cada euro gastado, la tienda genera más dinero en ventas.",
    lowReturn: "Los anuncios necesitan mejoras",
    lowReturnText:
      "El retorno es bajo. Revisa productos, textos y presupuesto.",
    noSpend: "Todavía no hay gastos registrados",
    noSpendText:
      "Al conectar las plataformas, los gastos y ventas aparecerán aquí.",
    recentAds: "Anuncios recientes",
    recentAdsHint: "Últimos anuncios preparados para esta tienda.",
    recentContent: "Contenido reciente",
    recentContentHint: "Último contenido creado para promocionar productos.",
    noAds: "Todavía no hay anuncios.",
    noContent: "Todavía no hay contenido.",
    draft: "Borrador",
    perDay: "por día",
    manual: "Contenido manual",
    source: "Origen",
  },
  "fr-FR": {
    page: "Statistiques",
    kicker: "Résultats de la boutique",
    title: "Comprenez facilement ce qui fonctionne",
    description:
      "Consultez les publicités créées, les dépenses et les résultats enregistrés.",
    adsCreated: "Publicités créées",
    adsCreatedHint: "Toutes les publicités enregistrées",
    contentCreated: "Contenus créés",
    contentCreatedHint: "Textes et images préparés",
    scheduled: "Publications programmées",
    scheduledHint: "Contenus dans le calendrier",
    published: "Publications réalisées",
    publishedHint: "Contenus déjà publiés",
    spend: "Dépenses",
    spendHint: "Dépenses publicitaires enregistrées",
    revenue: "Ventes générées",
    revenueHint: "Revenus attribués aux publicités",
    return: "Retour publicitaire",
    returnHint: "Montant récupéré par euro dépensé",
    noReturn: "Pas encore de données",
    summary: "Résumé publicitaire",
    summaryHint: "Une lecture simple des résultats.",
    goodReturn: "Les publicités sont rentables",
    goodReturnText:
      "Chaque euro dépensé génère davantage de ventes.",
    lowReturn: "Les publicités doivent être améliorées",
    lowReturnText:
      "Le retour est faible. Revoyez produits, textes et budget.",
    noSpend: "Aucune dépense enregistrée",
    noSpendText:
      "Après connexion des plateformes, les dépenses et ventes apparaîtront ici.",
    recentAds: "Publicités récentes",
    recentAdsHint: "Dernières publicités préparées pour cette boutique.",
    recentContent: "Contenus récents",
    recentContentHint: "Derniers contenus créés pour promouvoir des produits.",
    noAds: "Aucune publicité pour le moment.",
    noContent: "Aucun contenu pour le moment.",
    draft: "Brouillon",
    perDay: "par jour",
    manual: "Contenu manuel",
    source: "Source",
  },
  "it-IT": {
    page: "Statistiche",
    kicker: "Risultati del negozio",
    title: "Capisci facilmente cosa sta funzionando",
    description:
      "Controlla gli annunci creati, la spesa e i risultati registrati.",
    adsCreated: "Annunci creati",
    adsCreatedHint: "Tutti gli annunci salvati",
    contentCreated: "Contenuti creati",
    contentCreatedHint: "Testi e immagini preparati",
    scheduled: "Post programmati",
    scheduledHint: "Contenuti nel calendario",
    published: "Post pubblicati",
    publishedHint: "Contenuti già pubblicati",
    spend: "Denaro speso",
    spendHint: "Spesa pubblicitaria registrata",
    revenue: "Vendite generate",
    revenueHint: "Entrate attribuite agli annunci",
    return: "Ritorno pubblicitario",
    returnHint: "Quanto ritorna per ogni euro speso",
    noReturn: "Nessun dato",
    summary: "Riepilogo annunci",
    summaryHint: "Una lettura semplice dei risultati.",
    goodReturn: "Gli annunci sono redditizi",
    goodReturnText:
      "Per ogni euro speso, il negozio genera più denaro in vendite.",
    lowReturn: "Gli annunci devono migliorare",
    lowReturnText:
      "Il ritorno è basso. Rivedi prodotti, testi e budget.",
    noSpend: "Nessuna spesa registrata",
    noSpendText:
      "Dopo aver collegato le piattaforme, spesa e vendite appariranno qui.",
    recentAds: "Annunci recenti",
    recentAdsHint: "Ultimi annunci preparati per questo negozio.",
    recentContent: "Contenuti recenti",
    recentContentHint: "Ultimi contenuti creati per promuovere prodotti.",
    noAds: "Non ci sono ancora annunci.",
    noContent: "Non ci sono ancora contenuti.",
    draft: "Bozza",
    perDay: "al giorno",
    manual: "Contenuto manuale",
    source: "Origine",
  },
  "de-DE": {
    page: "Statistiken",
    kicker: "Shop-Ergebnisse",
    title: "Verstehe einfach, was funktioniert",
    description:
      "Sieh erstellte Anzeigen, Werbeausgaben und erfasste Ergebnisse.",
    adsCreated: "Erstellte Anzeigen",
    adsCreatedHint: "Alle gespeicherten Anzeigen",
    contentCreated: "Erstellte Inhalte",
    contentCreatedHint: "Vorbereitete Texte und Bilder",
    scheduled: "Geplante Beiträge",
    scheduledHint: "Inhalte im Kalender",
    published: "Veröffentlichte Beiträge",
    publishedHint: "Bereits veröffentlichte Inhalte",
    spend: "Werbeausgaben",
    spendHint: "Erfasste Gesamtausgaben",
    revenue: "Generierte Verkäufe",
    revenueHint: "Anzeigen zugeordneter Umsatz",
    return: "Werberendite",
    returnHint: "Rückfluss pro ausgegebenem Euro",
    noReturn: "Noch keine Daten",
    summary: "Anzeigenübersicht",
    summaryHint: "Eine einfache Zusammenfassung der Ergebnisse.",
    goodReturn: "Die Anzeigen sind profitabel",
    goodReturnText:
      "Jeder ausgegebene Euro erzeugt mehr Umsatz.",
    lowReturn: "Die Anzeigen müssen verbessert werden",
    lowReturnText:
      "Die Rendite ist niedrig. Prüfe Produkte, Texte und Budget.",
    noSpend: "Noch keine Ausgaben erfasst",
    noSpendText:
      "Nach Verbindung der Plattformen erscheinen Ausgaben und Verkäufe hier.",
    recentAds: "Letzte Anzeigen",
    recentAdsHint: "Zuletzt vorbereitete Anzeigen.",
    recentContent: "Letzte Inhalte",
    recentContentHint: "Zuletzt erstellte Inhalte zur Produktwerbung.",
    noAds: "Noch keine Anzeigen vorhanden.",
    noContent: "Noch keine Inhalte vorhanden.",
    draft: "Entwurf",
    perDay: "pro Tag",
    manual: "Manueller Inhalt",
    source: "Quelle",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMoney(value: number, language: Language) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getProviderName(provider: string) {
  if (provider === "meta") return "Meta";
  if (provider === "google") return "Google";
  return "TikTok";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [
    contentCount,
    scheduledCount,
    publishedCount,
    recentContent,
    adsCount,
    recentAds,
    adTotals,
    language,
  ] = await Promise.all([
    db.campaign.count({
      where: { shop: session.shop },
    }),
    db.scheduledPost.count({
      where: { shop: session.shop },
    }),
    db.scheduledPost.count({
      where: {
        shop: session.shop,
        status: "published",
      },
    }),
    db.campaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.adsCampaign.count({
      where: { shop: session.shop },
    }),
    db.adsCampaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.adsCampaign.aggregate({
      where: { shop: session.shop },
      _sum: {
        spend: true,
        revenue: true,
      },
    }),
    getShopLanguage(session.shop),
  ]);

  const spend = Number(adTotals._sum.spend ?? 0);
  const revenue = Number(adTotals._sum.revenue ?? 0);
  const returnOnAds = spend > 0 ? revenue / spend : null;

  return {
    contentCount,
    scheduledCount,
    publishedCount,
    recentContent,
    adsCount,
    recentAds,
    spend,
    revenue,
    returnOnAds,
    language,
  };
};

export default function Analytics() {
  const data = useLoaderData<typeof loader>();
  const language = data.language as Language;
  const text = copy[language] ?? copy["en-US"];

  const summary =
    data.spend === 0
      ? {
          state: "pending",
          symbol: "→",
          title: text.noSpend,
          description: text.noSpendText,
        }
      : data.returnOnAds !== null && data.returnOnAds >= 1
        ? {
            state: "ready",
            symbol: "✓",
            title: text.goodReturn,
            description: text.goodReturnText,
          }
        : {
            state: "pending",
            symbol: "!",
            title: text.lowReturn,
            description: text.lowReturnText,
          };

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">↗</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">{text.description}</p>
          </div>
        </section>

        <section className="lp-stats-grid">
          <StatCard
            label={text.adsCreated}
            value={String(data.adsCount)}
            hint={text.adsCreatedHint}
            icon="📣"
          />

          <StatCard
            label={text.contentCreated}
            value={String(data.contentCount)}
            hint={text.contentCreatedHint}
            icon="✨"
          />

          <StatCard
            label={text.scheduled}
            value={String(data.scheduledCount)}
            hint={text.scheduledHint}
            icon="📅"
          />

          <StatCard
            label={text.published}
            value={String(data.publishedCount)}
            hint={text.publishedHint}
            icon="✓"
          />
        </section>

        <section className="lp-stats-grid">
          <StatCard
            label={text.spend}
            value={formatMoney(data.spend, language)}
            hint={text.spendHint}
            icon="💳"
          />

          <StatCard
            label={text.revenue}
            value={formatMoney(data.revenue, language)}
            hint={text.revenueHint}
            icon="💰"
          />

          <StatCard
            label={text.return}
            value={
              data.returnOnAds === null
                ? text.noReturn
                : `${data.returnOnAds.toFixed(2)}x`
            }
            hint={text.returnHint}
            icon="📈"
          />

          <StatCard
            label={text.published}
            value={`${data.publishedCount}/${data.scheduledCount}`}
            hint={text.scheduledHint}
            icon="◎"
          />
        </section>

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">{text.summary}</h3>
              <p className="lp-panel-subtitle">{text.summaryHint}</p>
            </div>
          </div>

          <div className={`lp-connection-state ${summary.state}`}>
            <span>{summary.symbol}</span>

            <div>
              <strong>{summary.title}</strong>
              <p>{summary.description}</p>
            </div>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.recentAds}</h3>
                <p className="lp-panel-subtitle">{text.recentAdsHint}</p>
              </div>
            </div>

            <div className="lp-campaign-list">
              {data.recentAds.length > 0 ? (
                data.recentAds.map((campaign) => (
                  <article className="lp-campaign-row" key={campaign.id}>
                    <div className="lp-social-avatar">
                      {campaign.provider === "meta"
                        ? "M"
                        : campaign.provider === "google"
                          ? "G"
                          : "T"}
                    </div>

                    <div>
                      <strong>{campaign.name}</strong>
                      <span>
                        {getProviderName(campaign.provider)} · €
                        {campaign.dailyBudget}/{text.perDay} ·{" "}
                        {campaign.status === "draft"
                          ? text.draft
                          : campaign.status}{" "}
                        ·{" "}
                        {new Date(campaign.createdAt).toLocaleDateString(
                          language,
                        )}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="lp-muted">{text.noAds}</p>
              )}
            </div>
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.recentContent}</h3>
                <p className="lp-panel-subtitle">
                  {text.recentContentHint}
                </p>
              </div>
            </div>

            <div className="lp-campaign-list">
              {data.recentContent.length > 0 ? (
                data.recentContent.map((campaign) => (
                  <article className="lp-campaign-row" key={campaign.id}>
                    {campaign.productImage ? (
                      <img
                        src={campaign.productImage}
                        alt={campaign.productTitle ?? campaign.title}
                      />
                    ) : (
                      <div className="lp-row-placeholder">S</div>
                    )}

                    <div>
                      <strong>{campaign.title}</strong>
                      <span>
                        {campaign.productTitle ?? text.manual} ·{" "}
                        {text.source}: {campaign.source} ·{" "}
                        {new Date(campaign.createdAt).toLocaleDateString(
                          language,
                        )}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="lp-muted">{text.noContent}</p>
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