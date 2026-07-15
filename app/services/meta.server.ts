import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const META_GRAPH_VERSION =
  process.env.META_GRAPH_VERSION?.trim() || "v25.0";

export const META_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

type OAuthState = {
  shop: string;
  nonce: string;
  exp: number;
};

type MetaErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type InstagramAccount = {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
};

type PagingCursor = {
  after?: string;
  before?: string;
};

type Paging = {
  cursors?: PagingCursor;
  next?: string;
  previous?: string;
};

type MetaListResponse<T> = MetaErrorPayload & {
  data?: T[];
  paging?: Paging;
};

type MetaPublishResponse = MetaErrorPayload & {
  id?: string;
};

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramAccount;
};

export type MetaConnectionDetails = {
  page: MetaPage;
  instagramAccount: InstagramAccount | null;
};

export class MetaApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly type?: string;
  readonly traceId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: number;
      subcode?: number;
      type?: string;
      traceId?: string;
    },
  ) {
    super(message);
    this.name = "MetaApiError";
    this.status = options.status;
    this.code = options.code;
    this.subcode = options.subcode;
    this.type = options.type;
    this.traceId = options.traceId;
  }
}

function requireEnv(
  name:
    | "META_APP_ID"
    | "META_APP_SECRET"
    | "META_REDIRECT_URI",
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function appSecretProof(accessToken: string) {
  return createHmac("sha256", requireEnv("META_APP_SECRET"))
    .update(accessToken)
    .digest("hex");
}

function addAccessToken(url: URL, accessToken: string) {
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set(
    "appsecret_proof",
    appSecretProof(accessToken),
  );
}

function assertShopDomain(shop: string) {
  const normalized = shop.trim().toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    throw new Error("Invalid Shopify shop domain");
  }

  return normalized;
}

export function createMetaState(shop: string) {
  const secret = requireEnv("META_APP_SECRET");
  const payload: OAuthState = {
    shop: assertShopDomain(shop),
    nonce: randomBytes(18).toString("hex"),
    exp: Date.now() + 10 * 60 * 1000,
  };

  const encoded = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyMetaState(state: string): OAuthState {
  const secret = requireEnv("META_APP_SECRET");
  const [encoded, receivedSignature] = state.split(".");

  if (!encoded || !receivedSignature) {
    throw new Error("Invalid Meta state");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const received = Buffer.from(
    receivedSignature,
    "utf8",
  );
  const expected = Buffer.from(
    expectedSignature,
    "utf8",
  );

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new Error("Invalid Meta state signature");
  }

  let payload: OAuthState;

  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as OAuthState;
  } catch {
    throw new Error("Invalid Meta state payload");
  }

  if (
    !payload.shop ||
    !payload.nonce ||
    !payload.exp ||
    payload.exp < Date.now()
  ) {
    throw new Error("Meta state expired");
  }

  payload.shop = assertShopDomain(payload.shop);

  return payload;
}

