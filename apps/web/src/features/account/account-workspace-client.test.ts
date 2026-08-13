import { describe, expect, it } from "vitest";
import {
  archiveAccountProject,
  createAccountProject,
  getAccountProject,
  getAccountSavedAudit,
  listArchivedAccountProjects,
  listAccountProjects,
  renameAccountProject,
  restoreAccountProject,
  runAccountProjectAudit,
} from "./account-workspace-client";
import {
  isArchivedAccountProject,
  isArchivedAccountProjectListResponse,
  isAccountProject,
  isAccountProjectDetailResponse,
  isAccountProjectListResponse,
  isSavedAuditDetailResponse,
} from "./account-workspace-contract";
import { accountWorkspaceLifecyclePath } from "./account-workspace-proxy";

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
const archivedProject = {
  contract_version: "webdiag.account.archived_project.v1" as const,
  ...project,
  archived_at: "2026-08-13T10:00:00Z",
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
  it("allows only explicit lifecycle upstream paths", () => {
    expect(accountWorkspaceLifecyclePath(project.id, "archive")).toBe(`/v1/account/projects/${project.id}/archive`);
    expect(accountWorkspaceLifecyclePath(project.id, "restore")).toBe(`/v1/account/projects/${project.id}/restore`);
    expect(accountWorkspaceLifecyclePath("not-a-uuid", "archive")).toBeNull();
  });
  it("accepts exact versioned responses and rejects internal fields", () => {
    expect(isAccountProjectListResponse({ contract_version: "webdiag.account.project_list.v1", projects: [project] })).toBe(true);
    expect(isAccountProjectDetailResponse({ contract_version: "webdiag.account.project_detail.v1", project, saved_audits: [audit] })).toBe(true);
    expect(isSavedAuditDetailResponse({ contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload })).toBe(true);
    expect(isSavedAuditDetailResponse({ contract_version: "webdiag.account.saved_audit_detail.v1", project, audit, payload: { ...payload, job_id: "internal" } })).toBe(false);
  });

  it("accepts exact archived project contracts and rejects malformed snapshots", () => {
    expect(isAccountProject({ ...project, updated_at: "not-a-date" })).toBe(false);
    expect(isArchivedAccountProject(archivedProject)).toBe(true);
    expect(isArchivedAccountProjectListResponse({
      contract_version: "webdiag.account.archived_project_list.v1",
      projects: [archivedProject],
    })).toBe(true);
    expect(isArchivedAccountProject({ ...archivedProject, archived_at: "not-a-date" })).toBe(false);
    expect(isArchivedAccountProject({ ...archivedProject, user_id: "internal" })).toBe(false);
  });

  it("rejects malformed lifecycle project timestamps", async () => {
    const invalidProject = { ...project, created_at: "not-a-date" };
    await expect(renameAccountProject(project.id, "Renamed", async () => new Response(
      JSON.stringify(invalidProject),
      { status: 200 },
    ))).rejects.toMatchObject({ code: "account_invalid_response" });
    await expect(restoreAccountProject(project.id, async () => new Response(
      JSON.stringify(invalidProject),
      { status: 200 },
    ))).rejects.toMatchObject({ code: "account_invalid_response" });
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

  it("uses exact lifecycle routes, methods, bodies, and same-origin credentials", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetcher = async (input: string, init?: RequestInit) => {
      calls.push([input, init]);
      const response = input.endsWith("/archived")
        ? { contract_version: "webdiag.account.archived_project_list.v1", projects: [archivedProject] }
        : input.endsWith("/archive")
          ? archivedProject
          : project;
      return new Response(JSON.stringify(response), { status: 200 });
    };

    await renameAccountProject(project.id, "Renamed", fetcher);
    await archiveAccountProject(project.id, fetcher);
    await listArchivedAccountProjects(fetcher);
    await restoreAccountProject(project.id, fetcher);

    expect(calls.map(([path, init]) => [path, init?.method, init?.body])).toEqual([
      [`/api/account/projects/${project.id}`, "PATCH", JSON.stringify({ name: "Renamed" })],
      [`/api/account/projects/${project.id}/archive`, "POST", undefined],
      ["/api/account/projects/archived", "GET", undefined],
      [`/api/account/projects/${project.id}/restore`, "POST", undefined],
    ]);
    expect(calls.every(([, init]) => init?.credentials === "same-origin" && init.cache === "no-store")).toBe(true);
  });
});
