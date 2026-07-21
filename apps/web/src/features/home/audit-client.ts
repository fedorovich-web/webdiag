import { isAuditFrontendResult, type AuditFrontendResult } from "./audit-contract";

export type AuditSnapshotResponse = AuditFrontendResult;

export class AuditClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code?: string }) {
    super(message);
    this.name = "AuditClientError";
    this.status = options.status;
    this.code = options.code ?? "audit_client_error";
  }
}

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export function normalizeAuditUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseAuditUrlInput(value: string): URL | null {
  const normalized = normalizeAuditUrlInput(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown): { code?: string; message?: string } {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;
  const detail = record.detail;
  if (detail && typeof detail === "object") {
    const detailRecord = detail as Record<string, unknown>;
    return {
      code: typeof detailRecord.code === "string" ? detailRecord.code : undefined,
      message: typeof detailRecord.message === "string" ? detailRecord.message : undefined,
    };
  }
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export async function startAuditSnapshot(
  url: string,
  options: { endpoint?: string; fetcher?: Fetcher } = {},
): Promise<AuditFrontendResult> {
  const endpoint = options.endpoint ?? "/api/audits";
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const extracted = extractErrorMessage(payload);
    throw new AuditClientError(extracted.message ?? "Audit request failed.", {
      status: response.status,
      code: extracted.code,
    });
  }

  if (!isAuditFrontendResult(payload)) {
    throw new AuditClientError("Audit API returned an invalid response.", { status: response.status, code: "invalid_response" });
  }

  return payload;
}
