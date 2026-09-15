export const session = {
  contract_version: "webdiag.account.session.v1",
  authenticated: true,
  user: {
    id: "user-1",
    email: "user@example.com",
    display_name: "Roman User",
    created_at: "2026-07-24T12:00:00Z",
  },
};

export const firstProject = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Основной сайт",
  origin: "https://example.com",
  created_at: "2026-07-30T10:00:00Z",
  updated_at: "2026-07-31T10:00:00Z",
};

export const secondProject = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Документация",
  origin: "https://docs.example.com",
  created_at: "2026-07-29T10:00:00Z",
  updated_at: "2026-07-30T10:00:00Z",
};

export const emptyOverview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [],
};

export const operationsOverview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [{
    project: firstProject,
    latest_audit: {
      id: "33333333-3333-4333-8333-333333333333",
      project_id: firstProject.id,
      status: "succeeded",
      score: 82,
      check_count: 14,
      issue_count: 3,
      completed_at: "2026-08-12T10:00:00Z",
      created_at: "2026-08-12T10:00:00Z",
    },
    monitor: {
      contract_version: "webdiag.account.monitor.v1",
      id: "44444444-4444-4444-8444-444444444444",
      project_id: firstProject.id,
      cadence: "daily",
      timezone: "Europe/Berlin",
      enabled: true,
      status: "changed",
      next_run_at: "2026-08-13T10:00:00Z",
      last_run_at: "2026-08-12T10:00:00Z",
      consecutive_failures: 0,
      created_at: "2026-08-11T10:00:00Z",
      updated_at: "2026-08-12T10:00:00Z",
    },
    report_count: 2,
    shared_report_count: 1,
    latest_report_created_at: "2026-08-12T11:00:00Z",
  }],
};
