import {
  createHash,
  timingSafeEqual,
} from "node:crypto";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";

import db from "../db.server";
import { unauthenticated } from "../shopify.server";
import { runAutopilot } from "../services/autopilot.server";

function fingerprint(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, 10);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    throw new Response("CRON_SECRET is not configured", {
      status: 503,
    });
  }

  const authorization =
    request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${secret}`;

  console.log("Autopilot cron authorization", {
    headerPresent: Boolean(authorization),
    receivedLength: authorization.length,
    expectedLength: expected.length,
    receivedFingerprint: authorization
      ? fingerprint(authorization)
      : null,
    expectedFingerprint: fingerprint(expected),
  });

  if (!safeEqual(authorization, expected)) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return "Erro desconhecido ao executar o Autopilot.";
}

async function runAutopilotCron(request: Request) {
  authorizeCron(request);

  const now = new Date();

  const configs = await db.autopilotConfig.findMany({
    where: {
      enabled: true,
      OR: [
        {
          nextRunAt: null,
        },
        {
          nextRunAt: {
            lte: now,
          },
        },
      ],
    },
    orderBy: {
      nextRunAt: "asc",
    },
    take: 50,
  });

  const items: Array<{
    shop: string;
    status: "completed" | "failed";
    created?: number;
    scheduled?: number;
    skipped?: number;
    nextRunAt?: string | null;
    error?: string;
  }> = [];

  let completed = 0;
  let failed = 0;
  let campaignsCreated = 0;
  let postsScheduled = 0;

  for (const config of configs) {
    try {
      const { admin } = await unauthenticated.admin(
        config.shop,
      );

      const result = await runAutopilot({
        shop: config.shop,
        admin,
        now,
      });

      completed += 1;
      campaignsCreated += result.created;
      postsScheduled += result.scheduled;

      items.push({
        shop: config.shop,
        status: "completed",
        created: result.created,
        scheduled: result.scheduled,
        skipped: result.skipped,
        nextRunAt: result.nextRunAt,
      });
    } catch (error) {
      failed += 1;

      items.push({
        shop: config.shop,
        status: "failed",
        error: errorMessage(error),
      });

      console.error(
        `SellForge Autopilot failed for ${config.shop}`,
        error,
      );
    }
  }

  return Response.json({
    ok: true,
    checked: configs.length,
    completed,
    failed,
    campaignsCreated,
    postsScheduled,
    items,
    ranAt: now.toISOString(),
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return runAutopilotCron(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return runAutopilotCron(request);
};
