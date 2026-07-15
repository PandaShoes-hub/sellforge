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
import {
  analyzeStore,
  answerQuestion,
  findBestProducts,
  generateAds,
  generateMarketingPlan,
  generateSocialCalendar,
  type AIContext,
} from "../services/ai-assistant.server";
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type Language =
  | "pt-PT"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "it-IT"
  | "de-DE";

type ShopifyProduct = {
  id: string;
  title: string;
  description: string | null;
  variants?: {
    nodes?: Array<{
      price?: string;
    }>;
  };
};

type ShopifyData = {
  shop?: {
    name?: string;
  };
  products?: {
    nodes?: ShopifyProduct[];
  };
};

type GraphQLResponse = {
  data?: ShopifyData;
  errors?: Array<{
    message?: string;
  }>;
};

const copy = {
  "pt-PT": {
    page: "Assistente IA",
    kicker: "SellForge AI",
    title: "Pergunta tudo sobre a tua loja",
    description:
      "A IA analisa os produtos e ajuda-te a criar anúncios, conteúdos e planos para vender mais.",
    placeholder: "Escreve aqui a tua pergunta...",
    send: "Perguntar à IA",
    thinking: "A analisar a loja...",
    suggestions: "Perguntas rápidas",
    analyze: "Analisa a minha loja",
    products: "Que produtos devo anunciar?",
    marketing: "Cria um plano de marketing",
    calendar: "Cria um calendário de conteúdos",
    ads: "Cria ideias de anúncios",
    answer: "Resposta da SellForge",
    question: "A tua pergunta",
    empty: "Escreve uma pergunta para começar.",
    sourceAI: "Criado com IA",
    sourceTemplate: "Resposta automática",
  },
  "en-US": {
    page: "AI Assistant",
    kicker: "SellForge AI",
    title: "Ask anything about your store",
    description:
      "AI analyses your products and helps create ads, content and plans to sell more.",
    placeholder: "Write your question here...",
    send: "Ask AI",
    thinking: "Analysing the store...",
    suggestions: "Quick questions",
    analyze: "Analyse my store",
    products: "Which products should I advertise?",
    marketing: "Create a marketing plan",
    calendar: "Create a content calendar",
    ads: "Create ad ideas",
    answer: "SellForge answer",
    question: "Your question",
    empty: "Write a question to begin.",
    sourceAI: "Created with AI",
    sourceTemplate: "Automatic answer",
  },
  "es-ES": {
    page: "Asistente IA",
    kicker: "SellForge AI",
    title: "Pregunta cualquier cosa sobre tu tienda",
    description:
      "La IA analiza tus productos y ayuda a crear anuncios, contenido y planes.",
    placeholder: "Escribe aquí tu pregunta...",
    send: "Preguntar a la IA",
    thinking: "Analizando la tienda...",
    suggestions: "Preguntas rápidas",
    analyze: "Analiza mi tienda",
    products: "¿Qué productos debo anunciar?",
    marketing: "Crea un plan de marketing",
    calendar: "Crea un calendario de contenido",
    ads: "Crea ideas de anuncios",
    answer: "Respuesta de SellForge",
    question: "Tu pregunta",
    empty: "Escribe una pregunta para empezar.",
    sourceAI: "Creado con IA",
    sourceTemplate: "Respuesta automática",
  },
  "fr-FR": {
    page: "Assistant IA",
    kicker: "SellForge AI",
    title: "Posez vos questions sur votre boutique",
    description:
      "L’IA analyse vos produits et aide à créer des publicités, contenus et plans.",
    placeholder: "Écrivez votre question...",
    send: "Demander à l’IA",
    thinking: "Analyse de la boutique...",
    suggestions: "Questions rapides",
    analyze: "Analyse ma boutique",
    products: "Quels produits dois-je promouvoir ?",
    marketing: "Créer un plan marketing",
    calendar: "Créer un calendrier de contenu",
    ads: "Créer des idées publicitaires",
    answer: "Réponse SellForge",
    question: "Votre question",
    empty: "Écrivez une question pour commencer.",
    sourceAI: "Créé avec IA",
    sourceTemplate: "Réponse automatique",
  },
  "it-IT": {
    page: "Assistente IA",
    kicker: "SellForge AI",
    title: "Chiedi qualsiasi cosa sul tuo negozio",
    description:
      "L’IA analizza i prodotti e aiuta a creare annunci, contenuti e piani.",
    placeholder: "Scrivi qui la tua domanda...",
    send: "Chiedi all’IA",
    thinking: "Analisi del negozio...",
    suggestions: "Domande rapide",
    analyze: "Analizza il mio negozio",
    products: "Quali prodotti devo pubblicizzare?",
    marketing: "Crea un piano marketing",
    calendar: "Crea un calendario contenuti",
    ads: "Crea idee per annunci",
    answer: "Risposta SellForge",
    question: "La tua domanda",
    empty: "Scrivi una domanda per iniziare.",
    sourceAI: "Creato con IA",
    sourceTemplate: "Risposta automatica",
  },
  "de-DE": {
    page: "KI-Assistent",
    kicker: "SellForge AI",
    title: "Frage alles über deinen Shop",
    description:
      "Die KI analysiert Produkte und hilft bei Anzeigen, Inhalten und Plänen.",
    placeholder: "Schreibe deine Frage...",
    send: "KI fragen",
    thinking: "Shop wird analysiert...",
    suggestions: "Schnelle Fragen",
    analyze: "Analysiere meinen Shop",
    products: "Welche Produkte soll ich bewerben?",
    marketing: "Marketingplan erstellen",
    calendar: "Inhaltskalender erstellen",
    ads: "Anzeigenideen erstellen",
    answer: "SellForge-Antwort",
    question: "Deine Frage",
    empty: "Schreibe eine Frage, um zu beginnen.",
    sourceAI: "Mit KI erstellt",
    sourceTemplate: "Automatische Antwort",
  },
} satisfies Record<Language, Record<string, string>>;

