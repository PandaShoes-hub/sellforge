import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useLoaderData,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { buildMetaAuthorizationUrl } from "../services/meta.server";
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
    page: "Ligações",
    kicker: "Contas de marketing",
    title: "Liga as plataformas onde queres anunciar",
    description:
      "A SellForge usa estas ligações para preparar, publicar e acompanhar anúncios da tua loja.",
    connected: "Ligado",
    ready: "Pronto para ligar",
    missing: "Por configurar",
    connectMeta: "Ligar Facebook e Instagram",
    disconnect: "Desligar conta",
    disconnecting: "A desligar...",
    meta: "Facebook e Instagram",
    metaReady: "Credenciais Meta configuradas.",
    metaMissing: "Falta configurar a aplicação Meta no servidor.",
    google: "Google Ads",
    googleReady: "Credenciais Google Ads configuradas.",
    googleMissing: "Falta configurar as credenciais Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenciais TikTok configuradas.",
    tiktokMissing: "Falta configurar as credenciais TikTok.",
    openai: "Inteligência Artificial",
    openaiReady: "OpenAI configurada para criar conteúdos.",
    openaiMissing: "Falta configurar a chave OpenAI.",
    account: "Conta ligada",
    facebookPage: "Página Facebook",
    instagramAccount: "Conta Instagram",
    instagramMissing: "Instagram Business ainda não encontrado",
    tokenExpiry: "Acesso válido até",
    noExpiry: "Sem data de validade disponível",
    permissions: "Permissões necessárias",
    permissionsHint:
      "Estas permissões permitem ler páginas, publicar conteúdos e gerir a presença da loja.",
    redirect: "Endereço de retorno",
    status: "Estado geral",
    statusHint: "Plataformas prontas para utilização.",
    platformsReady: "plataformas preparadas",
    security: "Segurança",
    securityText:
      "As credenciais ficam guardadas no servidor. Os comerciantes apenas autorizam as próprias contas.",
    connectedSuccess: "Facebook e Instagram ligados com sucesso.",
    facebookOnly:
      "A página Facebook foi ligada, mas não foi encontrada uma conta Instagram Business.",
    cancelled: "A ligação foi cancelada.",
    noPage: "Não foi encontrada nenhuma página Facebook disponível.",
    invalidState: "A sessão de ligação expirou. Tenta novamente.",
    metaError: "Não foi possível concluir a ligação à Meta.",
  },
  "en-US": {
    page: "Connections",
    kicker: "Marketing accounts",
    title: "Connect the platforms where you want to advertise",
    description:
      "SellForge uses these connections to prepare, publish and track ads for your store.",
    connected: "Connected",
    ready: "Ready to connect",
    missing: "Needs setup",
    connectMeta: "Connect Facebook and Instagram",
    disconnect: "Disconnect account",
    disconnecting: "Disconnecting...",
    meta: "Facebook and Instagram",
    metaReady: "Meta credentials are configured.",
    metaMissing: "The Meta app still needs server configuration.",
    google: "Google Ads",
    googleReady: "Google Ads credentials are configured.",
    googleMissing: "Google Ads credentials still need configuration.",
    tiktok: "TikTok Ads",
    tiktokReady: "TikTok credentials are configured.",
    tiktokMissing: "TikTok credentials still need configuration.",
    openai: "Artificial Intelligence",
    openaiReady: "OpenAI is configured for content creation.",
    openaiMissing: "The OpenAI key still needs configuration.",
    account: "Connected account",
    facebookPage: "Facebook page",
    instagramAccount: "Instagram account",
    instagramMissing: "Instagram Business account not found yet",
    tokenExpiry: "Access valid until",
    noExpiry: "No expiry date available",
    permissions: "Required permissions",
    permissionsHint:
      "These permissions allow page access, content publishing and store presence management.",
    redirect: "Return address",
    status: "Overall status",
    statusHint: "Platforms ready to use.",
    platformsReady: "platforms ready",
    security: "Security",
    securityText:
      "Credentials stay on the server. Merchants only authorise their own accounts.",
    connectedSuccess: "Facebook and Instagram connected successfully.",
    facebookOnly:
      "The Facebook page was connected, but no Instagram Business account was found.",
    cancelled: "The connection was cancelled.",
    noPage: "No available Facebook page was found.",
    invalidState: "The connection session expired. Try again.",
    metaError: "The Meta connection could not be completed.",
  },
  "es-ES": {
    page: "Conexiones",
    kicker: "Cuentas de marketing",
    title: "Conecta las plataformas donde quieres anunciar",
    description:
      "SellForge usa estas conexiones para preparar, publicar y seguir los anuncios.",
    connected: "Conectado",
    ready: "Listo para conectar",
    missing: "Por configurar",
    connectMeta: "Conectar Facebook e Instagram",
    disconnect: "Desconectar cuenta",
    disconnecting: "Desconectando...",
    meta: "Facebook e Instagram",
    metaReady: "Credenciales Meta configuradas.",
    metaMissing: "Falta configurar la aplicación Meta.",
    google: "Google Ads",
    googleReady: "Credenciales Google Ads configuradas.",
    googleMissing: "Faltan las credenciales Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenciales TikTok configuradas.",
    tiktokMissing: "Faltan las credenciales TikTok.",
    openai: "Inteligencia Artificial",
    openaiReady: "OpenAI está configurada para crear contenido.",
    openaiMissing: "Falta configurar la clave OpenAI.",
    account: "Cuenta conectada",
    facebookPage: "Página de Facebook",
    instagramAccount: "Cuenta de Instagram",
    instagramMissing: "Todavía no se encontró Instagram Business",
    tokenExpiry: "Acceso válido hasta",
    noExpiry: "Sin fecha de caducidad disponible",
    permissions: "Permisos necesarios",
    permissionsHint:
      "Permiten acceder a páginas, publicar contenido y gestionar la presencia de la tienda.",
    redirect: "Dirección de retorno",
    status: "Estado general",
    statusHint: "Plataformas listas para usar.",
    platformsReady: "plataformas preparadas",
    security: "Seguridad",
    securityText:
      "Las credenciales permanecen en el servidor. Los comerciantes solo autorizan sus cuentas.",
    connectedSuccess: "Facebook e Instagram conectados correctamente.",
    facebookOnly:
      "La página de Facebook se conectó, pero no se encontró Instagram Business.",
    cancelled: "La conexión fue cancelada.",
    noPage: "No se encontró ninguna página de Facebook.",
    invalidState: "La sesión expiró. Inténtalo de nuevo.",
    metaError: "No fue posible completar la conexión con Meta.",
  },
  "fr-FR": {
    page: "Connexions",
    kicker: "Comptes marketing",
    title: "Connectez les plateformes où vous souhaitez faire de la publicité",
    description:
      "SellForge utilise ces connexions pour préparer, publier et suivre les publicités.",
    connected: "Connecté",
    ready: "Prêt à connecter",
    missing: "À configurer",
    connectMeta: "Connecter Facebook et Instagram",
    disconnect: "Déconnecter le compte",
    disconnecting: "Déconnexion...",
    meta: "Facebook et Instagram",
    metaReady: "Identifiants Meta configurés.",
    metaMissing: "L’application Meta doit encore être configurée.",
    google: "Google Ads",
    googleReady: "Identifiants Google Ads configurés.",
    googleMissing: "Les identifiants Google Ads doivent être configurés.",
    tiktok: "TikTok Ads",
    tiktokReady: "Identifiants TikTok configurés.",
    tiktokMissing: "Les identifiants TikTok doivent être configurés.",
    openai: "Intelligence Artificielle",
    openaiReady: "OpenAI est configuré pour créer du contenu.",
    openaiMissing: "La clé OpenAI doit être configurée.",
    account: "Compte connecté",
    facebookPage: "Page Facebook",
    instagramAccount: "Compte Instagram",
    instagramMissing: "Compte Instagram Business introuvable",
    tokenExpiry: "Accès valide jusqu’au",
    noExpiry: "Aucune date d’expiration disponible",
    permissions: "Autorisations nécessaires",
    permissionsHint:
      "Elles permettent d’accéder aux pages, de publier et de gérer la présence de la boutique.",
    redirect: "Adresse de retour",
    status: "État général",
    statusHint: "Plateformes prêtes à l’emploi.",
    platformsReady: "plateformes prêtes",
    security: "Sécurité",
    securityText:
      "Les identifiants restent sur le serveur. Les commerçants autorisent seulement leurs propres comptes.",
    connectedSuccess: "Facebook et Instagram connectés avec succès.",
    facebookOnly:
      "La page Facebook est connectée, mais aucun compte Instagram Business n’a été trouvé.",
    cancelled: "La connexion a été annulée.",
    noPage: "Aucune page Facebook disponible n’a été trouvée.",
    invalidState: "La session a expiré. Réessayez.",
    metaError: "La connexion Meta n’a pas pu être terminée.",
  },
  "it-IT": {
    page: "Connessioni",
    kicker: "Account marketing",
    title: "Collega le piattaforme dove vuoi fare pubblicità",
    description:
      "SellForge usa queste connessioni per preparare, pubblicare e monitorare gli annunci.",
    connected: "Collegato",
    ready: "Pronto da collegare",
    missing: "Da configurare",
    connectMeta: "Collega Facebook e Instagram",
    disconnect: "Scollega account",
    disconnecting: "Disconnessione...",
    meta: "Facebook e Instagram",
    metaReady: "Credenziali Meta configurate.",
    metaMissing: "L’app Meta deve ancora essere configurata.",
    google: "Google Ads",
    googleReady: "Credenziali Google Ads configurate.",
    googleMissing: "Mancano le credenziali Google Ads.",
    tiktok: "TikTok Ads",
    tiktokReady: "Credenziali TikTok configurate.",
    tiktokMissing: "Mancano le credenziali TikTok.",
    openai: "Intelligenza Artificiale",
    openaiReady: "OpenAI è configurato per creare contenuti.",
    openaiMissing: "Manca la chiave OpenAI.",
    account: "Account collegato",
    facebookPage: "Pagina Facebook",
    instagramAccount: "Account Instagram",
    instagramMissing: "Account Instagram Business non trovato",
    tokenExpiry: "Accesso valido fino al",
    noExpiry: "Nessuna scadenza disponibile",
    permissions: "Permessi necessari",
    permissionsHint:
      "Consentono accesso alle pagine, pubblicazione e gestione della presenza del negozio.",
    redirect: "Indirizzo di ritorno",
    status: "Stato generale",
    statusHint: "Piattaforme pronte all’uso.",
    platformsReady: "piattaforme pronte",
    security: "Sicurezza",
    securityText:
      "Le credenziali restano sul server. I commercianti autorizzano solo i propri account.",
    connectedSuccess: "Facebook e Instagram collegati con successo.",
    facebookOnly:
      "La pagina Facebook è collegata, ma Instagram Business non è stato trovato.",
    cancelled: "La connessione è stata annullata.",
    noPage: "Nessuna pagina Facebook disponibile trovata.",
    invalidState: "La sessione è scaduta. Riprova.",
    metaError: "Impossibile completare la connessione Meta.",
  },
  "de-DE": {
    page: "Verbindungen",
    kicker: "Marketing-Konten",
    title: "Verbinde die Plattformen, auf denen du werben möchtest",
    description:
      "SellForge nutzt diese Verbindungen, um Anzeigen vorzubereiten, zu veröffentlichen und zu verfolgen.",
    connected: "Verbunden",
    ready: "Bereit zum Verbinden",
    missing: "Einrichtung nötig",
    connectMeta: "Facebook und Instagram verbinden",
    disconnect: "Konto trennen",
    disconnecting: "Wird getrennt...",
    meta: "Facebook und Instagram",
    metaReady: "Meta-Zugangsdaten sind konfiguriert.",
    metaMissing: "Die Meta-App muss noch eingerichtet werden.",
    google: "Google Ads",
    googleReady: "Google-Ads-Zugangsdaten sind konfiguriert.",
    googleMissing: "Google-Ads-Zugangsdaten fehlen.",
    tiktok: "TikTok Ads",
    tiktokReady: "TikTok-Zugangsdaten sind konfiguriert.",
    tiktokMissing: "TikTok-Zugangsdaten fehlen.",
    openai: "Künstliche Intelligenz",
    openaiReady: "OpenAI ist für die Inhaltserstellung konfiguriert.",
    openaiMissing: "Der OpenAI-Schlüssel fehlt.",
    account: "Verbundenes Konto",
    facebookPage: "Facebook-Seite",
    instagramAccount: "Instagram-Konto",
    instagramMissing: "Instagram-Business-Konto noch nicht gefunden",
    tokenExpiry: "Zugriff gültig bis",
    noExpiry: "Kein Ablaufdatum verfügbar",
    permissions: "Erforderliche Berechtigungen",
    permissionsHint:
      "Sie erlauben Seitenzugriff, Veröffentlichung und Verwaltung der Shop-Präsenz.",
    redirect: "Rückgabeadresse",
    status: "Gesamtstatus",
    statusHint: "Einsatzbereite Plattformen.",
    platformsReady: "Plattformen bereit",
    security: "Sicherheit",
    securityText:
      "Zugangsdaten bleiben auf dem Server. Händler autorisieren nur ihre eigenen Konten.",
    connectedSuccess: "Facebook und Instagram erfolgreich verbunden.",
    facebookOnly:
      "Die Facebook-Seite wurde verbunden, aber kein Instagram-Business-Konto gefunden.",
    cancelled: "Die Verbindung wurde abgebrochen.",
    noPage: "Keine verfügbare Facebook-Seite gefunden.",
    invalidState: "Die Sitzung ist abgelaufen. Versuche es erneut.",
    metaError: "Die Meta-Verbindung konnte nicht abgeschlossen werden.",
  },
} satisfies Record<Language, Record<string, string>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const requestUrl = new URL(request.url);

  const metaConfigured = Boolean(
    process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      process.env.META_REDIRECT_URI,
  );
  const googleConfigured = Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET,
  );
  const tiktokConfigured = Boolean(
    process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET,
  );
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);

  const [connection, language] = await Promise.all([
    prisma.metaConnection.findUnique({
      where: { shop: session.shop },
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    language,
    metaConfigured,
    googleConfigured,
    tiktokConfigured,
    openAiConfigured,
    redirectUri:
      process.env.META_REDIRECT_URI || "Not configured",
    authUrl: metaConfigured
      ? buildMetaAuthorizationUrl(session.shop)
      : null,
    result: requestUrl.searchParams.get("meta"),
    connection: connection
      ? {
          status: connection.status,
          facebookPageName: connection.facebookPageName,
          instagramUsername: connection.instagramUsername,
          instagramName: connection.instagramName,
          instagramProfilePicture:
            connection.instagramProfilePicture,
          tokenExpiresAt:
            connection.tokenExpiresAt?.toISOString() || null,
          lastError: connection.lastError,
        }
      : null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.get("intent") === "disconnect") {
    await prisma.metaConnection.deleteMany({
      where: { shop: session.shop },
    });
  }

  return {
    ok: true,
  };
};

export default function Social() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const language = data.language as Language;
  const text = copy[language] ?? copy["en-US"];
  const connected = data.connection?.status === "connected";
  const busy = navigation.state !== "idle";

  const messages: Record<string, string> = {
    connected: text.connectedSuccess,
    facebook_only: text.facebookOnly,
    cancelled: text.cancelled,
    no_page: text.noPage,
    invalid_state: text.invalidState,
    error: text.metaError,
  };

  const readyCount = [
    connected,
    data.googleConfigured,
    data.tiktokConfigured,
    data.openAiConfigured,
  ].filter(Boolean).length;

  const integrationRows = [
    {
      name: text.meta,
      ready: connected,
      configured: data.metaConfigured,
      readyText: text.metaReady,
      missingText: text.metaMissing,
    },
    {
      name: text.google,
      ready: data.googleConfigured,
      configured: data.googleConfigured,
      readyText: text.googleReady,
      missingText: text.googleMissing,
    },
    {
      name: text.tiktok,
      ready: data.tiktokConfigured,
      configured: data.tiktokConfigured,
      readyText: text.tiktokReady,
      missingText: text.tiktokMissing,
    },
    {
      name: text.openai,
      ready: data.openAiConfigured,
      configured: data.openAiConfigured,
      readyText: text.openaiReady,
      missingText: text.openaiMissing,
    },
  ];

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        {data.result && messages[data.result] ? (
          <div
            className={`lp-social-notice ${
              data.result === "connected" ||
              data.result === "facebook_only"
                ? "success"
                : "error"
            }`}
          >
            {messages[data.result]}
          </div>
        ) : null}

        <section className="lp-module-hero">
          <div className="lp-module-icon">L</div>

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
              <div className="lp-stat-icon">M</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.meta}</p>
              <h2 className="lp-stat-value">
                {connected ? text.connected : text.missing}
              </h2>
              <p className="lp-muted">
                {connected ? text.metaReady : text.metaMissing}
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">G</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.google}</p>
              <h2 className="lp-stat-value">
                {data.googleConfigured ? text.ready : text.missing}
              </h2>
              <p className="lp-muted">
                {data.googleConfigured
                  ? text.googleReady
                  : text.googleMissing}
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">T</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.tiktok}</p>
              <h2 className="lp-stat-value">
                {data.tiktokConfigured ? text.ready : text.missing}
              </h2>
              <p className="lp-muted">
                {data.tiktokConfigured
                  ? text.tiktokReady
                  : text.tiktokMissing}
              </p>
            </div>
          </article>

          <article className="lp-stat-card">
            <div className="lp-stat-card-top">
              <div className="lp-stat-icon">AI</div>
            </div>
            <div className="lp-stat-content">
              <p className="lp-eyebrow">{text.openai}</p>
              <h2 className="lp-stat-value">
                {data.openAiConfigured ? text.ready : text.missing}
              </h2>
              <p className="lp-muted">
                {data.openAiConfigured
                  ? text.openaiReady
                  : text.openaiMissing}
              </p>
            </div>
          </article>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.meta}</h3>
                <p className="lp-panel-subtitle">
                  {connected
                    ? text.account
                    : data.metaConfigured
                      ? text.ready
                      : text.missing}
                </p>
              </div>

              <span
                className={`lp-status ${
                  connected ? "lp-status-active" : ""
                }`}
              >
                {connected
                  ? text.connected
                  : data.metaConfigured
                    ? text.ready
                    : text.missing}
              </span>
            </div>

            <div
              className={`lp-connection-state ${
                connected ? "ready" : "pending"
              }`}
            >
              <span>{connected ? "✓" : "→"}</span>

              <div>
                <strong>
                  {connected
                    ? text.connected
                    : data.metaConfigured
                      ? text.ready
                      : text.missing}
                </strong>
                <p>
                  {connected
                    ? `${text.facebookPage}: ${
                        data.connection?.facebookPageName ||
                        "Facebook"
                      }`
                    : data.metaConfigured
                      ? text.metaReady
                      : text.metaMissing}
                </p>
              </div>
            </div>

            {connected ? (
              <div className="lp-connected-account">
                {data.connection?.instagramProfilePicture ? (
                  <img
                    src={data.connection.instagramProfilePicture}
                    alt={
                      data.connection.instagramName ||
                      text.instagramAccount
                    }
                  />
                ) : (
                  <div className="lp-social-avatar">M</div>
                )}

                <div>
                  <strong>
                    {data.connection?.instagramName ||
                      data.connection?.facebookPageName ||
                      text.account}
                  </strong>
                  <span>
                    {data.connection?.instagramUsername
                      ? `@${data.connection.instagramUsername}`
                      : text.instagramMissing}
                  </span>
                  <span>
                    {text.tokenExpiry}:{" "}
                    {data.connection?.tokenExpiresAt
                      ? new Date(
                          data.connection.tokenExpiresAt,
                        ).toLocaleDateString(language)
                      : text.noExpiry}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="lp-social-actions">
              {!connected && data.authUrl ? (
                <a
                  className="lp-native-button lp-primary"
                  href={data.authUrl}
                  target="_top"
                  rel="noreferrer"
                >
                  {text.connectMeta}
                </a>
              ) : null}

              {connected ? (
                <Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="disconnect"
                  />
                  <button
                    className="lp-native-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? text.disconnecting : text.disconnect}
                  </button>
                </Form>
              ) : null}
            </div>

            {data.connection?.lastError ? (
              <p className="lp-error">
                {data.connection.lastError}
              </p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">{text.status}</h3>
                <p className="lp-panel-subtitle">
                  {readyCount}/4 {text.platformsReady}
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
                      : integration.configured
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

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">
                {text.permissions}
              </h3>
              <p className="lp-panel-subtitle">
                {text.permissionsHint}
              </p>
            </div>
          </div>

          <ul className="lp-checklist">
            <li>
              <span className="lp-check">→</span>
              pages_show_list
            </li>
            <li>
              <span className="lp-check">→</span>
              pages_read_engagement
            </li>
            <li>
              <span className="lp-check">→</span>
              pages_manage_posts
            </li>
            <li>
              <span className="lp-check">→</span>
              instagram_basic
            </li>
            <li>
              <span className="lp-check">→</span>
              instagram_content_publish
            </li>
          </ul>

          <p className="lp-muted">
            {text.redirect}: {data.redirectUri}
          </p>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};