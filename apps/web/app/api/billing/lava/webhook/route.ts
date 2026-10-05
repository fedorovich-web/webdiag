import { NextRequest, NextResponse } from "next/server";
import { resolveAccountApiBaseUrl } from "../../../../../src/features/account/account-proxy-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBuffer = Buffer.from(await request.arrayBuffer());
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };

  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers["x-api-key"] = apiKey;

  const signature = request.headers.get("signature") || request.headers.get("x-signature");
  if (signature) headers["signature"] = signature;

  try {
    const apiBaseUrl = resolveAccountApiBaseUrl();
    const upstream = await fetch(`${apiBaseUrl}/v1/billing/webhook`, {
      method: "POST",
      headers,
      body: rawBuffer,
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Internal webhook forwarding error" },
      { status: 500 },
    );
  }
}
