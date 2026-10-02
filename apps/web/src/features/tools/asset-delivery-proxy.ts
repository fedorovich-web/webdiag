import type { NextRequest } from "next/server";
import { isToolErrorPayload, parsePageUrlInput } from "./client-delivery-tool-contract";
import type { AssetDeliveryToolResponse } from "./asset-delivery-tool-contract";
import {
  getBackendApiBaseUrl,
  parseJsonResponse,
  toJsonResponse,
} from "../../lib/backend-api";

const REQUEST_TIMEOUT_MS = 30_000;

type ResponseValidator = (payload: unknown) => payload is AssetDeliveryToolResponse;

interface AssetDeliveryProxyOptions {
  readonly upstreamPath:
    | "/v1/tools/javascript-bundle-surface"
    | "/v1/tools/css-delivery"
    | "/v1/tools/font-loading";
  readonly validator: ResponseValidator;
  readonly invalidResponseMessage: string;
}

export function createAssetDeliveryProxy(options: AssetDeliveryProxyOptions) {
  return async function POST(request: NextRequest) {
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return toJsonResponse(
        {
          detail: {
            code: "tool_bad_request",
            message: "Request body must be a JSON object.",
          },
        },
        400,
      );
    }

    const rawUrl = (payload as Record<string, unknown>).url;
    const url = typeof rawUrl === "string" ? parsePageUrlInput(rawUrl) : null;
    if (!url) {
      return toJsonResponse(
        {
          detail: {
            code: "tool_bad_request",
            message: "Enter a valid public http/https URL without credentials.",
          },
        },
        400,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const upstreamResponse = await fetch(`${getBackendApiBaseUrl()}${options.upstreamPath}`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ url }),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await parseJsonResponse(upstreamResponse);
      if (data === undefined) {
        return toJsonResponse(
          {
            detail: {
              code: "tool_api_invalid_response",
              message: "Tool API returned invalid JSON.",
            },
          },
          502,
        );
      }
      if (!upstreamResponse.ok) {
        return toJsonResponse(
          isToolErrorPayload(data)
            ? data
            : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
          upstreamResponse.status,
        );
      }
      if (!options.validator(data)) {
        return toJsonResponse(
          {
            detail: {
              code: "tool_api_invalid_response",
              message: options.invalidResponseMessage,
            },
          },
          502,
        );
      }
      return toJsonResponse(data, 200);
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      return toJsonResponse(
        {
          detail: {
            code: timedOut ? "tool_api_timeout" : "tool_api_unavailable",
            message: timedOut ? "Tool API request timed out." : "Tool API is unavailable.",
          },
        },
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
