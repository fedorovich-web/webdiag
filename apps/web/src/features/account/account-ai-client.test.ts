import { describe, expect, it } from "vitest";
import { AccountClientError } from "./account-client";
import {
  createAIRun,
  createAuditActionPlan,
  deleteAIRun,
  getAICatalog,
  getAICredits,
  getAIRun,
  listAIRuns,
} from "./account-ai-client";

const projectId = "11111111-1111-4111-8111-111111111111";
const auditId = "22222222-2222-4222-8222-222222222222";
const runId = "33333333-3333-4333-8333-333333333333";
const pendingRun = {
  id: runId,
  tool_id: "ai_audit_action_plan",
  contract_version: "v1",
  credit_price: 7,
  state: "pending",
  output: null,
  error_code: null,
  created_at: "2026-09-10T12:00:00Z",
  updated_at: "2026-09-10T12:00:00Z",
};

describe("account AI client", () => {
  it("serializes only authoritative Audit Copilot references with caller-owned idempotency", async () => {
    let seenInput = "";
    let seenInit: RequestInit | undefined;
    const fetcher = async (input: string, init?: RequestInit) => {
      seenInput = input;
      seenInit = init;
      return Response.json(
        { contract_version: "webdiag.ai.run.v1", run: pendingRun },
        { status: 201 },
      );
    };

    const created = await createAuditActionPlan({
      locale: "ru",
      projectId,
      auditId,
    }, "550e8400-e29b-41d4-a716-446655440000", fetcher);

    const headers = new Headers(seenInit?.headers);
    expect(seenInput).toBe("/api/account/ai/runs");
    expect(seenInit?.method).toBe("POST");
    expect(headers.get("idempotency-key")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(seenInit?.body).toBe(JSON.stringify({
      tool_id: "ai_audit_action_plan",
      input: { locale: "ru", project_id: projectId, audit_id: auditId },
    }));
    expect(created.run.id).toBe(runId);
  });

  it("serializes a text-tool run without forwarding arbitrary browser headers", async () => {
    let seenInit: RequestInit | undefined;
    const fetcher = async (_input: string, init?: RequestInit) => {
      seenInit = init;
      return Response.json({ contract_version: "webdiag.ai.run.v1", run: pendingRun }, { status: 202 });
    };

    await createAIRun(
      "ai_content_brief",
      { locale: "en", audience: "Editors", objective: "Clarify the page", facts: ["Verified fact"] },
      "550e8400-e29b-41d4-a716-446655440000",
      fetcher,
    );

    expect(new Headers(seenInit?.headers).get("idempotency-key")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(seenInit?.body).toBe(JSON.stringify({
      tool_id: "ai_content_brief",
      input: { locale: "en", audience: "Editors", objective: "Clarify the page", facts: ["Verified fact"] },
    }));
  });

  it("loads strict catalog, credit, run list, and bound run detail responses", async () => {
    const responses: Readonly<Record<string, unknown>> = {
      "/api/account/ai/catalog": {
        contract_version: "webdiag.ai.catalog.v1",
        tools: [{ id: "ai_audit_action_plan", contract_version: "v1", credit_price: 7 }],
      },
      "/api/account/credits": {
        contract_version: "webdiag.credits.balance.v1",
        account: { available: 20, reserved: 7 },
      },
      "/api/account/ai/runs": {
        contract_version: "webdiag.ai.run_list.v1",
        runs: [pendingRun],
        next_cursor: null,
      },
      [`/api/account/ai/runs/${runId}`]: {
        contract_version: "webdiag.ai.run.v1",
        run: pendingRun,
      },
    };
    const fetcher = async (input: string) => Response.json(responses[input]);

    expect((await getAICatalog(fetcher)).tools[0]?.credit_price).toBe(7);
    expect((await getAICredits(fetcher)).account.available).toBe(20);
    expect((await listAIRuns(fetcher)).runs[0]?.id).toBe(runId);
    expect((await getAIRun(runId, fetcher)).run.id).toBe(runId);
  });

  it("rejects malformed success data and a run detail bound to another ID", async () => {
    const malformed = async () => Response.json({ tools: [] });
    await expect(getAICatalog(malformed)).rejects.toMatchObject({
      code: "account_invalid_response",
      status: 200,
    });

    const wrongRun = async () => Response.json({
      contract_version: "webdiag.ai.run.v1",
      run: { ...pendingRun, id: "44444444-4444-4444-8444-444444444444" },
    });
    await expect(getAIRun(runId, wrongRun)).rejects.toMatchObject({
      code: "account_invalid_response",
      status: 200,
    });
  });

  it("preserves stable API error codes without trusting unknown error shapes", async () => {
    const insufficient = async () => Response.json({
      detail: { code: "ai_insufficient_credits", message: "Private provider detail" },
    }, { status: 402 });
    await expect(createAuditActionPlan({
      locale: "en",
      projectId,
      auditId,
    }, "550e8400-e29b-41d4-a716-446655440000", insufficient)).rejects.toMatchObject({
      code: "ai_insufficient_credits",
      status: 402,
    });

    const unknown = async () => Response.json({ error: "private upstream body" }, { status: 502 });
    try {
      await getAICredits(unknown);
      throw new Error("Expected getAICredits to reject");
    } catch (caught) {
      expect(caught).toBeInstanceOf(AccountClientError);
      expect(caught).toMatchObject({ code: "account_ai_request_failed", status: 502 });
      expect(String(caught)).not.toContain("private upstream body");
    }
  });

  it("deletes a bound run only on an empty 204 response", async () => {
    let seenInput = "";
    let seenMethod = "";
    const success = async (input: string, init?: RequestInit) => {
      seenInput = input;
      seenMethod = init?.method ?? "";
      return new Response(null, { status: 204 });
    };
    await expect(deleteAIRun(runId, success)).resolves.toBeUndefined();
    expect(seenInput).toBe(`/api/account/ai/runs/${runId}`);
    expect(seenMethod).toBe("DELETE");

    const invalid = async () => Response.json({ deleted: true });
    await expect(deleteAIRun(runId, invalid)).rejects.toMatchObject({
      code: "account_invalid_response",
      status: 200,
    });
  });
});
