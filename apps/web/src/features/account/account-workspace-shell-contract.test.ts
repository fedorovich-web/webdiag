import { describe, expect, it } from "vitest";
import {
  buildAccountWorkspaceNavigation,
  recentAccountProjects,
  resolveActiveAccountProject,
} from "./account-workspace-shell-contract";
import type { AccountProject } from "./account-workspace-contract";

const projects: readonly AccountProject[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Older",
    origin: "https://older.example",
    created_at: "2026-07-29T10:00:00Z",
    updated_at: "2026-07-29T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Newest",
    origin: "https://newest.example",
    created_at: "2026-07-30T10:00:00Z",
    updated_at: "2026-07-31T10:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Middle",
    origin: "https://middle.example",
    created_at: "2026-07-30T11:00:00Z",
    updated_at: "2026-07-30T11:00:00Z",
  },
];

describe("account workspace shell contract", () => {
  it("builds localized navigation for the real account routes", () => {
    const ru = buildAccountWorkspaceNavigation("ru", "overview");
    expect(ru).toHaveLength(3);
    expect(ru[0]?.label).toBe("Обзор");
    expect(ru[0]?.active).toBe(true);
    expect(ru[1]?.href).toBe("/account#projects");
    expect(ru[2]?.href).toBe("/account/reports");

    const en = buildAccountWorkspaceNavigation("en", "projects");
    expect(en[0]?.href).toBe("/en/account");
    expect(en[1]?.label).toBe("Projects");
    expect(en[1]?.active).toBe(true);
    expect(en[2]?.label).toBe("Reports");
    expect(en[2]?.active).toBe(false);
  });

  it("orders recent projects and resolves the active project by UUID", () => {
    const recent = recentAccountProjects(projects, 2);
    expect(recent.map((project) => project.name)).toEqual(["Newest", "Middle"]);
    expect(resolveActiveAccountProject(projects, projects[1]!.id)?.name).toBe("Newest");
    expect(resolveActiveAccountProject(projects, "not-a-project")).toBeNull();
  });
});
