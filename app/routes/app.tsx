import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { getShopLanguage, getTranslations } from "../i18n.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "", language: await getShopLanguage(session.shop) };
};

export default function App() {
  const { apiKey, language } = useLoaderData<typeof loader>();
  const t = getTranslations(language);
  return <AppProvider embedded apiKey={apiKey}>
    <s-app-nav>
      <s-link href="/app">{t("nav_dashboard")}</s-link>
      <s-link href="/app/products">{t("nav_products")}</s-link>
      <s-link href="/app/studio">{t("nav_studio")}</s-link>
      <s-link href="/app/social">{t("nav_social")}</s-link>
      <s-link href="/app/autopilot">{t("nav_autopilot")}</s-link>
      <s-link href="/app/ads">{t("nav_ads")}</s-link>
      <s-link href="/app/calendar">{t("nav_calendar")}</s-link>
      <s-link href="/app/analytics">{t("nav_analytics")}</s-link>
      <s-link href="/app/settings">{t("nav_settings")}</s-link>
      <s-link href="/app/billing">{t("nav_billing")}</s-link>
    </s-app-nav>
    <Outlet />
  </AppProvider>;
}
export function ErrorBoundary(){ return boundary.error(useRouteError()); }
export const headers: HeadersFunction = (args) => boundary.headers(args);
