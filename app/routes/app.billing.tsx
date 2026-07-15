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

type PlanId = "free" | "starter" | "pro" | "business";

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const copy = {
  "pt-PT": {
    page: "Plano",
    kicker: "Subscrição SellForge",
    title: "Escolhe o plano certo para a tua loja",
    description:
      "Começa gratuitamente e aumenta os limites quando precisares de criar mais conteúdos e anúncios.",
    currentPlan: "Plano atual",
    choosePlan: "Escolher plano",
    changing: "A atualizar...",
    saved: "Plano atualizado com sucesso.",
    month: "mês",
    recommended: "Mais escolhido",
    freeName: "Grátis",
    freeDescription: "Para experimentar a SellForge.",
    starterName: "Starter",
    starterDescription: "Para lojas que estão a começar a anunciar.",
    proName: "Pro",
    proDescription: "Para lojas que querem crescer mais depressa.",
    businessName: "Business",
    businessDescription: "Para equipas e operações com maior volume.",
    freeFeatures: [
      "Até 5 conteúdos por mês",
      "1 rascunho de anúncio",
      "Acesso ao catálogo de produtos",
      "Estatísticas básicas",
    ],
    starterFeatures: [
      "Até 30 conteúdos por mês",
      "Até 10 anúncios guardados",
      "Calendário de publicações",
      "Sugestões automáticas",
      "Suporte por email",
    ],
    proFeatures: [
      "Conteúdos ilimitados",
      "Anúncios ilimitados",
      "Piloto Automático",
      "Estatísticas avançadas",
      "Facebook e Instagram",
      "Suporte prioritário",
    ],
    businessFeatures: [
      "Tudo do plano Pro",
      "Várias lojas",
      "Google Ads e TikTok Ads",
      "Limites personalizados",
      "Acesso antecipado a novidades",
      "Suporte prioritário",
    ],
    noticeTitle: "Cobrança ainda em modo de teste",
    noticeText:
      "Nesta fase, mudar de plano atualiza apenas o acesso interno da app. A cobrança real será ligada através do Shopify Billing antes da publicação.",
  },
  "en-US": {
    page: "Plan",
    kicker: "SellForge subscription",
    title: "Choose the right plan for your store",
    description:
      "Start free and increase limits when you need more content and ads.",
    currentPlan: "Current plan",
    choosePlan: "Choose plan",
    changing: "Updating...",
    saved: "Plan updated successfully.",
    month: "month",
    recommended: "Most popular",
    freeName: "Free",
    freeDescription: "To try SellForge.",
    starterName: "Starter",
    starterDescription: "For stores starting to advertise.",
    proName: "Pro",
    proDescription: "For stores that want to grow faster.",
    businessName: "Business",
    businessDescription: "For teams and higher-volume operations.",
    freeFeatures: [
      "Up to 5 content items per month",
      "1 ad draft",
      "Product catalogue access",
      "Basic statistics",
    ],
    starterFeatures: [
      "Up to 30 content items per month",
      "Up to 10 saved ads",
      "Content calendar",
      "Automatic suggestions",
      "Email support",
    ],
    proFeatures: [
      "Unlimited content",
      "Unlimited ads",
      "Autopilot",
      "Advanced statistics",
      "Facebook and Instagram",
      "Priority support",
    ],
    businessFeatures: [
      "Everything in Pro",
      "Multiple stores",
      "Google Ads and TikTok Ads",
      "Custom limits",
      "Early access to new features",
      "Priority support",
    ],
    noticeTitle: "Billing is still in test mode",
    noticeText:
      "For now, changing plans only updates internal app access. Real billing will be connected through Shopify Billing before launch.",
  },
  "es-ES": {
    page: "Plan",
    kicker: "Suscripción SellForge",
    title: "Elige el plan adecuado para tu tienda",
    description:
      "Empieza gratis y aumenta los límites cuando necesites más contenido y anuncios.",
    currentPlan: "Plan actual",
    choosePlan: "Elegir plan",
    changing: "Actualizando...",
    saved: "Plan actualizado correctamente.",
    month: "mes",
    recommended: "Más elegido",
    freeName: "Gratis",
    freeDescription: "Para probar SellForge.",
    starterName: "Starter",
    starterDescription: "Para tiendas que empiezan a anunciar.",
    proName: "Pro",
    proDescription: "Para tiendas que quieren crecer más rápido.",
    businessName: "Business",
    businessDescription: "Para equipos y operaciones con mayor volumen.",
    freeFeatures: [
      "Hasta 5 contenidos al mes",
      "1 borrador de anuncio",
      "Acceso al catálogo",
      "Estadísticas básicas",
    ],
    starterFeatures: [
      "Hasta 30 contenidos al mes",
      "Hasta 10 anuncios guardados",
      "Calendario de publicaciones",
      "Sugerencias automáticas",
      "Soporte por email",
    ],
    proFeatures: [
      "Contenido ilimitado",
      "Anuncios ilimitados",
      "Piloto automático",
      "Estadísticas avanzadas",
      "Facebook e Instagram",
      "Soporte prioritario",
    ],
    businessFeatures: [
      "Todo lo incluido en Pro",
      "Varias tiendas",
      "Google Ads y TikTok Ads",
      "Límites personalizados",
      "Acceso anticipado",
      "Soporte prioritario",
    ],
    noticeTitle: "La facturación está en modo de prueba",
    noticeText:
      "Por ahora, cambiar de plan solo actualiza el acceso interno. La facturación real se conectará antes del lanzamiento.",
  },
  "fr-FR": {
    page: "Offre",
    kicker: "Abonnement SellForge",
    title: "Choisissez l’offre adaptée à votre boutique",
    description:
      "Commencez gratuitement et augmentez les limites lorsque vous avez besoin de plus de contenus et de publicités.",
    currentPlan: "Offre actuelle",
    choosePlan: "Choisir l’offre",
    changing: "Mise à jour...",
    saved: "Offre mise à jour avec succès.",
    month: "mois",
    recommended: "Le plus choisi",
    freeName: "Gratuit",
    freeDescription: "Pour essayer SellForge.",
    starterName: "Starter",
    starterDescription: "Pour les boutiques qui commencent à faire de la publicité.",
    proName: "Pro",
    proDescription: "Pour les boutiques qui souhaitent accélérer leur croissance.",
    businessName: "Business",
    businessDescription: "Pour les équipes et les volumes plus importants.",
    freeFeatures: [
      "Jusqu’à 5 contenus par mois",
      "1 brouillon publicitaire",
      "Accès au catalogue",
      "Statistiques de base",
    ],
    starterFeatures: [
      "Jusqu’à 30 contenus par mois",
      "Jusqu’à 10 publicités enregistrées",
      "Calendrier de contenu",
      "Suggestions automatiques",
      "Support par email",
    ],
    proFeatures: [
      "Contenus illimités",
      "Publicités illimitées",
      "Pilote automatique",
      "Statistiques avancées",
      "Facebook et Instagram",
      "Support prioritaire",
    ],
    businessFeatures: [
      "Tout le plan Pro",
      "Plusieurs boutiques",
      "Google Ads et TikTok Ads",
      "Limites personnalisées",
      "Accès anticipé",
      "Support prioritaire",
    ],
    noticeTitle: "La facturation est encore en mode test",
    noticeText:
      "Pour le moment, changer d’offre met seulement à jour l’accès interne. La facturation réelle sera connectée avant le lancement.",
  },
  "it-IT": {
    page: "Piano",
    kicker: "Abbonamento SellForge",
    title: "Scegli il piano giusto per il tuo negozio",
    description:
      "Inizia gratuitamente e aumenta i limiti quando hai bisogno di più contenuti e annunci.",
    currentPlan: "Piano attuale",
    choosePlan: "Scegli piano",
    changing: "Aggiornamento...",
    saved: "Piano aggiornato con successo.",
    month: "mese",
    recommended: "Più scelto",
    freeName: "Gratis",
    freeDescription: "Per provare SellForge.",
    starterName: "Starter",
    starterDescription: "Per negozi che iniziano a fare pubblicità.",
    proName: "Pro",
    proDescription: "Per negozi che vogliono crescere più velocemente.",
    businessName: "Business",
    businessDescription: "Per team e operazioni con maggiore volume.",
    freeFeatures: [
      "Fino a 5 contenuti al mese",
      "1 bozza annuncio",
      "Accesso al catalogo",
      "Statistiche di base",
    ],
    starterFeatures: [
      "Fino a 30 contenuti al mese",
      "Fino a 10 annunci salvati",
      "Calendario contenuti",
      "Suggerimenti automatici",
      "Supporto email",
    ],
    proFeatures: [
      "Contenuti illimitati",
      "Annunci illimitati",
      "Pilota automatico",
      "Statistiche avanzate",
      "Facebook e Instagram",
      "Supporto prioritario",
    ],
    businessFeatures: [
      "Tutto il piano Pro",
      "Più negozi",
      "Google Ads e TikTok Ads",
      "Limiti personalizzati",
      "Accesso anticipato",
      "Supporto prioritario",
    ],
    noticeTitle: "La fatturazione è ancora in modalità test",
    noticeText:
      "Per ora, cambiare piano aggiorna solo l’accesso interno. La fatturazione reale sarà collegata prima del lancio.",
  },
  "de-DE": {
    page: "Plan",
    kicker: "SellForge-Abonnement",
    title: "Wähle den passenden Plan für deinen Shop",
    description:
      "Starte kostenlos und erhöhe die Limits, wenn du mehr Inhalte und Anzeigen brauchst.",
    currentPlan: "Aktueller Plan",
    choosePlan: "Plan auswählen",
    changing: "Wird aktualisiert...",
    saved: "Plan erfolgreich aktualisiert.",
    month: "Monat",
    recommended: "Am beliebtesten",
    freeName: "Kostenlos",
    freeDescription: "Zum Testen von SellForge.",
    starterName: "Starter",
    starterDescription: "Für Shops, die mit Werbung beginnen.",
    proName: "Pro",
    proDescription: "Für Shops, die schneller wachsen möchten.",
    businessName: "Business",
    businessDescription: "Für Teams und größere Volumen.",
    freeFeatures: [
      "Bis zu 5 Inhalte pro Monat",
      "1 Anzeigenentwurf",
      "Zugriff auf den Produktkatalog",
      "Grundlegende Statistiken",
    ],
    starterFeatures: [
      "Bis zu 30 Inhalte pro Monat",
      "Bis zu 10 gespeicherte Anzeigen",
      "Inhaltskalender",
      "Automatische Vorschläge",
      "E-Mail-Support",
    ],
    proFeatures: [
      "Unbegrenzte Inhalte",
      "Unbegrenzte Anzeigen",
      "Autopilot",
      "Erweiterte Statistiken",
      "Facebook und Instagram",
      "Priorisierter Support",
    ],
    businessFeatures: [
      "Alles aus Pro",
      "Mehrere Shops",
      "Google Ads und TikTok Ads",
      "Individuelle Limits",
      "Früher Zugang",
      "Priorisierter Support",
    ],
    noticeTitle: "Abrechnung noch im Testmodus",
    noticeText:
      "Der Planwechsel ändert derzeit nur den internen Zugriff. Die echte Abrechnung wird vor dem Start über Shopify Billing verbunden.",
  },
} satisfies Record<Language, Record<string, string | string[]>>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [merchant, language] = await Promise.all([
    db.merchantPlan.upsert({
      where: { shop: session.shop },
      update: {},
      create: { shop: session.shop },
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    merchant,
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const requested = String(form.get("plan") ?? "free");

  const allowed: PlanId[] = [
    "free",
    "starter",
    "pro",
    "business",
  ];

  const plan = allowed.includes(requested as PlanId)
    ? (requested as PlanId)
    : "free";

  const merchant = await db.merchantPlan.upsert({
    where: { shop: session.shop },
    update: { plan },
    create: { shop: session.shop, plan },
  });

  return {
    ok: true,
    merchant,
  };
};

export default function Billing() {
  const { merchant, language } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const currentLanguage = language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";

  const currentPlan =
    result && "merchant" in result
      ? result.merchant.plan
      : merchant.plan;

  const plans: Plan[] = [
    {
      id: "free",
      name: String(text.freeName),
      price: "€0",
      description: String(text.freeDescription),
      features: text.freeFeatures as string[],
    },
    {
      id: "starter",
      name: String(text.starterName),
      price: `€19/${String(text.month)}`,
      description: String(text.starterDescription),
      features: text.starterFeatures as string[],
    },
    {
      id: "pro",
      name: String(text.proName),
      price: `€49/${String(text.month)}`,
      description: String(text.proDescription),
      features: text.proFeatures as string[],
      highlighted: true,
    },
    {
      id: "business",
      name: String(text.businessName),
      price: `€99/${String(text.month)}`,
      description: String(text.businessDescription),
      features: text.businessFeatures as string[],
    },
  ];

  return (
    <s-page heading={String(text.page)}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">P</div>

          <div>
            <p className="lp-eyebrow">{String(text.kicker)}</p>
            <h2 className="lp-module-title">
              {String(text.title)}
            </h2>
            <p className="lp-module-description">
              {String(text.description)}
            </p>
          </div>
        </section>

        {result && "ok" in result && result.ok ? (
          <div className="lp-social-notice success">
            {String(text.saved)}
          </div>
        ) : null}

        <div className="lp-pricing-grid">
          {plans.map((plan) => {
            const current = currentPlan === plan.id;

            return (
              <section
                className={`lp-panel lp-price-card ${
                  current ? "selected" : ""
                }`}
                key={plan.id}
              >
                <div className="lp-panel-header">
                  <div>
                    <p className="lp-eyebrow">{plan.name}</p>
                    <h3>{plan.price}</h3>
                  </div>

                  {plan.highlighted ? (
                    <span className="lp-badge">
                      {String(text.recommended)}
                    </span>
                  ) : null}
                </div>

                <p className="lp-muted">{plan.description}</p>

                <ul className="lp-checklist">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span className="lp-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Form method="post">
                  <input
                    type="hidden"
                    name="plan"
                    value={plan.id}
                  />

                  <button
                    className={`lp-native-button ${
                      current ? "" : "lp-primary"
                    }`}
                    type="submit"
                    disabled={current || busy}
                  >
                    {busy
                      ? String(text.changing)
                      : current
                        ? String(text.currentPlan)
                        : String(text.choosePlan)}
                  </button>
                </Form>
              </section>
            );
          })}
        </div>

        <section className="lp-coming-soon">
          <div>
            <strong>{String(text.noticeTitle)}</strong>
            <div>{String(text.noticeText)}</div>
          </div>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};