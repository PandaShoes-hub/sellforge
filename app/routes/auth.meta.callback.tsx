import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import prisma from "../db.server";
import {
  encryptMetaToken,
  exchangeMetaCode,
  getMetaPages,
  verifyMetaState,
} from "../services/meta.server";

function socialRedirect(shop: string, status: string) {
  const params = new URLSearchParams({ shop, meta: status });
  return redirect(`/app/social?${params.toString()}`);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const denied = url.searchParams.get("error");

  if (!state) return socialRedirect("", "invalid_state");

  let shop = "";
  try {
    const verified = verifyMetaState(state);
    shop = verified.shop;

    if (denied || !code) return socialRedirect(shop, "cancelled");

    const token = await exchangeMetaCode(code);
    const pages = await getMetaPages(token.access_token);
    const page = pages.find((item) => item.instagram_business_account) || pages[0];

    if (!page) return socialRedirect(shop, "no_page");

    const instagram = page.instagram_business_account;
    const tokenExpiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : null;

    await prisma.metaConnection.upsert({
      where: { shop },
      create: {
        shop,
        facebookPageId: page.id,
        facebookPageName: page.name,
        pageAccessToken: encryptMetaToken(page.access_token),
        userAccessToken: encryptMetaToken(token.access_token),
        instagramAccountId: instagram?.id,
        instagramUsername: instagram?.username,
        instagramName: instagram?.name,
        instagramProfilePicture: instagram?.profile_picture_url,
        tokenExpiresAt,
        status: "connected",
      },
      update: {
        facebookPageId: page.id,
        facebookPageName: page.name,
        pageAccessToken: encryptMetaToken(page.access_token),
        userAccessToken: encryptMetaToken(token.access_token),
        instagramAccountId: instagram?.id,
        instagramUsername: instagram?.username,
        instagramName: instagram?.name,
        instagramProfilePicture: instagram?.profile_picture_url,
        tokenExpiresAt,
        status: "connected",
        lastError: null,
      },
    });

    return socialRedirect(shop, instagram ? "connected" : "facebook_only");
  } catch (error) {
    console.error("Meta OAuth callback failed", error);
    if (shop) {
      await prisma.metaConnection
        .upsert({
          where: { shop },
          create: {
            shop,
            status: "error",
            lastError: error instanceof Error ? error.message : "Unknown Meta error",
          },
          update: {
            status: "error",
            lastError: error instanceof Error ? error.message : "Unknown Meta error",
          },
        })
        .catch(() => undefined);
    }
    return socialRedirect(shop, "error");
  }
};

export default function MetaCallback() {
  return null;
}
