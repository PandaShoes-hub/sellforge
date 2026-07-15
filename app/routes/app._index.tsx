import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import QuickAction from "../components/dashboard/QuickAction";
import StatCard from "../components/dashboard/StatCard";
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type DashboardProduct = {
  id: string;
  title: string;
  onlineStoreUrl: string | null;
  featuredImage?: {
    url: string;
    altText: string | null;
  } | null;
  variants?: {
    nodes?: Array<{
      price?: string;
    }>;
  };
};

type Language = "pt-PT" | "en-US" | "es-ES" | "fr-FR" | "it-IT" | "de-DE";

const copy = {
  "pt-PT": {
    page: "Início",
    welcome: "Bem-vindo à SellForge",
    subtitle: "Vê o que está a acontecer e o que deves fazer para vender mais.",
    createAd: "Criar anúncio",
    products: "Produtos",
    productsHint: "Disponíveis na tua loja",
    ads: "Anúncios criados",
    adsHint: "Campanhas guardadas",
    spend: "Gasto em anúncios",
    spendHint: "Total registado",
    return: "Retorno dos anúncios",
    returnHint: "Vendas geradas por cada euro",
    suggestions: "Sugestões da IA",
    suggestionsHint: "Próximos passos recomendados para esta loja.",
    productsReady: "Produtos prontos para anunciar",
    productsReadyHint: "Escolhe um produto e cria um anúncio em poucos segundos.",
    noProducts: "Ainda não existem produtos disponíveis nesta loja.",
    priceUnavailable: "Preço indisponível",
    useProduct: "Criar anúncio",
    quickActions: "Ações rápidas",
    quickHint: "Vai diretamente para o que precisas.",
    browseProducts: "Ver produtos",
    browseProductsDesc: "Escolhe os produtos que queres promover.",
    createAds: "Criar anúncios",
    createAdsDesc: "Prepara anúncios para Facebook, Instagram, Google e TikTok.",
    createContent: "Criar conteúdo",
    createContentDesc: "Gera textos e imagens para promover produtos.",
    statistics: "Estatísticas",
    statisticsDesc: "Vê os resultados das campanhas desta loja.",
    autopilot: "Piloto Automático",
    autopilotDesc: "Deixa a SellForge planear e preparar o marketing.",
    connected: "Loja preparada",
    connectedHint: "A SellForge está ligada à tua loja Shopify.",
    checklist: "Estado da configuração",
    shopConnected: "Produtos ligados à Shopify",
    metaConnected: "Facebook e Instagram ligados",
    metaMissing: "Falta ligar Facebook e Instagram",
    autopilotOn: "Piloto Automático ligado",
    autopilotOff: "Piloto Automático desligado",
    scheduled: "Publicações agendadas",
    openSettings: "Abrir definições",
    openAutopilot: "Abrir Piloto Automático",
    suggestionNoProductsTitle: "Adiciona produtos à loja",
    suggestionNoProductsText: "A SellForge precisa de produtos para criar anúncios.",
    suggestionMetaTitle: "Liga o Facebook e o Instagram",
    suggestionMetaText: "Depois de ligares a Meta, poderás preparar a publicação dos anúncios.",
    suggestionFirstAdTitle: "Cria o teu primeiro anúncio",
    suggestionFirstAdText: "Já tens produtos disponíveis. Escolhe um e começa a promovê-lo.",
    suggestionAutopilotTitle: "Ativa o Piloto Automático",
    suggestionAutopilotText: "A SellForge pode ajudar-te a manter o marketing organizado.",
    suggestionReadyTitle: "A loja está pronta para crescer",
    suggestionReadyText: "Continua a testar produtos e acompanha os resultados dos anúncios.",
    revenueMissing: "Ainda sem vendas atribuídas",
    revenueMissingText: "Quando as plataformas de anúncios estiverem ligadas, os resultados aparecem aqui.",
  },
  "en-US": {
    page: "Home",
    welcome: "Welcome to SellForge",
    subtitle: "See what is happening and what to do next to sell more.",
    createAd: "Create ad",
    products: "Products",
    productsHint: "Available in your store",
    ads: "Ads created",
    adsHint: "Saved campaigns",
    spend: "Ad spend",
    spendHint: "Recorded total",
    return: "Ad return",
    returnHint: "Sales generated per euro",
    suggestions: "AI suggestions",
    suggestionsHint: "Recommended next steps for this store.",
    productsReady: "Products ready to advertise",
    productsReadyHint: "Choose a product and create an ad in seconds.",
    noProducts: "There are no products available in this store yet.",
    priceUnavailable: "Price unavailable",
    useProduct: "Create ad",
    quickActions: "Quick actions",
    quickHint: "Go directly to what you need.",
    browseProducts: "View products",
    browseProductsDesc: "Choose the products you want to promote.",
    createAds: "Create ads",
    createAdsDesc: "Prepare ads for Facebook, Instagram, Google and TikTok.",
    createContent: "Create content",
    createContentDesc: "Generate copy and images to promote products.",
    statistics: "Statistics",
    statisticsDesc: "See campaign results for this store.",
    autopilot: "Autopilot",
    autopilotDesc: "Let SellForge plan and prepare your marketing.",
    connected: "Store ready",
    connectedHint: "SellForge is connected to your Shopify store.",
    checklist: "Setup status",
    shopConnected: "Products connected to Shopify",
    metaConnected: "Facebook and Instagram connected",
    metaMissing: "Facebook and Instagram are not connected",
    autopilotOn: "Autopilot enabled",
    autopilotOff: "Autopilot disabled",
    scheduled: "Scheduled posts",
    openSettings: "Open settings",
    openAutopilot: "Open Autopilot",
    suggestionNoProductsTitle: "Add products to your store",
    suggestionNoProductsText: "SellForge needs products before it can create ads.",
    suggestionMetaTitle: "Connect Facebook and Instagram",
    suggestionMetaText: "Once Meta is connected, you can prepare ads for publishing.",
    suggestionFirstAdTitle: "Create your first ad",
    suggestionFirstAdText: "You already have products. Choose one and start promoting it.",
    suggestionAutopilotTitle: "Enable Autopilot",
    suggestionAutopilotText: "SellForge can help keep your marketing organised.",
    suggestionReadyTitle: "Your store is ready to grow",
    suggestionReadyText: "Keep testing products and follow your ad results.",
    revenueMissing: "No attributed sales yet",
    revenueMissingText: "Results will appear here after advertising platforms are connected.",
  },
  "es-ES": {
    page: "Inicio",
    welcome: "Bienvenido a SellForge",
    subtitle: "Consulta lo que ocurre y qué debes hacer para vender más.",
    createAd: "Crear anuncio",
    products: "Productos",
    productsHint: "Disponibles en tu tienda",
    ads: "Anuncios creados",
    adsHint: "Campañas guardadas",
    spend: "Gasto en anuncios",
    spendHint: "Total registrado",
    return: "Retorno de anuncios",
    returnHint: "Ventas generadas por cada euro",
    suggestions: "Sugerencias de la IA",
    suggestionsHint: "Próximos pasos recomendados para esta tienda.",
    productsReady: "Productos listos para anunciar",
    productsReadyHint: "Elige un producto y crea un anuncio en segundos.",
    noProducts: "Todavía no hay productos disponibles en esta tienda.",
    priceUnavailable: "Precio no disponible",
    useProduct: "Crear anuncio",
    quickActions: "Acciones rápidas",
    quickHint: "Ve directamente a lo que necesitas.",
    browseProducts: "Ver productos",
    browseProductsDesc: "Elige los productos que quieres promocionar.",
    createAds: "Crear anuncios",
    createAdsDesc: "Prepara anuncios para Facebook, Instagram, Google y TikTok.",
    createContent: "Crear contenido",
    createContentDesc: "Genera textos e imágenes para promocionar productos.",
    statistics: "Estadísticas",
    statisticsDesc: "Consulta los resultados de las campañas.",
    autopilot: "Piloto automático",
    autopilotDesc: "Deja que SellForge planifique tu marketing.",
    connected: "Tienda preparada",
    connectedHint: "SellForge está conectado a tu tienda Shopify.",
    checklist: "Estado de configuración",
    shopConnected: "Productos conectados a Shopify",
    metaConnected: "Facebook e Instagram conectados",
    metaMissing: "Falta conectar Facebook e Instagram",
    autopilotOn: "Piloto automático activado",
    autopilotOff: "Piloto automático desactivado",
    scheduled: "Publicaciones programadas",
    openSettings: "Abrir configuración",
    openAutopilot: "Abrir Piloto automático",
    suggestionNoProductsTitle: "Añade productos a tu tienda",
    suggestionNoProductsText: "SellForge necesita productos para crear anuncios.",
    suggestionMetaTitle: "Conecta Facebook e Instagram",
    suggestionMetaText: "Después de conectar Meta podrás preparar la publicación de anuncios.",
    suggestionFirstAdTitle: "Crea tu primer anuncio",
    suggestionFirstAdText: "Ya tienes productos. Elige uno y empieza a promocionarlo.",
    suggestionAutopilotTitle: "Activa el Piloto automático",
    suggestionAutopilotText: "SellForge puede ayudarte a organizar el marketing.",
    suggestionReadyTitle: "Tu tienda está lista para crecer",
    suggestionReadyText: "Sigue probando productos y revisa los resultados.",
    revenueMissing: "Todavía no hay ventas atribuidas",
    revenueMissingText: "Los resultados aparecerán cuando conectes las plataformas.",
  },
  "fr-FR": {
    page: "Accueil",
    welcome: "Bienvenue sur SellForge",
    subtitle: "Découvrez ce qui se passe et quoi faire pour vendre davantage.",
    createAd: "Créer une publicité",
    products: "Produits",
    productsHint: "Disponibles dans votre boutique",
    ads: "Publicités créées",
    adsHint: "Campagnes enregistrées",
    spend: "Dépenses publicitaires",
    spendHint: "Total enregistré",
    return: "Retour publicitaire",
    returnHint: "Ventes générées par euro",
    suggestions: "Suggestions de l’IA",
    suggestionsHint: "Prochaines étapes recommandées pour cette boutique.",
    productsReady: "Produits prêts à promouvoir",
    productsReadyHint: "Choisissez un produit et créez une publicité en quelques secondes.",
    noProducts: "Aucun produit n’est encore disponible.",
    priceUnavailable: "Prix indisponible",
    useProduct: "Créer une publicité",
    quickActions: "Actions rapides",
    quickHint: "Accédez directement à ce dont vous avez besoin.",
    browseProducts: "Voir les produits",
    browseProductsDesc: "Choisissez les produits que vous souhaitez promouvoir.",
    createAds: "Créer des publicités",
    createAdsDesc: "Préparez des publicités pour Facebook, Instagram, Google et TikTok.",
    createContent: "Créer du contenu",
    createContentDesc: "Générez des textes et des images promotionnelles.",
    statistics: "Statistiques",
    statisticsDesc: "Consultez les résultats des campagnes.",
    autopilot: "Pilote automatique",
    autopilotDesc: "Laissez SellForge organiser votre marketing.",
    connected: "Boutique prête",
    connectedHint: "SellForge est connecté à votre boutique Shopify.",
    checklist: "État de la configuration",
    shopConnected: "Produits connectés à Shopify",
    metaConnected: "Facebook et Instagram connectés",
    metaMissing: "Facebook et Instagram ne sont pas connectés",
    autopilotOn: "Pilote automatique activé",
    autopilotOff: "Pilote automatique désactivé",
    scheduled: "Publications programmées",
    openSettings: "Ouvrir les paramètres",
    openAutopilot: "Ouvrir le Pilote automatique",
    suggestionNoProductsTitle: "Ajoutez des produits",
    suggestionNoProductsText: "SellForge a besoin de produits pour créer des publicités.",
    suggestionMetaTitle: "Connectez Facebook et Instagram",
    suggestionMetaText: "Après la connexion à Meta, vous pourrez préparer vos publicités.",
    suggestionFirstAdTitle: "Créez votre première publicité",
    suggestionFirstAdText: "Vous avez déjà des produits. Choisissez-en un pour commencer.",
    suggestionAutopilotTitle: "Activez le Pilote automatique",
    suggestionAutopilotText: "SellForge peut vous aider à organiser votre marketing.",
    suggestionReadyTitle: "Votre boutique est prête à grandir",
    suggestionReadyText: "Continuez à tester vos produits et suivez les résultats.",
    revenueMissing: "Aucune vente attribuée pour le moment",
    revenueMissingText: "Les résultats apparaîtront après connexion des plateformes.",
  },
  "it-IT": {
    page: "Inizio",
    welcome: "Benvenuto su SellForge",
    subtitle: "Scopri cosa sta succedendo e cosa fare per vendere di più.",
    createAd: "Crea annuncio",
    products: "Prodotti",
    productsHint: "Disponibili nel tuo negozio",
    ads: "Annunci creati",
    adsHint: "Campagne salvate",
    spend: "Spesa pubblicitaria",
    spendHint: "Totale registrato",
    return: "Ritorno pubblicitario",
    returnHint: "Vendite generate per ogni euro",
    suggestions: "Suggerimenti dell’IA",
    suggestionsHint: "Prossimi passi consigliati per questo negozio.",
    productsReady: "Prodotti pronti da pubblicizzare",
    productsReadyHint: "Scegli un prodotto e crea un annuncio in pochi secondi.",
    noProducts: "Non ci sono ancora prodotti disponibili.",
    priceUnavailable: "Prezzo non disponibile",
    useProduct: "Crea annuncio",
    quickActions: "Azioni rapide",
    quickHint: "Vai direttamente a ciò che ti serve.",
    browseProducts: "Vedi prodotti",
    browseProductsDesc: "Scegli i prodotti che vuoi promuovere.",
    createAds: "Crea annunci",
    createAdsDesc: "Prepara annunci per Facebook, Instagram, Google e TikTok.",
    createContent: "Crea contenuti",
    createContentDesc: "Genera testi e immagini promozionali.",
    statistics: "Statistiche",
    statisticsDesc: "Controlla i risultati delle campagne.",
    autopilot: "Pilota automatico",
    autopilotDesc: "Lascia che SellForge organizzi il tuo marketing.",
    connected: "Negozio pronto",
    connectedHint: "SellForge è collegato al tuo negozio Shopify.",
    checklist: "Stato configurazione",
    shopConnected: "Prodotti collegati a Shopify",
    metaConnected: "Facebook e Instagram collegati",
    metaMissing: "Facebook e Instagram non sono collegati",
    autopilotOn: "Pilota automatico attivo",
    autopilotOff: "Pilota automatico disattivo",
    scheduled: "Post programmati",
    openSettings: "Apri impostazioni",
    openAutopilot: "Apri Pilota automatico",
    suggestionNoProductsTitle: "Aggiungi prodotti al negozio",
    suggestionNoProductsText: "SellForge ha bisogno di prodotti per creare annunci.",
    suggestionMetaTitle: "Collega Facebook e Instagram",
    suggestionMetaText: "Dopo il collegamento potrai preparare gli annunci.",
    suggestionFirstAdTitle: "Crea il tuo primo annuncio",
    suggestionFirstAdText: "Hai già dei prodotti. Scegline uno e inizia a promuoverlo.",
    suggestionAutopilotTitle: "Attiva il Pilota automatico",
    suggestionAutopilotText: "SellForge può aiutarti a organizzare il marketing.",
    suggestionReadyTitle: "Il negozio è pronto a crescere",
    suggestionReadyText: "Continua a testare prodotti e controlla i risultati.",
    revenueMissing: "Nessuna vendita attribuita",
    revenueMissingText: "I risultati appariranno dopo il collegamento delle piattaforme.",
  },
  "de-DE": {
    page: "Start",
    welcome: "Willkommen bei SellForge",
    subtitle: "Sieh, was passiert und was du tun solltest, um mehr zu verkaufen.",
    createAd: "Anzeige erstellen",
    products: "Produkte",
    productsHint: "In deinem Shop verfügbar",
    ads: "Erstellte Anzeigen",
    adsHint: "Gespeicherte Kampagnen",
    spend: "Werbeausgaben",
    spendHint: "Erfasste Gesamtsumme",
    return: "Werberendite",
    returnHint: "Verkäufe pro eingesetztem Euro",
    suggestions: "KI-Empfehlungen",
    suggestionsHint: "Empfohlene nächste Schritte für diesen Shop.",
    productsReady: "Produkte bereit für Werbung",
    productsReadyHint: "Wähle ein Produkt und erstelle in Sekunden eine Anzeige.",
    noProducts: "In diesem Shop sind noch keine Produkte verfügbar.",
    priceUnavailable: "Preis nicht verfügbar",
    useProduct: "Anzeige erstellen",
    quickActions: "Schnellaktionen",
    quickHint: "Gehe direkt zu dem, was du brauchst.",
    browseProducts: "Produkte ansehen",
    browseProductsDesc: "Wähle die Produkte aus, die du bewerben möchtest.",
    createAds: "Anzeigen erstellen",
    createAdsDesc: "Erstelle Anzeigen für Facebook, Instagram, Google und TikTok.",
    createContent: "Inhalte erstellen",
    createContentDesc: "Erzeuge Texte und Bilder zur Produktwerbung.",
    statistics: "Statistiken",
    statisticsDesc: "Sieh die Ergebnisse deiner Kampagnen.",
    autopilot: "Autopilot",
    autopilotDesc: "Lass SellForge dein Marketing organisieren.",
    connected: "Shop bereit",
    connectedHint: "SellForge ist mit deinem Shopify-Shop verbunden.",
    checklist: "Einrichtungsstatus",
    shopConnected: "Produkte mit Shopify verbunden",
    metaConnected: "Facebook und Instagram verbunden",
    metaMissing: "Facebook und Instagram nicht verbunden",
    autopilotOn: "Autopilot aktiviert",
    autopilotOff: "Autopilot deaktiviert",
    scheduled: "Geplante Beiträge",
    openSettings: "Einstellungen öffnen",
    openAutopilot: "Autopilot öffnen",
    suggestionNoProductsTitle: "Produkte hinzufügen",
    suggestionNoProductsText: "SellForge benötigt Produkte, um Anzeigen zu erstellen.",
    suggestionMetaTitle: "Facebook und Instagram verbinden",
    suggestionMetaText: "Nach der Verbindung kannst du Anzeigen vorbereiten.",
    suggestionFirstAdTitle: "Erste Anzeige erstellen",
    suggestionFirstAdText: "Du hast bereits Produkte. Wähle eines aus und bewirb es.",
    suggestionAutopilotTitle: "Autopilot aktivieren",
    suggestionAutopilotText: "SellForge kann dein Marketing übersichtlich organisieren.",
    suggestionReadyTitle: "Dein Shop ist bereit zu wachsen",
    suggestionReadyText: "Teste weiter Produkte und beobachte die Ergebnisse.",
    revenueMissing: "Noch keine zugeordneten Verkäufe",
    revenueMissingText: "Ergebnisse erscheinen nach Verbindung der Werbeplattformen.",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMoney(value: number, language: Language) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  let shopName = session.shop;
  let products: DashboardProduct[] = [];
  let productCount = 0;

  try {
    const response = await admin.graphql(`
      #graphql
      query SellForgeDashboard {
        shop {
          name
        }
        productsCount {
          count
        }
        products(first: 3, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            title
            onlineStoreUrl
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              nodes {
                price
              }
            }
          }
        }
      }
    `);

    const json: any = await response.json();

    shopName = String(json.data?.shop?.name ?? shopName);
    productCount = Number(json.data?.productsCount?.count ?? 0);
    products = (json.data?.products?.nodes ?? []) as DashboardProduct[];
  } catch (error) {
    console.error("SellForge dashboard Shopify query failed:", error);
  }

  const [
    adsCount,
    scheduledCount,
    adsTotals,
    metaConnection,
    autopilot,
    language,
  ] = await Promise.all([
    db.adsCampaign.count({
      where: { shop: session.shop },
    }),
    db.scheduledPost.count({
      where: {
        shop: session.shop,
        status: "scheduled",
      },
    }),
    db.adsCampaign.aggregate({
      where: { shop: session.shop },
      _sum: {
        spend: true,
        revenue: true,
      },
    }),
    db.metaConnection.findUnique({
      where: { shop: session.shop },
      select: { status: true },
    }),
    db.autopilotConfig.findUnique({
      where: { shop: session.shop },
      select: { enabled: true },
    }),
    getShopLanguage(session.shop),
  ]);

  const spend = Number(adsTotals._sum.spend ?? 0);
  const revenue = Number(adsTotals._sum.revenue ?? 0);
  const returnOnAds = spend > 0 ? revenue / spend : null;

  return {
    shopName,
    products,
    productCount,
    adsCount,
    scheduledCount,
    spend,
    revenue,
    returnOnAds,
    metaConnected: metaConnection?.status === "connected",
    autopilotEnabled: Boolean(autopilot?.enabled),
    language,
  };
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const language = data.language as Language;
  const text = copy[language] ?? copy["en-US"];

  const suggestion =
    data.productCount === 0
      ? {
          type: "warning",
          title: text.suggestionNoProductsTitle,
          description: text.suggestionNoProductsText,
          href: "/app/products",
          button: text.browseProducts,
        }
      : !data.metaConnected
        ? {
            type: "warning",
            title: text.suggestionMetaTitle,
            description: text.suggestionMetaText,
            href: "/app/social",
            button: text.openSettings,
          }
        : data.adsCount === 0
          ? {
              type: "info",
              title: text.suggestionFirstAdTitle,
              description: text.suggestionFirstAdText,
              href: "/app/ads",
              button: text.createAd,
            }
          : !data.autopilotEnabled
            ? {
                type: "info",
                title: text.suggestionAutopilotTitle,
                description: text.suggestionAutopilotText,
                href: "/app/autopilot",
                button: text.openAutopilot,
              }
            : {
                type: "success",
                title: text.suggestionReadyTitle,
                description: text.suggestionReadyText,
                href: "/app/analytics",
                button: text.statistics,
              };

  return (
    <s-page heading={text.page}>
      <s-button slot="primary-action" variant="primary" href="/app/ads">
        {text.createAd}
      </s-button>

      <div className="lp-dashboard">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-kicker">SellForge AI</p>
            <h2>
              {text.welcome}, {data.shopName}
            </h2>
            <p className="lp-hero-description">{text.subtitle}</p>

            <div className="lp-hero-actions">
              <s-button variant="primary" href="/app/ads">
                {text.createAd}
              </s-button>
              <s-button href="/app/products">{text.browseProducts}</s-button>
            </div>
          </div>

          <div className="lp-hero-mark">↗</div>
        </section>

        <section className="lp-stats-grid">
          <StatCard
            label={text.products}
            value={String(data.productCount)}
            hint={text.productsHint}
            icon="📦"
          />

          <StatCard
            label={text.ads}
            value={String(data.adsCount)}
            hint={text.adsHint}
            icon="📣"
          />

          <StatCard
            label={text.spend}
            value={formatMoney(data.spend, language)}
            hint={text.spendHint}
            icon="💳"
          />

          <StatCard
            label={text.return}
            value={
              data.returnOnAds === null
                ? "—"
                : `${data.returnOnAds.toFixed(2)}x`
            }
            hint={text.returnHint}
            icon="📈"
          />
        </section>

        <section className="lp-main-grid">
          <div className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.suggestions}</h3>
                <p className="lp-panel-subtitle">{text.suggestionsHint}</p>
              </div>
            </div>

            <div className={`lp-connection-state ${suggestion.type}`}>
              <span>
                {suggestion.type === "success"
                  ? "✓"
                  : suggestion.type === "warning"
                    ? "!"
                    : "→"}
              </span>

              <div>
                <strong>{suggestion.title}</strong>
                <p>{suggestion.description}</p>
              </div>
            </div>

            <div className="lp-hero-actions">
              <s-button variant="primary" href={suggestion.href}>
                {suggestion.button}
              </s-button>
            </div>

            {data.revenue === 0 ? (
              <div className="lp-coming-soon">
                <div>
                  <strong>{text.revenueMissing}</strong>
                  <div>{text.revenueMissingText}</div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lp-panel lp-autopilot">
            <div>
              <div className="lp-autopilot-status">
                <span className="lp-status-dot" />
                {text.connected}
              </div>

              <h3 className="lp-panel-title" style={{ marginTop: 14 }}>
                {text.checklist}
              </h3>

              <p className="lp-panel-subtitle">{text.connectedHint}</p>
            </div>

            <ul className="lp-checklist">
              <li>
                <span className="lp-check">✓</span>
                {text.shopConnected}
              </li>

              <li>
                <span className="lp-check">
                  {data.metaConnected ? "✓" : "→"}
                </span>
                {data.metaConnected ? text.metaConnected : text.metaMissing}
              </li>

              <li>
                <span className="lp-check">
                  {data.autopilotEnabled ? "✓" : "→"}
                </span>
                {data.autopilotEnabled
                  ? text.autopilotOn
                  : text.autopilotOff}
              </li>

              <li>
                <span className="lp-check">
                  {data.scheduledCount > 0 ? "✓" : "→"}
                </span>
                {text.scheduled}: {data.scheduledCount}
              </li>
            </ul>

            <div className="lp-hero-actions">
              <s-button href="/app/autopilot">
                {text.openAutopilot}
              </s-button>
              <s-button href="/app/settings">{text.openSettings}</s-button>
            </div>
          </aside>
        </section>

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">{text.productsReady}</h3>
              <p className="lp-panel-subtitle">{text.productsReadyHint}</p>
            </div>

            <s-button href="/app/products">{text.browseProducts}</s-button>
          </div>

          {data.products.length > 0 ? (
            <div className="lp-product-grid">
              {data.products.map((product) => {
                const price = product.variants?.nodes?.[0]?.price;

                return (
                  <article className="lp-product-card" key={product.id}>
                    <div className="lp-product-image">
                      {product.featuredImage?.url ? (
                        <img
                          src={product.featuredImage.url}
                          alt={
                            product.featuredImage.altText ??
                            product.title
                          }
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>

                    <div className="lp-product-body">
                      <h3>{product.title}</h3>

                      <div className="lp-product-footer">
                        <strong>
                          {price
                            ? formatMoney(Number(price), language)
                            : text.priceUnavailable}
                        </strong>

                        <a
                          className="lp-native-button lp-primary"
                          href={`/app/ads?product=${encodeURIComponent(
                            product.id,
                          )}`}
                        >
                          {text.useProduct}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="lp-muted">{text.noProducts}</p>
          )}
        </section>

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">{text.quickActions}</h3>
              <p className="lp-panel-subtitle">{text.quickHint}</p>
            </div>
          </div>

          <div className="lp-actions-list">
            <QuickAction
              title={text.createAds}
              description={text.createAdsDesc}
              icon="📣"
              href="/app/ads"
            />

            <QuickAction
              title={text.browseProducts}
              description={text.browseProductsDesc}
              icon="📦"
              href="/app/products"
            />

            <QuickAction
              title={text.createContent}
              description={text.createContentDesc}
              icon="✨"
              href="/app/studio"
            />

            <QuickAction
              title={text.statistics}
              description={text.statisticsDesc}
              icon="📊"
              href="/app/analytics"
            />

            <QuickAction
              title={text.autopilot}
              description={text.autopilotDesc}
              icon="🤖"
              href="/app/autopilot"
              badge={data.autopilotEnabled ? "ON" : "NOVO"}
            />
          </div>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};