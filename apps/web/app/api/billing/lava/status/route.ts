import { NextResponse } from "next/server";
import {
  DOKPLOY_API_CONTAINER_URL,
  getBackendApiBaseUrl,
} from "../../../../../src/lib/backend-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBillingApiBaseUrls(): string[] {
  const primary = getBackendApiBaseUrl();
  const urls = [primary];
  if (primary !== DOKPLOY_API_CONTAINER_URL && primary.includes("api:8000")) {
    urls.push(DOKPLOY_API_CONTAINER_URL);
  }
  return urls;
}

export async function GET(): Promise<NextResponse> {
  const urls = getBillingApiBaseUrls();
  let upstream: Response | null = null;
  let text = "";

  for (const url of urls) {
    try {
      const res = await fetch(`${url}/v1/billing/status`, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      });

      const bodyText = await res.text();
      if (res.status === 400 && bodyText.includes("Invalid host header") && urls.length > 1 && url !== urls[urls.length - 1]) {
        continue;
      }

      upstream = res;
      text = bodyText;
      break;
    } catch {
      if (url === urls[urls.length - 1]) {
        return NextResponse.json(
          { provider: "lava", is_live: false, currency: "RUB" },
          { status: 200, headers: { "cache-control": "no-store" } },
        );
      }
    }
  }

  if (!upstream || !upstream.ok) {
    return NextResponse.json(
      { provider: "lava", is_live: false, currency: "RUB" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const data = text ? JSON.parse(text) : { provider: "lava", is_live: false, currency: "RUB" };
    return NextResponse.json(data, {
      status: 200,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { provider: "lava", is_live: false, currency: "RUB" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
}
