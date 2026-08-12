import {
  buildAccountWorkspaceNavigation,
  recentAccountProjects,
  resolveActiveAccountProject,
} from "./account-workspace-shell-contract";
import type { AccountProject } from "./account-workspace-contract";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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

const ru = buildAccountWorkspaceNavigation("ru", "overview");
assert(ru.length === 3, "RU navigation must contain overview, projects, and reports");
assert(ru[0]?.label === "Обзор" && ru[0].active, "RU overview must be active");
assert(ru[1]?.href === "/account#projects", "RU projects link must target the real list");
assert(ru[2]?.href === "/account/reports", "RU reports link must target saved reports");

const en = buildAccountWorkspaceNavigation("en", "projects");
assert(en[0]?.href === "/en/account", "EN overview path must be localized");
assert(en[1]?.label === "Projects" && en[1].active, "EN projects must be active");
assert(en[2]?.label === "Reports" && !en[2].active, "EN reports must be present");

const recent = recentAccountProjects(projects, 2);
assert(recent.map((project) => project.name).join(",") === "Newest,Middle", "Recent projects must be sorted by updated_at");
assert(resolveActiveAccountProject(projects, projects[1]!.id)?.name === "Newest", "Current project must resolve by UUID");
assert(resolveActiveAccountProject(projects, "not-a-project") === null, "Unknown project must resolve to null");

console.log("account workspace shell contract: PASS");
