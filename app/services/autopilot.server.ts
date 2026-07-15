import db from "../db.server";
import { generateCampaign } from "./marketing.server";

const DAY_MS = 24 * 60 * 60 * 1000;

type ShopifyAdmin = {
  graphql: (query: string) => Promise<Response>;
};

type ShopifyProduct = {
  id: string;
  title: string;
  description: string | null;
  totalInventory: number | null;
  featuredMedia?: {
    preview?: {
      image?: {
        url?: string;
      } | null;
    } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      price?: string;
    }>;
  };
};

type ProductScore = {
  product: ShopifyProduct;
  score: number;
};

export type AutopilotRunResult = {
  created: number;
  scheduled: number;
  skipped: number;
  nextRunAt: string | null;
  campaignIds: string[];
};

async function getProducts(admin: ShopifyAdmin) {
  const response = await admin.graphql(`
    #graphql
    query SellForgeAutopilotProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          description
          totalInventory
          featuredMedia {
            preview {
              image {
                url
              }
            }
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

  const json = (await response.json()) as {
    data?: {
      products?: {
        nodes?: ShopifyProduct[];
      };
    };
    errors?: Array<{
      message?: string;
    }>;
  };

  if (json.errors?.length) {
    throw new Error(
      json.errors[0]?.message ||
        "Não foi possível carregar os produtos para o Autopilot.",
    );
  }

  return json.data?.products?.nodes ?? [];
}

function scoreProduct(product: ShopifyProduct) {
  let score = 0;

  if (product.featuredMedia?.preview?.image?.url) {
    score += 30;
  }

  if (product.description?.trim()) {
    score += Math.min(product.description.trim().length / 20, 25);
  }

  if ((product.totalInventory ?? 0) > 0) {
    score += 25;
  }

  if (product.variants?.nodes?.[0]?.price) {
    score += 20;
  }

  return score;
}

function chooseProducts(
  products: ShopifyProduct[],
  limit: number,
): ShopifyProduct[] {
  return products
    .map(
      (product): ProductScore => ({
        product,
        score: scoreProduct(product),
      }),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);
}

function getPlatformList(platforms: string) {
  const allowed = new Set([
    "facebook",
    "instagram",
    "tiktok",
  ]);

  return platforms
    .split(",")
    .map((platform) => platform.trim())
    .filter((platform) => allowed.has(platform));
}

function scheduleDates(
  count: number,
  startAt: Date,
  daysAhead = 7,
) {
  if (count <= 0) {
    return [];
  }

  const interval =
    (Math.max(daysAhead, 1) * DAY_MS) / count;

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      startAt.getTime() + interval * (index + 1),
    );

    date.setMinutes(0, 0, 0);

    if (date.getHours() < 18) {
      date.setHours(19);
    }

    return date;
  });
}

export async function runAutopilot(input: {
  shop: string;
  admin: ShopifyAdmin;
  now?: Date;
}): Promise<AutopilotRunResult> {
  const now = input.now ?? new Date();

  const config = await db.autopilotConfig.findUnique({
    where: {
      shop: input.shop,
    },
  });

  if (!config || !config.enabled) {
    return {
      created: 0,
      scheduled: 0,
      skipped: 1,
      nextRunAt: config?.nextRunAt?.toISOString() ?? null,
      campaignIds: [],
    };
  }

  if (config.nextRunAt && config.nextRunAt > now) {
    return {
      created: 0,
      scheduled: 0,
      skipped: 1,
      nextRunAt: config.nextRunAt.toISOString(),
      campaignIds: [],
    };
  }

  const products = await getProducts(input.admin);
  const numberOfPosts = Math.max(
    1,
    config.postsPerWeek +
      config.reelsPerWeek +
      config.storiesPerWeek,
  );
  const selectedProducts = chooseProducts(
    products,
    Math.min(numberOfPosts, 7),
  );
  const platforms = getPlatformList(config.platforms);

  if (
    selectedProducts.length === 0 ||
    platforms.length === 0
  ) {
    const nextRunAt = new Date(now.getTime() + DAY_MS);

    await db.autopilotConfig.update({
      where: {
        shop: input.shop,
      },
      data: {
        lastRunAt: now,
        nextRunAt,
      },
    });

    return {
      created: 0,
      scheduled: 0,
      skipped: 1,
      nextRunAt: nextRunAt.toISOString(),
      campaignIds: [],
    };
  }

  const schedule = scheduleDates(
    selectedProducts.length,
    now,
  );
  const campaignIds: string[] = [];
  let scheduled = 0;

  for (let index = 0; index < selectedProducts.length; index += 1) {
    const product = selectedProducts[index];
    const generated = await generateCampaign({
      productTitle: product.title,
      productDescription:
        product.description ?? undefined,
      price: product.variants?.nodes?.[0]?.price
        ? `€${product.variants.nodes[0].price}`
        : undefined,
      tone: "friendly",
      language: "pt-PT",
      goal: config.goal,
      format: index % 3 === 0 ? "reel" : "feed",
    });

    const campaign = await db.campaign.create({
      data: {
        shop: input.shop,
        productId: product.id,
        productTitle: product.title,
        productImage:
          product.featuredMedia?.preview?.image?.url ?? null,
        title: generated.title,
        caption: generated.caption,
        hashtags: generated.hashtags,
        callToAction: generated.callToAction,
        format: index % 3 === 0 ? "reel" : "feed",
        source: generated.source,
        status: "scheduled",
      },
    });

    campaignIds.push(campaign.id);

    const platform =
      platforms[index % platforms.length] ?? "instagram";

    await db.scheduledPost.create({
      data: {
        shop: input.shop,
        campaignId: campaign.id,
        platform,
        scheduledAt:
          schedule[index] ?? new Date(now.getTime() + DAY_MS),
      },
    });

    scheduled += 1;
  }

  const nextRunAt = new Date(now.getTime() + 7 * DAY_MS);

  await db.autopilotConfig.update({
    where: {
      shop: input.shop,
    },
    data: {
      lastRunAt: now,
      nextRunAt,
    },
  });

  return {
    created: campaignIds.length,
    scheduled,
    skipped: 0,
    nextRunAt: nextRunAt.toISOString(),
    campaignIds,
  };
}
