import { NextRequest, NextResponse } from "next/server";
import {
  isToolErrorPayload,
  parseDomainInput,
  parsePublicIpInput,
  type ComparisonRecordType,
  type NetworkIntelligenceResponse,
} from "./network-intelligence-tool-contract";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 20_000;

interface DomainProxyOptions {
  readonly kind: "domain";
  readonly upstreamPath: "/v1/tools/domain-rdap";
  readonly validator: (payload: unknown) => payload is NetworkIntelligenceResponse;
  readonly invalidResponseMessage: string;
}

interface IpProxyOptions {
  readonly kind: "ip";
  readonly upstreamPath: "/v1/tools/ip-rdap";
  readonly validator: (payload: unknown) => payload is NetworkIntelligenceResponse;
  readonly invalidResponseMessage: string;
}

interface DnsComparisonProxyOptions {
  readonly kind: "dns-comparison";
  readonly upstreamPath: "/v1/tools/dns-resolver-comparison";
  readonly validator: (payload: unknown) => payload is NetworkIntelligenceResponse;
  readonly invalidResponseMessage: string;
}

type ProxyOptions = DomainProxyOptions | IpProxyOptions | DnsComparisonProxyOptions;

const comparisonRecordTypes = new Set<ComparisonRecordType>([
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
]);

function getApiBaseUrl(): string {
  const raw =
    process.env.WEBDIAG_API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/u, "");
}

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function sanitizePayload(options: ProxyOptions, payload: unknown): Record<string, string> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  if (options.kind === "ip") {
    const ip = typeof record.ip === "string" ? parsePublicIpInput(record.ip) : null;
    return ip ? { ip } : null;
  }
  const domain = typeof record.domain === "string" ? parseDomainInput(record.domain) : null;
  if (!domain) return null;
  if (options.kind === "domain") return { domain };
  const rawRecordType = record.record_type;
  if (typeof rawRecordType !== "string" || !comparisonRecordTypes.has(rawRecordType as ComparisonRecordType)) {
    return null;
  }
  return { domain, record_type: rawRecordType };
}

export function createNetworkIntelligenceProxy(options: ProxyOptions) {
  return async function POST(request: NextRequest) {
    const payload: unknown = await request.json().catch(() => null);
    const sanitized = sanitizePayload(options, payload);
    if (!sanitized) {
      return json(
        {
          detail: {
            code: "tool_bad_request",
            message: "Request contains invalid or unsupported network lookup input.",
          },
        },
        400,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${getApiBaseUrl()}${options.upstreamPath}`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(sanitized),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await parseJson(response);
      if (data === undefined) {
        return json(
          {
            detail: {
              code: "tool_api_invalid_response",
              message: "Tool API returned invalid JSON.",
            },
          },
          502,
        );
      }
      if (!response.ok) {
        return json(
          isToolErrorPayload(data)
            ? data
            : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
          response.status,
        );
      }
      if (!options.validator(data)) {
        return json(
          {
            detail: {
              code: "tool_api_invalid_response",
              message: options.invalidResponseMessage,
            },
          },
          502,
        );
      }
      return json(data, 200);
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      return json(
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
