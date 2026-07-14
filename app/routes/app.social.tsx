import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { buildMetaAuthorizationUrl } from "../services/meta.server";
import "../styles/launchpilot.css";
import { getShopLanguage } from "../i18n.server";
import { getTranslations } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const requestUrl = new URL(request.url);
  const configured = Boolean(
    process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI,
  );
  const connection = await prisma.metaConnection.findUnique({ where: { shop: session.shop } });

  return {
    language: await getShopLanguage(session.shop),
    configured,
    redirectUri: process.env.META_REDIRECT_URI || "Not configured",
    authUrl: configured ? buildMetaAuthorizationUrl(session.shop) : null,
    result: requestUrl.searchParams.get("meta"),
    connection: connection
      ? {
          status: connection.status,
          facebookPageName: connection.facebookPageName,
          instagramUsername: connection.instagramUsername,
          instagramName: connection.instagramName,
          instagramProfilePicture: connection.instagramProfilePicture,
          tokenExpiresAt: connection.tokenExpiresAt?.toISOString() || null,
          lastError: connection.lastError,
        }
      : null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  if (formData.get("intent") === "disconnect") {
    await prisma.metaConnection.deleteMany({ where: { shop: session.shop } });
  }
  return null;
};


export default function Social() {
  const data = useLoaderData<typeof loader>();
  const result = data.result;
  const t = getTranslations(data.language);
  const messages: Record<string,string> = { connected:t("connected_success"), facebook_only:t("facebook_only"), cancelled:t("cancelled"), no_page:t("no_page"), invalid_state:t("invalid_state"), error:t("meta_error") };
  const connected = data.connection?.status === "connected";

  return (
    <s-page heading={t("social")}>
      <div className="lp-page-stack">
        {result && messages[result] ? (
          <div className={result === "connected" || result === "facebook_only" ? "lp-social-notice success" : "lp-social-notice error"}>
            {messages[result]}
          </div>
        ) : null}

        <section className="lp-module-hero">
          <div className="lp-module-icon">📱</div>
          <div>
            <p className="lp-eyebrow">{t("publishing_connections")}</p>
            <h2 className="lp-module-title">{t("instagram_facebook")}</h2>
            <p className="lp-module-description">
              {t("social_desc")}
            </p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <div className={`lp-connection-state ${connected ? "ready" : "pending"}`}>
              <span>{connected ? "✓" : "!"}</span>
              <div>
                <strong>{connected ? t("account_connected") : data.configured ? t("ready_connect") : t("missing_meta")}</strong>
                <p>
                  {connected
                    ? `${t("page")}: ${data.connection?.facebookPageName || "Facebook"}`
                    : data.configured
                      ? t("authorize_meta")
                      : t("add_env")}
                </p>
              </div>
            </div>

            {connected ? (
              <div className="lp-connected-account">
                {data.connection?.instagramProfilePicture ? (
                  <img src={data.connection.instagramProfilePicture} alt="Instagram profile" />
                ) : (
                  <div className="lp-social-avatar">◎</div>
                )}
                <div>
                  <strong>{data.connection?.instagramName || data.connection?.facebookPageName}</strong>
                  <span>
                    {data.connection?.instagramUsername
                      ? `@${data.connection.instagramUsername}`
                      : t("instagram_missing")}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="lp-social-actions">
              {!connected && data.authUrl ? (
                <a className="lp-native-button lp-primary" href={data.authUrl} target="_top" rel="noreferrer">
                  {t("connect_meta")}
                </a>
              ) : null}

              {connected ? (
                <Form method="post">
                  <input type="hidden" name="intent" value="disconnect" />
                  <button className="lp-native-button" type="submit">{t("disconnect")}</button>
                </Form>
              ) : null}
            </div>

            {data.connection?.lastError ? <p className="lp-error">{data.connection.lastError}</p> : null}
          </section>

          <section className="lp-panel">
            <h3 className="lp-panel-title">{t("required_permissions")}</h3>
            <ul className="lp-checklist">
              <li><span className="lp-check">→</span>pages_show_list</li>
              <li><span className="lp-check">→</span>pages_read_engagement</li>
              <li><span className="lp-check">→</span>pages_manage_posts</li>
              <li><span className="lp-check">→</span>instagram_basic</li>
              <li><span className="lp-check">→</span>instagram_content_publish</li>
            </ul>
            <p className="lp-muted">Redirect URI: {data.redirectUri}</p>
          </section>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => boundary.headers(args);
