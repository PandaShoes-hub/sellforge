import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getShopLanguage } from "../i18n.server";
import { getTranslations } from "../i18n";
import "../styles/launchpilot.css";

type Plan = { id: "free" | "starter" | "pro" | "business"; name: string; price: string; features: string[] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [merchant, language] = await Promise.all([
    db.merchantPlan.upsert({ where: { shop: session.shop }, update: {}, create: { shop: session.shop } }),
    getShopLanguage(session.shop),
  ]);
  return { merchant, language };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const requested = String(form.get("plan") ?? "free");
  const allowed = ["free", "starter", "pro", "business"] as const;
  const plan = allowed.includes(requested as (typeof allowed)[number]) ? requested : "free";
  await db.merchantPlan.upsert({ where: { shop: session.shop }, update: { plan }, create: { shop: session.shop, plan } });
  return { ok: true };
};

export default function Billing() {
  const { merchant, language } = useLoaderData<typeof loader>();
  const t = getTranslations(language);
  const plans: Plan[] = [
    { id: "free", name: "Free", price: "€0", features: t("free_features") as string[] },
    { id: "starter", name: "Starter", price: `€19/${String(t("month"))}`, features: t("starter_features") as string[] },
    { id: "pro", name: "Pro", price: `€49/${String(t("month"))}`, features: t("pro_features") as string[] },
    { id: "business", name: "Business", price: `€99/${String(t("month"))}`, features: t("business_features") as string[] },
  ];
  return <s-page heading={String(t("billing"))}><div className="lp-page-stack"><section className="lp-module-hero"><div className="lp-module-icon">💳</div><div><p className="lp-eyebrow">{String(t("monetization_ready"))}</p><h2 className="lp-module-title">{String(t("billing_title"))}</h2><p className="lp-module-description">{String(t("billing_long"))}</p></div></section><div className="lp-pricing-grid">{plans.map((plan) => { const current = merchant.plan === plan.id; return <section className={`lp-panel lp-price-card ${current ? "selected" : ""}`} key={plan.id}><p className="lp-eyebrow">{plan.name}</p><h3>{plan.price}</h3><ul className="lp-checklist">{plan.features.map((feature) => <li key={feature}><span className="lp-check">✓</span>{feature}</li>)}</ul><Form method="post"><input type="hidden" name="plan" value={plan.id}/><button className={`lp-native-button ${current ? "" : "lp-primary"}`} type="submit" disabled={current}>{current ? String(t("current_plan")) : String(t("choose_plan"))}</button></Form></section>; })}</div></div></s-page>;
}

export const headers: HeadersFunction = (args) => boundary.headers(args);
