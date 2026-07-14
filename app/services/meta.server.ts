import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const META_GRAPH_VERSION = "v25.0";

const META_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

type OAuthState = {
  shop: string;
  nonce: string;
  exp: number;
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

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramAccount;
};

function requireEnv(name: "META_APP_ID" | "META_APP_SECRET" | "META_REDIRECT_URI") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function createMetaState(shop: string) {
  const secret = requireEnv("META_APP_SECRET");
  const payload: OAuthState = {
    shop,
    nonce: randomBytes(18).toString("hex"),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyMetaState(state: string): OAuthState {
  const secret = requireEnv("META_APP_SECRET");
  const [encoded, receivedSignature] = state.split(".");
  if (!encoded || !receivedSignature) throw new Error("Invalid Meta state");

  const expectedSignature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid Meta state signature");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState;
  if (!payload.shop || !payload.exp || payload.exp < Date.now()) {
    throw new Error("Meta state expired");
  }
  return payload;
}

export function buildMetaAuthorizationUrl(shop: string) {
  const appId = requireEnv("META_APP_ID");
  const redirectUri = requireEnv("META_REDIRECT_URI");
  const state = createMetaState(shop);
  const url = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES);
  return url.toString();
}

async function metaJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const body = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || `Meta request failed (${response.status})`);
  }
  return body;
}

export async function exchangeMetaCode(code: string) {
  const appId = requireEnv("META_APP_ID");
  const appSecret = requireEnv("META_APP_SECRET");
  const redirectUri = requireEnv("META_REDIRECT_URI");

  const shortUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  shortUrl.searchParams.set("client_id", appId);
  shortUrl.searchParams.set("client_secret", appSecret);
  shortUrl.searchParams.set("redirect_uri", redirectUri);
  shortUrl.searchParams.set("code", code);
  const shortToken = await metaJson<MetaTokenResponse>(shortUrl);

  const longUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", appId);
  longUrl.searchParams.set("client_secret", appSecret);
  longUrl.searchParams.set("fb_exchange_token", shortToken.access_token);

  try {
    return await metaJson<MetaTokenResponse>(longUrl);
  } catch {
    return shortToken;
  }
}

export async function getMetaPages(userAccessToken: string): Promise<MetaPage[]> {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`);
  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}",
  );
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", userAccessToken);
  const result = await metaJson<{ data?: MetaPage[] }>(url);
  return result.data || [];
}

function encryptionKey() {
  const source = process.env.META_TOKEN_ENCRYPTION_KEY || requireEnv("META_APP_SECRET");
  return createHash("sha256").update(source).digest();
}

export function encryptMetaToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptMetaToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid encrypted token");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
