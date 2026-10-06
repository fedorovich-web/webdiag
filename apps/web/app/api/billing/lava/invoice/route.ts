import { NextRequest, NextResponse } from "next/server";
import { resolveRequestSessionCookie } from "../../../../../src/features/account/account-proxy-contract";
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = resolveRequestSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.json(
      { detail: { code: "account_unauthenticated", message: "Требуется авторизация для выставления счета." } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: { code: "invalid_json", message: "Некорректный JSON в теле запроса." } },
      { status: 400 },
    );
  }

  const urls = getBillingApiBaseUrls();
  let upstream: Response | null = null;
  let text = "";

  for (const url of urls) {
    try {
      const res = await fetch(`${url}/v1/billing/invoice`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          cookie: sessionCookie,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const bodyText = await res.text();
      if (res.status === 400 && bodyText.includes("Invalid host header") && urls.length > 1 && url !== urls[urls.length - 1]) {
        continue;
      }

      upstream = res;
      text = bodyText;
      break;
    } catch (err) {
      if (url === urls[urls.length - 1]) {
        return NextResponse.json(
          { detail: { code: "billing_upstream_error", message: "Ошибка связи с платежным сервисом." } },
          { status: 502 },
        );
      }
    }
  }

  if (!upstream) {
    return NextResponse.json(
      { detail: { code: "billing_upstream_error", message: "Платежный сервис недоступен." } },
      { status: 502 },
    );
  }

  try {
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: { code: "billing_invalid_response", message: "Некорректный ответ от платежного сервиса." } },
      { status: 502 },
    );
  }
}
