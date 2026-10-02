import type { NextRequest } from "next/server";
import {
  isToolErrorPayload,
  parsePageUrlInput,
  type ClientDeliveryToolResponse,
} from "./client-delivery-tool-contract";
import {
  getBackendApiBaseUrl,
  parseJsonResponse as parseJson,
  toJsonResponse,
} from "../../lib/backend-api";

const REQUEST_TIMEOUT_MS = 20_000;

type ResponseValidator = (payload: unknown) => payload is ClientDeliveryToolResponse;

interface ClientDeliveryProxyOptions {
  readonly upstreamPath:
    | "/v1/tools/csp"
    | "/v1/tools/third-party-scripts"
    | "/v1/tools/resource-hints";
  readonly validator: ResponseValidator;
  readonly invalidResponseMessage: string;
}

export function createClientDeliveryProxy(options: ClientDeliveryProxyOptions) {
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
      const data = await parseJson(upstreamResponse);
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
      return toJsonResponse(data, upstreamResponse.status);
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      return toJsonResponse(
        {
          detail: {
            code: aborted ? "tool_api_timeout" : "tool_api_unavailable",
            message: aborted ? "Tool API request timed out." : "Tool API is not available.",
          },
        },
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
