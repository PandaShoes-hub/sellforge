import db from "../db.server";
import {
  publishSocial,
  type PublishSocialResult,
  type SocialPlatform,
} from "./social.server";

const DEFAULT_BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;

export type ScheduledPostRunResult = {
  checked: number;
  published: number;
  failed: number;
  skipped: number;
  items: Array<{
    id: string;
    status: "published" | "failed" | "skipped";
    externalId?: string;
    error?: string;
  }>;
};

function isSupportedPlatform(
  value: string,
): value is SocialPlatform {
  return (
    value === "facebook" ||
    value === "instagram" ||
    value === "tiktok"
  );
}

function buildMessage(campaign: {
  caption: string;
  hashtags: string;
  callToAction: string;
}) {
  return [
    campaign.caption.trim(),
    campaign.hashtags.trim(),
    campaign.callToAction.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return "Erro desconhecido ao publicar.";
}

async function releaseExpiredLocks(now: Date) {
  const expiredBefore = new Date(
    now.getTime() - PROCESSING_TIMEOUT_MS,
  );

  await db.scheduledPost.updateMany({
    where: {
      status: "processing",
      processingAt: {
        lt: expiredBefore,
      },
    },
    data: {
      status: "scheduled",
      processingAt: null,
      lastError:
        "A publicação anterior ficou bloqueada e foi libertada automaticamente.",
    },
  });
}

async function claimScheduledPost(id: string, now: Date) {
  const claimed = await db.scheduledPost.updateMany({
    where: {
      id,
      status: "scheduled",
      scheduledAt: {
        lte: now,
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    data: {
      status: "processing",
      processingAt: now,
      attempts: {
        increment: 1,
      },
      lastError: null,
    },
  });

  return claimed.count === 1;
}

async function markPublished(
  id: string,
  result: PublishSocialResult,
  now: Date,
) {
  await db.scheduledPost.update({
    where: { id },
    data: {
      status: "published",
      externalId: result.externalId,
      publishedAt: now,
      processingAt: null,
      lastError: null,
    },
  });
}

async function markFailed(
  id: string,
  attempts: number,
  error: unknown,
) {
  const finalFailure = attempts >= MAX_ATTEMPTS;

  await db.scheduledPost.update({
    where: { id },
    data: {
      status: finalFailure ? "failed" : "scheduled",
      processingAt: null,
      lastError: errorMessage(error),
    },
  });

  return finalFailure;
}

export async function publishScheduledPosts(
  options: {
    limit?: number;
    now?: Date;
    shop?: string;
  } = {},
): Promise<ScheduledPostRunResult> {
  const now = options.now ?? new Date();
  const limit = Math.max(
    1,
    Math.min(options.limit ?? DEFAULT_BATCH_SIZE, 50),
  );

  await releaseExpiredLocks(now);

  const posts = await db.scheduledPost.findMany({
    where: {
      shop: options.shop,
      status: "scheduled",
      scheduledAt: {
        lte: now,
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    include: {
      campaign: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: limit,
  });

  const run: ScheduledPostRunResult = {
    checked: posts.length,
    published: 0,
    failed: 0,
    skipped: 0,
    items: [],
  };

  for (const post of posts) {
    const claimed = await claimScheduledPost(post.id, now);

    if (!claimed) {
      run.skipped += 1;
      run.items.push({
        id: post.id,
        status: "skipped",
      });
      continue;
    }

    if (!isSupportedPlatform(post.platform)) {
      const finalFailure = await markFailed(
        post.id,
        post.attempts + 1,
        new Error(
          `Plataforma não suportada: ${post.platform}`,
        ),
      );

      run.failed += 1;
      run.items.push({
        id: post.id,
        status: "failed",
        error: finalFailure
          ? "A plataforma não é suportada."
          : "A publicação será tentada novamente.",
      });
      continue;
    }

    try {
      const result = await publishSocial({
        shop: post.shop,
        platform: post.platform,
        message: buildMessage(post.campaign),
        imageUrl:
          post.campaign.productImage ?? undefined,
      });

      await markPublished(post.id, result, now);

      run.published += 1;
      run.items.push({
        id: post.id,
        status: "published",
        externalId: result.externalId,
      });
    } catch (error) {
      const finalFailure = await markFailed(
        post.id,
        post.attempts + 1,
        error,
      );

      run.failed += 1;
      run.items.push({
        id: post.id,
        status: "failed",
        error: finalFailure
          ? errorMessage(error)
          : `${errorMessage(error)} Será tentado novamente.`,
      });
    }
  }

  return run;
}

export async function retryScheduledPost(id: string, shop: string) {
  const post = await db.scheduledPost.findFirst({
    where: {
      id,
      shop,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!post) {
    throw new Error("Publicação agendada não encontrada.");
  }

  await db.scheduledPost.update({
    where: {
      id: post.id,
    },
    data: {
      status: "scheduled",
      attempts: 0,
      processingAt: null,
      publishedAt: null,
      externalId: null,
      lastError: null,
      scheduledAt: new Date(),
    },
  });
}
