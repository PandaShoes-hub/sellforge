import {
  createHash,
  timingSafeEqual,
} from "node:crypto";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";

import { publishScheduledPosts } from "../services/scheduler.server";

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
    console.error("Cron authorization failed: CRON_SECRET is missing.");

    throw new Response("CRON_SECRET is not configured", {
      status: 503,
    });
  }

  const authorization =
    request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${secret}`;

  console.log("Cron authorization check", {
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

async function runPublisher(request: Request) {
  authorizeCron(request);

  const result = await publishScheduledPosts();

  return Response.json({
    ok: true,
    checked: result.checked,
    published: result.published,
    failed: result.failed,
    skipped: result.skipped,
    items: result.items,
    ranAt: new Date().toISOString(),
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return runPublisher(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return runPublisher(request);
};