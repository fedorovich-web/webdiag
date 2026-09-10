import type { Locale } from "@webdiag/tool-registry";
import { AccountClientError } from "./account-client";
import { isAccountErrorPayload } from "./account-contract";
import {
  isAICatalogResponse,
  isAICreditBalanceResponse,
  isAIRunDetailResponse,
  isAIRunListResponse,
  type AICatalogResponse,
  type AICreditBalanceResponse,
  type AIRunDetailResponse,
  type AIRunListResponse,
} from "./account-ai-contract";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const common: Pick<RequestInit, "cache" | "credentials"> = {
  cache: "no-store",
  credentials: "same-origin",
};

async function parse<T>(
  response: Response,
  validator: (value: unknown) => value is T,
): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("AI workspace request failed.", {
      status: response.status,
      code: "account_ai_request_failed",
    });
  }
  if (!validator(payload)) throw invalidResponse(response.status);
  return payload;
}

function invalidResponse(status: number): AccountClientError {
  return new AccountClientError("AI workspace returned an invalid response.", {
    status,
    code: "account_invalid_response",
  });
}

export async function getAICatalog(fetcher: Fetcher = fetch): Promise<AICatalogResponse> {
  return parse(
    await fetcher("/api/account/ai/catalog", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAICatalogResponse,
  );
}

export async function getAICredits(fetcher: Fetcher = fetch): Promise<AICreditBalanceResponse> {
  return parse(
    await fetcher("/api/account/credits", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAICreditBalanceResponse,
  );
}

export async function listAIRuns(fetcher: Fetcher = fetch): Promise<AIRunListResponse> {
  return parse(
    await fetcher("/api/account/ai/runs", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAIRunListResponse,
  );
}

export async function getAIRun(
  runId: string,
  fetcher: Fetcher = fetch,
): Promise<AIRunDetailResponse> {
  const detail = await parse(
    await fetcher(`/api/account/ai/runs/${runId}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAIRunDetailResponse,
  );
  if (detail.run.id !== runId) throw invalidResponse(200);
  return detail;
}

export async function createAuditActionPlan(
  input: {
    readonly locale: Locale;
    readonly projectId: string;
    readonly auditId: string;
  },
  idempotencyKey: string,
  fetcher: Fetcher = fetch,
): Promise<AIRunDetailResponse> {
  return parse(
    await fetcher("/api/account/ai/runs", {
      ...common,
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        tool_id: "ai_audit_action_plan",
        input: {
          locale: input.locale,
          project_id: input.projectId,
          audit_id: input.auditId,
        },
      }),
    }),
    isAIRunDetailResponse,
  );
}

export async function deleteAIRun(runId: string, fetcher: Fetcher = fetch): Promise<void> {
  const response = await fetcher(`/api/account/ai/runs/${runId}`, {
    ...common,
    method: "DELETE",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("AI run deletion failed.", {
      status: response.status,
      code: "account_ai_request_failed",
    });
  }
  if (response.status !== 204) throw invalidResponse(response.status);
}
