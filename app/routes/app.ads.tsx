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
import {
  createAdDraft,
  providerReadiness,
  type AdProvider,
} from "../services/ads.server";
import { getShopLanguage } from "../i18n.server";
import { getTranslations } from "../i18n";

import "../styles/launchpilot.css";

type ShopifyProduct = {
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

async function getProducts(admin: any) {
  const response = await admin.graphql(`
    #graphql
    query AdsProducts {
      shop {
        url
      }
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
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

  if (json.errors?.length) {
    console.error("AdsProducts GraphQL errors:", json.errors);
    throw new Error("Não foi possível carregar os produtos da Shopify.");
  }

  return {
    products: (json.data?.products?.nodes ?? []) as ShopifyProduct[],
    shopUrl: String(json.data?.shop?.url ?? ""),
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [catalog, campaigns, language] = await Promise.all([
    getProducts(admin),
    db.adsCampaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    ...catalog,
    campaigns,
    readiness: providerReadiness(),
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();

  const catalog = await getProducts(admin);
  const productId = String(form.get("productId") ?? "");
  const product = catalog.products.find((item) => item.id === productId);

  if (!product) {
    return {
      ok: false,
      error: "Escolhe um produto.",
    };
  }

  const provider = String(form.get("provider") ?? "meta") as AdProvider;
  const goal = String(form.get("goal") ?? "sales");
  const parsedBudget = Number(form.get("dailyBudget") ?? 5);
  const dailyBudget = Number.isFinite(parsedBudget)
    ? Math.max(1, parsedBudget)
    : 5;

  const price = product.variants?.nodes?.[0]?.price;
  const destinationUrl = product.onlineStoreUrl || catalog.shopUrl;

  const draft = createAdDraft({
    provider,
    productTitle: product.title,
    price: price ? `€${price}` : undefined,
    goal,
    dailyBudget,
    storeUrl: destinationUrl,
  });

  const campaign = await db.adsCampaign.create({
    data: {
      shop: session.shop,
      provider,
      name: draft.name,
      objective: draft.objective,
      dailyBudget,
      productId: product.id,
      productTitle: product.title,
      headline: draft.headline,
      primaryText: draft.primaryText,
      destinationUrl: draft.destinationUrl,
    },
  });

  return {
    ok: true,
    campaign,
  };
};

function getProviderName(provider: string) {
  if (provider === "meta") return "Facebook e Instagram";
  if (provider === "google") return "Google";
  return "TikTok";
}

function getProviderLetter(provider: string) {
  if (provider === "meta") return "M";
  if (provider === "google") return "G";
  return "T";
}

export default function AdsManager() {
  const data = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const t = getTranslations(data.language);
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Anúncios">
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">📣</div>

          <div>
            <p className="lp-eyebrow">Vender mais</p>
            <h2 className="lp-module-title">
              Cria anúncios sem perceber de publicidade
            </h2>
            <p className="lp-module-description">
              Escolhe o produto, define quanto queres gastar por dia e a
              SellForge prepara o anúncio.
            </p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">Criar novo anúncio</h3>
                <p className="lp-panel-subtitle">
                  A SellForge cria o texto, o título e o destino.
                </p>
              </div>
            </div>

            <Form method="post" className="lp-form">
              <label>
                Onde queres anunciar?
                <select name="provider" defaultValue="meta">
                  <option value="meta">Facebook e Instagram</option>
                  <option value="google">Google</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>

              <label>
                Que produto queres vender?
                <select name="productId" required defaultValue="">
                  <option value="" disabled>
                    Escolhe um produto
                  </option>

                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lp-two-cols">
                <label>
                  O que queres alcançar?
                  <select name="goal" defaultValue="sales">
                    <option value="sales">Vender mais</option>
                    <option value="traffic">Levar pessoas ao site</option>
                    <option value="awareness">Dar a conhecer a marca</option>
                  </select>
                </label>

                <label>
                  Quanto queres gastar por dia?
                  <input
                    name="dailyBudget"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue="5"
                    required
                  />
                </label>
              </div>

              <button
                className="lp-native-button lp-primary"
                type="submit"
                disabled={busy || data.products.length === 0}
              >
                {busy ? "A criar anúncio..." : "Criar anúncio"}
              </button>
            </Form>

            {data.products.length === 0 ? (
              <p className="lp-error">
                Ainda não existem produtos disponíveis nesta loja.
              </p>
            ) : null}

            {result && "error" in result && result.error ? (
              <p className="lp-error">{result.error}</p>
            ) : null}

            {result && "ok" in result && result.ok ? (
              <p className="lp-success-message">
                Anúncio criado e guardado com sucesso.
              </p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">Contas ligadas</h3>
                <p className="lp-panel-subtitle">
                  Liga as plataformas para publicar anúncios reais.
                </p>
              </div>
            </div>

            <ul className="lp-checklist">
              <li>
                <span className="lp-check">
                  {data.readiness.meta ? "✓" : "→"}
                </span>
                Facebook e Instagram{" "}
                {data.readiness.meta ? "prontos" : "ainda não ligados"}
              </li>

              <li>
                <span className="lp-check">
                  {data.readiness.google ? "✓" : "→"}
                </span>
                Google {data.readiness.google ? "pronto" : "ainda não ligado"}
              </li>

              <li>
                <span className="lp-check">
                  {data.readiness.tiktok ? "✓" : "→"}
                </span>
                TikTok {data.readiness.tiktok ? "pronto" : "ainda não ligado"}
              </li>
            </ul>
          </section>
        </div>

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">Anúncios criados</h3>
              <p className="lp-panel-subtitle">
                Vê os anúncios preparados para esta loja.
              </p>
            </div>
          </div>

          <div className="lp-campaign-list">
            {data.campaigns.length > 0 ? (
              data.campaigns.map((campaign) => (
                <article className="lp-campaign-row" key={campaign.id}>
                  <div className="lp-social-avatar">
                    {getProviderLetter(campaign.provider)}
                  </div>

                  <div>
                    <strong>{campaign.name}</strong>
                    <span>
                      {getProviderName(campaign.provider)} · €
                      {campaign.dailyBudget}/dia ·{" "}
                      {campaign.status === "draft"
                        ? "Rascunho"
                        : campaign.status}{" "}
                      ·{" "}
                      {new Date(campaign.createdAt).toLocaleDateString(
                        data.language,
                      )}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="lp-muted">Ainda não criaste nenhum anúncio.</p>
            )}
          </div>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};