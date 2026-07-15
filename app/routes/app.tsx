import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { getShopLanguage } from "../i18n.server";

type Language =
  | "pt-PT"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "it-IT"
  | "de-DE";

const navigation = {
  "pt-PT": {
    home: "Início",
    ai: "Assistente IA",
    ads: "Anúncios",
    create: "Criar conteúdo",
    products: "Produtos",
    statistics: "Estatísticas",
    autopilot: "Piloto Automático",
    calendar: "Calendário",
    connections: "Ligações",
    plan: "Plano",
    settings: "Definições",
  },
  "en-US": {
    home: "Home",
    ai: "AI Assistant",
    ads: "Ads",
    create: "Create content",
    products: "Products",
    statistics: "Statistics",
    autopilot: "Autopilot",
    calendar: "Calendar",
    connections: "Connections",
    plan: "Plan",
    settings: "Settings",
  },
  "es-ES": {
    home: "Inicio",
    ai: "Asistente IA",
    ads: "Anuncios",
    create: "Crear contenido",
    products: "Productos",
    statistics: "Estadísticas",
    autopilot: "Piloto automático",
    calendar: "Calendario",
    connections: "Conexiones",
    plan: "Plan",
    settings: "Configuración",
  },
  "fr-FR": {
    home: "Accueil",
    ai: "Assistant IA",
    ads: "Publicités",
    create: "Créer du contenu",
    products: "Produits",
    statistics: "Statistiques",
    autopilot: "Pilote automatique",
    calendar: "Calendrier",
    connections: "Connexions",
    plan: "Offre",
    settings: "Paramètres",
  },
  "it-IT": {
    home: "Inizio",
    ai: "Assistente IA",
    ads: "Annunci",
    create: "Crea contenuti",
    products: "Prodotti",
    statistics: "Statistiche",
    autopilot: "Pilota automatico",
    calendar: "Calendario",
    connections: "Connessioni",
    plan: "Piano",
    settings: "Impostazioni",
  },
  "de-DE": {
    home: "Start",
    ai: "KI-Assistent",
    ads: "Anzeigen",
    create: "Inhalte erstellen",
    products: "Produkte",
    statistics: "Statistiken",
    autopilot: "Autopilot",
    calendar: "Kalender",
    connections: "Verbindungen",
    plan: "Plan",
    settings: "Einstellungen",
  },
} satisfies Record<Language, Record<string, string>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    language: await getShopLanguage(session.shop),
  };
};

export default function App() {
  const { apiKey, language } = useLoaderData<typeof loader>();
  const text =
    navigation[language as Language] ?? navigation["en-US"];

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">{text.home}</s-link>
        <s-link href="/app/ai">{text.ai}</s-link>
        <s-link href="/app/ads">{text.ads}</s-link>
        <s-link href="/app/studio">{text.create}</s-link>
        <s-link href="/app/products">{text.products}</s-link>
        <s-link href="/app/analytics">{text.statistics}</s-link>
        <s-link href="/app/autopilot">{text.autopilot}</s-link>
        <s-link href="/app/calendar">{text.calendar}</s-link>
        <s-link href="/app/social">{text.connections}</s-link>
        <s-link href="/app/billing">{text.plan}</s-link>
        <s-link href="/app/settings">{text.settings}</s-link>
      </s-app-nav>

      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};