import { NextResponse } from "next/server";

export const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
export const DOKPLOY_API_CONTAINER_URL = "http://webdiag-webdiagcore-mlnqpr-api-1:8000";
export const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;

/**
 * Resolves the internal API base URL for server-side proxy routes.
 * Handles production Dokploy container DNS resolution to avoid network collisions.
 */
export function getBackendApiBaseUrl(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const raw =
    env.WEBDIAG_API_INTERNAL_URL ??
    env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  const cleaned = raw.replace(/\/+$/, "");
  if (cleaned === "http://api:8000" && env.NODE_ENV === "production") {
    return DOKPLOY_API_CONTAINER_URL;
  }
  return cleaned;
}

/**
 * Standardized JSON response helper disabling caching on proxy endpoints.
 */
export function toJsonResponse(
  payload: unknown,
  status: number,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

/**
 * Safely parses JSON response from upstream, returning:
 * - null for empty body
 * - parsed object for valid JSON
 * - undefined for invalid/corrupted JSON
 */
export async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}