async function getStoreContext(admin: {
  graphql: (query: string) => Promise<Response>;
}): Promise<AIContext> {
  const response = await admin.graphql(`
    #graphql
    query SellForgeAIContext {
      shop {
        name
      }
      products(first: 30, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          description
          variants(first: 1) {
            nodes {
              price
            }
          }
        }
      }
    }
  `);

  const json = (await response.json()) as GraphQLResponse;

  if (json.errors?.length) {
    console.error("SellForgeAIContext errors:", json.errors);
  }

  return {
    shopName: json.data?.shop?.name ?? "Shopify Store",
    products: (json.data?.products?.nodes ?? []).map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description ?? undefined,
      price: product.variants?.nodes?.[0]?.price,
    })),
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [context, language] = await Promise.all([
    getStoreContext(admin),
    getShopLanguage(session.shop),
  ]);

  return {
    shopName: context.shopName,
    productCount: context.products?.length ?? 0,
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();

  const intent = String(form.get("intent") || "question");
  const question = String(form.get("question") || "").trim();
  const context = await getStoreContext(admin);

  let result;

  if (intent === "analyze") {
    result = await analyzeStore(context);
  } else if (intent === "products") {
    result = await findBestProducts(context);
  } else if (intent === "marketing") {
    result = await generateMarketingPlan(context);
  } else if (intent === "calendar") {
    result = await generateSocialCalendar(context);
  } else if (intent === "ads") {
    result = await generateAds(context);
  } else {
    if (!question) {
      return {
        ok: false,
        error: "EMPTY_QUESTION",
      };
    }

    result = await answerQuestion(question, context);
  }

  return {
    ok: true,
    question:
      question ||
      intent,
    answer: result.answer,
    source: result.source,
  };
};

export default function AIAssistant() {
  const data = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  const language = data.language as Language;
  const text = copy[language] ?? copy["en-US"];
  const busy = navigation.state !== "idle";

  const quickActions = [
    {
      intent: "analyze",
      label: text.analyze,
    },
    {
      intent: "products",
      label: text.products,
    },
    {
      intent: "marketing",
      label: text.marketing,
    },
    {
      intent: "calendar",
      label: text.calendar,
    },
    {
      intent: "ads",
      label: text.ads,
    },
  ];

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">AI</div>

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
              <input
                type="hidden"
                name="intent"
                value="question"
              />

              <label>
                {text.question}
                <textarea
                  name="question"
                  rows={6}
                  placeholder={text.placeholder}
                  required
                />
              </label>

              <button
                className="lp-native-button lp-primary"
                type="submit"
                disabled={busy}
              >
                {busy ? text.thinking : text.send}
              </button>
            </Form>

            {result &&
            "error" in result &&
            result.error ? (
              <p className="lp-error">{text.empty}</p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.suggestions}
                </h3>
                <p className="lp-panel-subtitle">
                  {data.productCount} produtos encontrados em{" "}
                  {data.shopName}
                </p>
              </div>
            </div>

            <div className="lp-actions-list">
              {quickActions.map((action) => (
                <Form method="post" key={action.intent}>
                  <input
                    type="hidden"
                    name="intent"
                    value={action.intent}
                  />

                  <button
                    className="lp-action-card"
                    type="submit"
                    disabled={busy}
                  >
                    <span className="lp-action-icon">→</span>

                    <span className="lp-action-copy">
                      <strong className="lp-action-title">
                        {action.label}
                      </strong>
                    </span>

                    <span className="lp-arrow">›</span>
                  </button>
                </Form>
              ))}
            </div>
          </section>
        </div>

        {result &&
        "ok" in result &&
        result.ok &&
        "answer" in result ? (
          <section className="lp-panel lp-generated">
            <div className="lp-generated-head">
              <div>
                <p className="lp-eyebrow">
                  {result.source === "openai"
                    ? text.sourceAI
                    : text.sourceTemplate}
                </p>

                <h3>{text.answer}</h3>
              </div>
            </div>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {result.answer}
            </p>
          </section>
        ) : null}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};