import { describe, expect, it } from "vitest";
import {
  createAccountProject,
  getAccountProject,
  getAccountSavedAudit,
  listAccountProjects,
  runAccountProjectAudit,
} from "./account-workspace-client";
import {
  isAccountProjectDetailResponse,
  isAccountProjectListResponse,
  isSavedAuditDetailResponse,
} from "./account-workspace-contract";

const project = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Main",
  origin: "https://example.com",
  created_at: "2026-07-31T10:00:00Z",
  updated_at: "2026-07-31T10:00:00Z",
};
const audit = {
  id: "22222222-2222-4222-8222-222222222222",
  project_id: project.id,
  status: "succeeded" as const,
  score: 90,
  check_count: 1,
  issue_count: 0,
  completed_at: "2026-07-31T10:01:00Z",
  created_at: "2026-07-31T10:01:00Z",
};
const payload = {
  contract_version: "webdiag.account.saved_audit_payload.v1" as const,
  target_origin: "https://example.com",
  status: "succeeded" as const,
  score: 90,
  checks: [{ check_id: "http.status", name: "HTTP status", category: "http", status: "passed" }],
  issues: [],
  completed_at: "2026-07-31T10:01:00Z",
};

describe("account workspace contracts", () => {
  it("accepts exact versioned responses and rejects internal fields", () => {
    expect(isAccountProjectListResponse({ contract_version: "webdiag.account.project_list.v1", projects: [project] })).toBe(true);
    expect(isAccountProjectDetailResponse({ contract_version: "webdiag.account.project_detail.v1", project, saved_audits: [audit] })).toBe(true);
    expect(isSavedAuditDetailResponse({ contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload })).toBe(true);
    expect(isSavedAuditDetailResponse({ contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload: { ...payload, job_id: "internal" } })).toBe(false);
  });

  it("uses same-origin endpoints and sends no browser-controlled audit payload", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetcher = async (input: string, init?: RequestInit) => {
      calls.push([input, init]);
      const response = input.endsWith("/audits")
        ? { contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload }
        : input.includes(`/audits/${audit.id}`)
          ? { contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload }
          : init?.method === "POST"
            ? project
            : input.endsWith(project.id)
              ? { contract_version: "webdiag.account.project_detail.v1", project, saved_audits: [audit] }
              : { contract_version: "webdiag.account.project_list.v1", projects: [project] };
      return new Response(JSON.stringify(response), { status: init?.method === "POST" ? 201 : 200 });
    };

    await listAccountProjects(fetcher);
    await createAccountProject({ name: "Main", origin: "example.com" }, fetcher);
    await getAccountProject(project.id, fetcher);
    await runAccountProjectAudit(project.id, fetcher);
    await getAccountSavedAudit(project.id, audit.id, fetcher);

    expect(calls.every(([, init]) => init?.credentials === "same-origin")).toBe(true);
    const runCall = calls.find(([path]) => path.endsWith("/audits"));
    expect(runCall?.[1]?.body).toBeUndefined();
  });
});
