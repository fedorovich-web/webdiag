import { NextRequest, NextResponse } from "next/server";
import {
  resolveAccountApiBaseUrl,
  selectAccountSessionCookie,
} from "../../../../../src/features/account/account-proxy-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = selectAccountSessionCookie(request.headers.get("cookie"));
  if (!sessionCookie) {
    return NextResponse.json(
      { detail: { code: "account_unauthenticated", message: "Требуется авторизация." } },
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

  try {
    const apiBaseUrl = resolveAccountApiBaseUrl();
    const upstream = await fetch(`${apiBaseUrl}/v1/billing/invoice`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json();
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { detail: { code: "billing_upstream_error", message: "Ошибка связи с платежным сервисом." } },
      { status: 502 },
    );
  }
}
