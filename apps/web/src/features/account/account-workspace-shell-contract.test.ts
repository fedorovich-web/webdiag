import { describe, expect, it } from "vitest";
import {
  buildAccountWorkspaceNavigation,
  ownedAccountProjectContextId,
  projectLandingAfterSwitch,
  recentAccountProjects,
  resolveActiveAccountProject,
} from "./account-workspace-shell-contract";
import { accountAIPath } from "../../lib/routes";
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
    expect(accountAIPath("ru")).toBe("/account/ai");
    expect(accountAIPath("en")).toBe("/en/account/ai");

    const ru = buildAccountWorkspaceNavigation("ru", "overview");
    expect(ru.portfolio).toHaveLength(8);
    expect(ru.portfolio[0]).toMatchObject({
      id: "overview",
      label: "Панель управления",
      href: "/account",
      active: true,
    });
    expect(ru.portfolio[1]).toMatchObject({
      id: "projects",
      label: "Мои проекты",
      href: "/account#projects",
    });
    expect(ru.portfolio[2]).toMatchObject({
      id: "checks",
      label: "Проверки",
      href: null,
      disabled: true,
    });
    expect(ru.portfolio[3]).toMatchObject({
      id: "tools",
      label: "Инструменты",
      href: "/account/ai",
      active: false,
    });
    expect(ru.portfolio[4]?.href).toBe("/account/reports");
    expect(ru.portfolio[5]?.href).toBe("/account#tasks");
    expect(ru.portfolio[6]).toMatchObject({
      id: "monitoring",
      href: null,
      disabled: true,
    });
    expect(ru.portfolio[7]).toMatchObject({
      id: "account",
      label: "Настройки",
      href: "/account/settings",
      active: false,
    });
    expect(ru.project).toBeNull();

    const en = buildAccountWorkspaceNavigation("en", "projects");
    expect(en.portfolio[0]?.label).toBe("Dashboard");
    expect(en.portfolio[1]?.label).toBe("My projects");
    expect(en.portfolio[1]?.active).toBe(true);
    expect(en.portfolio[3]?.label).toBe("Tools");
    expect(en.portfolio[4]?.label).toBe("Reports");
    expect(en.portfolio[5]?.label).toBe("Tasks");
    expect(en.portfolio[6]?.label).toBe("Monitoring");
    expect(en.portfolio[7]?.href).toBe("/en/account/settings");

    const settings = buildAccountWorkspaceNavigation("ru", "settings");
    expect(settings.portfolio[7]?.active).toBe(true);

    const ai = buildAccountWorkspaceNavigation("ru", "ai");
    expect(ai.portfolio[3]?.active).toBe(true);
  });

  it("builds project task navigation only from live routes and known audit context", () => {
    const projectId = projects[0]!.id;
    const auditId = "44444444-4444-4444-8444-444444444444";
    const navigation = buildAccountWorkspaceNavigation(
      "ru",
      "monitoring",
      projectId,
      auditId,
    );

    expect(navigation.project?.map((item) => item.id)).toEqual([
      "project_overview",
      "audits",
      "issues",
      "monitoring",
      "project_reports",
    ]);
    expect(navigation.portfolio.find((item) => item.id === "checks")).toMatchObject({
      href: `/account/projects/${projectId}#audit-history`,
      disabled: false,
    });
    expect(navigation.portfolio.find((item) => item.id === "monitoring")).toMatchObject({
      href: `/account/projects/${projectId}/monitoring`,
      active: true,
      disabled: false,
    });
    expect(navigation.project?.find((item) => item.id === "monitoring")).toMatchObject({
      href: `/account/projects/${projectId}/monitoring`,
      active: true,
      disabled: false,
    });
    expect(navigation.project?.find((item) => item.id === "issues")?.href).toBe(
      `/account/projects/${projectId}/audits/${auditId}/issues`,
    );
    expect(navigation.project?.find((item) => item.id === "project_reports")).toMatchObject({
      href: `/account/reports?project_id=${projectId}`,
      disabled: false,
    });
    expect(projectLandingAfterSwitch("en", projects[1]!.id)).toBe(
      `/en/account/projects/${projects[1]!.id}`,
    );
  });

  it("orders recent projects and resolves the active project by UUID", () => {
    const recent = recentAccountProjects(projects, 2);
    expect(recent.map((project) => project.name)).toEqual(["Newest", "Middle"]);
    expect(resolveActiveAccountProject(projects, projects[1]!.id)?.name).toBe("Newest");
    expect(resolveActiveAccountProject(projects, "not-a-project")).toBeNull();
    expect(ownedAccountProjectContextId(projects, projects[1]!.id)).toBe(projects[1]!.id);
    expect(ownedAccountProjectContextId(projects, "44444444-4444-4444-8444-444444444444")).toBeUndefined();
  });
});
