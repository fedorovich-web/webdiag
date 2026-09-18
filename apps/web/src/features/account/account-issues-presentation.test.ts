import { describe, expect, it } from "vitest";
import {
  defaultAccountIssueFilters,
  formatAffectedUrlCount,
  hasActiveAccountIssueFilters,
  issueCategoryLabel,
  issuePriorityLabel,
} from "./account-issues-presentation";

describe("account issue presentation", () => {
  it("localizes only defined priority and category values", () => {
    expect(issuePriorityLabel("ru", "p0")).toBe("P0 — исправить первым");
    expect(issuePriorityLabel("en", "p3")).toBe("P3 — later");
    expect(issueCategoryLabel("ru", "accessibility")).toBe("Доступность");
    expect(issueCategoryLabel("en", "technical")).toBe("Technical");
  });

  it("formats persisted affected URL counts without deriving impact", () => {
    expect(formatAffectedUrlCount("ru", 1)).toBe("1 страница");
    expect(formatAffectedUrlCount("ru", 2)).toBe("2 страницы");
    expect(formatAffectedUrlCount("ru", 5)).toBe("5 страниц");
    expect(formatAffectedUrlCount("en", 1)).toBe("1 page");
    expect(formatAffectedUrlCount("en", 8)).toBe("8 pages");
  });

  it("keeps fix order as the deterministic default and detects deviations", () => {
    expect(defaultAccountIssueFilters).toEqual({ sort: "priority", order: "asc" });
    expect(hasActiveAccountIssueFilters(defaultAccountIssueFilters)).toBe(false);
    expect(hasActiveAccountIssueFilters({ ...defaultAccountIssueFilters, priority: "p1" })).toBe(true);
    expect(hasActiveAccountIssueFilters({ sort: "title", order: "asc" })).toBe(true);
    expect(hasActiveAccountIssueFilters({ sort: "priority", order: "desc" })).toBe(true);
  });
});
