import { describe, expect, it } from "vitest";
import type { AuditFrontendIssue } from "../home/audit-contract";
import { orderAuditIssues } from "./single-page-audit-tool";
import { localizeAuditCheck, localizeAuditIssue, RU_AUDIT_CHECK_NAMES, RU_AUDIT_ISSUES } from "./audit-taxonomy-i18n";

function issue(id: string, priority: string, severity: string): AuditFrontendIssue {
  return {
    id,
    checkId: null,
    category: "metadata",
    priority,
    severity,
    title: id,
    description: `${id} description`,
    affectedUrls: ["https://example.com/"],
    recommendation: { summary: `${id} action`, steps: [], expectedImpact: null },
  };
}

describe("single-page audit presentation", () => {
  it("orders fix work by priority, then severity, without mutating the API result", () => {
    const source = [issue("low", "p2", "low"), issue("critical", "p0", "critical"), issue("high", "p0", "high")];
    expect(orderAuditIssues(source).map((item) => item.id)).toEqual(["critical", "high", "low"]);
    expect(source.map((item) => item.id)).toEqual(["low", "critical", "high"]);
  });

  it("keeps unknown priorities after known P0-P3 values", () => {
    expect(orderAuditIssues([issue("unknown", "later", "critical"), issue("p3", "p3", "info")]).map((item) => item.id)).toEqual(["p3", "unknown"]);
  });

  it("covers the complete backend taxonomy in RU and leaves EN source text unchanged", () => {
    expect(Object.keys(RU_AUDIT_CHECK_NAMES)).toHaveLength(13);
    expect(Object.keys(RU_AUDIT_ISSUES)).toHaveLength(19);
    const source = issue("metadata.title.missing", "p1", "medium");
    expect(localizeAuditIssue(source, "ru").title).toBe("Отсутствует title");
    expect(localizeAuditIssue(source, "en")).toBe(source);
    expect(localizeAuditCheck({ id: "metadata.title", name: "Title tag", category: "metadata", status: "passed" }, "ru")).toMatchObject({ name: "Title страницы", category: "метаданные" });
  });
});
