import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/account/reports/route";
import { accountReportListUpstreamPath } from "./account-report-query";

const projectId = "22222222-2222-4222-8222-222222222222";

describe("account report list query", () => {
  it("builds the canonical optional project filter", () => {
    expect(accountReportListUpstreamPath(new URLSearchParams())).toBe("/v1/account/reports");
    expect(accountReportListUpstreamPath(new URLSearchParams(`project_id=${projectId}`))).toBe(
      `/v1/account/reports?project_id=${projectId}`,
    );
  });

  it("rejects malformed, duplicate, and unknown query parameters", () => {
    expect(accountReportListUpstreamPath(new URLSearchParams("project_id=not-a-uuid"))).toBeNull();
    expect(accountReportListUpstreamPath(new URLSearchParams(`project_id=${projectId}&project_id=${projectId}`))).toBeNull();
    expect(accountReportListUpstreamPath(new URLSearchParams("page=1"))).toBeNull();
  });

  it("returns the stable no-store API envelope for an invalid query", async () => {
    const response = await GET(new NextRequest("https://webdiag.test/api/account/reports?page=1"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      detail: { code: "account_invalid_request", message: "Invalid report query." },
    });
  });
});