export function buildMetaAuthorizationUrl(shop: string) {
  const appId = requireEnv("META_APP_ID");
  const redirectUri = requireEnv("META_REDIRECT_URI");
  const state = createMetaState(shop);

  const url = new URL(
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`,
  );

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES.join(","));

  return url.toString();
}

async function parseMetaResponse<T>(
  response: Response,
): Promise<T> {
  let body: T & MetaErrorPayload;

  try {
    body = (await response.json()) as T & MetaErrorPayload;
  } catch {
    throw new MetaApiError(
      `Meta returned an invalid response (${response.status})`,
      { status: response.status },
    );
  }

  if (!response.ok || body.error) {
    throw new MetaApiError(
      body.error?.message ||
        `Meta request failed (${response.status})`,
      {
        status: response.status,
        code: body.error?.code,
        subcode: body.error?.error_subcode,
        type: body.error?.type,
        traceId: body.error?.fbtrace_id,
      },
    );
  }

  return body;
}

async function metaGet<T>(
  url: URL,
  accessToken?: string,
): Promise<T> {
  if (accessToken) {
    addAccessToken(url, accessToken);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });

  return parseMetaResponse<T>(response);
}

async function metaPost<T>(
  url: URL,
  body: URLSearchParams,
  accessToken: string,
): Promise<T> {
  body.set("access_token", accessToken);
  body.set(
    "appsecret_proof",
    appSecretProof(accessToken),
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type":
        "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  return parseMetaResponse<T>(response);
}

export async function exchangeMetaCode(code: string) {
  const cleanCode = code.trim();

  if (!cleanCode) {
    throw new Error("Meta authorization code is missing");
  }

  const appId = requireEnv("META_APP_ID");
  const appSecret = requireEnv("META_APP_SECRET");
  const redirectUri = requireEnv("META_REDIRECT_URI");

  const shortUrl = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
  );

  shortUrl.searchParams.set("client_id", appId);
  shortUrl.searchParams.set("client_secret", appSecret);
  shortUrl.searchParams.set("redirect_uri", redirectUri);
  shortUrl.searchParams.set("code", cleanCode);

  const shortToken =
    await metaGet<MetaTokenResponse>(shortUrl);

  const longUrl = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
  );

  longUrl.searchParams.set(
    "grant_type",
    "fb_exchange_token",
  );
  longUrl.searchParams.set("client_id", appId);
  longUrl.searchParams.set("client_secret", appSecret);
  longUrl.searchParams.set(
    "fb_exchange_token",
    shortToken.access_token,
  );

  try {
    return await metaGet<MetaTokenResponse>(longUrl);
  } catch (error) {
    console.warn(
      "Could not exchange Meta token for a long-lived token:",
      error,
    );

    return shortToken;
  }
}

export async function getMetaPages(
  userAccessToken: string,
): Promise<MetaPage[]> {
  const pages: MetaPage[] = [];
  let url: URL | null = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`,
  );

  url.searchParams.set(
    "fields",
    [
      "id",
      "name",
      "access_token",
      "instagram_business_account{id,username,name,profile_picture_url}",
    ].join(","),
  );
  url.searchParams.set("limit", "100");

  while (url) {
    const result: MetaListResponse<MetaPage> =
      await metaGet<MetaListResponse<MetaPage>>(
        url,
        userAccessToken,
      );

    pages.push(...(result.data ?? []));

    url = result.paging?.next
      ? new URL(result.paging.next)
      : null;
  }

  return pages;
}

export async function getPrimaryMetaConnection(
  userAccessToken: string,
): Promise<MetaConnectionDetails | null> {
  const pages = await getMetaPages(userAccessToken);

  if (pages.length === 0) {
    return null;
  }

  const pageWithInstagram = pages.find(
    (page) => page.instagram_business_account?.id,
  );
  const page = pageWithInstagram ?? pages[0];

  return {
    page,
    instagramAccount:
      page.instagram_business_account ?? null,
  };
}

export async function publishFacebookPagePost(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  link?: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
      input.pageId,
    )}/feed`,
  );

  const body = new URLSearchParams();
  body.set("message", input.message.trim());

  if (input.link?.trim()) {
    body.set("link", input.link.trim());
  }

  const result = await metaPost<MetaPublishResponse>(
    url,
    body,
    input.pageAccessToken,
  );

  if (!result.id) {
    throw new Error(
      "Meta did not return the created Facebook post ID",
    );
  }

  return result.id;
}

export async function createInstagramMediaContainer(input: {
  instagramAccountId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
      input.instagramAccountId,
    )}/media`,
  );

  const body = new URLSearchParams();
  body.set("image_url", input.imageUrl.trim());
  body.set("caption", input.caption.trim());

  const result = await metaPost<MetaPublishResponse>(
    url,
    body,
    input.pageAccessToken,
  );

  if (!result.id) {
    throw new Error(
      "Meta did not return the Instagram media container ID",
    );
  }

  return result.id;
}

export async function publishInstagramMedia(input: {
  instagramAccountId: string;
  pageAccessToken: string;
  creationId: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
      input.instagramAccountId,
    )}/media_publish`,
  );

  const body = new URLSearchParams();
  body.set("creation_id", input.creationId);

  const result = await metaPost<MetaPublishResponse>(
    url,
    body,
    input.pageAccessToken,
  );

  if (!result.id) {
    throw new Error(
      "Meta did not return the published Instagram media ID",
    );
  }

  return result.id;
}

function encryptionKey() {
  const source =
    process.env.META_TOKEN_ENCRYPTION_KEY?.trim() ||
    requireEnv("META_APP_SECRET");

  return createHash("sha256").update(source).digest();
}

export function encryptMetaToken(value: string) {
  if (!value) {
    throw new Error("Cannot encrypt an empty Meta token");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptMetaToken(value: string) {
  const [ivValue, tagValue, encryptedValue] =
    value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted Meta token");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(
    Buffer.from(tagValue, "base64url"),
  );

  return Buffer.concat([
    decipher.update(
      Buffer.from(encryptedValue, "base64url"),
    ),
    decipher.final(),
  ]).toString("utf8");
}