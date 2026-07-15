import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { publishScheduledPosts } from "../services/scheduler.server";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    throw new Response("CRON_SECRET is not configured", {
      status: 503,
    });
  }

  const authorization = request.headers.get("Authorization");

  if (authorization !== `Bearer ${secret}`) {
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
