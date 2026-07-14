import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { generateCampaign } from "../services/marketing.server";
import CreativePreview from "../components/studio/CreativePreview";
import "../styles/launchpilot.css";
import { getShopLanguage, getTranslations } from "../i18n.server";

async function getProducts(admin: any) {
  const response = await admin.graphql(`#graphql
    query LaunchPilotStudioProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes { id title description featuredMedia { preview { image { url } } } variants(first: 1) { nodes { price } } }
      }
    }
  `);
  const json = await response.json();
  return json.data?.products?.nodes ?? [];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const products = await getProducts(admin);
  const url = new URL(request.url);
  const selected = url.searchParams.get("product") || products[0]?.id || "";
  const settings = await db.brandSettings.findUnique({ where: { shop: session.shop } });
  const campaigns = await db.campaign.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" }, take: 8 });
  return { products, selected, settings, campaigns, language: await getShopLanguage(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "generate");
  if (intent === "delete") {
    const id = String(form.get("id") || "");
    if (id) await db.campaign.deleteMany({ where: { id, shop: session.shop } });
    return { ok: true, deleted: true };
  }
  const products = await getProducts(admin);
  const productId = String(form.get("productId") || "");
  const product = products.find((item: any) => item.id === productId);
  if (!product) return { ok: false, error: "Choose a product first." };
  const settings = await db.brandSettings.findUnique({ where: { shop: session.shop } });
  const generated = await generateCampaign({
    productTitle: product.title,
    productDescription: product.description,
    price: product.variants?.nodes?.[0]?.price ? `€${product.variants.nodes[0].price}` : undefined,
    tone: String(form.get("tone") || settings?.tone || "friendly"),
    language: settings?.language || "pt-PT",
    goal: String(form.get("goal") || "sales"),
    format: String(form.get("format") || "feed"),
  });
  const campaign = await db.campaign.create({ data: {
    shop: session.shop, productId: product.id, productTitle: product.title,
    productImage: product.featuredMedia?.preview?.image?.url || null,
    title: generated.title, caption: generated.caption, hashtags: generated.hashtags,
    callToAction: generated.callToAction, format: String(form.get("format") || "feed"), source: generated.source,
  }});
  return { ok: true, campaign };
};

export default function Studio() {
  const { products, selected, settings, campaigns, language } = useLoaderData<typeof loader>();
  const t = getTranslations(language);
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const generated = result && "campaign" in result ? result.campaign : null;
  const product = products.find((item: any) => item.id === (generated?.productId || selected)) || products[0];
  return <s-page heading={t("studio")}>
    <div className="lp-page-stack">
      <section className="lp-module-hero"><div className="lp-module-icon">🎨</div><div><p className="lp-eyebrow">{t("studio_kicker")}</p><h2 className="lp-module-title">{t("studio_title")}</h2><p className="lp-module-description">{t("studio_desc")}</p></div></section>
      <div className="lp-studio-grid">
        <section className="lp-panel">
          <Form method="post" className="lp-form">
            <input type="hidden" name="intent" value="generate" />
            <label>{t("product")}<select name="productId" defaultValue={selected}>{products.map((item:any)=><option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
            <div className="lp-two-cols"><label>{t("format")}<select name="format" defaultValue="feed"><option value="feed">{t("feed")}</option><option value="story">{t("story")}</option><option value="reel">{t("reel")}</option></select></label><label>{t("goal")}<select name="goal"><option value="sales">{t("sales")}</option><option value="awareness">{t("awareness")}</option><option value="launch">{t("launch")}</option></select></label></div>
            <label>{t("tone")}<select name="tone" defaultValue={settings?.tone || "friendly"}><option value="friendly">{t("friendly")}</option><option value="premium">Premium</option><option value="energetic">{t("energetic")}</option><option value="minimal">Minimal</option></select></label>
            <button className="lp-native-button lp-primary" type="submit" disabled={navigation.state !== "idle"}>{navigation.state !== "idle" ? t("generating") : t("generate_campaign")}</button>
          </Form>
          {result && "error" in result && result.error && <p className="lp-error">{result.error}</p>}
        </section>
        <section className="lp-panel">
          <CreativePreview image={generated?.productImage || product?.featuredMedia?.preview?.image?.url} title={generated?.productTitle || product?.title || t("product")} price={product?.variants?.nodes?.[0]?.price ? `€${product.variants.nodes[0].price}` : null} color={settings?.primaryColor || "#5B3DF5"} downloadLabel={t("download_png")} tagline={t("discover_store")} />
        </section>
      </div>
      {generated && <section className="lp-panel lp-generated"><div className="lp-generated-head"><div><p className="lp-eyebrow">{t("generated_with")} {generated.source}</p><h3>{generated.title}</h3></div><a className="lp-native-button" href="/app/calendar">{t("schedule")}</a></div><p>{generated.caption}</p><p className="lp-hashtags">{generated.hashtags}</p><strong>CTA: {generated.callToAction}</strong></section>}
      <section className="lp-panel"><div className="lp-panel-header"><div><h3 className="lp-panel-title">{t("recent_campaigns")}</h3><p className="lp-panel-subtitle">{t("drafts_store")}</p></div></div><div className="lp-campaign-list">{campaigns.length ? campaigns.map((c:any)=><article className="lp-campaign-row" key={c.id}><img src={c.productImage || ""} alt="" /><div><strong>{c.title}</strong><span>{c.productTitle} · {new Date(c.createdAt).toLocaleDateString()}</span></div><Form method="post"><input type="hidden" name="intent" value="delete"/><input type="hidden" name="id" value={c.id}/><button className="lp-link-button" type="submit">{t("delete")}</button></Form></article>) : <p className="lp-muted">{t("no_campaigns")}</p>}</div></section>
    </div>
  </s-page>;
}
export const headers: HeadersFunction = (args) => boundary.headers(args);
