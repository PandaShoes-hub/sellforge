import db from "../db.server";
import {
  createInstagramMediaContainer,
  decryptMetaToken,
  publishFacebookPagePost,
  publishInstagramMedia,
} from "./meta.server";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok";

export type PublishSocialInput = {
  shop: string;
  platform: SocialPlatform;
  message: string;
  imageUrl?: string;
  link?: string;
};

export type PublishSocialResult = {
  platform: SocialPlatform;
  externalId: string;
  status: "published";
};

type MetaConnectionRecord = {
  status: string;
  facebookPageId: string | null;
  instagramAccountId: string | null;
  pageAccessToken: string | null;
};

function requireText(value: string, name: string) {
  const clean = value.trim();

  if (!clean) {
    throw new Error(`${name} is required`);
  }

  return clean;
}

async function getMetaConnection(
  shop: string,
): Promise<MetaConnectionRecord> {
  const connection = await db.metaConnection.findUnique({
    where: { shop },
    select: {
      status: true,
      facebookPageId: true,
      instagramAccountId: true,
      pageAccessToken: true,
    },
  });

  if (!connection || connection.status !== "connected") {
    throw new Error(
      "Facebook e Instagram ainda não estão ligados.",
    );
  }

  return connection;
}

export async function publishFacebook(input: {
  shop: string;
  message: string;
  link?: string;
}) {
  const connection = await getMetaConnection(input.shop);

  if (
    !connection.facebookPageId ||
    !connection.pageAccessToken
  ) {
    throw new Error(
      "A ligação Facebook está incompleta.",
    );
  }

  const pageAccessToken = decryptMetaToken(
    connection.pageAccessToken,
  );

  const externalId = await publishFacebookPagePost({
    pageId: connection.facebookPageId,
    pageAccessToken,
    message: requireText(input.message, "message"),
    link: input.link?.trim() || undefined,
  });

  return {
    platform: "facebook",
    externalId,
    status: "published",
  } satisfies PublishSocialResult;
}

export async function publishInstagram(input: {
  shop: string;
  caption: string;
  imageUrl: string;
}) {
  const connection = await getMetaConnection(input.shop);

  if (
    !connection.instagramAccountId ||
    !connection.pageAccessToken
  ) {
    throw new Error(
      "A ligação Instagram Business está incompleta.",
    );
  }

  const pageAccessToken = decryptMetaToken(
    connection.pageAccessToken,
  );

  const creationId =
    await createInstagramMediaContainer({
      instagramAccountId:
        connection.instagramAccountId,
      pageAccessToken,
      imageUrl: requireText(
        input.imageUrl,
        "imageUrl",
      ),
      caption: requireText(
        input.caption,
        "caption",
      ),
    });

  const externalId = await publishInstagramMedia({
    instagramAccountId:
      connection.instagramAccountId,
    pageAccessToken,
    creationId,
  });

  return {
    platform: "instagram",
    externalId,
    status: "published",
  } satisfies PublishSocialResult;
}

export async function publishTikTok(): Promise<never> {
  throw new Error(
    "A publicação TikTok ainda não está ligada.",
  );
}

export async function publishSocial(
  input: PublishSocialInput,
): Promise<PublishSocialResult> {
  if (input.platform === "facebook") {
    return publishFacebook({
      shop: input.shop,
      message: input.message,
      link: input.link,
    });
  }

  if (input.platform === "instagram") {
    if (!input.imageUrl) {
      throw new Error(
        "O Instagram precisa de uma imagem pública.",
      );
    }

    return publishInstagram({
      shop: input.shop,
      caption: input.message,
      imageUrl: input.imageUrl,
    });
  }

  return publishTikTok();
}

export async function getSocialReadiness(shop: string) {
  const connection = await db.metaConnection.findUnique({
    where: { shop },
    select: {
      status: true,
      facebookPageId: true,
      instagramAccountId: true,
    },
  });

  return {
    facebook: Boolean(
      connection?.status === "connected" &&
        connection.facebookPageId,
    ),
    instagram: Boolean(
      connection?.status === "connected" &&
        connection.instagramAccountId,
    ),
    tiktok: Boolean(
      process.env.TIKTOK_APP_ID &&
        process.env.TIKTOK_APP_SECRET,
    ),
  };
}